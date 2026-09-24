/**
 * Babbl Claude Design tokens.
 * Mirrors the `C` constant from eee-handoff/app/app-screens.jsx so inline
 * styles across the ported screens stay in sync with the design source.
 */

export const BabblTheme = {
  // Warm neutrals
  lait: '#FAF5EC',
  creme: '#F2E9D8',
  coquille: '#FFFDF8',
  ivoire: '#EFE5D2',

  // Text
  cafe: '#2B2320',
  cafeSoft: '#5A4D46',
  cafeMute: '#75655B', // 5,1:1 sur lait (l'ancien #907F74 faisait 3,5:1)

  // Accents
  terracotta: '#A94420', // 5,2:1 sur les fonds clairs (l'ancien #C25230 : 4,0:1)
  terracottaLight: '#E2886A',
  ocre: '#D9B56A',
  sauge: '#A8B898',

  // Typography
  display: "'Fraunces Variable', 'Fraunces', 'Cormorant Garamond', Georgia, serif",
  body: "'Instrument Sans Variable', 'Instrument Sans', -apple-system, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

export type BabblColor = keyof typeof BabblTheme;
