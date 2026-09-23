"""
ElevenLabs TTS client — text-to-speech and instant voice cloning.
"""

import mimetypes
import os

import requests

# Rachel — calm warm female voice (fallback)
DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"

# Une réponse à 3 h du matin n'attend pas la voix : délai court, repli silencieux.
TTS_TIMEOUT_S = float(os.environ.get("TTS_TIMEOUT_S", "6"))
# Sous le délai de gunicorn (30 s) : au-delà, le worker était tué et le parent
# recevait une erreur 500 muette au lieu du message « le clonage a échoué ».
CLONE_TIMEOUT_S = float(os.environ.get("CLONE_TIMEOUT_S", "25"))

_AUDIO_TYPES = {".webm": "audio/webm", ".m4a": "audio/mp4", ".mp4": "audio/mp4", ".ogg": "audio/ogg",
                ".wav": "audio/wav", ".mp3": "audio/mpeg", ".aac": "audio/aac"}


def tts_configured() -> bool:
    return bool(os.environ.get("ELEVENLABS_API_KEY"))


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
    r = requests.post(url, json=data, headers=headers, timeout=TTS_TIMEOUT_S)
    r.raise_for_status()
    return r.content


def clone_voice(name: str, audio_path: str, description: str = "") -> str:
    """Create a cloned voice from a short sample and return its voice_id."""
    url = "https://api.elevenlabs.io/v1/voices/add"
    headers = {"xi-api-key": _api_key()}
    data = {
        "name": name,
        "description": description or f"Babbl cloned voice: {name}",
    }
    with open(audio_path, "rb") as f:
        ext = os.path.splitext(audio_path)[1].lower()
        mime = _AUDIO_TYPES.get(ext) or mimetypes.guess_type(audio_path)[0] or "application/octet-stream"
        files = [("files", (os.path.basename(audio_path), f, mime))]
        r = requests.post(url, headers=headers, data=data, files=files, timeout=CLONE_TIMEOUT_S)
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


def delete_voice(voice_id: str) -> bool:
    """Supprime une voix clonée du compte ElevenLabs de Babbl (effacement RGPD).
    Retourne True si la voix n'existe plus (supprimée ou déjà absente)."""
    r = requests.delete(
        f"https://api.elevenlabs.io/v1/voices/{voice_id}",
        headers={"xi-api-key": _api_key()},
        timeout=TTS_TIMEOUT_S,
    )
    return r.ok or r.status_code == 404
