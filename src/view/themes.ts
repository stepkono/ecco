import { CLASSES, type ClassId } from '../game/catalog';

/**
 * Colour themes for the 3D view. Each one is a soft, harmonious gradient
 * (low amplitude -> high amplitude) plus a background tint, a fog colour, two
 * UI accents and a paint set for the brush / layer colours. The ramps step
 * through neighbouring and complementary hues instead of one hue dark -> light.
 * Each level gets its own theme so every node feels like a new place.
 * All colours are sRGB hex.
 */
export interface Theme {
  id: string;
  name: string;
  ramp: [string, string, string, string, string]; // quiet -> loud
  bg: string; // top of the sky gradient
  fog: string; // fog and horizon colour
  accent: string; // UI accent (primary buttons with dark text, active states): light, never green
  accent2: string; // UI secondary accent
  /** brush / layer colours, distinct and readable on the ramp (targets first, see applyPaint) */
  paint: string[];
  /** true for light, pastel backdrops */
  light: boolean;
}

export const THEMES: Theme[] = [
  {
    id: 'classic', name: 'Classic',
    ramp: ['#27404a', '#3a7686', '#4bacb0', '#b4e2d0', '#fcfced'],
    bg: '#050b10', fog: '#0b1e26', accent: '#a6dcff', accent2: '#56c8ff',
    paint: ['#ffb020', '#ff6b6b', '#c58cff', '#ffe066', '#ff8fc8', '#7d8bff', '#e0b98c'],
    light: false,
  },
  {
    // favourite: deep indigo through periwinkle and lilac to a blush top
    id: 'glacier', name: 'Glacier',
    ramp: ['#1f2550', '#33489a', '#6f86dc', '#b9aef2', '#fadcec'],
    bg: '#0a0d22', fog: '#323d73', accent: '#aebaff', accent2: '#f7c8e4',
    paint: ['#ffc46b', '#ff7f6e', '#6fe3f0', '#ff9ed2', '#fff0a0', '#f2a65a', '#c9a0ff'],
    light: false,
  },
  {
    // navy water and teal shallows, peaks warm up through peach into an orange-red
    id: 'lagoon', name: 'Lagoon',
    ramp: ['#17304f', '#1e6782', '#40a89e', '#f6c99a', '#ff7650'],
    bg: '#081a2a', fog: '#24546a', accent: '#ffc7a3', accent2: '#7fd6e3',
    paint: ['#ffd166', '#ef476f', '#a78bfa', '#f7f3e3', '#ff9f68', '#5ec8ff', '#ff8fc8'],
    light: false,
  },
  {
    // shade under the trees (blue-violet) -> dusty rose -> peach -> apricot -> cream
    id: 'orchard', name: 'Orchard',
    ramp: ['#2d2b55', '#a0587a', '#f0957a', '#f8c98a', '#fdf3d0'],
    bg: '#14122a', fog: '#4a3858', accent: '#f8c98a', accent2: '#b9b2ff',
    paint: ['#5cc8ff', '#8a7dff', '#ffe45c', '#ff4f7b', '#4fd1e0', '#e6e6ff', '#ffa94d'],
    light: false,
  },
  {
    // soft plum night, mauve and rose up to a blush white, cyan and cream labels
    id: 'plum', name: 'Plum',
    ramp: ['#341a44', '#6e3f7c', '#b8638f', '#eea0b2', '#fbe3ea'],
    bg: '#1a0c20', fog: '#3c2148', accent: '#f6b3c6', accent2: '#7fdcf0',
    paint: ['#6fe4f5', '#ffe08a', '#4a8cff', '#ff4d5e', '#b9f0ff', '#ff9b54', '#c7a6ff'],
    light: false,
  },
  {
    // coral architecture rising out of a mint fog
    id: 'coral', name: 'Coral',
    ramp: ['#79b0a3', '#cfae8c', '#f0a07f', '#e46a55', '#ffd08a'],
    bg: '#dcf1e6', fog: '#a9d6c3', accent: '#f6a58c', accent2: '#ffd36e',
    paint: ['#1f8a9a', '#5b4bc4', '#ffd23f', '#b8325a', '#2d5d7b', '#f7f1e3', '#8a6d3b'],
    light: true,
  },
  {
    // periwinkle, lavender, pink and cream on a pale green morning
    id: 'pastel', name: 'Pastel',
    ramp: ['#6f78c8', '#a99ae4', '#eeb2cf', '#f6d8b8', '#fff6e0'],
    bg: '#e8f6e8', fog: '#cbe8d6', accent: '#c9b6ff', accent2: '#f6b3cf',
    paint: ['#2aa198', '#e0457b', '#4b3fbf', '#f2a33a', '#1d6fb8', '#8b3fa8', '#d9534f'],
    light: true,
  },
  {
    // deep navy night, icy cyan structures, a small yellow light
    id: 'icenight', name: 'Ice night',
    ramp: ['#173a5c', '#2a6f96', '#4fa3c4', '#9fd8e6', '#eefaff'],
    bg: '#0b1f36', fog: '#123a5a', accent: '#a9e6f5', accent2: '#ffd23f',
    paint: ['#ffd23f', '#ff7a59', '#ff9ed2', '#b48cff', '#fff4c2', '#ff4d6d', '#f7a8ff'],
    light: false,
  },
  {
    // teal sky into navy, slate valleys, orange-red slopes and cream tops
    id: 'tealcream', name: 'Teal & cream',
    ramp: ['#28395a', '#2f6f7e', '#d9634c', '#f3b27a', '#fce9b8'],
    bg: '#2a9d9c', fog: '#2b3a55', accent: '#fce0a8', accent2: '#ff8a5c',
    paint: ['#4fd0e8', '#e8432f', '#b48cff', '#ffd23f', '#ff7ab8', '#f6f1e7', '#ffa24c'],
    light: false,
  },
  {
    // a warm paper morning: sand lowlands, loud ridges in dusty blue and slate
    id: 'dawn', name: 'Dawn',
    ramp: ['#e9c9a8', '#c7b3b8', '#8ea2b8', '#4f6688', '#2c3a5c'],
    bg: '#f4ece2', fog: '#ecd3bb', accent: '#f2b27e', accent2: '#8ea2c8',
    paint: ['#e8553f', '#2a9d8f', '#f2a516', '#7b4fbf', '#d6336c', '#1d70a2', '#8c6d46'],
    light: true,
  },
];

