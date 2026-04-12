"""
LLM client — sends acoustic features + parent context, gets back a
structured JSON triage. Uses Claude Sonnet (Anthropic API).
"""

import json
import os
import requests

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_MODEL = "claude-sonnet-4-20250514"

SYSTEM_PROMPT = """You are BabycareAI, a clinical-grade infant cry triage system.
You receive two inputs:
1. Acoustic features extracted from a baby's cry audio (scientifically measured, not subjective)
2. Caregiver-reported context (feeding schedule, sleep schedule, diaper status, posture)
3. Optional probabilities from a supervised ML classifier trained on Donate-a-Cry

Your job is to produce a probabilistic triage assessment. You must:
- If model probabilities are provided, preserve them as-is in the output probabilities.
- If model probabilities are not provided, estimate probabilities yourself (sum to ~1.0).
- Identify which specific signals (audio features + context) drove each probability
- Rank recommended actions by priority
- Be transparent about uncertainty
- Never claim medical diagnosis — you are a decision-support tool

IMPORTANT: All human-readable text (key_signals descriptions, recommended_actions,
reasoning, parent_summary) MUST be written in ENGLISH. Use a warm, gentle,
reassuring tone.

Respond ONLY in this exact JSON format, no markdown, no prose around it:
{
  "probabilities": {
    "hunger": 0.0,
    "fatigue": 0.0,
    "discomfort": 0.0,
    "pain": 0.0,
    "overstimulation": 0.0,
    "need_for_comfort": 0.0
  },
  "key_signals": [
    {"signal": "description", "source": "audio|context|posture", "impact": "high|medium|low"}
  ],
  "recommended_actions": [
    {"priority": 1, "action": "description", "reasoning": "why"}
  ],
  "confidence_level": "high|medium|low",
  "alert": "none|monitor|seek_medical_advice",
  "parent_summary": "A warm and reassuring 2-3 sentence summary in ENGLISH, explaining the most likely cause and what to try first. Write as if speaking directly to a tired parent at 3 AM."
}
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
