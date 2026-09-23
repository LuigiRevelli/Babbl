"""
Babbl backend — Flask API.

Endpoints:
- POST   /api/analyze                  : multipart `audio` + `context` JSON
                                         → observation (texte) + pistes + cartes de sécurité
                                         422 si l'enregistrement est inexploitable
- POST   /api/analyses/<id>/soothed    : « qu'est-ce qui a apaisé votre bébé ? » (compte vérifié)
- DELETE /api/me                       : efface le compte, ses données et sa voix clonée (RGPD)
- POST   /api/voice/clone              : clone la voix du parent (compte vérifié)
- GET    /api/audio/<f>                : mp3 générés (24 h)
- GET    /api/health                   : état + intégrations branchées + versions
"""

import json
import os
import re
import traceback
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

import logs
from logs import log_event

from audio_analysis import FEATURE_VERSION, extract_features
from baseline import update_baseline
from comfort_messages import generate_comfort_message
from elevenlabs_client import clone_voice, delete_voice, text_to_speech, tts_configured
from mistral_client import ANTHROPIC_MODEL, PROMPT_VERSION, llm_configured, safe_baby_name, write_parent_guidance
from security import RateLimiter, client_ip, is_safe_audio_name, safe_remove, sweep_old_files, verify_user
from taxonomy import NO_CRY_HINT, NO_CRY_REMINDER, SOOTHED_BY, TAXONOMY_VERSION, TOO_SHORT_HINT
from triage_rules import RULES_VERSION, cards_v2_enabled, context_hypotheses, intensity_observation, parent_menus, recording_gate, safety_cards

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Load .env from project root (one level up from backend/)
load_dotenv(os.path.join(BASE_DIR, "..", ".env"), override=True)

# ─── Supabase (service-role, bypasses RLS) ──────────────────
_supabase_client = None

def _get_supabase():
    """Lazy-init the Supabase admin client."""
    global _supabase_client
    if _supabase_client is None:
        sb_url = os.environ.get("SUPABASE_URL")
        sb_key = os.environ.get("SUPABASE_SERVICE_KEY")
        if sb_url and sb_key:
            try:
                from supabase import create_client
                _supabase_client = create_client(sb_url, sb_key)
            except Exception as e:
                log_event("integration_failed", "warning", component="supabase_init", error_type=type(e).__name__)
    return _supabase_client

TMP_DIR = os.path.join(BASE_DIR, "tmp")
os.makedirs(TMP_DIR, exist_ok=True)

# Les mp3 lus par le parent vivent 24 h ; les enregistrements bruts, zéro seconde
# après l'extraction des descripteurs (voir `finally` dans analyze / voice_clone).
MP3_TTL_S = 24 * 3600
# Aucune écriture du profil acoustique tant que la migration « clé bébé +
# feature_version » n'est pas faite : les descripteurs v2 et v3 (pyin) sont
# incompatibles avec les lignes existantes, et une collecte par défaut sans
# finalité visible pour le parent n'est pas défendable.
BASELINE_ENABLED = os.environ.get("BABBL_BASELINE_ENABLED", "0") == "1"

# Ce qui a produit chaque réponse — pour pouvoir dire, après coup, « ce soir-là
# l'app disait ceci avec ces règles ». Renvoyé dans chaque réponse.
VERSIONS = {
    "features": FEATURE_VERSION,
    "taxonomy": TAXONOMY_VERSION,
    "rules": RULES_VERSION,
    "prompt": PROMPT_VERSION,
    "git": os.environ.get("BABBL_GIT_SHA", "dev"),
}

# Appels payants (Anthropic, ElevenLabs) : limite par adresse.
_analyze_limiter = RateLimiter(limit=int(os.environ.get("BABBL_ANALYZE_PER_10MIN", "20")), window_s=600)
_clone_limiter = RateLimiter(limit=int(os.environ.get("BABBL_CLONE_PER_DAY", "3")), window_s=86400)
_executor = ThreadPoolExecutor(max_workers=4)

# Préchauffage (BABBL_WARMUP=1 dans l'image Docker) : avec preload_app de
# gunicorn, la compilation est faite une fois dans le maître puis héritée.
if os.environ.get("BABBL_WARMUP") == "1":
    from audio_analysis import warmup
    log_event("startup_warmup", seconds=round(warmup(), 1))

