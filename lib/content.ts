/**
 * ════════════════════════════════════════════════════════════════════
 *  LALZIN — MODÈLE DE CONTENU ÉDITABLE
 * ════════════════════════════════════════════════════════════════════
 *  Source de vérité du contenu du site. Éditable depuis /admin
 *  (sauvegarde navigateur + export/import JSON). Le site lit en priorité
 *  les modifications de l'admin, sinon ces valeurs par défaut.
 *
 *  Les champs de type `L` ont une version française ET anglaise
 *  (sélecteur de langue). Les liens marqués « TODO » sont à compléter.
 * ════════════════════════════════════════════════════════════════════
 */

export type Lang = 'fr' | 'en';

/** Texte localisé FR / EN. */
export type L = { fr: string; en: string };

/** Renvoie la bonne langue (fallback FR). */
export const pick = (l: L | undefined, lang: Lang): string =>
  (l && (l[lang] ?? l.fr)) || '';

/* -------------------------------------------------------------- TYPES */
export type SocialKey =
  | 'instagram'
  | 'spotify'
  | 'appleMusic'
  | 'youtube'
  | 'soundcloud'
  | 'facebook';

export type Social = { key: SocialKey; label: string; href: string };

export type Stat = { value: string; label: L; sub: L };

export type Release = {
  id: string;
  title: string;
  type: 'Album' | 'EP' | 'Single' | 'Remix';
  accent: [string, string];
  cover?: string;
  href: string;
  featured?: boolean;
  /** Affiche ce morceau en popup d'accueil (« nouveau titre »). */
  announce?: boolean;
};

export type LiveDate = {
  id: string;
  date: string;
  venue: string;
  city: string;
  ticketsHref?: string;
};

export type MerchProduct = {
  id: string;
  name: string;
  category: 'T-shirt' | 'Vinyle' | 'Goodies';
  accent: [string, string];
  available: boolean;
  href?: string;
};

export type Content = {
  artist: {
    name: string;
    tagline: L;
    bio: L;
    genres: string[];
    bookingEmail: string;
    stats: Stat[];
    photos: { portrait: string; live: string; casual: string };
    logo: string;
  };
  socials: Social[];
  releases: Release[];
  video: { title: string; subtitle: L; youtubeId: string };
  liveDates: LiveDate[];
  merch: MerchProduct[];
  site: { url: string; title: string; description: string; shopUrl?: string };
};

