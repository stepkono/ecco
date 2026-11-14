/** Sound classes the edge model learns, and the species / threats players can unlock. */

export type ClassId = 'frog' | 'hornet' | 'chainsaw' | 'cicada' | 'rain' | 'wind' | 'unknown';

export const CLASSES: Record<ClassId, { label: string; color: string; target: boolean; hint: string }> = {
  frog: { label: 'Frog call', color: '#9be15d', target: true, hint: 'Pulsed harmonic strands, 0.4 to 4 kHz, repeating rhythm' },
  hornet: { label: 'Hornet wing-beat', color: '#ffb020', target: true, hint: 'Dense harmonic comb, ~110 Hz fundamental, slow Doppler bend' },
  chainsaw: { label: 'Chainsaw', color: '#ff5a5a', target: true, hint: 'Engine harmonics that rise and fall with RPM' },
  cicada: { label: 'Cicada', color: '#c58cff', target: true, hint: 'Broadband buzz, 3 to 8 kHz, very regular' },
  rain: { label: 'Rain', color: '#6f7dff', target: false, hint: 'Vertical streaks: short broadband drop impacts' },
  wind: { label: 'Wind', color: '#d6b98c', target: false, hint: 'Low rumble below 500 Hz that swells in gusts' },
  unknown: { label: 'Unknown', color: '#ff7ac8', target: false, hint: 'Something you cannot name yet' },
};

/** The model's output heads. Noise classes are the residual. */
export const MODEL_CLASSES: ClassId[] = ['frog', 'hornet', 'chainsaw', 'cicada'];

export type SourceId =
  | 'hyla'
  | 'pelophylax'
  | 'litoria'
  | 'cicada'
  | 'chainsaw_a'
  | 'chainsaw_b'
  | 'rain_drops'
  | 'rain_light'
  | 'wind'
  | 'hornet';

export interface SourceInfo {
  cls: ClassId;
  file?: string; // under /audio, otherwise synthesised
  species?: string;
  common: string;
  credit: string;
  license: string;
  url?: string;
}

export const SOURCES: Record<SourceId, SourceInfo> = {
  hyla: {
    cls: 'frog', file: 'frog_hyla_cinerea.wav', species: 'Hyla cinerea', common: 'Green treefrog',
    credit: 'Fredlyfish4', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Hyla_cinerea_call_audio.ogg',
  },
  pelophylax: {
    cls: 'frog', file: 'frog_pelophylax.wav', species: 'Pelophylax ridibundus', common: 'Marsh frog',
    credit: 'Llivermore', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Marsh_frog_(Pelophylax_ridibundus)_call.ogg',
  },
  litoria: {
    cls: 'frog', file: 'frog_litoria_fallax.wav', species: 'Litoria fallax', common: 'Eastern sedge frog',
    credit: 'Aviceda', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Litoria_fallax_jul08.ogg',
  },
  cicada: {
    cls: 'cicada', file: 'cicada_orni.wav', species: 'Cicada orni', common: 'Grey cicada',
    credit: 'DavidDelon', license: 'Public domain', url: 'https://commons.wikimedia.org/wiki/File:Cicada_orni.ogg',
  },
  chainsaw_a: {
    cls: 'chainsaw', file: 'chainsaw_a.wav', common: 'Chainsaw (idle and cut)',
    credit: 'ezwa', license: 'Public domain', url: 'https://commons.wikimedia.org/wiki/File:Chainsaw_3.ogg',
  },
  chainsaw_b: {
    cls: 'chainsaw', file: 'chainsaw_b.wav', common: 'Chainsaw (felling)',
    credit: 'ezwa', license: 'Public domain', url: 'https://commons.wikimedia.org/wiki/File:Chainsaw_1.ogg',
  },
  rain_drops: {
    cls: 'rain', file: 'rain_drops.wav', common: 'Heavy rain drops',
    credit: 'Gravity Sound', license: 'CC BY 4.0', url: 'https://commons.wikimedia.org/wiki/File:Rain_drops_(Gravity_Sound).wav',
  },
  rain_light: {
    cls: 'rain', file: 'rain_light.wav', common: 'Light rain',
    credit: 'Effib', license: 'CC BY-SA 3.0', url: 'https://commons.wikimedia.org/wiki/File:Sound_of_rain.ogg',
  },
  wind: { cls: 'wind', common: 'Gusty wind on microphone', credit: 'Procedural synthesis (BioSpectra)', license: 'CC0' },
  hornet: {
    cls: 'hornet', species: 'Vespa velutina', common: 'Yellow-legged hornet (invasive)',
    credit: 'Physics-inspired synthesis (BioSpectra)', license: 'CC0',
  },
};

/** Unlockable ecosystem entries, keyed by source id. */
export const ECOSYSTEM: { src: SourceId; role: 'native' | 'invasive' | 'threat' | 'rare' }[] = [
  { src: 'hyla', role: 'native' },
  { src: 'pelophylax', role: 'native' },
  { src: 'litoria', role: 'rare' },
  { src: 'cicada', role: 'native' },
  { src: 'hornet', role: 'invasive' },
  { src: 'chainsaw_b', role: 'threat' },
];
