/**
 * Babbl — capture audio d'un pleur.
 *
 * Deux règles, issues de SYMPTOMS.md (« Chaîne de capture contrainte ») :
 *
 * 1. Micro brut. Par défaut, le navigateur active le réglage automatique du
 *    volume (AGC), la réduction de bruit et l'annulation d'écho. L'AGC écrase
 *    la dynamique dont dépend la seule mesure valable (l'intensité) ; la
 *    réduction de bruit efface les composantes apériodiques du cri. Les trois
 *    sont désactivés ici. Cela vaut pour le PLEUR uniquement — la voix du
 *    parent (clonage) garde les réglages par défaut, qui l'aident.
 *
 * 2. Format avec repli. `audio/webm;codecs=opus` n'existe pas sur iOS Safari
 *    < 18.4 : on choisit le premier format supporté et on transmet le vrai
 *    type au backend (qui convertit via ffmpeg). Ne jamais mélanger deux
 *    formats dans une même série d'enregistrements d'un bébé.
 */

/** Contraintes micro pour l'enregistrement d'un pleur (pas pour la voix du parent). */
export const CRY_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  autoGainControl: false,
  noiseSuppression: false,
  echoCancellation: false,
  channelCount: 1,
};

/** Durée fixe d'un enregistrement de pleur (ms). Un clip plus long ne mesure rien de plus. */
export const CRY_RECORD_MS = 10_000;

const MIME_CANDIDATES: Array<{ mimeType: string; ext: string }> = [
  { mimeType: 'audio/webm;codecs=opus', ext: 'webm' },
  { mimeType: 'audio/webm', ext: 'webm' },
  { mimeType: 'audio/mp4', ext: 'm4a' },
  { mimeType: 'audio/ogg;codecs=opus', ext: 'ogg' },
];

/** Premier format que ce navigateur sait encoder. `mimeType` vide = laisser le navigateur choisir. */
export function pickRecordingMime(): { mimeType: string; ext: string } {
  if (typeof MediaRecorder === 'undefined') return { mimeType: '', ext: 'webm' };
  for (const c of MIME_CANDIDATES) {
    try {
      if (MediaRecorder.isTypeSupported(c.mimeType)) return c;
    } catch {
      /* certains navigateurs lèvent sur isTypeSupported */
    }
  }
  return { mimeType: '', ext: 'webm' };
}

/** Extension de fichier à partir du type MIME réel d'un blob. */
export function extensionForMime(mime: string): string {
  const base = (mime || '').split(';')[0].trim();
  if (base === 'audio/mp4' || base === 'audio/aac' || base === 'audio/x-m4a') return 'm4a';
  if (base === 'audio/ogg') return 'ogg';
  if (base === 'audio/wav' || base === 'audio/x-wav') return 'wav';
  return 'webm';
}

/**
 * Crée un MediaRecorder sur un flux, avec repli de format.
 * Le blob final porte le type MIME réellement utilisé par le navigateur.
 */
export function createRecorder(stream: MediaStream): MediaRecorder {
  const { mimeType } = pickRecordingMime();
  return mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
}

/** Assemble les morceaux en un blob typé comme l'encodeur l'a produit. */
export function chunksToBlob(chunks: Blob[], recorder: MediaRecorder): Blob {
  const type = recorder.mimeType || chunks[0]?.type || 'audio/webm';
  return new Blob(chunks, { type });
}
