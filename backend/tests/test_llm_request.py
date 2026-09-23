"""La requête envoyée à Claude, vérifiée sans réseau : modèle actuel, pas de
paramètre refusé par Sonnet 5, JSON imposé par schéma, repli sur refus."""

import json
import os
import sys
import types

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest  # noqa: E402

import mistral_client as mc  # noqa: E402
from triage_rules import context_hypotheses, intensity_observation  # noqa: E402

INTEN = intensity_observation({"duration_seconds": 9.0, "cry_band_fraction": 0.7})
HYPS = context_hypotheses({"lastFeedingTime": "2000-01-01T00:00:00Z"}, 2)


class _FakeMessages:
    def __init__(self, text, stop_reason="end_turn"):
        self.text, self.stop_reason, self.kwargs = text, stop_reason, None

    def create(self, **kwargs):
        self.kwargs = kwargs
        return types.SimpleNamespace(
            stop_reason=self.stop_reason,
            content=[types.SimpleNamespace(type="text", text=self.text)],
        )


@pytest.fixture
def fake(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test")
    holder = {}

    def install(text, stop_reason="end_turn"):
        msgs = _FakeMessages(text, stop_reason)
        monkeypatch.setattr(mc, "_client", types.SimpleNamespace(messages=msgs))
        holder["m"] = msgs
        return msgs
    return install


GOOD_JSON = json.dumps({
    "parent_summary": "Vous avez noté la dernière tétée il y a plus de trois heures. Proposer le sein ou le biberon est la piste la plus simple.",
    "recommended_actions": [{"priority": 1, "action": "Proposez le sein ou le biberon.", "reasoning": "C'est le geste le plus simple à essayer."}],
    "key_signals": [{"signal": "Dernière tétée saisie", "source": "context"}],
})


def test_request_uses_current_sonnet_and_no_rejected_params(fake):
    msgs = fake(GOOD_JSON)
    out = mc.write_parent_guidance(HYPS, INTEN, {}, 2, "Léa")
    k = msgs.kwargs
    assert k["model"] == "claude-sonnet-5"
    assert "temperature" not in k and "top_p" not in k and "top_k" not in k   # 400 sur Sonnet 5
    assert k["thinking"] == {"type": "disabled"}
    assert k["output_config"]["format"]["type"] == "json_schema"
    assert k["output_config"]["format"]["schema"]["additionalProperties"] is False
    assert out["guidance_source"] == "llm"
    assert out["parent_summary"].startswith("Vous avez noté")


def test_no_acoustic_numbers_reach_the_model(fake):
    msgs = fake(GOOD_JSON)
    mc.write_parent_guidance(HYPS, INTEN, {"lastFeedingTime": "2000-01-01T00:00:00Z", "cry_band_fraction": 0.7}, 2)
    sent = msgs.kwargs["messages"][0]["content"]
    assert "cry_band_fraction" not in sent and "0.7" not in sent


def test_refusal_falls_back_to_fixed_text(fake):
    fake(GOOD_JSON, stop_reason="refusal")
    out = mc.write_parent_guidance(HYPS, INTEN, {}, 2)
    assert out["guidance_source"] == "deterministic"


def test_gendered_llm_text_falls_back(fake):
    bad = json.loads(GOOD_JSON)
    bad["parent_summary"] = "Prends-la dans tes bras, elle a sûrement faim."
    fake(json.dumps(bad))
    assert mc.write_parent_guidance(HYPS, INTEN, {}, 2)["guidance_source"] == "deterministic"


def test_no_key_means_fixed_text_without_network(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.delenv("ANTHROPIC_AUTH_TOKEN", raising=False)
    monkeypatch.setattr(mc, "_client", None)
    assert mc.write_parent_guidance(HYPS, INTEN, {}, 2)["guidance_source"] == "deterministic"
