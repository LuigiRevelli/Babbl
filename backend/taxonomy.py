"""
Babbl — Taxonomie canonique.

SOURCE UNIQUE DE VÉRITÉ backend. Miroir frontend : `frontend/src/lib/taxonomy.ts`.
Garder les deux fichiers synchronisés (mêmes clés, mêmes textes).

────────────────────────────────────────────────────────────────────────
Ce que dit l'étude (SYMPTOMS.md — 21 candidats, 399 sources, vérification adverse)
────────────────────────────────────────────────────────────────────────
Un pleur de nourrisson porte de façon fiable trois choses : le niveau de
détresse à l'instant, l'âge approximatif, et l'identité du bébé.
AUCUNE cause. AUCUNE maladie. Le modèle ML précédent faisait moins bien
qu'un programme répondant toujours « faim » ; il n'est plus branché.

Deux couches, et rien d'autre :

  Couche 1 — OBSERVATION SONORE. Ce que le micro a mesuré sur les secondes
    enregistrées (continuité, hauteur). Rendue en TEXTE, jamais chiffrée,
    jamais stockée, jamais rassurante. Un pleur faible ou éteint n'est jamais
    présenté comme normal.

  Couche 2 — HYPOTHÈSES CONTEXTUELLES. Déduites de ce que le parent a saisi
    (dernière tétée, dernière couche, âge). Jamais du son. Jamais en
    pourcentage. Chaque hypothèse dit d'où elle vient.

Plus des CARTES DE SÉCURITÉ statiques : contenu fixe, mises en avant par l'âge
du bébé SEUL (jamais par une mesure saisie — ce serait une règle de triage),
identiques sur tous les écrans — leur absence ne peut jamais se lire comme un
feu vert.

Règle structurelle : AUCUNE clé ne porte un nom de maladie. Une clé qui porte
ce nom finit toujours par produire une chaîne qui le porte — c'est ainsi
qu'un « drapeau neurologique » a survécu jusqu'en production.

Les formulations destinées aux parents doivent être relues par un
professionnel de santé français avant publication (SYMPTOMS.md, Méthode).
"""

from __future__ import annotations

# ─── Couche 2 : hypothèses contextuelles ────────────────────────────
# Ordre = ordre d'affichage par défaut. `source` est toujours "context".
CONTEXT_HYPOTHESES: dict[str, dict] = {
    "hunger": {
        "fr": "Faim",
        "basis": "Délai depuis la dernière tétée, saisi par le parent. "
                 "Les pleurs sont un signe tardif de faim.",
    },
    "discomfort": {
        "fr": "Inconfort",
        "basis": "Délai depuis la dernière couche, position, vêtement — "
                 "saisis ou observés par le parent.",
    },
    "fatigue": {
        "fr": "Fatigue",
        "basis": "Durée d'éveil, si le parent l'a renseignée. "
                 "Aucune signature sonore.",
    },
    "need_for_comfort": {
        "fr": "Besoin de réconfort",
        "basis": "Proximité, portage, voix du parent. Toujours plausible, "
                 "surtout avant 3 mois.",
    },
}

HYPOTHESIS_KEYS: list[str] = list(CONTEXT_HYPOTHESES.keys())

# Phrase fixe accolée à toute hypothèse : elle vient du contexte, pas du son.
HYPOTHESIS_DISCLAIMER = "Le son ne permet pas de le confirmer."


# ─── Couche 1 : observation sonore ──────────────────────────────────
INTENSITY_LEVELS = ("faible", "modere", "intense")

INTENSITY_OBSERVATIONS: dict[str, str] = {
    "intense": "Sur ces {seconds} secondes, Babbl a entendu un pleur soutenu et aigu.",
    "modere":  "Sur ces {seconds} secondes, Babbl a entendu un pleur d'intensité moyenne.",
    "faible":  "Sur ces {seconds} secondes, le pleur était faible ou discontinu.",
}

# Toujours affiché avec l'observation. Volontairement asymétrique : on ne
# rassure jamais sur un pleur faible (sepsis, méningite et hypertension
# intracrânienne se présentent par un nourrisson léthargique qui pleure peu).
INTENSITY_DISCLAIMER = (
    "Babbl mesure un son ; il ne détecte aucune maladie. Un pleur faible, "
    "geignard ou éteint n'est jamais rassurant en soi : si votre bébé vous "
    "semble différent de d'habitude, consultez."
)


# ─── Cartes de sécurité (statiques, jamais déduites du son) ─────────
# Mise en avant : l'âge du bébé seul (date de naissance en priorité). Les trois
# cartes sont TOUJOURS renvoyées ; `emphasized` indique celles à mettre en avant.
# Repères issus des recommandations grand public HAS ; formulation à faire
# relire par un professionnel de santé avant publication.
SAFETY_CARDS: dict[str, dict] = {
    "fever_under_3_months": {
        "title": "Moins de 3 mois et fièvre",
        "body": "Si votre bébé a moins de 3 mois et une température mesurée à "
                "38 °C ou plus : consultez un médecin sans délai, quel que soit "
                "le pleur.",
        "emphasize_when": "age_months < 3",
    },
    "breathing": {
        "title": "Respiration",
        "body": "Respiration rapide ou difficile, creux entre les côtes, lèvres "
                "ou ongles bleutés, pauses respiratoires, refus de boire : "
                "appelez le 15. Ces signes s'observent avec les yeux, pas avec "
                "le micro.",
        "emphasize_when": "always",
    },
    "newborn_under_15_days": {
        "title": "Nouveau-né de moins de 15 jours",
        "body": "Jaunisse qui s'étend, tétées difficiles, somnolence inhabituelle "
                "ou pleur très faible : consultez sans attendre.",
        "emphasize_when": "age_days < 15",
    },
}

SAFETY_FOOTER = "En cas de doute, appelez le 15 (SAMU). Babbl n'est pas un dispositif médical."


# ─── Refus d'enregistrement ──────────────────────────────────────────
# Quand Babbl n'entend pas de pleur, c'est potentiellement le cas le plus
# grave (nourrisson léthargique). Le refus n'impute jamais le silence à un
# défaut de captation avant d'avoir rappelé ceci — et il embarque toujours
# les trois cartes de sécurité.
NO_CRY_REMINDER = (
    "Un bébé qui pleure peu, faiblement ou pas du tout n'est jamais rassurant "
    "en soi. Si votre bébé vous semble différent de d'habitude, consultez."
)
NO_CRY_HINT = "Si votre bébé pleurait bien, rapprochez le téléphone (20 à 30 cm) et recommencez."
TOO_SHORT_HINT = "Il faut au moins 3 secondes pour que Babbl entende quelque chose. Recommencez."


def fr_label(key: str) -> str:
    """Libellé français d'une hypothèse contextuelle."""
    meta = CONTEXT_HYPOTHESES.get(key)
    return meta["fr"] if meta else key