app = Flask(__name__)
# Origines autorisées : liste séparée par des virgules (ex. « https://babbl.fr,
# https://www.babbl.fr »). Non définie = toutes (développement local).
_origins = [o.strip() for o in os.environ.get("BABBL_ALLOWED_ORIGINS", "").split(",") if o.strip()]
CORS(app, origins=_origins or "*")
logs.install(app)
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024  # 8 Mo : un clip de 10 s en pèse < 1


def _refusal(status: int, error: str, code: str, context: dict, baby_age_months: int | None, hint: str | None = None):
    """INVARIANT : toute réponse d'échec porte les trois cartes de sécurité."""
    return jsonify({
        "error": error,
        "code": code,
        "versions": VERSIONS,
        "reminder": NO_CRY_REMINDER,
        "hint": hint or "",
        "safety": safety_cards(context, baby_age_months),
    }), status


@app.get("/api/health")
def health():
    """Ce qui est réellement branché — sans jamais exposer une clé. Sert à
    vérifier un déploiement : sans clé Anthropic, les résumés sont en texte fixe."""
    return jsonify({
        "status": "ok",
        "versions": VERSIONS,
        "integrations": {
            "llm": llm_configured(),
            "llm_model": ANTHROPIC_MODEL,
            "voice": tts_configured(),
            "database": _get_supabase() is not None,
            "baseline_collection": BASELINE_ENABLED,
            "cards": "v2" if cards_v2_enabled() else "v1",
        },
    })


@app.post("/api/voice/clone")
def voice_clone():
    """Create an ElevenLabs Instant Voice Clone from a short sample.

    Réservé aux comptes vérifiés : cet endpoint crée des voix sur le compte
    ElevenLabs de Babbl. Ouvert à Internet, il permettait de cloner n'importe
    quelle voix avec notre clé."""
    auth = verify_user(_get_supabase(), request.headers.get("Authorization"))
    if not auth.verified:
        return jsonify({"error": "Connexion requise pour cloner une voix.", "code": "auth_required"}), 401
    if not _clone_limiter.allow(auth.user_id):
        return jsonify({"error": "Limite de clonage atteinte pour aujourd'hui.", "code": "rate_limited"}), 429
    if "audio" not in request.files:
        return jsonify({"error": "Fichier audio manquant"}), 400

    audio_file = request.files["audio"]
    name = request.form.get("name", "Parent Babbl")

    request_id = uuid.uuid4().hex
    ext = os.path.splitext(audio_file.filename or "")[1] or ".webm"
    sample_path = os.path.join(TMP_DIR, f"voice_{request_id}{ext}")
    audio_file.save(sample_path)

    try:
        voice_id = clone_voice(name=name, audio_path=sample_path)
    except Exception as e:
        traceback.print_exc()
        msg = str(e) or type(e).__name__
        if "missing_permissions" in msg or "create_instant_voice_clone" in msg:
            return jsonify({
                "error": (
                    "Votre clé API ElevenLabs n'a pas la permission de cloner une voix. "
                    "Allez sur elevenlabs.io → Settings → API Keys et activez 'Voices: Write' "
                    "(ou 'Create Instant Voice Clone')."
                )
            }), 403
        return jsonify({"error": "Le clonage vocal a échoué."}), 500
    finally:
        # La voix du parent ne reste pas sur le disque.
        safe_remove(sample_path)

    return jsonify({"voice_id": voice_id, "name": name})


