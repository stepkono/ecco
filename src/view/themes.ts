/**
 * Colour themes for the 3D view. Each one is a soft, harmonious gradient
 * (low amplitude -> high amplitude) plus a background tint, a fog colour and
 * two UI accents. Each level gets its own theme so every node feels like a
 * new place. All colours are sRGB hex.
 */
export interface Theme {
  id: string;
  name: string;
  ramp: [string, string, string, string, string]; // quiet -> loud
  bg: string; // top of the sky gradient
  fog: string; // fog and horizon colour
  accent: string; // UI accent (primary buttons, active states)
  accent2: string; // UI secondary accent
}

export const THEMES: Theme[] = [
  {
    id: 'classic', name: 'Classic',
    ramp: ['#27404a', '#3a7686', '#4bacb0', '#b4e2d0', '#fcfced'],
    bg: '#050b10', fog: '#0b1e26', accent: '#9be15d', accent2: '#56c8ff',
  },
  {
    id: 'lagoon', name: 'Lagoon',
    ramp: ['#1b2f52', '#21627f', '#2fa39a', '#8fd8bd', '#ffe0b8'],
    bg: '#081322', fog: '#234a5e', accent: '#7fe3c6', accent2: '#ffbf94',
  },
  {
    id: 'dusk', name: 'Dusk',
    ramp: ['#2a1a4a', '#5a2a80', '#b4428f', '#f2788a', '#ffd59a'],
    bg: '#0f0a1c', fog: '#43285a', accent: '#ff95ab', accent2: '#ffd59a',
  },
  {
    id: 'orchard', name: 'Orchard',
    ramp: ['#3a1f33', '#7a3352', '#d65f6c', '#f5a97d', '#fbecb0'],
    bg: '#150c13', fog: '#55303f', accent: '#f7b183', accent2: '#fbe39c',
  },
  {
    id: 'glacier', name: 'Glacier',
    ramp: ['#1f2550', '#33489a', '#6f86dc', '#b9aef2', '#fadcec'],
    bg: '#0a0d22', fog: '#323d73', accent: '#aebaff', accent2: '#f7c8e4',
  },
  {
    id: 'moss', name: 'Moss',
    ramp: ['#16301f', '#225a3c', '#3f9a62', '#a8d572', '#f4f0b4'],
    bg: '#07130d', fog: '#244a38', accent: '#b9e27c', accent2: '#f4ecb0',
  },
];

/** Default theme per level id. */
export const LEVEL_THEME: Record<string, string> = {
  l1: 'moss', // wetland edge, dusk
  l2: 'orchard', // orchard hedge, noon
  l3: 'lagoon', // old-growth margin, morning
  l4: 'glacier', // storm front, night
  l5: 'dusk', // sedge pond, rain
};

export const themeById = (id: string) => THEMES.find((t) => t.id === id) ?? THEMES[0];

/** Swap only the UI accents, so the panels keep their design language. */
export function applyUiTheme(t: Theme) {
  const s = document.documentElement.style;
  s.setProperty('--accent', t.accent);
  s.setProperty('--accent-2', t.accent2);
}
