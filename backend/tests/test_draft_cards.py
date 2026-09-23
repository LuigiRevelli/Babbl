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


def test_drafts_are_not_served_by_default(monkeypatch):
    """Tant que BABBL_CARDS_V2 n'est pas activé (après relecture pédiatrique),
    les parents voient les trois cartes v1 et aucun menu."""
    from taxonomy import SAFETY_CARDS
    from triage_rules import parent_menus, safety_cards
    monkeypatch.delenv("BABBL_CARDS_V2", raising=False)
    keys = {c["key"] for c in safety_cards({}, 2)["cards"]}
    assert keys == set(SAFETY_CARDS)
    assert parent_menus() == []


def test_v2_switch_serves_the_drafts_with_age_emphasis(monkeypatch):
    from triage_rules import parent_menus, safety_cards
    monkeypatch.setenv("BABBL_CARDS_V2", "1")
    young = {c["key"]: c["emphasized"] for c in safety_cards({}, 1)["cards"]}
    assert {"call_15", "breathing_and_cough", "newborn_under_15_days", "never_shake"} <= set(young)
    assert young["call_15"] and young["breathing_and_cough"]
    older = {c["key"]: c["emphasized"] for c in safety_cards({}, 11)["cards"]}
    assert "milestone_babbling" in older and not older["breathing_and_cough"]
    assert "milestone_babbling" not in young
    unknown = safety_cards({}, None)["cards"]
    assert all(c["emphasized"] for c in unknown if c["key"] != "never_shake" or True)
    assert {m["key"] for m in parent_menus()} >= {"cough_menu", "when_to_call_breath_holding"}


def test_every_emphasis_rule_is_understood():
    from triage_rules import _emphasis
    for key, card in DRAFT_CARDS.items():
        _emphasis(card.get("emphasize", "always" if card["trigger"] == "always" else None), 2, 60)
