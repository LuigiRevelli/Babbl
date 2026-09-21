"""
Test bout-en-bout de POST /api/analyze avec le client de test Flask, sans
réseau ni clé : le LLM et ElevenLabs échouent proprement, le repli
déterministe prend le relais, et la réponse ne contient aucun champ interdit.

Lancer :  cd backend && .venv/bin/python tests/test_api.py
"""

import io
import json
import os
import sys
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app as babbl_app  # noqa: E402  (charge .env — on neutralise juste après)

# Jamais d'appel réseau payant depuis un test.
os.environ["ANTHROPIC_API_KEY"] = ""
os.environ["ELEVENLABS_API_KEY"] = ""
os.environ["SUPABASE_URL"] = ""
os.environ["SUPABASE_SERVICE_KEY"] = ""

FORBIDDEN_KEYS = {
    "probabilities", "alert", "alert_message", "alert_notes", "confidence_level",
    "reliability_score", "reliability_label", "medical_considerations", "distress_level",
    "ml_raw_probabilities", "baseline_deviation_score", "baseline_message", "baseline_anomalies",
}


def _wav_bytes(seconds: float, freq: float = 450.0, sr: int = 22050, silent_tail: float = 0.0) -> bytes:
    t = np.linspace(0, seconds, int(sr * seconds), endpoint=False)
    # Pleur synthétique : porteuse + modulation d'amplitude, puis silence.
    y = 0.6 * np.sin(2 * np.pi * freq * t) * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * t))
    if silent_tail > 0:
        n = int(sr * silent_tail)
        y[-n:] = 0.0
    pcm = (y * 32767).astype(np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())
    return buf.getvalue()


def _post(client, wav: bytes, context: dict, age: int = 2):
    data = {
        "audio": (io.BytesIO(wav), "recording.wav"),
        "context": json.dumps(context),
        "baby_age_months": str(age),
    }
    return client.post("/api/analyze", data=data, content_type="multipart/form-data")


def test_analyze_end_to_end():
    client = babbl_app.app.test_client()
    ctx = {"lastFeedingTime": "2000-01-01T00:00:00Z", "babyName": "Léa", "babyAgeMonths": 2}
    r = _post(client, _wav_bytes(8.0, silent_tail=1.0), ctx)
    assert r.status_code == 200, r.get_data(as_text=True)
    body = r.get_json()

    assert not (set(body) & FORBIDDEN_KEYS), set(body) & FORBIDDEN_KEYS
    assert set(body["intensity"]) == {"level", "observation", "disclaimer"}
    assert body["intensity"]["level"] in ("faible", "modere", "intense")
    assert body["hypotheses"][0]["key"] == "hunger"           # tétée il y a très longtemps
    assert all(h["source"] == "context" for h in body["hypotheses"])
    assert {c["key"] for c in body["safety"]["cards"]} == {"fever_under_3_months", "breathing", "newborn_under_15_days"}
    assert body["guidance_source"] == "deterministic"        # pas de clé → repli
    assert body["parent_summary"] and "%" not in body["parent_summary"]
    assert body["recommended_actions"][0]["action"]
    assert body["audio_url"] is None and body["comfort_audio_url"] is None
    text = json.dumps(body, ensure_ascii=False).lower()
    for word in ("colique", "otite", "reflux", "neuro", "diagnos", "détecté"):
        assert word not in text, word


def test_analyze_rejects_too_short():
    client = babbl_app.app.test_client()
    r = _post(client, _wav_bytes(1.0), {})
    assert r.status_code == 422
    body = r.get_json()
    assert body["code"] == "too_short" and "recording" in body


def test_analyze_rejects_silence():
    client = babbl_app.app.test_client()
    sr = 22050
    silent = _wav_bytes(6.0, silent_tail=5.9)
    r = _post(client, silent, {})
    assert r.status_code == 422
    assert r.get_json()["code"] == "no_cry_detected"


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for fn in fns:
        fn()
        print(f"ok  {fn.__name__}")
    print(f"{len(fns)} tests passed")
