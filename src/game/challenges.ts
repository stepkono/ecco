import { LEVELS, type Level } from './levels';

/**
 * Practice challenges for the welcome screen. The recordings are the built-in
 * sample levels. Places, times, views and disagreement are made-up demo data.
 */
export interface Challenge {
  level: Level;
  index: number; // position in LEVELS
  place: string;
  region: string;
  lat: number;
  lon: number;
  recorded: Date; // local time of the recording
  views: number;
  /** share of players who disagree with the most common label */
  disagreement: number;
}

const DATA: Record<string, Omit<Challenge, 'level' | 'index'>> = {
  l1: { place: 'Nuuksio National Park', region: 'Espoo, Uusimaa', lat: 60.315, lon: 24.502, recorded: new Date(2026, 10, 14, 16, 48), views: 412, disagreement: 0.12 },
  l2: { place: 'Ruissalo', region: 'Turku, Southwest Finland', lat: 60.43, lon: 22.16, recorded: new Date(2026, 10, 13, 12, 5), views: 1240, disagreement: 0.21 },
  l3: { place: 'Patvinsuo National Park', region: 'Lieksa, North Karelia', lat: 63.12, lon: 30.7, recorded: new Date(2026, 10, 14, 7, 22), views: 860, disagreement: 0.34 },
  l4: { place: 'Oulanka National Park', region: 'Kuusamo, North Ostrobothnia', lat: 66.37, lon: 29.33, recorded: new Date(2026, 10, 12, 23, 41), views: 2310, disagreement: 0.47 },
  l5: { place: 'Linnansaari National Park', region: 'Saimaa, South Savo', lat: 62.13, lon: 28.5, recorded: new Date(2026, 10, 14, 21, 10), views: 96, disagreement: 0.28 },
};

export const CHALLENGES: Challenge[] = LEVELS.map((level, index) => ({ level, index, ...DATA[level.id] }));

export type Category = 'newest' | 'hottest' | 'most' | 'least';

export const CATEGORIES: { id: Category; label: string; help: string }[] = [
  { id: 'newest', label: 'Newest', help: 'The most recent recordings' },
  { id: 'hottest', label: 'Hottest', help: 'Recordings where people disagree the most about what they hear' },
  { id: 'most', label: 'Most viewed', help: 'Recordings many people have looked at' },
  { id: 'least', label: 'Least viewed', help: 'Recordings that still need fresh ears' },
];

export function sortChallenges(c: Category): Challenge[] {
  const list = [...CHALLENGES];
  if (c === 'newest') list.sort((a, b) => b.recorded.getTime() - a.recorded.getTime());
  if (c === 'hottest') list.sort((a, b) => b.disagreement - a.disagreement);
  if (c === 'most') list.sort((a, b) => b.views - a.views);
  if (c === 'least') list.sort((a, b) => a.views - b.views);
  return list;
}

export const DIFFICULTY = ['', 'Easy', 'Easy', 'Medium', 'Hard', 'Hard'];

const fmtTime = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/** "Today, 16:48", "Yesterday, 07:22" or "12 Nov, 23:41" */
export function whenRecorded(d: Date, now = new Date()): string {
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86400000);
  if (diff === 0) return `Today, ${fmtTime(d)}`;
  if (diff === 1) return `Yesterday, ${fmtTime(d)}`;
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${fmtTime(d)}`;
}

/** Time of day in words, for the card subtitle. */
export function partOfDay(d: Date): string {
  const h = d.getHours();
  if (h < 5) return 'Night';
  if (h < 10) return 'Morning';
  if (h < 16) return 'Midday';
  if (h < 20) return 'Evening';
  return 'Night';
}

export const coords = (c: Challenge) => `${c.lat.toFixed(2)}° N, ${c.lon.toFixed(2)}° E`;
