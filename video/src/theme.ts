import {loadFont} from '@remotion/google-fonts/Inter';

export const {fontFamily: INTER} = loadFont('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

/** Colours from src/style.css and the Plum theme in src/view/themes.ts */
export const C = {
  bg: '#07080f',
  plumBg: '#1a0c20',
  plumFog: '#3c2148',
  text: '#f3f5fa',
  muted: 'rgba(243, 245, 250, 0.62)',
  faint: 'rgba(243, 245, 250, 0.38)',
  glass: 'rgba(16, 18, 32, 0.56)',
  glassStrong: 'rgba(18, 20, 34, 0.74)',
  edge: 'rgba(255, 255, 255, 0.26)',
  edgeSoft: 'rgba(255, 255, 255, 0.12)',
  accent: '#f6b3c6', // Plum accent
  accent2: '#7fdcf0', // Plum secondary accent
  orange: '#ff8a4c', // Horizon accent
  blue: '#6f86ff',
  amber: '#ffc24a',
  cyan: '#71d4e1', // logo rays start
  violet: '#c59ef2', // logo rays end
  pink: '#f59ac6', // logo inner rays
  plumRamp: ['#341a44', '#6e3f7c', '#b8638f', '#eea0b2', '#fbe3ea'],
};

export const RADIUS = 6;
export const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
