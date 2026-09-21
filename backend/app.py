"""
Babbl backend — Flask API.

Endpoints:
- POST /api/analyze    : multipart form with `audio` file + `context` JSON string
                         → observation sonore (texte) + hypothèses contextuelles + cartes de sécurité
                         422 si l'enregistrement est inexploitable
- GET  /api/audio/<f>  : serves the generated TTS mp3
- GET  /api/health     : health check
"""

import json
import os
import traceback
import uuid

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from audio_analysis import extract_features
from baseline import update_baseline
from comfort_messages import generate_comfort_message
from elevenlabs_client import clone_voice, text_to_speech
from mistral_client import write_parent_guidance
from taxonomy import NO_CRY_HINT, NO_CRY_REMINDER, TOO_SHORT_HINT
from triage_rules import context_hypotheses, intensity_observation, recording_gate, safety_cards

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
                print(f"[supabase] init failed: {e}")
    return _supabase_client

TMP_DIR = os.path.join(BASE_DIR, "tmp")
os.makedirs(TMP_DIR, exist_ok=True)

app = Flask(__name__)
CORS(app)


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/api/voice/clone")
def voice_clone():
    """Create an ElevenLabs Instant Voice Clone from a short sample."""
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
        return jsonify({"error": f"Le clonage vocal a échoué : {msg}"}), 500

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
    except json.JSONDecodeError:
        return jsonify({"error": "JSON de contexte invalide"}), 400

    voice_id = request.form.get("voice_id") or context.get("voiceId") or context.get("voice_id") or None
    parent_label = request.form.get("parent_label") or context.get("parentLabel") or context.get("parent_label") or "father"
    baby_name = context.get("babyName") or context.get("baby_name") or None
    try:
        baby_age_months = int(
            request.form.get("baby_age_months")
            or context.get("babyAgeMonths")
            or context.get("baby_age_months")
            or 3
        )
    except ValueError:
        baby_age_months = 3

    request_id = uuid.uuid4().hex
    ext = os.path.splitext(audio_file.filename or "")[1] or ".webm"
    audio_path = os.path.join(TMP_DIR, f"{request_id}{ext}")
    audio_file.save(audio_path)

    # 1. Descripteurs acoustiques
    try:
        features = extract_features(audio_path)
    except Exception as e:
        traceback.print_exc()
        msg = str(e) or type(e).__name__
        return jsonify({"error": f"L'analyse audio a échoué : {msg}"}), 500

    # Aucun chiffre acoustique ne sort du serveur : un nombre finirait affiché
    # ou stocké côté client. Seule la durée est renvoyée.
    recording = {"duration_seconds": features.get("duration_seconds", 0.0)}

    # 2. Porte d'entrée — Babbl refuse de répondre sur rien.
    # INVARIANT : un refus embarque toujours les trois cartes de sécurité et le
    # rappel « un bébé qui pleure peu n'est jamais rassurant ». « Pas de pleur »
    # est le cas potentiellement le plus grave, pas un défaut de micro.
    ok, gate_code, gate_msg = recording_gate(features)
    if not ok:
        return jsonify({
            "error": gate_msg,
            "code": gate_code,
            "recording": recording,
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

    # 7. Audio (best-effort)
    audio_url = None
    try:
        summary = guidance.get("parent_summary", "")
        if summary:
            mp3_bytes = text_to_speech(summary)
            mp3_name = f"{request_id}.mp3"
            with open(os.path.join(TMP_DIR, mp3_name), "wb") as f:
                f.write(mp3_bytes)
            audio_url = f"/api/audio/{mp3_name}"
    except Exception as e:
        print(f"[elevenlabs] failed: {e}")

    top_key = hypotheses[0]["key"] if hypotheses else "need_for_comfort"
    comfort_audio_url = None
    comfort_text = None
    if voice_id:
        try:
            comfort_text = generate_comfort_message(
                top_cause=top_key, age_months=baby_age_months, parent_label=parent_label,
            )
            comfort_bytes = text_to_speech(comfort_text, voice_id=voice_id)
            comfort_name = f"{request_id}_comfort.mp3"
            with open(os.path.join(TMP_DIR, comfort_name), "wb") as f:
                f.write(comfort_bytes)
            comfort_audio_url = f"/api/audio/{comfort_name}"
        except Exception as e:
            print(f"[elevenlabs comfort] failed: {e}")

    # 8. Utilisateur (JWT Supabase dans Authorization), profil silencieux, persistance
    user_id = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            import base64
            token = auth_header.split(" ", 1)[1]
            payload = token.split(".")[1]
            payload += "=" * (-len(payload) % 4)
            claims = json.loads(base64.urlsafe_b64decode(payload))
            user_id = claims.get("sub")
        except Exception:
            pass

    if user_id:
        sb = _get_supabase()
        if sb:
            # Le profil acoustique continue de se constituer, sans rien afficher
            # (SYMPTOMS.md : aucune sortie « déviation » n'est défendable aujourd'hui).
            try:
                update_baseline(sb, user_id, features)
            except Exception as e:
                print(f"[baseline] update failed: {e}")

            # L'observation sonore n'est PAS persistée (texte transitoire, jamais
            # historisé). Les colonnes héritées reçoivent des valeurs neutres.
            try:
                sb.table("analyses").insert({
                    "id": request_id,
                    "user_id": user_id,
                    "top_cause": top_key,
                    "probabilities": {},
                    "parent_summary": guidance.get("parent_summary", ""),
                    "confidence_level": "context",
                    "alert": "none",
                    "key_signals": [s for s in guidance.get("key_signals", []) if s.get("source") == "context"],
                    "recommended_actions": guidance.get("recommended_actions", []),
                    "audio_url": audio_url,
                    "comfort_audio_url": comfort_audio_url,
                    "comfort_text": comfort_text,
                }).execute()
            except Exception as e:
                print(f"[supabase] save analysis failed: {e}")

    return jsonify(
        {
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


@app.get("/api/audio/<path:filename>")
def get_audio(filename):
    return send_from_directory(TMP_DIR, filename, mimetype="audio/mpeg")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)
