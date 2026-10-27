/**
 * Modèle de configuration d'un mini-jeu de titre.
 * Tout ce qui est propre à un morceau vit dans `games/<slug>/config.ts` ;
 * le cœur (`lib/minigame/`) ne connaît que ces types.
 */

export type Vec2 = { x: number; y: number };

/** Langues du jeu. */
export type Lang = 'fr' | 'en';
/** Texte affiché au joueur : une chaîne (identique partout) ou une version par langue. */
export type Localized = string | Record<Lang, string>;

/** Couleurs en hex CSS (#rrggbb). */
export type Palette = {
  wallTop: string;
  wallBottom: string;
  amberA: string;
  amberB: string;
  floor: string;
};

export type Links = {
  spotify?: string;
  appleMusic?: string;
  page?: string;
};

/** Accord du synthé placeholder : basse (MIDI) + notes de nappe (MIDI). */
export type Chord = { root: number; notes: number[] };

export type AudioConfig = {
  /** BPM du morceau (à confirmer). */
  bpm: number;
  /** Position (s) du premier temps fort dans les stems. */
  firstBeatOffset: number;
  beatsPerBar: number;
  /**
   * Une couche par seuil de proximité des mains (`unlockAt` en %, 0 = toujours,
   * 100 = au contact). `src` = stem AAC/MP3 ; plusieurs couches
   * peuvent partager le même fichier et n'en garder qu'une bande de
   * fréquences (`band` = [Hz bas, Hz haut], 0 = pas de limite).
   * Sans `src` : voix du synthé placeholder portant le même `id`
   * (pad, bass, vocals, drums, chorus).
   */
  layers: { id: string; src?: string; band?: [number, number]; unlockAt: number }[];
  /** Boucle commune aux stems (secondes dans les fichiers) ; `start` doit tomber sur un premier temps. */
  loop?: { start: number; end: number };
  /**
   * Où commence la lecture dans les fichiers (s). Avant `loop.start`, c'est l'intro :
   * jouée une fois, en entier (toutes les couches). Défaut : `loop.start`.
   * `firstBeatOffset` = position du 1er temps par rapport à ce point de départ.
   */
  playFrom?: number;
  /** Refrain joué en entier à 100 %, enchaîné sur la mesure suivante. */
  finale?: { src: string; start: number; end: number };
  /**
   * Version « super disco » jouée pendant le mode disco : même tempo et même
   * calage de mesures que les stems (boucle sur `start`..`end`). Absente =
   * batterie disco synthétisée par-dessus le morceau.
   */
  disco?: { src: string; start: number; end: number };
  /** Grille d'accords du synthé placeholder (une mesure par accord). */
  placeholderChords: Chord[];
};

/** Paramètres d'une ombre (« corps virtuel ») pour un niveau. */
export type ShadowRig = {
  /** Position des pieds, 0..1 en largeur de monde. */
  feetX: number;
  /** De combien la main glisse quand la lumière bouge en x. */
  gainX: number;
  /** De combien la main monte/descend quand la lumière bouge en y. */
  gainY: number;
  /** Glissement des pieds sur le mur (faible). */
  slide: number;
};

