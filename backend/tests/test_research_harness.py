"""Le banc de R&D doit trouver un signal quand il existe, et n'en inventer aucun sinon."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "research"))

import eval_harness as h  # noqa: E402


def test_no_signal_gives_no_go():
    r = h.evaluate(h.synthetic(n_babies=12, per_cause=15, d_personal=0.0, d_universal=0.0))
    assert not r["GO_UNIVERSAL"] and not r["GO_PERSONAL"]


def test_personal_signal_is_found_where_a_shared_model_fails():
    r = h.evaluate(h.synthetic(n_babies=12, per_cause=15, d_personal=3.0, d_universal=0.0))
    assert r["GO_PERSONAL"] and not r["GO_UNIVERSAL"]
