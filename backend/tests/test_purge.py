"""Purge par durée de conservation : désactivée par défaut, garde-fou, dates."""

import os
import sys
import types
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest  # noqa: E402

import purge  # noqa: E402


class _Q:
    def __init__(self, db, table):
        self.db, self.table, self.op, self.filters = db, table, None, []

    def select(self, *_, **__):
        self.op = "select"; return self

    def delete(self):
        self.op = "delete"; return self

    def lt(self, col, val):
        self.filters.append((col, val)); return self

    def execute(self):
        self.db.log.append((self.table, self.op, tuple(self.filters)))
        if self.table in self.db.fail:
            raise RuntimeError("boom")
        return types.SimpleNamespace(data=[{}, {}], count=2)


class _Db:
    def __init__(self, fail=()):
        self.log, self.fail = [], set(fail)

    def table(self, name):
        return _Q(self, name)


def test_off_by_default(monkeypatch):
    monkeypatch.delenv("BABBL_RETENTION_DAYS", raising=False)
    assert purge.retention_days({}) is None
    assert purge.retention_days({"BABBL_RETENTION_DAYS": " "}) is None
    assert purge.main([]) == 0  # ne touche pas la base


def test_typo_guard():
    with pytest.raises(ValueError):
        purge.retention_days({"BABBL_RETENTION_DAYS": "7"})
    assert purge.retention_days({"BABBL_RETENTION_DAYS": "730"}) == 730


def test_deletes_only_rows_older_than_the_cutoff():
    db = _Db()
    now = datetime(2026, 9, 23, tzinfo=timezone.utc)
    report = purge.purge(db, 365, now=now)
    assert report == {"analyses": 2, "context_logs": 2}
    for table, op, filters in db.log:
        assert op == "delete"
        assert filters == (("created_at", "2025-09-23T00:00:00+00:00"),)
    assert {t for t, *_ in db.log} == {"analyses", "context_logs"}  # jamais profils ni comptes


def test_dry_run_deletes_nothing():
    db = _Db()
    purge.purge(db, 365, dry_run=True)
    assert all(op == "select" for _, op, _ in db.log)


def test_a_failing_table_is_reported_and_the_other_still_purged():
    report = purge.purge(_Db(fail={"analyses"}), 365)
    assert report["analyses"].startswith("failed") and report["context_logs"] == 2
