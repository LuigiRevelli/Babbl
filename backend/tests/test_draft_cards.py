"""Les brouillons de cartes passent le crible des cartes de sécurité, disent ce
que Babbl n'entend pas, et ne sont servis par aucun code."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from draft_cards import DRAFT_CARDS, DRAFT_FAQ  # noqa: E402
from mistral_client import violates_static  # noqa: E402

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def test_drafts_pass_the_safety_card_sieve():
    for key, card in DRAFT_CARDS.items():
        for field in ("title", "body"):
            hit = violates_static(card[field], allow_medical=True)
            assert hit is None, (key, field, hit)


def test_faq_passes_the_static_sieve_except_disease_free_negations():
    for key, text in DRAFT_FAQ.items():
        hit = violates_static(text, allow_medical=True)
        assert hit is None, (key, hit)


def test_every_card_says_the_microphone_does_not_hear_it_or_is_advice_only():
    markers = ("Babbl n'", "pas le micro", "pas avec le micro", "ne dit rien", "Le pleur ne permet pas", "On ne secoue jamais")
    for key, card in DRAFT_CARDS.items():
        if key.startswith("when_to_call"):
            continue
        assert any(m in card["body"] for m in markers), key


def test_drafts_are_not_served():
    for name in ("app.py", "triage_rules.py", "taxonomy.py", "mistral_client.py"):
        with open(os.path.join(BACKEND, name), encoding="utf-8") as fh:
            assert "draft_cards" not in fh.read(), name