export type LevelConfig = {
  id: string;
  name: string;
  /** Position de départ de la lumière (0..1, y = 0 en haut de la zone jouable). */
  lightStart: Vec2;
  /** Position de lumière où les mains se rejoignent (0..1). */
  meetLight: Vec2;
  /** Hauteur (unités monde au-dessus du sol) où se touchent les mains. */
  meetHeight: number;
  left: ShadowRig;
  right: ShadowRig;
  /**
   * Le point de rencontre « danse » : il oscille en rythme, et l'amplitude
   * grandit à chaque palier. Amplitudes en unités normalisées, période en mesures.
   */
  sway: { x: number; y: number; bars: number };
  /** Distance mains (unités monde) en dessous de laquelle il y a contact. */
  touchRadius: number;
  /** Distance au-delà de laquelle la jauge redescend. */
  farRadius: number;
  /** Secondes de contact (hors bonus de rythme) pour remplir la jauge. */
  fillSeconds: number;
  /** Phrase d'aide affichée au début du niveau (présente la mécanique). */
  hint: Localized;
  /** « Right now » : toutes les 4 mesures, toucher pile sur le premier temps. */
  golden?: boolean;
  /** « Breathe » : toutes les 4 mesures, rester immobile mains jointes une mesure. */
  breath?: boolean;
  /**
   * Aide visuelle (cercle doré) : `full` = visible jusqu'au premier contact puis
   * seulement de près ; `near` = seulement de près ; `none` = jamais.
   */
  targetHelp?: 'full' | 'near' | 'none';
  /** Pas de danse : le point de rencontre saute toutes les `bars` mesures, dans ±`range`. */
  step?: { bars: number; range: number };
  /** Secondes de prolongation après le chrono avant de perdre le niveau (défaut 12). */
  overtimeSeconds?: number;
  /** Seuil « no rush » propre au niveau (px CSS/s), sinon celui du jeu. */
  noRushSpeed?: number;
  /**
   * Bonus spécial du niveau : apparaît une fois, file dans tous les sens, fuit la
   * lumière ; l'attraper rapporte gros et débloque son anecdote dans la cabine.
   */
  special?: {
    id: string;
    /** Dessin vectoriel de secours (si pas d'image). */
    kind: string;
    /** Image du bonus (PNG/WebP alpha) : sprite en jeu et vignette dans l'interface. */
    image?: string;
    icon: string;
    name: Localized;
    story: Localized;
    points: number;
  };
  /** Seconde source de lumière qui dérive seule (niveau 3). */
  secondLight?: { weight: number; center: Vec2; amp: Vec2; speed: number };
};

export type NoRushConfig = {
  /** Vitesse du doigt (px CSS/s) au-delà de laquelle on « se précipite ». */
  speed: number;
  /** Perte de jauge (%/s) pendant la précipitation. */
  drain: number;
};

export type EasterEggConfig = {
  id: string;
  label: string;
  light: Vec2;
  tolerance: number;
  holdSeconds: number;
  asset?: string;
  link?: string;
};

/** Une carte du tutoriel (avant la partie, sans musique). */
export type TutorialStep = {
  art: 'light' | 'hands' | 'rhythm' | 'bonus';
  title: Localized;
  text: Localized;
};

export type GameConfig = {
  slug: string;
  title: string;
  artist: string;
  palette: Palette;
  audio: AudioConfig;
  noRush: NoRushConfig;
  levels: LevelConfig[];
  /** Cartes du tutoriel affichées avant la première partie. */
  tutorial: TutorialStep[];
  /** Silhouettes pour illustrer le tutoriel (planche : atlas, cellule, séparation elle/lui). */
  tutorialSprites?: { src: string; atlasW: number; atlasH: number; cellW: number; cellH: number; split: number };
  /** Lignes de paroles projetées aux paliers 25/50/75/100. */
  lyrics: string[];
  easterEggs: EasterEggConfig[];
  /** Cabine à secrets : s'ouvre après `unlockPoints` points cumulés sur les victoires. */
  cabin?: {
    unlockPoints: number;
    /** Chaque contenu exclusif ne se dévoile qu'une fois le bonus `requires` attrapé. */
    album: { title: Localized; text: Localized; requires?: string };
    firstCover: { image: string; title: Localized; text: Localized; requires?: string };
  };
  links: Links;
  assets: {
    /** Boucle vidéo de l'écran d'accueil + image fixe. */
    loop: string;
    still: string;
    cover: string;
    /** Logo de l'artiste (PNG/WebP alpha). */
    logo: string;
    /** Planche de danse : silhouettes blanches sur fond transparent (voir dance.json). */
    dance: string;
  };
};

/** Résultat d'un niveau, pour l'écran de victoire et la carte de partage. */
export type LevelStats = {
  level: number;
  levelName: string;
  time: number;
  hits: number;
  beats: number;
  maxCombo: number;
  rushes: number;
  /** Objets attrapés. */
  catches: number;
  /** Bonus chrono encaissé à la fin. */
  timeBonus: number;
  score: number;
};
