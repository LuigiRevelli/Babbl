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

from datetime import date, datetime, timezone

# Incrémenter à chaque changement de seuil ou de règle. Renvoyé dans chaque réponse.
RULES_VERSION = "2026.09.23-2"

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


def _days_since_birth(context: dict) -> int | None:
    """Âge en jours depuis `babyBirthDate` (AAAA-MM-JJ). La date de naissance
    est la seule source fiable : la tranche « 0-3 mois » devenait « 2 mois »
    et la carte nouveau-né ne pouvait jamais s'allumer."""
    raw = context.get("babyBirthDate") or context.get("baby_birth_date")
    if not raw:
        return None
    try:
        born = date.fromisoformat(str(raw)[:10])
    except ValueError:
        return None
    days = (datetime.now(timezone.utc).date() - born).days
    return days if days >= 0 else None


def _age_days(context: dict) -> int | None:
    from_birth = _days_since_birth(context)
    if from_birth is not None:
        return from_birth
    raw = context.get("babyAgeDays")
    if raw is None:
        raw = context.get("baby_age_days")
    try:
        return int(raw) if raw is not None else None
    except (TypeError, ValueError):
        return None


def _age_months(context: dict, fallback: int | None = None) -> int | None:
    days = _days_since_birth(context)
    if days is not None:
        return int(days // 30.44)
    raw = context.get("babyAgeMonths")
    if raw is None:
        raw = context.get("baby_age_months")
    try:
        return int(raw) if raw is not None else fallback
    except (TypeError, ValueError):
        return fallback


def _fmt_delay(minutes: float) -> str:
    if minutes < 60:
        return f"{int(round(minutes))} min"
    hours = minutes / 60.0
    return f"{hours:.0f} h" if abs(hours - round(hours)) < 0.1 else f"{hours:.1f} h".replace(".", ",")


# ─── 1. Porte d'entrée : enregistrement exploitable ? ────────────────
# Seuils posés sur 366 VRAIS pleurs de 0-6 mois enregistrés au téléphone par
# des parents (Donate-a-Cry), le 23/09/2026 — `bench/gate_bench.py` :
#   ancienne porte (≥ 20 % de trames voisées ET hauteur médiane 250-800 Hz)
#     → 21 % de vrais pleurs rejetés « pas de pleur net » ;
#   porte actuelle (≥ 5 % du clip voisé dans la bande 255-1000 Hz, pyin
#   borné à la bande, ET hauteur qui varie d'au moins 0,05 octave) → 2,2 %
#   rejetés ; 0 % des 40 pleurs d'ESC-50 (autre micro, autre source).
# Sons qui ne sont pas des pleurs (2 000 sons réels d'ESC-50 + voix
# d'hommes) : acceptés à 36,5 % (49 % sans le critère de variation, 16,6 %
# pour l'ancienne porte). Chats, sirènes, coqs, rires passent : leur son est
# celui d'un pleur. Le seuil de variation est volontairement bas : plus haut,
# il rejetterait mieux les bruits mais risquerait de refuser un pleur
# anormalement monotone, précisément celui qui ne doit pas être refusé.
# Un classifieur appris a été essayé et écarté : il reconnaissait le micro
# du téléphone, pas le pleur (recherche/banc-porte-2026-09.md).
# Toujours refusés : bruit blanc (télé), musique 220 Hz, voix d'homme 130 Hz,
# voix de femme 210 Hz, silence. Toujours acceptés à tort : babillage et voix
# adressée au bébé dans la bande du pleur (tests « échec attendu »).
# Un rejet à tort n'est pas neutre : le parent peut croire que le micro a
# échoué. C'est le critère de sécurité, d'où un seuil bas.

MIN_DURATION_S = 3.0
MIN_CRY_BAND_FRACTION = 0.05
MIN_CRY_PITCH_SPREAD = 0.05   # octave


def _cry_band_fraction(features: dict) -> float:
    return float(features.get("cry_band_fraction", 0.0) or 0.0)


def recording_gate(features: dict) -> tuple[bool, str | None, str | None]:
    """Retourne (ok, code, message_fr). Babbl refuse de répondre plutôt que de
    répondre sur rien. La porte reconnaît une voix dans la bande d'un pleur,
    pas un volume."""
    duration = float(features.get("duration_seconds", 0.0) or 0.0)

    if duration < MIN_DURATION_S:
        return False, "too_short", f"L'enregistrement dure {duration:.1f} s."
    spread = float(features.get("cry_pitch_spread", 0.0) or 0.0)
    if _cry_band_fraction(features) < MIN_CRY_BAND_FRACTION or spread < MIN_CRY_PITCH_SPREAD:
        # Le message ne dit PAS « rapprochez le téléphone » : le silence peut
        # être le bébé, pas le micro. Le rappel et l'indice sont dans app.py.
        return False, "no_cry_detected", "Babbl n'a pas entendu de pleur net sur cet enregistrement."
    return True, None, None


# ─── 2. Couche 1 : observation sonore (texte, jamais chiffré) ────────
# Tertiles de `cry_band_fraction` sur les 359 vrais pleurs acceptés du banc :
# 0,355 et 0,578. Les trois mots se répartissent donc en tiers sur de vrais
# pleurs — ce sont des descriptions du clip, pas des niveaux de détresse.

CONTINUOUS_BAND_FRACTION = 0.58
PAUSED_BAND_FRACTION = 0.35


def intensity_observation(features: dict) -> dict:
    """Observation en trois mots, à partir d'une seule grandeur invariante au
    volume capté : la part du clip où l'on entend une voix dans la bande d'un
    pleur. La hauteur ne décide rien — elle est spécifique au bébé, pas à son
    état (Corvin 2024, Lockhart-Bouron 2023). Le résultat ne doit être ni
    stocké, ni historisé, ni chiffré au parent."""
    duration = float(features.get("duration_seconds", 0.0) or 0.0)
    continuity = max(0.0, min(1.0, _cry_band_fraction(features)))

    if continuity < PAUSED_BAND_FRACTION:
        level = "faible"
    elif continuity >= CONTINUOUS_BAND_FRACTION:
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
    """Les trois cartes, toujours. `emphasized` dépend de l'ÂGE SEUL — jamais
    du son, et plus d'une température saisie : une règle qui transforme une
    mesure physiologique individuelle en « consultez » est un algorithme de
    triage (MDCG 2019-11). Le texte de la carte fièvre reste, statique."""
    age_m = _age_months(context, baby_age_months)
    age_d = _age_days(context)

    cards = []
    for key, meta in SAFETY_CARDS.items():
        rule = meta["emphasize_when"]
        if rule == "always":
            emphasized = True
        elif rule == "age_months < 3":
            emphasized = age_m is not None and age_m < 3
        elif rule == "age_days < 15":
            emphasized = (age_d is not None and age_d < 15) or (age_d is None and age_m == 0)
        else:
            emphasized = False
        cards.append({"key": key, "title": meta["title"], "body": meta["body"], "emphasized": emphasized})

    # Les cartes mises en avant d'abord, ordre stable ensuite.
    cards.sort(key=lambda c: 0 if c["emphasized"] else 1)
    return {"cards": cards, "footer": SAFETY_FOOTER}
