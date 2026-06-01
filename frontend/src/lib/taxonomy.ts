/**
 * Babbl — Taxonomie canonique des causes (miroir frontend).
 *
 * Doit rester synchronisé avec `backend/taxonomy.py` (mêmes clés).
 * Le backend renvoie les causes via la clé `probabilities`, en snake_case
 * anglais (hunger, pain, gas…). Ce module fournit les libellés FR + descriptions
 * + la couche de détection, pour un affichage transparent au parent.
 *
 * 3 couches : 'acoustic' = prouvé au son · 'context' = déduit du contexte
 * · 'medical' = signalé pour consultation (jamais diagnostiqué).
 */

export type CauseLayer = 'acoustic' | 'context' | 'medical';

export interface CauseMeta {
  fr: string;
  desc: string;
  layer: CauseLayer;
  /** Niveau de preuve acoustique : ce que le son prouve réellement. */
  audioEvidence: 'strong' | 'moderate' | 'weak' | 'none';
}

/** Causes quotidiennes — affichées comme barres de probabilité. */
export const CAUSE_META: Record<string, CauseMeta> = {
  pain: {
    fr: 'Douleur',
    desc: 'Cri soudain, aigu, intense, avec blocage respiratoire.',
    layer: 'acoustic',
    audioEvidence: 'strong',
  },
  hunger: {
    fr: 'Faim',
    desc: 'Pleur rythmé, répétitif, qui monte progressivement.',
    layer: 'acoustic',
    audioEvidence: 'moderate',
  },
  fatigue: {
    fr: 'Fatigue',
    desc: 'Pleur geignard, bâillements, yeux qui se ferment.',
    layer: 'context',
    audioEvidence: 'weak',
  },
  discomfort: {
    fr: 'Inconfort',
    desc: 'Agitation, pleurs intermittents. Couche, position, vêtement.',
    layer: 'context',
    audioEvidence: 'weak',
  },
  gas: {
    fr: 'Gaz / besoin de roter',
    desc: 'Décharges courtes après la tétée, jambes repliées.',
    layer: 'context',
    audioEvidence: 'weak',
  },
  overstimulation: {
    fr: 'Surstimulation',
    desc: 'Pleur qui monte dans un environnement bruyant ou lumineux.',
    layer: 'context',
    audioEvidence: 'none',
  },
  stress: {
    fr: 'Stress / tension',
    desc: 'Tension, difficulté à revenir au calme. Besoin d\'apaisement.',
    layer: 'context',
    audioEvidence: 'none',
  },
  need_for_comfort: {
    fr: 'Besoin de réconfort',
    desc: 'S\'apaise au contact et au portage. Besoin de proximité.',
    layer: 'context',
    audioEvidence: 'none',
  },
};

/** Considérations médicales — triage, jamais un diagnostic. */
export const MEDICAL_META: Record<string, { fr: string; desc: string }> = {
  colic: { fr: 'Coliques', desc: 'Pleurs vespéraux intenses, jambes repliées (critère de Wessel).' },
  reflux: { fr: 'Reflux (RGO)', desc: 'Pleurs pendant ou après la tétée, cambrure du dos.' },
  teething: { fr: 'Poussée dentaire', desc: 'Salivation, joues rouges, à partir de ~6 mois.' },
  ear_infection: { fr: 'Otite', desc: 'Pleurs aggravés en position couchée, fièvre possible.' },
  fever_illness: { fr: 'Fièvre / maladie', desc: 'Pleur faible et plaintif, ou aigu et monotone.' },
  allergy_cmpa: { fr: 'Allergie aux protéines de lait', desc: 'Pleurs avec signes digestifs ou cutanés.' },
  neuro_redflag: { fr: 'Cri neurologique atypique', desc: 'Cri aigu, monotone, perçant. Avis médical conseillé.' },
};

export function causeFr(key: string): string {
  return CAUSE_META[key]?.fr ?? MEDICAL_META[key]?.fr ?? key.charAt(0).toUpperCase() + key.slice(1);
}

export function causeDesc(key: string): string {
  return CAUSE_META[key]?.desc ?? MEDICAL_META[key]?.desc ?? '';
}

export function causeLayer(key: string): CauseLayer | undefined {
  return CAUSE_META[key]?.layer;
}

/** Libellé court de la couche, pour signaler la provenance au parent. */
export function layerLabel(layer: CauseLayer | undefined): string {
  switch (layer) {
    case 'acoustic':
      return 'détecté au son';
    case 'context':
      return 'déduit du contexte';
    case 'medical':
      return 'à surveiller';
    default:
      return '';
  }
}
