import type { GameConfig } from '@/lib/minigame/types';
import dance from './dance.json';

const base = '/games/a-little-closer';
// Stems du morceau : hors de public/, servis seulement aux joueurs qui ont l'accès
// (route /api/minigame/media, fichiers dans games/a-little-closer/media).
const media = '/api/minigame/media/a-little-closer';

/** LALZIN — « A Little Closer » : tout ce qui est propre au titre. */
export const config: GameConfig = {
  slug: 'a-little-closer',
  title: 'A Little Closer',
  artist: 'LALZIN',
  palette: {
    wallTop: '#001428',
    wallBottom: '#002146',
    amberA: '#ff8a2a',
    amberB: '#ffb24a',
    floor: '#030f1f',
  },
  audio: {
    // Grille calée sur le kick isolé : 119 BPM, premier temps à 0,388 s dans les stems.
    bpm: 119,
    firstBeatOffset: 0.3876, // 1er temps du morceau (outil tap tempo : ?debug=1)
    beatsPerBar: 4,
    // Multipiste regroupé en 4 couches, depuis 0:00 : l'intro (mesures 0-8, voix parlée) joue
    // une fois en entier, puis la boucle de jeu = mesures 9 à 40.
    layers: [
      { id: 'pad', src: `${media}/pad.m4a`, unlockAt: 0 }, // CHORDS + Synth PAD
      { id: 'bass', src: `${media}/bass.m4a`, unlockAt: 25 }, // Kick BASS
      { id: 'vocals', src: `${media}/vox.m4a`, unlockAt: 50 }, // Vocal
      { id: 'drums', src: `${media}/groove.m4a`, unlockAt: 72 }, // DRUMS + GUITAR + LEAD + NOISE FX
    ],
    playFrom: 0,
    loop: { start: 0.3876 + 9 * (240 / 119), end: 0.3876 + 41 * (240 / 119) },
    // Second drop (mesures 57 à 72), tous les stems.
    finale: { src: `${media}/finale.m4a`, start: 1, end: 1 + 16 * (240 / 119) },
    // Mode disco : on saute au refrain (mesures 57-72) avec Kick BASS, CHORDS et LEAD
    // en version disco + les autres stems d'origine.
    disco: { src: `${media}/disco.m4a`, start: 1, end: 1 + 16 * (240 / 119) },
    // Synthé de secours (si un stem manque) + petits sons d'interface.
    placeholderChords: [
      { root: 43, notes: [58, 62, 65, 69] },
      { root: 48, notes: [58, 64, 67, 74] },
      { root: 41, notes: [57, 64, 67, 72] },
      { root: 50, notes: [60, 64, 65, 69] },
    ],
  },
  noRush: { speed: 1100, drain: 12 },
  // Règle de calage des ombres : la lumière part du côté où l'ombre au plus fort
  // gainX s'éloigne (sinon les mains se croisent au départ).
  levels: [
    {
      id: 'slow-hands',
      name: 'Slow hands',
      hint: { fr: 'Amène la lumière dans le cercle doré. Puis suis leur danse : il bouge !', en: 'Bring the light into the golden circle. Then follow their dance: it moves!' },
      special: { id: 'car', image: `${base}/eggs/egg-car.webp`, kind: 'car', icon: '🚗', name: { fr: 'La voiture du mariage', en: 'The wedding car' }, story: { fr: 'Ce morceau est né sur la route du mariage de ma cousine, au volant d’une Peugeot 4007.', en: 'This track was born on the road to my cousin’s wedding, behind the wheel of a Peugeot 4007.' }, points: 750 },
      targetHelp: 'full',
      step: { bars: 8, range: 0.22 },
      lightStart: { x: 0.85, y: 0.15 },
      meetLight: { x: 0.36, y: 0.62 },
      meetHeight: 470,
      left: { feetX: 0.3, gainX: 0.22, gainY: 0.25, slide: 0.03 },
      right: { feetX: 0.7, gainX: 0.55, gainY: 0.5, slide: 0.05 },
      sway: { x: 0.12, y: 0.08, bars: 4 },
      touchRadius: 46,
      farRadius: 260,
      fillSeconds: 22,
    },
    {
      id: 'steady-pace',
      name: 'Steady pace',
      hint: { fr: 'Le cercle ne se montre que de près. Anneau doré : contact pile sur le 1.', en: 'The circle only shows up close. Golden ring: touch right on the 1.' },
      special: { id: 'bouquet', image: `${base}/eggs/egg-bouquet.webp`, kind: 'bouquet', icon: '💐', name: { fr: 'Le bouquet de la mariée', en: 'The bride’s bouquet' }, story: { fr: 'Le bouquet s’est envolé… et c’est toi qui l’as attrapé !', en: 'The bouquet flew away… and you caught it!' }, points: 750 },
      targetHelp: 'near',
      step: { bars: 4, range: 0.25 },
      golden: true,
      lightStart: { x: 0.2, y: 0.7 },
      meetLight: { x: 0.64, y: 0.36 },
      meetHeight: 500,
      left: { feetX: 0.27, gainX: 0.42, gainY: 0.2, slide: 0.04 },
      right: { feetX: 0.73, gainX: 0.16, gainY: 0.36, slide: 0.03 },
      sway: { x: 0.14, y: 0.1, bars: 2 },
      touchRadius: 44,
      farRadius: 250,
      fillSeconds: 24,
    },
    {
      id: 'breathe',
      name: 'Feel it when we breathe',
      hint: { fr: 'Plus de cercle doré : à toi de trouver le point. Quand la lumière respire, ne bouge plus.', en: 'No more golden circle: find the spot yourself. When the light breathes, stay still.' },
      special: { id: 'mic', image: `${base}/eggs/egg-mic.webp`, kind: 'mic', icon: '🎤', name: { fr: 'Le micro', en: 'The mic' }, story: { fr: 'La voix de A Little Closer s’inspire directement de Dua Lipa.', en: 'The vocal of A Little Closer is directly inspired by Dua Lipa.' }, points: 750 },
      targetHelp: 'none',
      step: { bars: 4, range: 0.25 },
      breath: true,
      lightStart: { x: 0.88, y: 0.3 },
      meetLight: { x: 0.42, y: 0.5 },
      meetHeight: 480,
      left: { feetX: 0.28, gainX: 0.2, gainY: 0.4, slide: 0.03 },
      right: { feetX: 0.72, gainX: 0.5, gainY: 0.18, slide: 0.04 },
      sway: { x: 0.12, y: 0.08, bars: 4 },
      touchRadius: 46,
      farRadius: 250,
      fillSeconds: 26,
    },
    {
      id: 'shadows-on-the-wall',
      name: 'Shadows on the wall',
      hint: { fr: 'Une deuxième lumière bouge seule : compense-la.', en: 'A second light moves on its own: make up for it.' },
      special: { id: 'album', image: `${base}/eggs/egg-album.webp`, kind: 'mystery', icon: '💿', name: { fr: 'La pochette mystère', en: 'The mystery sleeve' }, story: { fr: 'A Little Closer fera partie du prochain album, celui d’après Party Love and Funk…', en: 'A Little Closer will be on the next album, the one after Party Love and Funk…' }, points: 750 },
      targetHelp: 'none',
      step: { bars: 4, range: 0.24 },
      golden: true,
      lightStart: { x: 0.74, y: 0.15 },
      meetLight: { x: 0.5, y: 0.55 },
      meetHeight: 480,
      left: { feetX: 0.28, gainX: 0.18, gainY: 0.42, slide: 0.04 },
      right: { feetX: 0.72, gainX: 0.6, gainY: 0.22, slide: 0.04 },
      sway: { x: 0.13, y: 0.09, bars: 4 },
      touchRadius: 46,
      farRadius: 240,
      fillSeconds: 26,
      overtimeSeconds: 18,
      secondLight: { weight: 0.25, center: { x: 0.5, y: 0.45 }, amp: { x: 0.3, y: 0.22 }, speed: 0.16 },
    },
    {
      id: 'no-rush-no-maybe',
      name: 'No rush, no maybe',
      hint: { fr: 'Plus strict : les gestes brusques coûtent cher.', en: 'Stricter: sudden moves cost you.' },
      special: { id: 'champagne', image: `${base}/eggs/egg-champagne.webp`, kind: 'champagne', icon: '🍾', name: { fr: 'Le champagne', en: 'The champagne' }, story: { fr: 'Ça se fête ! Encore un niveau et tu ouvres la cabine.', en: 'Time to celebrate! One more level and the booth is yours.' }, points: 750 },
      targetHelp: 'none',
      step: { bars: 2, range: 0.27 },
      golden: true,
      breath: true,
      noRushSpeed: 900,
      lightStart: { x: 0.1, y: 0.2 },
      meetLight: { x: 0.6, y: 0.45 },
      meetHeight: 490,
      left: { feetX: 0.26, gainX: 0.5, gainY: 0.2, slide: 0.04 },
      right: { feetX: 0.74, gainX: 0.2, gainY: 0.45, slide: 0.03 },
      sway: { x: 0.17, y: 0.11, bars: 2 },
      touchRadius: 44,
      farRadius: 240,
      fillSeconds: 28,
      overtimeSeconds: 18,
    },
    {
      id: 'skin-to-skin',
      name: 'Skin to skin',
      hint: { fr: 'Tout à la fois : deuxième lumière, anneau doré, respiration.', en: 'All at once: second light, golden ring, breathing.' },
      special: { id: 'polaroid', image: `${base}/eggs/egg-polaroid.webp`, kind: 'polaroid', icon: '📸', name: { fr: 'Le polaroid', en: 'The polaroid' }, story: { fr: 'Avant la cover actuelle, il y avait une autre pochette… elle t’attend dans la cabine.', en: 'Before the current cover there was another one… it’s waiting for you in the booth.' }, points: 750 },
      targetHelp: 'none',
      step: { bars: 2, range: 0.3 },
      golden: true,
      breath: true,
      lightStart: { x: 0.9, y: 0.12 },
      meetLight: { x: 0.45, y: 0.58 },
      meetHeight: 470,
      left: { feetX: 0.28, gainX: 0.16, gainY: 0.45, slide: 0.03 },
      right: { feetX: 0.72, gainX: 0.55, gainY: 0.2, slide: 0.05 },
      sway: { x: 0.18, y: 0.12, bars: 2 },
      touchRadius: 43,
      farRadius: 230,
      fillSeconds: 30,
      overtimeSeconds: 18,
      secondLight: { weight: 0.26, center: { x: 0.5, y: 0.4 }, amp: { x: 0.32, y: 0.22 }, speed: 0.26 },
    },
  ],
  tutorialSprites: {
    src: `${base}/dance.webp`,
    atlasW: dance.cell.w * 4,
    atlasH: dance.cell.h * 4,
    cellW: dance.cell.w,
    cellH: dance.cell.h,
    split: dance.frames[0].split!,
  },
  tutorial: [
    {
      art: 'light',
      title: { fr: 'Tu bouges la lumière', en: 'You move the light' },
      text: {
        fr: 'Glisse le doigt (ou bouge la souris, ou les flèches). Tu ne touches pas les danseurs : seulement la lumière derrière le store.',
        en: 'Slide your finger (or move the mouse, or use the arrow keys). You never touch the dancers: only the light behind the blinds.',
      },
    },
    {
      art: 'hands',
      title: { fr: 'Rapproche leurs mains', en: 'Bring their hands together' },
      text: {
        fr: 'Leurs ombres suivent la lumière. Trouve le point où leurs mains se touchent : un fil s’allume entre elles et la jauge monte.',
        en: 'Their shadows follow the light. Find the spot where their hands meet: a thread lights up between them and the gauge fills.',
      },
    },
    {
      art: 'rhythm',
      title: { fr: 'Danse avec eux', en: 'Dance with them' },
      text: {
        fr: 'Le point bouge avec la musique et change de pas : suis-le. Mains jointes sur les temps = combo. Geste trop brusque = No rush.',
        en: 'The spot moves with the music and changes steps: follow it. Hands joined on the beat = combo. Too sudden a move = No rush.',
      },
    },
    {
      art: 'bonus',
      title: { fr: 'Bonus et chrono', en: 'Bonuses and timer' },
      text: {
        fr: 'Attrape les bonus qui tombent avec le halo de la lumière. La boule à facettes lance le refrain disco ×3. Mais fais vite : le bonus chrono fond.',
        en: 'Catch the falling bonuses with the light’s halo. The disco ball kicks off the ×3 disco chorus. But be quick: the time bonus melts away.',
      },
    },
  ],
  lyrics: [
    'Slide a little closer',
    'Feel it when we breathe now',
    "We don't need forever",
    'We just need right now',
  ],
  easterEggs: [],
  cabin: {
    unlockPoints: 15000,
    album: {
      title: { fr: 'Le prochain album', en: 'The next album' },
      requires: 'album',
      text: {
        fr: 'Pochette mystère… Le prochain album après Party Love and Funk. A Little Closer en fera partie.',
        en: 'Mystery sleeve… The next album after Party Love and Funk. A Little Closer will be on it.',
      },
    },
    firstCover: {
      image: `${base}/old-cover.webp`,
      title: { fr: 'L’ancienne cover', en: 'The old cover' },
      requires: 'polaroid',
      text: {
        fr: 'La pochette d’avant : la fenêtre, le store, la boule à facettes… et leurs ombres.',
        en: 'The sleeve that came before: the window, the blinds, the disco ball… and their shadows.',
      },
    },
  },
  links: {
    spotify: 'https://open.spotify.com/artist/0j4hdmNGBCznlyeFs618eM',
    appleMusic: 'https://music.apple.com/artist/lalzin/1406362337',
  },
  assets: {
    loop: `${base}/bg_loop.mp4`,
    still: `${base}/bg_still.webp`,
    cover: `${base}/cover.webp`,
    logo: `${base}/logo-lalzin.webp`,
    dance: `${base}/dance.webp`,
  },
};
