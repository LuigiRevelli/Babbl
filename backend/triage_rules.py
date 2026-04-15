"""
Context-aware post-processing rules for cry prediction.

The ML model provides audio-based probabilities. These helpers adjust the
distribution using lightweight contextual rules from the dashboard and compute
an interpretable reliability score for the user.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, Tuple


CAUSES = [
    "hunger",
    "fatigue",
    "discomfort",
    "pain",
    "overstimulation",
    "need_for_comfort",
]


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def _normalize(probabilities: Dict[str, float]) -> Dict[str, float]:
    total = sum(max(float(probabilities.get(c, 0.0)), 0.0) for c in CAUSES)
    if total <= 0:
        return {cause: 1.0 / len(CAUSES) for cause in CAUSES}
    return {cause: max(float(probabilities.get(cause, 0.0)), 0.0) / total for cause in CAUSES}


def _minutes_since_iso(iso_value: str | None) -> float | None:
    if not iso_value:
        return None
    try:
        parsed = datetime.fromisoformat(iso_value.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return max((now - parsed).total_seconds() / 60.0, 0.0)
    except Exception:
        return None


def _bucket_to_minutes(bucket: str | None) -> float | None:
    mapping = {
        "<1h": 30,
        "1-2h": 90,
        "2-3h": 150,
        "3-4h": 210,
        "4h+": 300,
        "<30min": 15,
        "30min-1h": 45,
        "2h+": 120,
    }
    if not bucket:
        return None
    return mapping.get(bucket)


def _meal_minutes(context: dict) -> float | None:
    iso_minutes = _minutes_since_iso(context.get("lastMealAt") or context.get("last_meal_at"))
    if iso_minutes is not None:
        return iso_minutes
    return _bucket_to_minutes(context.get("time_since_last_feeding"))


def _diaper_minutes(context: dict) -> float | None:
    iso_minutes = _minutes_since_iso(context.get("lastDiaperAt") or context.get("last_diaper_at"))
    if iso_minutes is not None:
        return iso_minutes
    return _bucket_to_minutes(context.get("time_since_last_diaper"))


def apply_context_rules(probabilities: Dict[str, float], context: dict) -> tuple[Dict[str, float], list[str]]:
    """Adjust a probability distribution using lightweight contextual rules."""
    probs = _normalize(probabilities)
    notes: list[str] = []

    meal_minutes = _meal_minutes(context)
    if meal_minutes is not None:
        if meal_minutes < 60:
            probs["hunger"] *= 0.55
            notes.append("Recent feeding lowers the hunger prior.")
        elif meal_minutes < 120:
            probs["hunger"] *= 0.85
            notes.append("Feeding within the last 2 hours keeps hunger moderate.")
        elif meal_minutes < 240:
            probs["hunger"] *= 1.15
            notes.append("Feeding more than 2 hours ago increases hunger slightly.")
        else:
            probs["hunger"] *= 1.35
            notes.append("Feeding far in the past increases hunger strongly.")

    diaper_minutes = _diaper_minutes(context)
    if diaper_minutes is not None:
        if diaper_minutes < 60:
            probs["discomfort"] *= 0.7
            probs["pain"] *= 0.9
            notes.append("A recent diaper change lowers discomfort-related causes.")
        elif diaper_minutes < 180:
            probs["discomfort"] *= 0.95
        else:
            probs["discomfort"] *= 1.2
            probs["pain"] *= 1.05
            notes.append("A long time since the last diaper change increases discomfort.")

    posture = (context.get("posture") or context.get("position") or "").lower()
    meal_hint = meal_minutes is not None and meal_minutes < 120

    if posture in {"on tummy", "belly", "tummy"}:
        probs["discomfort"] *= 1.15
        probs["pain"] *= 1.08
        notes.append("Tummy posture slightly increases discomfort-related causes.")
    elif posture in {"lying on back", "back", "on back"} and meal_hint:
        probs["discomfort"] *= 1.12
        notes.append("A recent meal while lying on the back can raise discomfort slightly.")
    elif posture in {"held upright", "upright", "cradled", "sitting up"}:
        probs["need_for_comfort"] *= 1.08

    age_months_raw = context.get("babyAgeMonths") or context.get("baby_age_months")
    try:
        age_months = int(age_months_raw) if age_months_raw is not None else None
    except Exception:
        age_months = None

    if age_months is not None:
        if age_months < 3:
            probs["need_for_comfort"] *= 1.1
        elif age_months < 6:
            probs["fatigue"] *= 1.08
        elif age_months >= 12:
            probs["overstimulation"] *= 1.05

    adjusted = _normalize(probs)
    return adjusted, notes


def reliability_score(features: dict, probabilities: Dict[str, float], context: dict) -> tuple[int, str, list[str]]:
    """Compute a simple, explainable reliability score out of 100."""
    ordered = sorted(probabilities.values(), reverse=True)
    top = ordered[0] if ordered else 0.0
    second = ordered[1] if len(ordered) > 1 else 0.0
    margin = max(top - second, 0.0)

    duration = float(features.get("duration_seconds", 0.0) or 0.0)
    silence_ratio = float(features.get("silence_ratio", 0.0) or 0.0)

    if 5 <= duration <= 20:
        audio_quality = 1.0
    elif 3 <= duration < 5 or 20 < duration <= 30:
        audio_quality = 0.78
    else:
        audio_quality = 0.55

    if silence_ratio > 0.82:
        audio_quality *= 0.8
    elif silence_ratio < 0.03:
        audio_quality *= 0.9

    context_count = sum(
        1
        for key in ("posture", "lastMealAt", "lastMeal", "lastDiaperAt", "lastDiaper", "babyAgeMonths", "baby_age_months")
        if context.get(key) not in (None, "")
    )
    context_quality = _clamp(context_count / 4.0, 0.0, 1.0)

    score = (0.48 * top + 0.27 * margin + 0.15 * audio_quality + 0.10 * context_quality) * 100.0
    score = int(round(_clamp(score, 0.0, 100.0)))

    if score >= 75:
        label = "high"
    elif score >= 50:
        label = "medium"
    else:
        label = "low"

    notes = []
    if audio_quality >= 0.9:
        notes.append("Audio length is in the ideal range.")
    elif audio_quality < 0.7:
        notes.append("Audio quality is limited by short length or heavy silence.")
    if context_quality >= 0.75:
        notes.append("Enough context is available to refine the prediction.")

    return score, label, notes


# ─── Alert escalation ────────────────────────────────────────

ALERT_LEVELS = ("none", "monitor", "consult_recommended", "urgent")


def _alert_rank(level: str) -> int:
    """Higher = more severe."""
    try:
        return ALERT_LEVELS.index(level)
    except ValueError:
        # Backward compat: map old value
        if level == "seek_medical_advice":
            return 2  # consult_recommended
        return 0


def escalate_alert(
    ai_alert: str,
    probabilities: Dict[str, float],
    features: dict,
    context: dict,
) -> tuple[str, list[str]]:
    """
    Apply rule-based escalation on top of the AI-determined alert level.
    Returns the (potentially escalated) alert level and explanatory notes.
    """
    current = _alert_rank(ai_alert)
    notes: list[str] = []

    pain = float(probabilities.get("pain", 0.0))
    discomfort = float(probabilities.get("discomfort", 0.0))

    # Rule 1: high pain probability → at least monitor
    if pain >= 0.40 and current < 1:
        current = 1
        notes.append("Probabilité de douleur élevée (≥40%) → surveillance recommandée.")

    # Rule 2: very high pain → consult recommended
    if pain >= 0.60 and current < 2:
        current = 2
        notes.append("Probabilité de douleur très élevée (≥60%) → consultation recommandée.")

    # Rule 3: extreme pain → urgent
    if pain >= 0.80 and current < 3:
        current = 3
        notes.append("Probabilité de douleur extrême (≥80%) → contact professionnel urgent.")

    # Rule 4: high pain + high discomfort combined → escalate
    if (pain + discomfort) >= 0.75 and current < 2:
        current = 2
        notes.append("Douleur + inconfort combinés élevés → consultation recommandée.")

    # Rule 5: very short, high-pitch cry (potential distress signal)
    pitch_mean = float(features.get("pitch_mean_hz", 0) or 0)
    duration = float(features.get("duration_seconds", 0) or 0)
    if pitch_mean > 600 and pain >= 0.30 and current < 1:
        current = 1
        notes.append("Pitch élevé (>600 Hz) associé à de la douleur → surveillance.")

    return ALERT_LEVELS[current], notes
