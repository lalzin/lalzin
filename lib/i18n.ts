/**
 * Chaînes d'interface (titres de sections, boutons, labels).
 * Le contenu « data » (sorties, liens…) vit dans content.ts ;
 * ici, uniquement l'habillage textuel, traduit FR / EN.
 */
import type { Lang } from './content';

export const ui = {
  fr: {
    nav: {
      home: 'Accueil',
      about: 'Bio',
      discography: 'Sorties',
      video: 'Vidéo',
      live: 'Live',
      socials: 'Réseaux',
      merch: 'Boutique',
      contact: 'Booking',
      links: 'Liens',
    },
    hero: { listen: 'Écouter', booking: 'Booking' },
    about: { eyebrow: "L'artiste", title: 'Le groove à l’état pur' },
    discography: {
      eyebrow: 'Discographie',
      title: 'Sorties & Remixes',
      subtitle: 'Clique sur une pochette pour écouter.',
      featured: 'À la une',
    },
    video: { eyebrow: 'Vidéo', watch: 'Lancer le clip', youtube: 'Voir sur YouTube' },
    live: {
      eyebrow: 'Live',
      title: 'Prochaines dates',
      soon: 'Dates bientôt annoncées',
      soonText: 'Les prochains événements arrivent très vite. Pour une date ou un booking, c’est juste en dessous.',
      book: 'Réserver une date',
      tickets: 'Billets',
    },
    socials: { eyebrow: 'Réseaux', title: 'Suis le groove', subtitle: 'Sur toutes les plateformes.' },
    merch: {
      eyebrow: 'Boutique',
      title: 'Merch',
      subtitle: 'T-shirts, vinyles & goodies — bientôt disponibles.',
      soon: 'Bientôt',
      soonBtn: 'Bientôt disponible',
      visit: 'Visiter la boutique',
      comingSoon: 'Boutique bientôt disponible',
      comingSoonText: 'Le merch officiel LALZIN arrive très vite — t-shirts, vinyles & goodies. Reste connecté.',
    },
    contact: {
      eyebrow: 'Contact',
      title: 'Booking & contact',
      subtitle: 'Une date, une collab, un remix ?',
      name: 'Ton nom',
      email: 'Ton email',
      message: 'Ton message…',
      send: 'Envoyer',
      or: 'ou directement',
      subjects: {
        booking: 'Booking / Date',
        collab: 'Collaboration',
        remix: 'Remix',
        press: 'Presse / Média',
        other: 'Autre',
      },
    },
    footer: { rights: 'Tous droits réservés.' },
    links: { official: 'Site officiel', listen: 'Écouter LALZIN', back: 'Retour au site' },
    promo: {
      badge: 'Nouveau titre',
      out: 'Disponible maintenant',
      listen: 'Écouter',
      later: 'Plus tard',
    },
  },

  en: {
    nav: {
      home: 'Home',
      about: 'Bio',
      discography: 'Music',
      video: 'Video',
      live: 'Live',
      socials: 'Socials',
      merch: 'Shop',
      contact: 'Booking',
      links: 'Links',
    },
    hero: { listen: 'Listen', booking: 'Booking' },
    about: { eyebrow: 'The artist', title: 'Pure groove energy' },
    discography: {
      eyebrow: 'Discography',
      title: 'Releases & Remixes',
      subtitle: 'Tap a cover to listen.',
      featured: 'Featured',
    },
    video: { eyebrow: 'Video', watch: 'Play video', youtube: 'Watch on YouTube' },
    live: {
      eyebrow: 'Live',
      title: 'Upcoming shows',
      soon: 'Dates announced soon',
      soonText: 'Upcoming events are coming very soon. For a date or booking, it’s right below.',
      book: 'Book a date',
      tickets: 'Tickets',
    },
    socials: { eyebrow: 'Socials', title: 'Follow the groove', subtitle: 'On every platform.' },
    merch: {
      eyebrow: 'Shop',
      title: 'Merch',
      subtitle: 'Tees, vinyl & goodies — coming soon.',
      soon: 'Soon',
      soonBtn: 'Coming soon',
      visit: 'Visit the shop',
      comingSoon: 'Shop coming soon',
      comingSoonText: 'Official LALZIN merch is on the way — tees, vinyl & goodies. Stay tuned.',
    },
    contact: {
      eyebrow: 'Contact',
      title: 'Booking & contact',
      subtitle: 'A date, a collab, a remix?',
      name: 'Your name',
      email: 'Your email',
      message: 'Your message…',
      send: 'Send',
      or: 'or directly',
      subjects: {
        booking: 'Booking / Date',
        collab: 'Collaboration',
        remix: 'Remix',
        press: 'Press / Media',
        other: 'Other',
      },
    },
    footer: { rights: 'All rights reserved.' },
    links: { official: 'Official website', listen: 'Listen to LALZIN', back: 'Back to site' },
    promo: {
      badge: 'New track',
      out: 'Out now',
      listen: 'Listen',
      later: 'Later',
    },
  },
} as const;

export type UI = (typeof ui)[Lang];
