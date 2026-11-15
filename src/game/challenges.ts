import { LEVELS } from './levels';

/**
 * Everything the challenge list can show: live recordings from the listening
 * posts (real, from the backend) and the built-in practice clips (sample
 * levels with known answers; their places, times and numbers are demo data).
 */
export interface Challenge {
  kind: 'live' | 'practice';
  id: string; // clip id (live) or level id (practice)
  title: string;
  /** live: the post's uncertain guess, in words */
  guess?: string;
  place: string;
  region: string;
  lat: number;
  lon: number;
  recorded: Date;
  durationS: number;
  views: number;
  /** share of people who disagree with the most common answer */
  disagreement: number;
  labels: number;
  /** practice only: 1 (easy) to 5 (hard) */
  difficulty?: number;
  /** practice only: index into LEVELS */
  levelIndex?: number;
}

const PRACTICE_DATA: Record<string, { place: string; region: string; lat: number; lon: number; recorded: Date; views: number; disagreement: number }> = {
  l1: { place: 'Nuuksio National Park', region: 'Espoo, Uusimaa', lat: 60.315, lon: 24.502, recorded: new Date(2026, 10, 14, 16, 48), views: 412, disagreement: 0.12 },
  l2: { place: 'Ruissalo', region: 'Turku, Southwest Finland', lat: 60.43, lon: 22.16, recorded: new Date(2026, 10, 13, 12, 5), views: 1240, disagreement: 0.21 },
  l3: { place: 'Patvinsuo National Park', region: 'Lieksa, North Karelia', lat: 63.12, lon: 30.7, recorded: new Date(2026, 10, 14, 7, 22), views: 860, disagreement: 0.34 },
  l4: { place: 'Oulanka National Park', region: 'Kuusamo, North Ostrobothnia', lat: 66.37, lon: 29.33, recorded: new Date(2026, 10, 12, 23, 41), views: 2310, disagreement: 0.47 },
  l5: { place: 'Linnansaari National Park', region: 'Saimaa, South Savo', lat: 62.13, lon: 28.5, recorded: new Date(2026, 10, 14, 21, 10), views: 96, disagreement: 0.28 },
};

export const PRACTICE: Challenge[] = LEVELS.map((level, index) => ({
  kind: 'practice',
  id: level.id,
  title: level.title,
  durationS: 5,
  labels: 0,
  difficulty: level.difficulty,
  levelIndex: index,
  ...PRACTICE_DATA[level.id],
}));

/** One waiting recording as the backend lists it (GET /clips). */
export interface LiveClip {
  clip_id: string;
  device_id: string;
  post: string;
  region: string;
  lat: number | null;
  lon: number | null;
  recorded_at: number;
  duration_s: number | null;
  heard_count: number;
  device_guess: string | null;
  device_score: number | null;
  views: number;
  labels: number;
  disagreement: number;
}

/** "noise:wind" -> "Wind noise", "chirping_birds" -> "Chirping birds" */
export function prettyLabel(label: string): string {
  if (label.startsWith('noise:')) return `${cap(label.slice(6))} noise`;
  if (label === 'noise') return 'Background noise';
  return cap(label.replace(/_/g, ' '));
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function fromLive(c: LiveClip): Challenge {
  const guess = c.device_guess ? prettyLabel(c.device_guess) : null;
  return {
    kind: 'live',
    id: c.clip_id,
    // the post was not sure: its best guess, as a question
    title: guess ? `${guess}?` : 'Unknown sound',
    guess: guess ? `The post's guess: ${guess.toLowerCase()} (${Math.round((c.device_score ?? 0) * 100)}%)` : undefined,
    place: c.post,
    region: c.region,
    lat: c.lat ?? 60.315,
    lon: c.lon ?? 24.502,
    recorded: new Date(c.recorded_at * 1000),
    durationS: c.duration_s ?? 5,
    views: c.views,
    disagreement: c.disagreement,
    labels: c.labels,
  };
}

export type Category = 'newest' | 'hottest' | 'most' | 'least';

export const CATEGORIES: { id: Category; label: string; help: string }[] = [
  { id: 'newest', label: 'Newest', help: 'The most recent recordings' },
  { id: 'hottest', label: 'Hottest', help: 'Recordings where people disagree the most about what they hear' },
  { id: 'most', label: 'Most viewed', help: 'Recordings many people have looked at' },
  { id: 'least', label: 'Least viewed', help: 'Recordings that still need fresh ears' },
];

export function sortChallenges(list: Challenge[], c: Category): Challenge[] {
  const out = [...list];
  const newest = (a: Challenge, b: Challenge) => b.recorded.getTime() - a.recorded.getTime();
  if (c === 'newest') out.sort(newest);
  if (c === 'hottest') out.sort((a, b) => b.disagreement - a.disagreement || b.labels - a.labels || newest(a, b));
  if (c === 'most') out.sort((a, b) => b.views - a.views || newest(a, b));
  if (c === 'least') out.sort((a, b) => a.views - b.views || newest(a, b));
  return out;
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

/** Time of day in words, for the map caption. */
export function partOfDay(d: Date): string {
  const h = d.getHours();
  if (h < 5) return 'Night';
  if (h < 10) return 'Morning';
  if (h < 16) return 'Midday';
  if (h < 20) return 'Evening';
  return 'Night';
}

export const coords = (c: Challenge) => `${c.lat.toFixed(2)}° N, ${c.lon.toFixed(2)}° E`;
