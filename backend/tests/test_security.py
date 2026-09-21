"""
Tests de sécurité et de minimisation — sans réseau.

Lancer :  cd backend && .venv/bin/python tests/test_security.py
"""

import io
import json
import os
import sys
import time
import types

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from security import AuthResult, RateLimiter, is_safe_audio_name, sweep_old_files, verify_user  # noqa: E402


class _FakeAuth:
    def __init__(self, behaviour):
        self.behaviour = behaviour

    def get_user(self, token):
        if self.behaviour == "raise_invalid":
            raise RuntimeError("Invalid JWT: signature verification failed")
        if self.behaviour == "raise_transient":
            raise RuntimeError("Connection timed out")
        if self.behaviour == "no_user":
            return types.SimpleNamespace(user=None)
        return types.SimpleNamespace(user=types.SimpleNamespace(id="user-123"))


class _FakeSb:
    def __init__(self, behaviour):
        self.auth = _FakeAuth(behaviour)


def test_verify_user_states():
    assert verify_user(_FakeSb("ok"), None) == AuthResult("none")
    assert verify_user(_FakeSb("ok"), "Bearer ") == AuthResult("invalid")
    assert verify_user(None, "Bearer abc") == AuthResult("unavailable")
    assert verify_user(_FakeSb("ok"), "Bearer abc") == AuthResult("verified", "user-123")
    assert verify_user(_FakeSb("raise_invalid"), "Bearer forged") == AuthResult("invalid")
    assert verify_user(_FakeSb("raise_transient"), "Bearer abc") == AuthResult("unavailable")
    assert verify_user(_FakeSb("no_user"), "Bearer abc") == AuthResult("invalid")


def test_rate_limiter_sliding_window():
    rl = RateLimiter(limit=2, window_s=10)
    assert rl.allow("ip", now=0.0) and rl.allow("ip", now=1.0)
    assert not rl.allow("ip", now=2.0)
    assert rl.allow("other", now=2.0)         # clé indépendante
    assert rl.allow("ip", now=11.0)           # fenêtre écoulée


def test_audio_name_whitelist():
    assert is_safe_audio_name("0123456789abcdef0123456789abcdef.mp3")
    assert is_safe_audio_name("0123456789abcdef0123456789abcdef_comfort.mp3")
    for bad in ("../.env", "voice_abc.webm", "0123456789abcdef0123456789abcdef.wav", "x.mp3", "", "0123456789ABCDEF0123456789abcdef.mp3"):
        assert not is_safe_audio_name(bad), bad


def test_sweep_removes_only_old_mp3(tmp_path=None):
    import tempfile
    d = tempfile.mkdtemp()
    old = os.path.join(d, "old.mp3"); new = os.path.join(d, "new.mp3"); wav = os.path.join(d, "old.wav")
    for p in (old, new, wav):
        open(p, "wb").write(b"x")
    past = time.time() - 3 * 3600
    os.utime(old, (past, past)); os.utime(wav, (past, past))
    removed = sweep_old_files(d, max_age_s=3600)
    assert removed == 1 and not os.path.exists(old) and os.path.exists(new) and os.path.exists(wav)


# ─── Bout-en-bout : l'API applique la doctrine ───────────────────────

import app as babbl_app  # noqa: E402
os.environ["ANTHROPIC_API_KEY"] = ""
os.environ["ELEVENLABS_API_KEY"] = ""
os.environ["SUPABASE_URL"] = ""
os.environ["SUPABASE_SERVICE_KEY"] = ""

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from test_api import _post, _wav_bytes  # noqa: E402


def test_clone_requires_verified_user():
    client = babbl_app.app.test_client()
    data = {"audio": (io.BytesIO(b"RIFF"), "voice_sample.webm"), "name": "Test"}
    r = client.post("/api/voice/clone", data=data, content_type="multipart/form-data")
    assert r.status_code == 401
    assert r.get_json()["code"] == "auth_required"


def test_forged_token_is_refused_with_cards(monkeypatch=None):
    client = babbl_app.app.test_client()
    original = babbl_app._get_supabase
    babbl_app._get_supabase = lambda: _FakeSb("raise_invalid")
    try:
        r = client.post(
            "/api/analyze",
            data={"audio": (io.BytesIO(_wav_bytes(8.0)), "recording.wav"), "context": "{}"},
            content_type="multipart/form-data",
            headers={"Authorization": "Bearer forged.token.here"},
        )
    finally:
        babbl_app._get_supabase = original
    assert r.status_code == 401
    body = r.get_json()
    assert body["code"] == "auth_invalid"
    assert {c["key"] for c in body["safety"]["cards"]} == {"fever_under_3_months", "breathing", "newborn_under_15_days"}


def test_token_without_supabase_is_anonymous_not_blocked():
    client = babbl_app.app.test_client()
    r = client.post(
        "/api/analyze",
        data={"audio": (io.BytesIO(_wav_bytes(8.0, silent_tail=1.0)), "recording.wav"), "context": "{}"},
        content_type="multipart/form-data",
        headers={"Authorization": "Bearer whatever"},
    )
    assert r.status_code == 200
    assert r.get_json()["persisted"] is False


def test_raw_audio_is_deleted_after_analysis():
    client = babbl_app.app.test_client()
    before = {n for n in os.listdir(babbl_app.TMP_DIR)}
    r = _post(client, _wav_bytes(8.0, silent_tail=1.0), {})
    assert r.status_code == 200
    after = {n for n in os.listdir(babbl_app.TMP_DIR)}
    leftover = [n for n in after - before if n.endswith((".wav", ".webm", ".m4a", ".ogg"))]
    assert leftover == [], leftover


def test_audio_endpoint_rejects_paths():
    client = babbl_app.app.test_client()
    for name in ("..%2F.env", "voice_abc.webm", "notamp3.txt"):
        assert client.get(f"/api/audio/{name}").status_code == 404


def test_rate_limit_refusal_carries_cards():
    client = babbl_app.app.test_client()
    saved = babbl_app._analyze_limiter
    babbl_app._analyze_limiter = RateLimiter(limit=1, window_s=600)
    try:
        assert _post(client, _wav_bytes(8.0, silent_tail=1.0), {}).status_code == 200
        r = _post(client, _wav_bytes(8.0, silent_tail=1.0), {})
    finally:
        babbl_app._analyze_limiter = saved
    assert r.status_code == 429
    assert "safety" in r.get_json()


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for fn in fns:
        fn()
        print(f"ok  {fn.__name__}")
    print(f"{len(fns)} tests passed")