@app.post("/api/analyze")
def analyze():
    """Pipeline (voir SYMPTOMS.md — deux couches, rien d'autre) :

    1. descripteurs acoustiques
    2. porte d'entrée : enregistrement exploitable, sinon 422
    3. Couche 1 — observation sonore en texte (jamais chiffrée, jamais stockée)
    4. Couche 2 — hypothèses depuis ce que le parent a saisi
    5. cartes de sécurité statiques (âge + saisie parent, jamais le son)
    6. résumé + gestes (LLM contraint, repli déterministe)
    7. audio (résumé lu, message de réconfort en voix clonée)
    8. profil acoustique mis à jour en silence ; persistance sans l'observation
    """
    if "audio" not in request.files:
        return jsonify({"error": "Fichier audio manquant"}), 400

    audio_file = request.files["audio"]
    context_raw = request.form.get("context", "{}")
    try:
        context = json.loads(context_raw)
        if not isinstance(context, dict):
            context = {}
    except json.JSONDecodeError:
        return jsonify({"error": "JSON de contexte invalide"}), 400

    # 0. Qui parle ? Jeton vérifié par Supabase — jamais décodé à la main.
    auth = verify_user(_get_supabase(), request.headers.get("Authorization"))
    sweep_old_files(TMP_DIR, MP3_TTL_S)

    voice_id = request.form.get("voice_id") or context.get("voiceId") or context.get("voice_id") or None
    parent_label = request.form.get("parent_label") or context.get("parentLabel") or context.get("parent_label") or "father"
    baby_name = safe_baby_name(context.get("babyName") or context.get("baby_name"))
    context.pop("baby_name", None)
    if baby_name:
        context["babyName"] = baby_name
    else:
        context.pop("babyName", None)
    # Âge inconnu = None, jamais une valeur par défaut : un « 3 mois » inventé
    # éteignait la carte « fièvre avant 3 mois » faute de date de naissance.
    raw_age = request.form.get("baby_age_months") or context.get("babyAgeMonths") or context.get("baby_age_months")
    try:
        baby_age_months = int(raw_age) if raw_age not in (None, "") else None
    except (TypeError, ValueError):
        baby_age_months = None

    if auth.status == "invalid":
        return _refusal(401, "Session invalide. Reconnectez-vous.", "auth_invalid", context, baby_age_months)
    if not _analyze_limiter.allow(client_ip(request)):
        return _refusal(429, "Trop d'analyses en peu de temps. Réessayez dans quelques minutes.", "rate_limited", context, baby_age_months)

    request_id = uuid.uuid4().hex
    ext = os.path.splitext(audio_file.filename or "")[1] or ".webm"
    audio_path = os.path.join(TMP_DIR, f"{request_id}{ext}")
    audio_file.save(audio_path)

    # 1. Descripteurs acoustiques — puis l'enregistrement brut est effacé,
    #    quoi qu'il arrive. Aucun pleur de nourrisson ne reste sur le disque.
    try:
        features = extract_features(audio_path)
    except Exception as e:
        log_event("analyze_failed", "error", step="features", error_type=type(e).__name__)
        traceback.print_exc()  # pile d'appels seulement (aucune donnée du parent dans les cadres)
        return _refusal(500, "L'analyse audio a échoué.", "audio_error", context, baby_age_months)
    finally:
        safe_remove(audio_path)

    # Aucun chiffre acoustique ne sort du serveur : un nombre finirait affiché
    # ou stocké côté client. Seule la durée est renvoyée.
    recording = {"duration_seconds": features.get("duration_seconds", 0.0)}

    # 2. Porte d'entrée — Babbl refuse de répondre sur rien.
    # INVARIANT : un refus embarque toujours les trois cartes de sécurité et le
    # rappel « un bébé qui pleure peu n'est jamais rassurant ». « Pas de pleur »
    # est le cas potentiellement le plus grave, pas un défaut de micro.
    ok, gate_code, gate_msg = recording_gate(features)
    if not ok:
        log_event("analyze", auth=auth.status, gate=gate_code, age_known=baby_age_months is not None)
        return jsonify({
            "error": gate_msg,
            "code": gate_code,
            "recording": recording,
            "versions": VERSIONS,
            "reminder": NO_CRY_REMINDER,
            "hint": TOO_SHORT_HINT if gate_code == "too_short" else NO_CRY_HINT,
            "safety": safety_cards(context, baby_age_months),
        }), 422

    # 3-5. Les deux couches + cartes de sécurité
    intensity = intensity_observation(features)
    hypotheses = context_hypotheses(context, baby_age_months)
    safety = safety_cards(context, baby_age_months)

    # 6. Résumé et gestes
    guidance = write_parent_guidance(hypotheses, intensity, context, baby_age_months, baby_name)

    # 7. Audio (best-effort, en parallèle, borné). Le résultat déterministe
    #    n'attend jamais la voix : chaque appel a son propre délai court.
    top_key = hypotheses[0]["key"] if hypotheses else "need_for_comfort"
    comfort_text = generate_comfort_message(
        top_cause=top_key, age_months=baby_age_months, parent_label=parent_label,
    ) if voice_id else None

    def _tts_to_file(text: str, name: str, vid: str | None):
        mp3_bytes = text_to_speech(text, voice_id=vid) if vid else text_to_speech(text)
        with open(os.path.join(TMP_DIR, name), "wb") as f:
            f.write(mp3_bytes)
        return f"/api/audio/{name}"

    audio_url = None
    comfort_audio_url = None
    summary = guidance.get("parent_summary", "")
    futures = {}
    if summary:
        futures["summary"] = _executor.submit(_tts_to_file, summary, f"{request_id}.mp3", None)
    if comfort_text:
        futures["comfort"] = _executor.submit(_tts_to_file, comfort_text, f"{request_id}_comfort.mp3", voice_id)
    for key, fut in futures.items():
        try:
            url = fut.result(timeout=8)
            if key == "summary":
                audio_url = url
            else:
                comfort_audio_url = url
        except Exception as e:
            log_event("integration_failed", "warning", component=f"tts_{key}", error_type=type(e).__name__)

    persisted = False
    # 8. Persistance — uniquement pour un compte VÉRIFIÉ. Le backend est le
    #    seul écrivain de `analyses` (le frontend n'écrit plus). L'observation
    #    sonore n'est jamais persistée ; les hypothèses le sont (dans
    #    key_signals, faute de colonne dédiée) pour que l'historique et le
    #    rapport médecin les retrouvent.
    if auth.verified:
        sb = _get_supabase()
        if sb:
            if BASELINE_ENABLED:
                try:
                    update_baseline(sb, auth.user_id, features)
                except Exception as e:
                    log_event("integration_failed", "warning", component="baseline", error_type=type(e).__name__)
            row = {
                "id": request_id,
                "user_id": auth.user_id,
                "top_cause": top_key,
                "probabilities": {},
                "parent_summary": guidance.get("parent_summary", ""),
                "confidence_level": "context",
                "alert": "none",
                "key_signals": [
                    {"signal": h["why"], "source": "context", "key": h["key"], "label": h["label"], "why": h["why"]}
                    for h in hypotheses
                ],
                "recommended_actions": guidance.get("recommended_actions", []),
                "audio_url": audio_url,
                "comfort_audio_url": comfort_audio_url,
                "comfort_text": comfort_text,
            }
            persisted = _insert_analysis(sb, row, guidance.get("guidance_source", "deterministic"))

    log_event(
        "analyze",
        auth=auth.status,
        gate="ok",
        age_known=baby_age_months is not None,
        hypotheses_count=len(hypotheses),
        guidance_source=guidance.get("guidance_source", "deterministic"),
        voice_requested=bool(voice_id),
        tts_ok=sum(1 for u in (audio_url, comfort_audio_url) if u),
        tts_failed=len(futures) - sum(1 for u in (audio_url, comfort_audio_url) if u),
        persisted=persisted,
    )

    return jsonify(
        {
            "id": request_id,
            "persisted": persisted,
            "versions": VERSIONS,
            "recording": recording,
            "intensity": intensity,
            "hypotheses": hypotheses,
            "safety": safety,
            "parent_summary": guidance.get("parent_summary", ""),
            "recommended_actions": guidance.get("recommended_actions", []),
            "key_signals": guidance.get("key_signals", []),
            "guidance_source": guidance.get("guidance_source", "deterministic"),
            "context": context,
            "audio_url": audio_url,
            "comfort_audio_url": comfort_audio_url,
            "comfort_text": comfort_text,
        }
    )


