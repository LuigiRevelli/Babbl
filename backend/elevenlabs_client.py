"""
ElevenLabs TTS client — text-to-speech and instant voice cloning.
"""

import os
import requests

# Rachel — calm warm female voice (fallback)
DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"


def _api_key() -> str:
    api_key = os.environ.get("ELEVENLABS_API_KEY")
    if not api_key:
        raise RuntimeError("ELEVENLABS_API_KEY is not set")
    return api_key


def text_to_speech(text: str, voice_id: str = DEFAULT_VOICE_ID) -> bytes:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": _api_key(),
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.55,
            "similarity_boost": 0.85,
            "style": 0.35,
            "use_speaker_boost": True,
        },
    }
    r = requests.post(url, json=data, headers=headers, timeout=60)
    r.raise_for_status()
    return r.content


def clone_voice(name: str, audio_path: str, description: str = "") -> str:
    """Create a cloned voice from a short sample and return its voice_id."""
    url = "https://api.elevenlabs.io/v1/voices/add"
    headers = {"xi-api-key": _api_key()}
    data = {
        "name": name,
        "description": description or f"Babycare cloned voice: {name}",
    }
    with open(audio_path, "rb") as f:
        files = [("files", (os.path.basename(audio_path), f, "audio/mpeg"))]
        r = requests.post(url, headers=headers, data=data, files=files, timeout=120)
    if not r.ok:
        try:
            body = r.json()
            detail = body.get("detail", body)
            if isinstance(detail, dict):
                msg = detail.get("message") or detail.get("status") or str(detail)
            else:
                msg = str(detail)
        except Exception:
            msg = r.text or f"HTTP {r.status_code}"
        raise RuntimeError(msg)
    return r.json()["voice_id"]
