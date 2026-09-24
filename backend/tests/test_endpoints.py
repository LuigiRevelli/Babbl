"""
Routes ajoutées le 23/09/2026 : santé détaillée, « ce qui a apaisé », effacement
du compte (RGPD), persistance tolérante à une migration non passée. Sans réseau :
une fausse base Supabase enregistre chaque opération.

Lancer :  cd backend && .venv/bin/python -m pytest tests/test_endpoints.py
"""

import io
import os
import sys
import types

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest  # noqa: E402

import app as babbl_app  # noqa: E402
from test_api import _wav_bytes  # noqa: E402


@pytest.fixture(autouse=True)
def _restore_app_globals():
    """Chaque test remplace la base et ElevenLabs ; on remet les vrais ensuite."""
    saved = (babbl_app._get_supabase, babbl_app.delete_voice)
    yield
    babbl_app._get_supabase, babbl_app.delete_voice = saved

UID = "user-123"
AID = "0123456789abcdef0123456789abcdef"


class _Query:
    def __init__(self, db, table):
        self.db, self.table, self.op, self.payload, self.filters = db, table, None, None, []

    def select(self, *_):
        self.op = "select"; return self

    def insert(self, payload):
        self.op, self.payload = "insert", payload; return self

    def update(self, payload):
        self.op, self.payload = "update", payload; return self

    def delete(self):
        self.op = "delete"; return self

    def eq(self, col, val):
        self.filters.append((col, val)); return self

    def execute(self):
        self.db.log.append((self.table, self.op, self.payload, tuple(self.filters)))
        if (self.table, self.op) in self.db.fail:
            raise RuntimeError("column does not exist")
        if self.op == "insert" and self.payload and "guidance_source" in self.payload and self.db.old_schema:
            raise RuntimeError('column "guidance_source" does not exist')
        if self.op == "select" and self.table == "profiles":
            return types.SimpleNamespace(data=[{"voice_id": "VoiceAbc123456"}])
        if self.op == "update":
            match = dict(self.filters).get("id") == AID and dict(self.filters).get("user_id") == UID
            return types.SimpleNamespace(data=[{"id": AID}] if match else [])
        return types.SimpleNamespace(data=[{}])


class _Admin:
    def __init__(self, db):
        self.db = db

    def delete_user(self, uid):
        self.db.log.append(("auth.users", "delete", None, (("id", uid),)))


class _Auth:
    def __init__(self, db):
        self.admin = _Admin(db)

    def get_user(self, token):
        if token != "good":
            raise RuntimeError("Invalid JWT")
        return types.SimpleNamespace(user=types.SimpleNamespace(id=UID))


class _Db:
    def __init__(self, old_schema=False, fail=()):
        self.log, self.old_schema, self.fail = [], old_schema, set(fail)
        self.auth = _Auth(self)

    def table(self, name):
        return _Query(self, name)


def _client(db):
    babbl_app._get_supabase = lambda: db
    babbl_app.app.config["TESTING"] = True
    return babbl_app.app.test_client()


GOOD = {"Authorization": "Bearer good"}


def test_health_reports_integrations_without_secrets():
    body = _client(None).get("/api/health").get_json()
    assert body["status"] == "ok"
    assert set(body["integrations"]) >= {"llm", "llm_model", "voice", "database"}
    assert body["integrations"]["llm_model"] == "claude-sonnet-5"
    assert "versions" in body
    assert "key" not in str(body).lower().replace("keys", "")


def test_soothed_requires_account_and_valid_answer():
    c = _client(_Db())
    assert c.post(f"/api/analyses/{AID}/soothed", json={"answer": "feeding"}).status_code == 401
    assert c.post(f"/api/analyses/{AID}/soothed", json={"answer": "colique"}, headers=GOOD).status_code == 400


def test_soothed_is_stored_for_the_owner_only():
    db = _Db()
    c = _client(db)
    r = c.post(f"/api/analyses/{AID}/soothed", json={"answer": "arms_or_voice"}, headers=GOOD)
    assert r.status_code == 200 and r.get_json()["stored"] is True
    table, op, payload, filters = db.log[-1]
    assert (table, op, payload["soothed_by"]) == ("analyses", "update", "arms_or_voice")
    assert ("user_id", UID) in filters  # jamais la ligne d'une autre famille
    other = "f" * 32
    assert c.post(f"/api/analyses/{other}/soothed", json={"answer": "feeding"}, headers=GOOD).status_code == 404


def test_soothed_without_migration_is_accepted_not_lost():
    c = _client(_Db(fail={("analyses", "update")}))
    r = c.post(f"/api/analyses/{AID}/soothed", json={"answer": "sleep"}, headers=GOOD)
    assert r.status_code == 202 and r.get_json()["stored"] is False


def test_analysis_is_saved_even_before_the_migration():
    db = _Db(old_schema=True)
    c = _client(db)
    r = c.post("/api/analyze", data={"audio": (io.BytesIO(_wav_bytes(8.0)), "r.wav"), "context": "{}"}, headers=GOOD)
    assert r.status_code == 200, r.get_json()
    inserts = [e for e in db.log if e[0] == "analyses" and e[1] == "insert"]
    assert len(inserts) == 2 and "guidance_source" not in inserts[-1][2]
    assert r.get_json()["persisted"] is True