def _insert_analysis(sb, row: dict, guidance_source: str) -> bool:
    """Écrit l'analyse. Colonnes ajoutées par supabase/migrations/20260923_*.sql
    (guidance_source) : si la migration n'est pas passée, on réécrit la ligne
    sans elles plutôt que de perdre l'analyse."""
    for extra in ({"guidance_source": guidance_source}, {}):
        try:
            sb.table("analyses").insert({**row, **extra}).execute()
            return True
        except Exception as e:
            log_event("integration_failed", "warning", component="supabase_insert" + ("" if extra else "_retry"), error_type=type(e).__name__)
    return False


@app.get("/api/cards")
def cards():
    """Cartes et repères, sans enregistrement : l'écran « Quand appeler » les
    affiche à tout moment. `?age_months=` et `?birth_date=` règlent la mise en
    avant ; rien d'autre n'entre en compte."""
    ctx = {}
    if request.args.get("birth_date"):
        ctx["babyBirthDate"] = request.args["birth_date"]
    try:
        age = int(request.args["age_months"]) if request.args.get("age_months") else None
    except ValueError:
        age = None
    return jsonify({
        "version": "v2" if cards_v2_enabled() else "v1",
        "safety": safety_cards(ctx, age),
        "menus": parent_menus(),
    })


