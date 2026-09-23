/**
 * Babbl — Taxonomie canonique (miroir frontend de `backend/taxonomy.py`).
 * Mêmes clés, mêmes textes. Garder les deux fichiers synchronisés.
 *
 * Ce que dit l'étude (SYMPTOMS.md) : un pleur porte de façon fiable trois
 * choses — le niveau de détresse à l'instant, l'âge approximatif, l'identité
 * du bébé. Aucune cause, aucune maladie.
 *
 * Deux couches, et rien d'autre :
 *  - Couche 1, OBSERVATION SONORE : ce que le micro a mesuré, en texte.
 *    Jamais chiffrée, jamais stockée, jamais rassurante.
 *  - Couche 2, HYPOTHÈSES CONTEXTUELLES : déduites de ce que le parent a
 *    saisi. Jamais du son. Jamais en pourcentage.
 *
 * Plus des CARTES DE SÉCURITÉ statiques, identiques sur tous les écrans.
 *
 * Règle structurelle : aucune clé ne porte un nom de maladie.
 */

export type HypothesisKey = 'hunger' | 'discomfort' | 'fatigue' | 'need_for_comfort';

export interface HypothesisMeta {
  fr: string;
  basis: string;
}

/** Couche 2 — hypothèses contextuelles. Ordre = ordre d'affichage par défaut. */
export const CONTEXT_HYPOTHESES: Record<HypothesisKey, HypothesisMeta> = {
  hunger: {
    fr: 'Faim',
    basis: 'Délai depuis la dernière tétée, saisi par le parent. Les pleurs sont un signe tardif de faim.',
  },
  discomfort: {
    fr: 'Inconfort',
    basis: 'Délai depuis la dernière couche, position, vêtement — saisis ou observés par le parent.',
  },
  fatigue: {
    fr: 'Fatigue',
    basis: "Durée d'éveil, si le parent l'a renseignée. Aucune signature sonore.",
  },
  need_for_comfort: {
    fr: 'Besoin de réconfort',
    basis: 'Proximité, portage, voix du parent. Toujours plausible, surtout avant 3 mois.',
  },
};

export const HYPOTHESIS_DISCLAIMER = 'Le son ne permet pas de le confirmer.';

/** Couche 1 — niveaux d'observation sonore (texte uniquement). */
export type IntensityLevel = 'faible' | 'modere' | 'intense';

export const INTENSITY_DISCLAIMER =
  "Babbl mesure un son ; il ne détecte aucune maladie. Un pleur faible, geignard ou éteint " +
  "n'est jamais rassurant en soi : si votre bébé vous semble différent de d'habitude, consultez.";

/** Cartes de sécurité — statiques, jamais déduites du son. Les trois sont toujours affichées. */
export type SafetyCardKey = 'fever_under_3_months' | 'breathing' | 'newborn_under_15_days';

export interface SafetyCardMeta {
  title: string;
  body: string;
}

export const SAFETY_CARDS: Record<SafetyCardKey, SafetyCardMeta> = {
  fever_under_3_months: {
    title: 'Moins de 3 mois et fièvre',
    body: 'Si votre bébé a moins de 3 mois et une température mesurée à 38 °C ou plus : consultez un médecin sans délai, quel que soit le pleur.',
  },
  breathing: {
    title: 'Respiration',
    body: 'Respiration rapide ou difficile, creux entre les côtes, lèvres ou ongles bleutés, pauses respiratoires, refus de boire : appelez le 15. Ces signes s\'observent avec les yeux, pas avec le micro.',
  },
  newborn_under_15_days: {
    title: 'Nouveau-né de moins de 15 jours',
    body: 'Jaunisse qui s\'étend, tétées difficiles, somnolence inhabituelle ou pleur très faible : consultez sans attendre.',
  },
};

/**
 * « Qu'est-ce qui l'a calmé ? » — miroir de SOOTHED_BY (backend/taxonomy.py).
 * Posée à la réouverture de l'app, jamais par notification. Liste fermée,
 * aucune clé de maladie. Elle vient du parent, pas du son.
 */
export const SOOTHED_QUESTION = "Tout à l'heure, qu'est-ce qui a apaisé votre bébé ?";
export const SOOTHED_BY = {
  feeding: 'Une tétée ou un biberon',
  diaper_or_position: 'La couche ou une autre position',
  sleep: "Votre bébé s'est endormi",
  arms_or_voice: 'Les bras, votre voix',
  babbl_voice: 'Votre voix Babbl',
  nothing_yet: "Rien pour l'instant",
  dont_know: 'Je ne sais pas',
} as const;
export type SoothedKey = keyof typeof SOOTHED_BY;

export const SAFETY_FOOTER = "En cas de doute, appelez le 15 (SAMU). Babbl n'est pas un dispositif médical.";

/** Libellé français d'une hypothèse (ou de toute clé héritée de l'historique). */
export function hypothesisFr(key: string): string {
  const meta = (CONTEXT_HYPOTHESES as Record<string, HypothesisMeta>)[key];
  if (meta) return meta.fr;
  // Clés héritées d'anciennes analyses stockées localement.
  const legacy: Record<string, string> = {
    pain: 'Ancienne analyse',
    gas: 'Gaz (ancienne analyse)',
    overstimulation: 'Surstimulation (ancienne analyse)',
    stress: 'Stress (ancienne analyse)',
    unknown: 'Analyse',
  };
  return legacy[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

/** Rappel de provenance, identique pour toute hypothèse. */
export const HYPOTHESIS_SOURCE_LABEL = "d'après ce que vous avez saisi";
