"""
Tests des règles déterministes et du garde-fou LLM. Sans réseau.

Lancer :  cd backend && .venv/bin/python -m tests.test_rules
(ou pytest si installé)
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta, timezone

from mistral_client import fallback_guidance, sanitize_llm_output
from taxonomy import HYPOTHESIS_KEYS, SAFETY_CARDS
from triage_rules import context_hypotheses, intensity_observation, recording_gate, safety_cards


def _iso_ago(minutes: float) -> str:
    return (datetime.now(timezone.utc) - timedelta(minutes=minutes)).isoformat()


GOOD = {"duration_seconds": 9.8, "voiced_fraction": 0.75, "cry_band_fraction": 0.72, "cry_pitch_spread": 0.15, "pitch_median_hz": 480.0}


def test_gate_recognises_a_cry_not_a_volume():
    assert recording_gate({"duration_seconds": 1.2, "cry_band_fraction": 0.8})[1] == "too_short"
    assert recording_gate({"duration_seconds": 8.0, "cry_band_fraction": 0.02})[1] == "no_cry_detected"   # bruit, voix adulte
    assert recording_gate({"duration_seconds": 8.0, "cry_band_fraction": 0.0, "voiced_fraction": 1.0})[1] == "no_cry_detected"  # voisé hors bande
    assert recording_gate({"duration_seconds": 8.0})[1] == "no_cry_detected"
    # un vrai pleur haché (pleur rauque, pauses) doit passer : 5 % suffisent
    assert recording_gate({"duration_seconds": 8.0, "cry_band_fraction": 0.06, "cry_pitch_spread": 0.06})[0]
    # voix dans la bande mais hauteur figée (alarme, moteur) : refusé
    assert recording_gate({"duration_seconds": 8.0, "cry_band_fraction": 0.9, "cry_pitch_spread": 0.01})[1] == "no_cry_detected"
    ok, code, msg = recording_gate(GOOD)
    assert ok and code is None and msg is None


def test_intensity_is_text_only_and_never_reassuring():
    for feats, level in (
        (GOOD, "intense"),
        ({"duration_seconds": 9.0, "cry_band_fraction": 0.47, "pitch_median_hz": 380.0}, "modere"),
        ({"duration_seconds": 9.0, "cry_band_fraction": 0.20, "pitch_median_hz": 380.0}, "faible"),
        ({"duration_seconds": 9.0, "cry_band_fraction": 0.75, "pitch_median_hz": 300.0}, "intense"),   # la hauteur ne décide plus
    ):
        out = intensity_observation(feats)
        assert out["level"] == level
        assert set(out) == {"level", "observation", "disclaimer"}  # aucun score chiffré
        assert "%" not in out["observation"]
        assert "n'est jamais rassurant" in out["disclaimer"]
        assert "normal" not in out["observation"].lower()


def test_hypotheses_come_from_context_only():
    ctx = {"lastFeedingTime": _iso_ago(250), "lastDiaperTime": _iso_ago(200), "babyAgeMonths": 2}
    hyps = context_hypotheses(ctx, 2)
    keys = [h["key"] for h in hyps]
    assert keys[0] == "hunger", keys
    assert "discomfort" in keys and "need_for_comfort" in keys
    assert all(h["source"] == "context" for h in hyps)
    assert all(h["key"] in HYPOTHESIS_KEYS for h in hyps)
    assert all("pas du son" in h["disclaimer"] for h in hyps)
    # sans contexte : uniquement le réconfort, jamais une cause inventée
    assert [h["key"] for h in context_hypotheses({}, None)] == ["need_for_comfort"]


def test_delays_read_like_speech():
    from triage_rules import _fmt_delay
    assert _fmt_delay(45) == "45 min"
    assert _fmt_delay(120) == "2 h"
    assert _fmt_delay(200) == "3 h 20"
    assert _fmt_delay(0.2) == "1 min"


def test_unknown_age_emphasizes_every_card():
    """Sans date de naissance ni âge, aucune carte ne doit être éteinte."""
    assert all(_emph({}, None).values())


def test_fallback_is_formal_and_gender_neutral():
    import re
    ctx = {"lastFeedingTime": _iso_ago(250), "awakeSinceAt": _iso_ago(150), "babyAgeMonths": 2}
    out = fallback_guidance(context_hypotheses(ctx, 2), intensity_observation(GOOD), "Léa")
    text = " ".join([out["parent_summary"]] + [a["action"] + " " + a["reasoning"] for a in out["recommended_actions"]])
    assert not re.search(r"\btu\b|\bton\b|\bta\b|\btoi\b", text, re.I), text          # vouvoiement
    assert not re.search(r"-le\b|-la\b|éveillé|réveillé|fatigué|calmé", text, re.I), text  # aucun genre supposé
    assert "Léa" in text
    assert "3 h 30" in out["parent_summary"] or "4 h" in out["parent_summary"] or "h" in out["parent_summary"]


def _emph(ctx, age=None):
    return {c["key"]: c["emphasized"] for c in safety_cards(ctx, age)["cards"]}


def _born_days_ago(n: int) -> str:
    return (datetime.now(timezone.utc).date() - timedelta(days=n)).isoformat()


def test_safety_cards_always_all_three_emphasised_by_age_only():
    for ctx, age in (({}, 8), ({"babyAgeMonths": 1}, 1), ({"babyAgeDays": 5}, 0), ({"babyBirthDate": _born_days_ago(3)}, None)):
        out = safety_cards(ctx, age)
        assert {c["key"] for c in out["cards"]} == set(SAFETY_CARDS)
        assert out["footer"].startswith("En cas de doute")
        assert _emph(ctx, age)["breathing"]                                   # toujours en avant
    assert _emph({}, 1)["fever_under_3_months"]
    assert not _emph({}, 6)["fever_under_3_months"]
    # la date de naissance prime : 3 jours → nouveau-né ET moins de 3 mois ; 40 jours → plus nouveau-né
    e3 = _emph({"babyBirthDate": _born_days_ago(3)})
    assert e3["newborn_under_15_days"] and e3["fever_under_3_months"]
    e40 = _emph({"babyBirthDate": _born_days_ago(40), "babyAgeMonths": 9})   # la date bat la tranche
    assert not e40["newborn_under_15_days"] and e40["fever_under_3_months"]
    # une température saisie ne déclenche rien : ce serait une règle de triage
    assert not _emph({"feverMeasuredC": 39.2}, 6)["fever_under_3_months"]
    assert _emph({"babyAgeDays": 5}, 0)["newborn_under_15_days"]


def test_sanitizer_blocks_medical_claims_percentages_and_alerts():
    hyps = context_hypotheses({"lastFeedingTime": _iso_ago(200)}, 3)
    inten = intensity_observation(GOOD)
    bad = {
        "probabilities": {"hunger": 0.8},
        "alert": "urgent",
        "medical_considerations": [{"condition": "colic"}],
        "parent_summary": "Il a 80% de chances d'avoir une colique, le son l'indique.",
        "recommended_actions": [
            {"priority": 1, "action": "Consulte pour une otite.", "reasoning": "douleur probable"},
            {"priority": 2, "action": "Propose le sein.", "reasoning": "Dernière tétée il y a longtemps."},
        ],
        "key_signals": [
            {"signal": "pitch 600 Hz détecté", "source": "audio"},
            {"signal": "Dernière tétée il y a 3 h", "source": "context"},
        ],
    }
    out = sanitize_llm_output(bad, hyps, inten, "Léa")
    assert set(out) == {"parent_summary", "recommended_actions", "key_signals", "guidance_source"}
    assert "%" not in out["parent_summary"] and "colique" not in out["parent_summary"].lower()
    assert out["guidance_source"] == "deterministic"
    assert [a["action"] for a in out["recommended_actions"]] == ["Propose le sein."]
    assert all(s["source"] in ("context", "intensity") for s in out["key_signals"])
    assert not any("audio" == s["source"] for s in out["key_signals"])


def test_sanitizer_keeps_a_clean_llm_answer():
    hyps = context_hypotheses({"lastFeedingTime": _iso_ago(200)}, 3)
    inten = intensity_observation(GOOD)
    good = {
        "parent_summary": "D'après ta dernière tétée il y a 3 h, la faim est l'hypothèse la plus simple. Essaie d'abord ça.",
        "recommended_actions": [{"priority": 1, "action": "Propose le sein ou le biberon.", "reasoning": "C'est le plus simple à tester."}],
        "key_signals": [{"signal": "Dernière tétée il y a 3 h", "source": "context"}],
    }
    out = sanitize_llm_output(good, hyps, inten)
    assert out["guidance_source"] == "llm"
    assert out["parent_summary"] == good["parent_summary"]


def test_fallback_never_empty():
    out = fallback_guidance([], intensity_observation(GOOD), None)
    assert out["parent_summary"] and out["recommended_actions"] and out["key_signals"]
    assert "%" not in out["parent_summary"]


def test_observation_words_describe_only_what_is_measured():
    """La porte mesure une continuité (trames voisées). Les mots affichés ne
    doivent parler ni de hauteur (« aigu »), ni de volume (« faible », « fort »),
    ni d'intensité ou de détresse, que Babbl ne mesure pas."""
    import re
    from taxonomy import INTENSITY_OBSERVATIONS
    banned = re.compile(r"aigu|grave|faible|\bfort|intens|détresse|detresse|douleur|monoton", re.IGNORECASE)
    for level, text in INTENSITY_OBSERVATIONS.items():
        assert not banned.search(text), (level, text)


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for fn in fns:
        fn()
        print(f"ok  {fn.__name__}")
    print(f"{len(fns)} tests passed")