/** Default theme per level id. */
export const LEVEL_THEME: Record<string, string> = {
  l1: 'plum', // wetland edge, dusk
  l2: 'coral', // orchard hedge, noon
  l3: 'pastel', // old-growth margin, morning
  l4: 'glacier', // storm front, night
  l5: 'lagoon', // sedge pond, rain
};

const FALLBACK = THEMES.find((t) => t.id === 'glacier')!;

export const themeById = (id: string) => THEMES.find((t) => t.id === id) ?? FALLBACK;

/** Swap only the UI accents, so the panels keep their design language. */
export function applyUiTheme(t: Theme) {
  const s = document.documentElement.style;
  s.setProperty('--accent', t.accent);
  s.setProperty('--accent-2', t.accent2);
}

/**
 * Recolour the classes from the theme's paint set: the level's targets get
 * paint[0], paint[1], ... in order, the remaining classes follow in CLASSES
 * order (wrapping around if there are more classes than colours).
 */
export function applyPaint(t: Theme, targets: ClassId[]) {
  const all = Object.keys(CLASSES) as ClassId[];
  const order = [...new Set(targets.filter((c) => c in CLASSES))];
  for (const c of all) if (!order.includes(c)) order.push(c);
  order.forEach((c, i) => {
    CLASSES[c].color = t.paint[i % t.paint.length];
  });
}