@app.post("/api/analyses/<analysis_id>/soothed")
def soothed(analysis_id: str):
    """« Qu'est-ce qui a apaisé votre bébé ? » — la réponse du parent, rangée
    avec l'analyse. Liste fermée (taxonomy.SOOTHED_BY) ou « skipped »."""
    auth = verify_user(_get_supabase(), request.headers.get("Authorization"))
    if not auth.verified:
        return jsonify({"error": "Connexion requise.", "code": "auth_required"}), 401
    body = request.get_json(silent=True) or {}
    answer = body.get("answer")
    if answer not in SOOTHED_BY and answer != "skipped":
        return jsonify({"error": "Réponse inconnue.", "code": "bad_answer"}), 400
    if not re.fullmatch(r"[0-9a-fA-F-]{32,36}", analysis_id or ""):
        return jsonify({"error": "Analyse inconnue.", "code": "not_found"}), 404
    sb = _get_supabase()
    if sb is None:
        return jsonify({"stored": False, "reason": "database_unavailable"}), 503
    try:
        resp = (sb.table("analyses")
                .update({"soothed_by": answer, "soothed_at": datetime.now(timezone.utc).isoformat()})
                .eq("id", analysis_id).eq("user_id", auth.user_id).execute())
    except Exception as e:
        # Colonne absente (migration non passée) : la réponse reste dans le téléphone.
        log_event("integration_failed", "warning", component="supabase_soothed", error_type=type(e).__name__)
        return jsonify({"stored": False, "reason": "not_stored"}), 202
    if not getattr(resp, "data", None):
        return jsonify({"error": "Analyse inconnue.", "code": "not_found"}), 404
    return jsonify({"stored": True, "answer": answer})


# Tables qui portent des données du parent, et la colonne qui les rattache.
_USER_TABLES = (("analyses", "user_id"), ("context_logs", "user_id"), ("badges", "user_id"),
                ("baby_baselines", "user_id"), ("profiles", "id"))


@app.delete("/api/me")
def delete_me():
    """Droit à l'effacement (RGPD art. 17). Efface, dans l'ordre : la voix
    clonée chez ElevenLabs, chaque table, puis le compte lui-même. Chaque étape
    est rapportée ; le compte n'est supprimé que si tout le reste a réussi,
    pour qu'un effacement partiel puisse être relancé."""
    sb = _get_supabase()
    auth = verify_user(sb, request.headers.get("Authorization"))
    if not auth.verified:
        return jsonify({"error": "Connexion requise.", "code": "auth_required"}), 401
    uid = auth.user_id
    report: dict[str, str] = {}

    voice_ids: set[str] = set()
    body = request.get_json(silent=True) or {}
    if isinstance(body.get("voice_ids"), list):
        voice_ids.update(v for v in body["voice_ids"] if isinstance(v, str) and re.fullmatch(r"[A-Za-z0-9]{8,40}", v))
    try:
        prof = sb.table("profiles").select("voice_id").eq("id", uid).execute()
        voice_ids.update(r["voice_id"] for r in (prof.data or []) if r.get("voice_id"))
    except Exception:
        pass
    for vid in sorted(voice_ids):
        try:
            report[f"voice:{vid[:6]}…"] = "deleted" if delete_voice(vid) else "failed"
        except Exception as e:
            report[f"voice:{vid[:6]}…"] = f"failed ({type(e).__name__})"

    for table, col in _USER_TABLES:
        try:
            sb.table(table).delete().eq(col, uid).execute()
            report[table] = "deleted"
        except Exception as e:
            report[table] = f"failed ({type(e).__name__})"

    if all(v == "deleted" for v in report.values()):
        try:
            sb.auth.admin.delete_user(uid)
            report["account"] = "deleted"
        except Exception as e:
            report["account"] = f"failed ({type(e).__name__})"
    else:
        report["account"] = "kept (retry: some data could not be deleted)"

    ok = all(v == "deleted" for v in report.values())
    log_event("account_delete", "info" if ok else "warning", status=200 if ok else 207,
              count=sum(1 for v in report.values() if v != "deleted"))
    return jsonify({"deleted": ok, "report": report}), (200 if ok else 207)


@app.get("/api/audio/<path:filename>")
def get_audio(filename):
    # Uniquement nos mp3 (identifiant aléatoire de 32 hex, durée de vie 24 h).
    # Jamais un chemin, jamais un enregistrement brut.
    if not is_safe_audio_name(filename):
        return jsonify({"error": "Fichier inconnu"}), 404
    return send_from_directory(TMP_DIR, filename, mimetype="audio/mpeg")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)