def test_delete_me_erases_voice_tables_then_account():
    deleted_voices = []
    babbl_app.delete_voice = lambda vid: deleted_voices.append(vid) or True
    db = _Db()
    r = _client(db).delete("/api/me", headers=GOOD)
    body = r.get_json()
    assert r.status_code == 200 and body["deleted"] is True, body
    assert deleted_voices == ["VoiceAbc123456"]
    deleted_tables = [t for t, op, _, f in db.log if op == "delete"]
    assert deleted_tables[:5] == ["analyses", "context_logs", "badges", "baby_baselines", "profiles"]
    assert deleted_tables[-1] == "auth.users"   # le compte en dernier


def test_delete_me_keeps_account_when_a_table_fails():
    babbl_app.delete_voice = lambda vid: True
    db = _Db(fail={("badges", "delete")})
    r = _client(db).delete("/api/me", headers=GOOD)
    assert r.status_code == 207
    assert not any(t == "auth.users" for t, *_ in db.log)   # effacement relançable


def test_delete_me_requires_account():
    assert _client(_Db()).delete("/api/me").status_code == 401


def test_unknown_age_is_not_invented():
    """Sans âge, la réponse met toutes les cartes en avant (plus de « 3 mois » par défaut)."""
    c = _client(None)
    r = c.post("/api/analyze", data={"audio": (io.BytesIO(_wav_bytes(8.0)), "r.wav"), "context": "{}"})
    cards = r.get_json()["safety"]["cards"]
    assert all(card["emphasized"] for card in cards)


def test_migration_lists_exactly_the_taxonomy_answers():
    import re
    from taxonomy import SOOTHED_BY
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    sql = open(os.path.join(root, "supabase", "migrations", "20260923_soothed_and_guidance_source.sql")).read()
    block = sql[sql.index("soothed_by in ("):sql.index(")", sql.index("soothed_by in ("))]
    assert set(re.findall(r"'([a-z_]+)'", block)) == set(SOOTHED_BY) | {"skipped"}


def test_export_requires_account():
    assert _client(_Db()).get("/api/me/export").status_code == 401


def test_export_reads_every_user_table_for_the_owner_only():
    db = _Db()
    body = _client(db).get("/api/me/export", headers=GOOD).get_json()
    assert set(body["tables"]) == {t for t, _ in babbl_app._USER_TABLES}
    selects = [(t, f) for t, op, _, f in db.log if op == "select"]
    assert all(dict(f).get("user_id", dict(f).get("id")) == UID for _, f in selects)
    assert body["account"]["id"] == UID and body["errors"] == {}


def test_export_reports_a_failing_table_instead_of_hiding_it():
    body = _client(_Db(fail={("badges", "select")})).get("/api/me/export", headers=GOOD).get_json()
    assert body["errors"] == {"badges": "RuntimeError"}
    assert "badges" not in body["tables"]


# ─── Limite de débit : adresse non falsifiable, mémoire bornée ───────

class _Req:
    def __init__(self, xff="", remote="10.0.0.9"):
        self.headers = {"X-Forwarded-For": xff} if xff else {}
        self.remote_addr = remote


def test_client_cannot_choose_its_address_behind_one_proxy():
    from security import client_ip
    # le client écrit « 1.2.3.4 », l'hébergeur ajoute la vraie adresse à droite
    assert client_ip(_Req("1.2.3.4, 203.0.113.7"), proxies=1) == "203.0.113.7"
    assert client_ip(_Req("203.0.113.7"), proxies=1) == "203.0.113.7"
    assert client_ip(_Req(""), proxies=1) == "10.0.0.9"


def test_no_proxy_ignores_the_header():
    from security import client_ip
    assert client_ip(_Req("1.2.3.4"), proxies=0) == "10.0.0.9"


def test_spoofed_addresses_do_not_bypass_the_limit():
    """Même en changeant d'adresse inventée à chaque requête, la 21e passe pas."""
    babbl_app._get_supabase = lambda: None
    saved = babbl_app._analyze_limiter
    from security import RateLimiter
    babbl_app._analyze_limiter = RateLimiter(limit=3, window_s=600)
    try:
        c = babbl_app.app.test_client()
        codes = []
        for i in range(5):
            r = c.post("/api/analyze", data={"audio": (io.BytesIO(b"x"), "r.wav"), "context": "{}"},
                       headers={"X-Forwarded-For": f"9.9.9.{i}, 203.0.113.7"})
            codes.append(r.status_code)
        assert codes[-1] == 429 and codes.count(429) == 2, codes
    finally:
        babbl_app._analyze_limiter = saved


def test_limiter_memory_is_bounded():
    from security import RateLimiter
    rl = RateLimiter(limit=5, window_s=600)
    rl.MAX_KEYS = 100
    for i in range(1000):
        rl.allow(f"k{i}", now=float(i))
    assert len(rl) <= 100


def test_cors_restricted_to_allowed_origins():
    """BABBL_ALLOWED_ORIGINS définie : seul le site de Babbl reçoit l'en-tête CORS."""
    import subprocess
    code = (
        "import app; c = app.app.test_client();"
        "ok = c.get('/api/cards', headers={'Origin': 'https://babbl.fr'}).headers.get('Access-Control-Allow-Origin');"
        "bad = c.get('/api/cards', headers={'Origin': 'https://evil.example'}).headers.get('Access-Control-Allow-Origin');"
        "h = c.get('/api/health').get_json()['security']['cors'];"
        "print(ok, bad, h)"
    )
    env = {**os.environ, "BABBL_ALLOWED_ORIGINS": "https://babbl.fr"}
    out = subprocess.run([sys.executable, "-c", code], cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                         env=env, capture_output=True, text=True, timeout=120).stdout.split()
    assert out[-3:] == ["https://babbl.fr", "None", "restricted"], out
