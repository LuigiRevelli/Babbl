"""
Babbl backend — Flask API.

Endpoints:
- POST /api/analyze    : multipart form with `audio` file + `context` JSON string
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
from comfort_messages import generate_comfort_message
from elevenlabs_client import clone_voice, text_to_speech
from ml_model import predict_probabilities
from mistral_client import analyze_with_mistral
from triage_rules import apply_context_rules, reliability_score, escalate_alert

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
    try:
        baby_age_months = int(
            request.form.get("baby_age_months")
            or context.get("babyAgeMonths")
            or context.get("baby_age_months")
            or 3
        )
    except ValueError:
        baby_age_months = 3

    # Save the upload (browsers usually send webm/ogg; librosa can handle most)
    request_id = uuid.uuid4().hex
    ext = os.path.splitext(audio_file.filename or "")[1] or ".webm"
    audio_path = os.path.join(TMP_DIR, f"{request_id}{ext}")
    audio_file.save(audio_path)

    # 1. Extract acoustic features
    try:
        features = extract_features(audio_path)
    except Exception as e:
        traceback.print_exc()
        msg = str(e) or type(e).__name__
        return jsonify({"error": f"L'analyse audio a échoué : {msg}"}), 500

    # 2. Predict with the supervised ML model (if available)
    ml = None
    try:
        ml = predict_probabilities(features)
    except Exception as e:
        print(f"[ml] inference failed: {e}")

    if ml:
        base_probs = ml["app_probabilities"]
        raw_probs = ml["raw_model_probabilities"]
    else:
        base_probs = None
        raw_probs = None

    # 3. Ask Mistral for triage explanation and caregiver-friendly guidance
    try:
        triage = analyze_with_mistral(features, context, model_probabilities=base_probs)
    except Exception as e:
        traceback.print_exc()
        if base_probs:
            top_cause = max(base_probs, key=base_probs.get)
            triage = {
                "probabilities": base_probs,
                "key_signals": [
                    {
                        "signal": "Prédiction basée sur les caractéristiques acoustiques extraites (MFCCs, énergie, spectre).",
                        "source": "audio",
                        "impact": "high",
                    }
                ],
                "recommended_actions": [
                    {
                        "priority": 1,
                        "action": "Observe le bébé pendant 5 à 10 minutes et essaie une action ciblée pour le calmer.",
                        "reasoning": "Le modèle indique une cause dominante, mais une vérification contextuelle rapide reste utile.",
                    }
                ],
                "confidence_level": "medium",
                "alert": "monitor",
                "parent_summary": f"La cause la plus probable est {top_cause}. Essaie d'abord une action qui correspond à cette hypothèse, puis réévalue si les pleurs continuent.",
                "model_source": "ml_fallback",
            }
        else:
            msg = str(e) or type(e).__name__
            return jsonify({"error": f"L'analyse IA a échoué : {msg}", "features": features}), 500

    adjusted_probs, rule_notes = apply_context_rules(triage.get("probabilities", {}), context)
    triage["probabilities"] = adjusted_probs
    triage["rule_notes"] = rule_notes

    score, label, reliability_notes = reliability_score(features, adjusted_probs, context)
    triage["reliability_score"] = score
    triage["reliability_label"] = label
    triage["reliability_notes"] = reliability_notes

    # 3b. Alert escalation rules
    escalated_alert, alert_notes = escalate_alert(
        triage.get("alert", "none"), adjusted_probs, features, context
    )
    triage["alert"] = escalated_alert
    triage["alert_notes"] = alert_notes

    if ml:
        triage["ml_raw_probabilities"] = raw_probs
        triage["ml_model_name"] = ml["model_name"]
        triage["ml_train_metrics"] = ml["train_metrics"]

    # 4. Generate spoken outputs (best-effort, non-blocking failure)
    audio_url = None
    try:
        summary = triage.get("parent_summary", "")
        if summary:
            mp3_bytes = text_to_speech(summary)
            mp3_name = f"{request_id}.mp3"
            with open(os.path.join(TMP_DIR, mp3_name), "wb") as f:
                f.write(mp3_bytes)
            audio_url = f"/api/audio/{mp3_name}"
    except Exception as e:
        # Don't fail the whole request just because TTS broke
        print(f"[elevenlabs] failed: {e}")

    comfort_audio_url = None
    comfort_text = None
    if voice_id:
        try:
            probs = triage.get("probabilities", {})
            top_cause = max(probs.items(), key=lambda kv: kv[1])[0] if probs else "need_for_comfort"
            comfort_text = generate_comfort_message(
                top_cause=top_cause,
                age_months=baby_age_months,
                parent_label=parent_label,
            )
            comfort_bytes = text_to_speech(comfort_text, voice_id=voice_id)
            comfort_name = f"{request_id}_comfort.mp3"
            with open(os.path.join(TMP_DIR, comfort_name), "wb") as f:
                f.write(comfort_bytes)
            comfort_audio_url = f"/api/audio/{comfort_name}"
        except Exception as e:
            print(f"[elevenlabs comfort] failed: {e}")

    # ─── Persist to Supabase (best-effort) ─────────────────────
    # Extract user_id from the Authorization header (Supabase JWT) if present.
    user_id = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            import base64
            token = auth_header.split(" ", 1)[1]
            # Decode JWT payload without verification (the service-role
            # client trusts the anon-key-signed token for user_id only).
            payload = token.split(".")[1]
            payload += "=" * (-len(payload) % 4)  # pad base64
            claims = json.loads(base64.urlsafe_b64decode(payload))
            user_id = claims.get("sub")
        except Exception:
            pass

    if user_id:
        sb = _get_supabase()
        if sb:
            try:
                probs = triage.get("probabilities", {})
                top_cause = max(probs, key=probs.get) if probs else "unknown"
                sb.table("analyses").insert({
                    "id": request_id,
                    "user_id": user_id,
                    "top_cause": top_cause,
                    "probabilities": probs,
                    "parent_summary": triage.get("parent_summary", ""),
                    "confidence_level": triage.get("confidence_level", "medium"),
                    "alert": triage.get("alert", "none"),
                    "key_signals": triage.get("key_signals", []),
                    "recommended_actions": triage.get("recommended_actions", []),
                    "audio_url": audio_url,
                    "comfort_audio_url": comfort_audio_url,
                    "comfort_text": comfort_text,
                }).execute()
            except Exception as e:
                print(f"[supabase] save analysis failed: {e}")

    return jsonify(
        {
            "features": features,
            "context": context,
            **triage,
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
