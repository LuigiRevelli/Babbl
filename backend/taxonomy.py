"""
Babbl — Taxonomie canonique des causes de pleurs.

SOURCE UNIQUE DE VÉRITÉ partagée par tout le backend :
  - ml_model.py          (mappe les classes du dataset vers ces clés)
  - triage_rules.py      (ajuste la distribution sur ces clés)
  - mistral_client.py    (le LLM ne renvoie QUE ces clés)
  - comfort_messages.py  (un message par cause)

Le frontend reflète cette taxonomie dans `frontend/src/lib/taxonomy.ts`.
Garder les deux fichiers synchronisés.

────────────────────────────────────────────────────────────────────────
Architecture en 3 couches — honnêteté scientifique
────────────────────────────────────────────────────────────────────────
On ne prétend PAS deviner 15 causes au son : ce serait faux et destructeur
de crédibilité. On sépare ce que chaque couche prouve réellement.

  Couche A « acoustique »   : ce que le SON prouve (douleur, détresse).
  Couche B « contextuelle » : ce qui est DÉDUIT du contexte (heure, âge…).
  Couche C « triage médical »: ce qu'on SIGNALE pour consultation, jamais
                               ce qu'on diagnostique.

Niveau de preuve audio (`audio_evidence`) :
  "strong"   — signature acoustique validée par la littérature.
  "moderate" — reconnu en labo, à confirmer par le contexte.
  "weak"     — pas de signature propre, le contexte porte l'information.
  "none"     — purement contextuel, l'audio n'apporte rien.
"""

from __future__ import annotations

# ─── Couches ────────────────────────────────────────────────
LAYER_ACOUSTIC = "acoustic"
LAYER_CONTEXT = "context"
LAYER_MEDICAL = "medical"


# ─── Couches A + B : causes quotidiennes (barres de probabilité) ──
# Ces 8 causes sont affichées au parent. La probabilité vient du modèle
# audio pour les causes acoustiques, et du raisonnement contextuel (Claude)
# pour les autres. Le champ `source` de chaque key_signal indique au parent
# d'où vient la conclusion ("audio" vs "context").
EVERYDAY_CAUSES: dict[str, dict] = {
    "pain": {
        "fr": "Douleur",
        "layer": LAYER_ACOUSTIC,
        "audio_evidence": "strong",
        "basis": "Début soudain, f0 élevé (>600 Hz), longue expiration puis "
                 "blocage respiratoire. Signature acoustique la mieux validée "
                 "(Porter 1986, Wasz-Höckert).",
        "default_alert": "monitor",
    },
    "hunger": {
        "fr": "Faim",
        "layer": LAYER_ACOUSTIC,
        "audio_evidence": "moderate",
        "basis": "Pleur rythmé, répétitif, montée progressive en rise-fall. "
                 "Reconnu en labo (Wasz-Höckert) et confirmé par le délai "
                 "depuis la dernière tétée.",
        "default_alert": "none",
    },
    "fatigue": {
        "fr": "Fatigue",
        "layer": LAYER_CONTEXT,
        "audio_evidence": "weak",
        "basis": "Pleur geignard, vocalisé, bâillements, yeux qui se ferment. "
                 "Déduit de la durée d'éveil.",
        "default_alert": "none",
    },
    "discomfort": {
        "fr": "Inconfort",
        "layer": LAYER_CONTEXT,
        "audio_evidence": "weak",
        "basis": "Agitation, pleurs intermittents. Couche, position, "
                 "vêtement. Déduit du contexte.",
        "default_alert": "none",
    },
    "gas": {
        "fr": "Gaz / besoin de roter",
        "layer": LAYER_CONTEXT,
        "audio_evidence": "weak",
        "basis": "Décharges courtes après la tétée, jambes repliées. "
                 "Déduit du contexte post-repas.",
        "default_alert": "none",
    },
    "overstimulation": {
        "fr": "Surstimulation",
        "layer": LAYER_CONTEXT,
        "audio_evidence": "none",
        "basis": "Pleur qui monte dans un environnement bruyant ou lumineux. "
                 "Déduit du contexte.",
        "default_alert": "none",
    },
    "stress": {
        "fr": "Stress / tension",
        "layer": LAYER_CONTEXT,
        "audio_evidence": "none",
        "basis": "Dysrégulation, tension, difficulté à revenir au calme. "
                 "Besoin de retour à un état apaisé.",
        "default_alert": "none",
    },
    "need_for_comfort": {
        "fr": "Besoin de réconfort",
        "layer": LAYER_CONTEXT,
        "audio_evidence": "none",
        "basis": "S'apaise au contact et au portage (réponse d'apaisement "
                 "au portage, Esposito 2013). Besoin de proximité.",
        "default_alert": "none",
    },
}

# Ordre canonique des clés — toute distribution de probabilité porte ces clés.
CAUSES: list[str] = list(EVERYDAY_CAUSES.keys())


# ─── Couche C : considérations médicales (triage, JAMAIS diagnostic) ──
# Ne figurent PAS dans les barres de probabilité. Claude les remonte comme
# pistes à évoquer avec un pédiatre quand l'audio + le contexte les évoquent.
# Chacune porte un niveau d'alerte par défaut.
MEDICAL_CONSIDERATIONS: dict[str, dict] = {
    "colic": {
        "fr": "Coliques",
        "alert": "monitor",
        "basis": "Critère de Wessel (>3h/j, >3j/sem, >3 sem), pleurs "
                 "vespéraux, jambes repliées.",
    },
    "reflux": {
        "fr": "Reflux (RGO)",
        "alert": "consult_recommended",
        "basis": "Pleurs pendant ou après la tétée, cambrure du dos.",
    },
    "teething": {
        "fr": "Poussée dentaire",
        "alert": "none",
        "basis": "Salivation, joues rouges, à partir de ~6 mois.",
    },
    "ear_infection": {
        "fr": "Otite",
        "alert": "consult_recommended",
        "basis": "Pleurs aggravés en position couchée, fièvre possible.",
    },
    "fever_illness": {
        "fr": "Fièvre / maladie",
        "alert": "consult_recommended",
        "basis": "Pleur faible et plaintif, ou aigu et monotone.",
    },
    "allergy_cmpa": {
        "fr": "Allergie aux protéines de lait de vache",
        "alert": "consult_recommended",
        "basis": "Pleurs associés à des signes digestifs ou cutanés.",
    },
    "neuro_redflag": {
        "fr": "Cri neurologique atypique",
        "alert": "urgent",
        "basis": "Cri aigu, monotone, perçant (f0 très élevé constant). "
                 "Drapeau rouge acoustique → avis médical.",
    },
}


def empty_distribution() -> dict[str, float]:
    """Prior uniforme sur les causes quotidiennes."""
    p = 1.0 / len(CAUSES)
    return {cause: p for cause in CAUSES}


def fr_label(key: str) -> str:
    """Libellé français d'une cause ou d'une considération médicale."""
    if key in EVERYDAY_CAUSES:
        return EVERYDAY_CAUSES[key]["fr"]
    if key in MEDICAL_CONSIDERATIONS:
        return MEDICAL_CONSIDERATIONS[key]["fr"]
    return key