/* ----------------------------------------------------- CONTENU PAR DÉFAUT */
export const defaultContent: Content = {
  artist: {
    name: 'LALZIN',
    tagline: {
      fr: 'Du pur groove, pour une vraie connexion',
      en: 'Pure groove for pure connection',
    },
    bio: {
      en: 'DJ & music producer blending funk, house, disco, bass vibes. From dancefloors to deep emotions, pure groove for pure connection.',
      fr: 'DJ & producteur. Un groove qui mêle funk, house, disco et bass, des dancefloors aux émotions profondes.',
    },
    genres: ['Funky House', 'Disco Funk', 'Bass House'],
    bookingEmail: 'dirty.lalzin@gmail.com',
    stats: [
      {
        value: '80K+',
        label: { fr: 'auditeurs mensuels', en: 'monthly listeners' },
        sub: { fr: 'Spotify', en: 'Spotify' },
      },
      {
        value: '10+',
        label: { fr: 'sorties & remixes', en: 'releases & remixes' },
        sub: { fr: 'sur les plateformes', en: 'on all platforms' },
      },
      {
        value: '∞',
        label: { fr: 'groove', en: 'groove' },
        sub: { fr: 'sur le dancefloor', en: 'on the dancefloor' },
      },
    ],
    photos: {
      portrait: '/images/artist/lalzin-portrait.jpg',
      live: '/images/artist/lalzin-live.jpg',
      casual: '/images/artist/lalzin-casual.jpg',
    },
    logo: '/images/brand/lalzin-logo.png',
  },

  socials: [
    { key: 'spotify', label: 'Spotify', href: 'https://open.spotify.com/artist/0j4hdmNGBCznlyeFs618eM' },
    { key: 'instagram', label: 'Instagram', href: 'https://instagram.com/_lalzin_' },
    { key: 'appleMusic', label: 'Apple Music', href: 'https://music.apple.com/fr/artist/lalzin/1406362337' },
    { key: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/@Lalzin' },
    { key: 'soundcloud', label: 'SoundCloud', href: 'https://soundcloud.com/lalzin' },
    { key: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/lalzinOfficial/' },
  ],

  releases: [
    { id: 'better-with-you', title: 'Better With You', type: 'Single', accent: ['#E8487E', '#EE6C3A'], cover: '/images/covers/better-with-you.jpg', href: 'https://spotify.link/lr7kzOQYNBb', featured: true, announce: true },
    { id: 'party-love-and-funk', title: 'Party Love And Funk', type: 'Album', accent: ['#E9AE3E', '#EE6C3A'], cover: '/images/covers/party-love-and-funk.jpg', href: 'https://hypeddit.com/lalzin/partyloveandfunk', featured: true },
    { id: 'party-love-and-funk-remixes', title: 'Party Love And Funk — Remixes', type: 'Album', accent: ['#1AA293', '#E8487E'], cover: '/images/covers/party-love-and-funk-remixes.jpg', href: 'https://hypeddit.com/lalzin/partyloveandfunkremixes' },
    { id: 'chemise', title: 'Chemise', type: 'EP', accent: ['#1AA293', '#E9AE3E'], cover: '/images/covers/chemise.jpg', href: 'https://hypeddit.com/lalzin/chemise' },
    { id: 'i-cant-stop', title: "I Can't Stop", type: 'Single', accent: ['#E8487E', '#1AA293'], cover: '/images/covers/i-cant-stop.jpg', href: 'https://www.youtube.com/watch?v=YtLSxRcAhX0', featured: true },
    { id: 'take-me-up', title: 'Take Me Up', type: 'Single', accent: ['#EE6C3A', '#E9AE3E'], cover: '/images/covers/take-me-up.jpg', href: 'https://hypeddit.com/lalzin/takemeup' },
    { id: 'feel-like-this', title: 'Feel Like This', type: 'Single', accent: ['#E9AE3E', '#EE6C3A'], cover: '/images/covers/feel-like-this.jpg', href: 'https://soundcloud.com/lalzin/feels-like-this' },
    { id: 'calabria-2024', title: 'Calabria 2024', type: 'Remix', accent: ['#EE6C3A', '#1AA293'], cover: '/images/covers/calabria-2024.jpg', href: 'https://hypeddit.com/lalzin/calabria' },
    { id: 'jamiroquai-feel-so-good', title: 'Jamiroquai — Feel So Good', type: 'Remix', accent: ['#E9AE3E', '#E8487E'], cover: '/images/covers/jamiroquai-feel-so-good.jpg', href: 'https://hypeddit.com/lalzin/jamiroquaimain' },
    { id: '4batz-act-v', title: '4batz — Act V: There Goes Another Vase', type: 'Remix', accent: ['#1AA293', '#EE6C3A'], cover: '/images/covers/4batz-act-v.jpg', href: 'https://hypeddit.com/lalzin/4batz' },
    { id: 'lil-tecca-dark-thoughts', title: 'Lil Tecca — Dark Thoughts', type: 'Remix', accent: ['#E8487E', '#E9AE3E'], cover: '/images/covers/lil-tecca-dark-thoughts.jpg', href: 'https://hypeddit.com/lalzin/teccaremixmain' },
  ],

  video: {
    title: "I Can't Stop",
    subtitle: { fr: 'Clip officiel', en: 'Official video' },
    youtubeId: 'YtLSxRcAhX0',
  },

  liveDates: [],

  merch: [
    { id: 'tee-funk', name: 'T-shirt « Party Love And Funk »', category: 'T-shirt', accent: ['#FF2E92', '#FF6B35'], available: false },
    { id: 'vinyl-album', name: 'Vinyle — Party Love And Funk', category: 'Vinyle', accent: ['#FFC23C', '#15C7B8'], available: false },
    { id: 'tee-chemise', name: 'Chemise hawaïenne LALZIN', category: 'Goodies', accent: ['#15C7B8', '#FF2E92'], available: false },
    { id: 'tote', name: 'Tote bag disco', category: 'Goodies', accent: ['#FF6B35', '#FFC23C'], available: false },
    { id: 'vinyl-better', name: 'Vinyle 7" — Better With You', category: 'Vinyle', accent: ['#FF2E92', '#FFD96B'], available: false },
    { id: 'cap', name: 'Bob / Casquette LALZIN', category: 'Goodies', accent: ['#15C7B8', '#FFC23C'], available: false },
  ],

  site: {
    url: 'https://lalzin.com',
    title: 'LALZIN — DJ & Producer | Funky House · Disco · Bass',
    description:
      'Site officiel de LALZIN, DJ & producteur funky house / disco / bass. 80K+ auditeurs mensuels. Sorties, clips, dates live & booking.',
    shopUrl: 'https://1mq7i0-f3.myshopify.com',
  },
};
