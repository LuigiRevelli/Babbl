"""
Journaux structurés : une ligne JSON par événement, jamais une donnée de la famille.

Lancer :  cd backend && .venv/bin/python -m pytest tests/test_logs.py
"""

import io
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app as babbl_app  # noqa: E402
from logs import log_event  # noqa: E402
from test_api import _wav_bytes  # noqa: E402


def test_unknown_fields_are_dropped_by_name_only():
    buf = io.StringIO()
    rec = log_event("x", stream=buf, route="/api/analyze", baby_name="Léa", user_id="abc", summary="Il a faim")
    line = json.loads(buf.getvalue())
    assert line == rec
    assert line["route"] == "/api/analyze"
    assert line["dropped"] == ["baby_name", "summary", "user_id"]
    assert "Léa" not in buf.getvalue() and "faim" not in buf.getvalue() and "abc" not in buf.getvalue()


def test_long_values_are_cut():
    rec = log_event("x", stream=io.StringIO(), error_type="E" * 500)
    assert len(rec["error_type"]) == 80


def test_analyze_logs_one_request_line_with_the_same_id(capsys):
    babbl_app._get_supabase_saved = babbl_app._get_supabase
    babbl_app._get_supabase = lambda: None
    try:
        c = babbl_app.app.test_client()
        ctx = json.dumps({"babyName": "Zoé-Secret", "notes": "texte privé du parent"})
        r = c.post("/api/analyze", data={"audio": (io.BytesIO(_wav_bytes(8.0)), "r.wav"), "context": ctx},
                   headers={"X-Request-ID": "trace-12345678"})
    finally:
        babbl_app._get_supabase = babbl_app._get_supabase_saved
    assert r.status_code == 200
    assert r.headers["X-Request-ID"] == "trace-12345678"
    out = capsys.readouterr().out
    lines = [json.loads(line) for line in out.splitlines() if line.startswith("{")]
    events = {line["event"]: line for line in lines}
    assert events["request"]["route"] == "/api/analyze" and events["request"]["status"] == 200
    assert events["analyze"]["gate"] == "ok" and events["analyze"]["auth"] == "none"
    assert all(line.get("request_id") == "trace-12345678" for line in lines if line["event"] in ("request", "analyze"))
    assert "Zoé" not in out and "privé" not in out
    assert not any("dropped" in line for line in lines), lines


def test_bad_request_id_header_is_replaced():
    r = babbl_app.app.test_client().get("/api/cards", headers={"X-Request-ID": "<script>"})
    assert r.headers["X-Request-ID"] != "<script>" and len(r.headers["X-Request-ID"]) == 16


def test_route_rule_not_real_path(capsys):
    babbl_app.app.test_client().post("/api/analyses/" + "a" * 32 + "/soothed", json={"answer": "sleep"})
    out = capsys.readouterr().out
    assert "a" * 32 not in out
    assert "/api/analyses/<analysis_id>/soothed" in out
