"""
LLM client — sends acoustic features + parent context, gets back a
structured JSON triage. Uses Claude Sonnet (Anthropic API).
"""

import json
import os
import requests

from taxonomy import CAUSES, EVERYDAY_CAUSES, MEDICAL_CONSIDERATIONS

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_MODEL = "claude-sonnet-4-20250514"


def _build_causes_doc() -> str:
    """One descriptive line per everyday cause, grouped by detection layer."""
    lines = []
    for key, meta in EVERYDAY_CAUSES.items():
        layer = {
            "acoustic": "AUDIO",
            "context": "CONTEXTE",
            "medical": "MÉDICAL",
        }.get(meta["layer"], meta["layer"].upper())
        lines.append(f'- "{key}" [{layer}, preuve audio: {meta["audio_evidence"]}] '
                     f'{meta["fr"]} — {meta["basis"]}')
    return "\n".join(lines)


def _build_probabilities_skeleton() -> str:
    return "{\n" + ",\n".join(f'    "{c}": 0.0' for c in CAUSES) + "\n  }"


def _build_medical_doc() -> str:
    lines = []
    for key, meta in MEDICAL_CONSIDERATIONS.items():
        lines.append(f'- "{key}" (alerte: {meta["alert"]}) {meta["fr"]} — {meta["basis"]}')
    return "\n".join(lines)


SYSTEM_PROMPT = f"""You are BabblAI, a clinical-grade infant cry triage system.
You receive:
1. Acoustic features extracted from a baby's cry audio (scientifically measured)
2. Caregiver-reported context (feeding schedule, sleep, diaper, posture, age)
3. Optional probabilities from a supervised ML classifier trained on Donate-a-Cry

═══════════════════════════════════════════════════════════════
SCIENTIFIC HONESTY — 3 detection layers (this is what makes us credible)
═══════════════════════════════════════════════════════════════
Only TWO things are truly provable from the SOUND alone:
  • PAIN (sudden onset, high f0 >600 Hz, breath-holding) — strong evidence.
  • The LEVEL OF DISTRESS (intensity/pitch) — strong evidence.
"hunger" is moderate (confirm with time-since-feeding). EVERYTHING ELSE
(fatigue, discomfort, gas, overstimulation, stress, need_for_comfort) has NO
distinct acoustic signature — it is DEDUCED FROM CONTEXT, not heard.

So: when you raise a context-layer cause, the driving key_signal MUST have
source "context" (never "audio"). Be transparent about which layer each
conclusion comes from — never pretend to hear what the signal cannot carry.

═══════════════════════════════════════════════════════════════
EVERYDAY CAUSES — the only keys allowed in "probabilities" (must sum ~1.0)
═══════════════════════════════════════════════════════════════
{_build_causes_doc()}

If ML probabilities are provided, treat them as the audio prior: keep the
audio-layer causes (pain, hunger) close to them, and redistribute the rest
using context. If none are provided, estimate yourself.

═══════════════════════════════════════════════════════════════
MEDICAL CONSIDERATIONS — triage only, NEVER a diagnosis, NEVER in probabilities
═══════════════════════════════════════════════════════════════
When audio + context evoke a possible medical cause, list it in
"medical_considerations" as a piste à évoquer avec un pédiatre. Allowed keys:
{_build_medical_doc()}

IMPORTANT: All human-readable text (key_signals, recommended_actions,
reasoning, parent_summary, alert_message, medical_considerations.why) MUST be
in FRENCH, warm and reassuring ("tu" form, as if speaking to an exhausted
parent at 3 AM). Never claim a medical diagnosis — you are a triage and
decision-support tool.

Respond ONLY in this exact JSON format, no markdown, no prose around it:
{{
  "probabilities": {_build_probabilities_skeleton()},
  "distress_level": 0,
  "key_signals": [
    {{"signal": "description", "source": "audio|context|posture", "impact": "high|medium|low"}}
  ],
  "recommended_actions": [
    {{"priority": 1, "action": "description", "reasoning": "why"}}
  ],
  "medical_considerations": [
    {{"condition": "colic|reflux|teething|ear_infection|fever_illness|allergy_cmpa|neuro_redflag", "why": "raison en français", "recommended_alert": "none|monitor|consult_recommended|urgent"}}
  ],
  "confidence_level": "high|medium|low",
  "alert": "none|monitor|consult_recommended|urgent",
  "alert_message": "Si alert != none, un court message en français expliquant pourquoi l'alerte est déclenchée et ce que le parent devrait faire.",
  "parent_summary": "Un résumé chaleureux et rassurant de 2-3 phrases en FRANÇAIS, expliquant la cause la plus probable et quoi essayer en premier, en tutoyant le parent."
}}

"distress_level" is an integer 0-100 estimated from intensity and pitch — the
acoustic urgency, independent of the cause. "medical_considerations" may be an
empty list when nothing medical is evoked.

ALERT LEVELS — Use these precise rules:
- "none": Situation standard, cause identifiée avec confiance. Pas d'inquiétude.
- "monitor": Quelque chose d'inhabituel ou confiance faible. Le parent devrait re-analyser dans 1h. Exemples : pattern ambigu, confiance basse, pleurs prolongés mais pas alarmants.
- "consult_recommended": Pattern anormal suggérant un problème médical potentiel. Le parent devrait consulter un pédiatre dans les 24h. Exemples : douleur récurrente, pattern compatible avec coliques sévères, otite, reflux.
- "urgent": Signaux de détresse aiguë. Le parent devrait contacter un professionnel IMMÉDIATEMENT. Exemples : cri strident inhabituel, douleur intense persistante, pattern neurologique anormal, pleurs inconsolables depuis plus de 45 minutes.
"""


def analyze_with_mistral(features: dict, context: dict, model_probabilities=None) -> dict:
    """Name kept for backward compatibility — now calls Claude Sonnet."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")

    user_msg = (
        "Audio features:\n"
        f"{json.dumps(features, indent=2)}\n\n"
        "Context:\n"
        f"{json.dumps(context, indent=2)}\n\n"
        "Model probabilities (optional, preserve if present):\n"
        f"{json.dumps(model_probabilities, indent=2) if model_probabilities else 'null'}\n\n"
        "Analyze and provide triage assessment."
    )

    payload = {
        "model": ANTHROPIC_MODEL,
        "max_tokens": 1024,
        "system": SYSTEM_PROMPT,
        "messages": [
            {"role": "user", "content": user_msg},
        ],
        "temperature": 0.3,
    }

    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }

    r = requests.post(ANTHROPIC_URL, headers=headers, json=payload, timeout=60)
    r.raise_for_status()
    data = r.json()
    content = data["content"][0]["text"]

    # Be defensive: try to parse JSON, fallback to extracting between braces
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        start = content.find("{")
        end = content.rfind("}")
        if start != -1 and end != -1:
            return json.loads(content[start : end + 1])
        raise
