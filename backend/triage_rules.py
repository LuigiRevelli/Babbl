"""
Règles déterministes de Babbl — tout ce qui n'est PAS le LLM.

Quatre fonctions pures, testables sans réseau :

  recording_gate(features)        → refuser un enregistrement inexploitable
  intensity_observation(features) → Couche 1, texte, jamais chiffré
  context_hypotheses(context)     → Couche 2, depuis ce que le parent a saisi
  safety_cards(context, age)      → cartes statiques, jamais déduites du son

Ce module ne produit ni probabilité, ni pourcentage, ni niveau d'alerte, ni
nom de maladie. Voir SYMPTOMS.md pour la raison de chaque absence.
"""

from __future__ import annotations

from datetime import datetime, timezone

from taxonomy import (
    CONTEXT_HYPOTHESES,
    HYPOTHESIS_DISCLAIMER,
    INTENSITY_DISCLAIMER,
    INTENSITY_OBSERVATIONS,
    SAFETY_CARDS,
    SAFETY_FOOTER,
)


# ─── Helpers contexte ────────────────────────────────────────────────

def _minutes_since_iso(iso_value: str | None) -> float | None:
    if not iso_value:
        return None
    try:
        parsed = datetime.fromisoformat(str(iso_value).replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return max((now - parsed).total_seconds() / 60.0, 0.0)
    except Exception:
        return None


def _bucket_to_minutes(bucket: str | None) -> float | None:
    mapping = {
        "<30min": 15, "30min-1h": 45, "<1h": 30, "1-2h": 90,
        "2h+": 120, "2-3h": 150, "3-4h": 210, "4h+": 300,
    }
    return mapping.get(bucket) if bucket else None


def _meal_minutes(context: dict) -> float | None:
    for key in ("lastMealAt", "last_meal_at", "lastFeedingTime", "lastMeal"):
        m = _minutes_since_iso(context.get(key))
        if m is not None:
            return m
    return _bucket_to_minutes(context.get("time_since_last_feeding"))


def _diaper_minutes(context: dict) -> float | None:
    for key in ("lastDiaperAt", "last_diaper_at", "lastDiaperTime", "lastDiaper"):
        m = _minutes_since_iso(context.get(key))
        if m is not None:
            return m
    return _bucket_to_minutes(context.get("time_since_last_diaper"))


def _awake_minutes(context: dict) -> float | None:
    for key in ("awakeSinceAt", "awake_since_at", "lastSleepEndAt"):
        m = _minutes_since_iso(context.get(key))
        if m is not None:
            return m
    raw = context.get("awakeMinutes") or context.get("awake_minutes")
    try:
        return float(raw) if raw is not None else None
    except (TypeError, ValueError):
        return None


def _age_months(context: dict, fallback: int | None = None) -> int | None:
    raw = context.get("babyAgeMonths") or context.get("baby_age_months")
    try:
        return int(raw) if raw is not None else fallback
    except (TypeError, ValueError):
        return fallback


def _age_days(context: dict) -> int | None:
    raw = context.get("babyAgeDays") or context.get("baby_age_days")
    try:
        return int(raw) if raw is not None else None
    except (TypeError, ValueError):
        return None


def _fmt_delay(minutes: float) -> str:
    if minutes < 60:
        return f"{int(round(minutes))} min"
    hours = minutes / 60.0
    return f"{hours:.0f} h" if abs(hours - round(hours)) < 0.1 else f"{hours:.1f} h".replace(".", ",")


# ─── 1. Porte d'entrée : enregistrement exploitable ? ────────────────

MIN_DURATION_S = 3.0
MAX_SILENCE_RATIO = 0.90


def recording_gate(features: dict) -> tuple[bool, str | None, str | None]:
    """Retourne (ok, code, message_fr). Babbl refuse de répondre plutôt que de
    répondre sur rien : dans l'étude de référence, 79,6 % des séquences ont été
    écartées pour bruit avant analyse."""
    duration = float(features.get("duration_seconds", 0.0) or 0.0)
    silence = float(features.get("silence_ratio", 0.0) or 0.0)
    pitch = float(features.get("pitch_mean_hz", 0.0) or 0.0)

    if duration < MIN_DURATION_S:
        return False, "too_short", (
            f"L'enregistrement dure {duration:.1f} s. Il en faut au moins "
            f"{MIN_DURATION_S:.0f} pour que Babbl entende quelque chose. Recommencez."
        )
    if silence > MAX_SILENCE_RATIO or pitch <= 0.0:
        return False, "no_cry_detected", (
            "Babbl n'a pas entendu de pleur sur cet enregistrement. Rapprochez "
            "le téléphone (20 à 30 cm) et recommencez."
        )
    return True, None, None


# ─── 2. Couche 1 : observation sonore (texte, jamais chiffré) ────────

def intensity_observation(features: dict) -> dict:
    """Observation coarse, en trois niveaux, à partir de deux grandeurs peu
    dépendantes du volume capté : la continuité du pleur sur le clip et sa
    hauteur moyenne. Ce n'est pas une échelle validée — c'est le maximum que
    SYMPTOMS.md autorise (« observation textuelle non stockée ») en attendant
    les expériences 0-2 (chaîne de capture, dégradation, test-retest).
    Le résultat ne doit être ni stocké, ni historisé, ni chiffré au parent."""
    duration = float(features.get("duration_seconds", 0.0) or 0.0)
    silence = float(features.get("silence_ratio", 0.0) or 0.0)
    pitch = float(features.get("pitch_mean_hz", 0.0) or 0.0)
    continuity = max(0.0, min(1.0, 1.0 - silence))

    if continuity < 0.30 or pitch <= 0.0:
        level = "faible"
    elif continuity >= 0.60 and pitch >= 450.0:
        level = "intense"
    else:
        level = "modere"

    seconds = int(round(duration)) if duration >= 1 else 1
    return {
        "level": level,
        "observation": INTENSITY_OBSERVATIONS[level].format(seconds=seconds),
        "disclaimer": INTENSITY_DISCLAIMER,
    }


# ─── 3. Couche 2 : hypothèses contextuelles ──────────────────────────

def context_hypotheses(context: dict, baby_age_months: int | None = None) -> list[dict]:
    """Hypothèses ordonnées, chacune avec sa raison en français et
    `source: "context"`. Rien ici ne lit l'audio."""
    hyps: list[tuple[int, str, str]] = []  # (poids, clé, pourquoi)

    meal = _meal_minutes(context)
    if meal is not None:
        if meal >= 180:
            hyps.append((3, "hunger", f"Dernière tétée il y a {_fmt_delay(meal)} — proposez le sein ou le biberon sans attendre."))
        elif meal >= 120:
            hyps.append((2, "hunger", f"Dernière tétée il y a {_fmt_delay(meal)}."))
        elif meal < 60:
            hyps.append((1, "discomfort", f"Tétée il y a {_fmt_delay(meal)} : un rot ou une position redressée peuvent aider."))

    diaper = _diaper_minutes(context)
    if diaper is not None and diaper >= 180:
        hyps.append((2, "discomfort", f"Dernière couche il y a {_fmt_delay(diaper)}."))

    awake = _awake_minutes(context)
    age = _age_months(context, baby_age_months)
    if awake is not None:
        limit = 60 if (age is not None and age < 3) else 120
        if awake >= limit:
            hyps.append((2, "fatigue", f"Éveillé depuis {_fmt_delay(awake)}."))

    if age is not None and age < 3:
        hyps.append((1, "need_for_comfort", "Avant 3 mois, le contact et le portage apaisent souvent."))
    else:
        hyps.append((0, "need_for_comfort", "Le contact et votre voix apaisent souvent."))

    # dédoublonner par clé en gardant le poids le plus fort, puis trier
    best: dict[str, tuple[int, str]] = {}
    for weight, key, why in hyps:
        if key not in best or weight > best[key][0]:
            best[key] = (weight, why)
    ordered = sorted(best.items(), key=lambda kv: -kv[1][0])

    return [
        {
            "key": key,
            "label": CONTEXT_HYPOTHESES[key]["fr"],
            "why": why,
            "source": "context",
            "disclaimer": HYPOTHESIS_DISCLAIMER,
        }
        for key, (_, why) in ordered
    ]


# ─── 4. Cartes de sécurité (statiques) ───────────────────────────────

def safety_cards(context: dict, baby_age_months: int | None = None) -> dict:
    """Les trois cartes, toujours. `emphasized` dépend de l'âge et de ce que
    le parent a saisi — jamais du son."""
    age_m = _age_months(context, baby_age_months)
    age_d = _age_days(context)
    fever = context.get("feverMeasuredC") or context.get("fever_measured_c")
    try:
        fever = float(fever) if fever is not None else None
    except (TypeError, ValueError):
        fever = None

    cards = []
    for key, meta in SAFETY_CARDS.items():
        rule = meta["emphasize_when"]
        if rule == "always":
            emphasized = True
        elif rule == "age_months < 3":
            emphasized = (age_m is not None and age_m < 3) or (fever is not None and fever >= 38.0)
        elif rule == "age_days < 15":
            emphasized = (age_d is not None and age_d < 15) or (age_m == 0)
        else:
            emphasized = False
        cards.append({"key": key, "title": meta["title"], "body": meta["body"], "emphasized": emphasized})

    # Les cartes mises en avant d'abord, ordre stable ensuite.
    cards.sort(key=lambda c: 0 if c["emphasized"] else 1)
    return {"cards": cards, "footer": SAFETY_FOOTER}
