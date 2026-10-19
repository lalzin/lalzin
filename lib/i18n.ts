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
      plugins: 'Plugins',
    },
    hero: { listen: 'Écouter', booking: 'Booking', loading: 'Chargement de la boule disco…' },
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
      subtitle: 'T-shirts, vinyles & goodies, bientôt disponibles.',
      soon: 'Bientôt',
      soonBtn: 'Bientôt disponible',
      visit: 'Visiter la boutique',
      comingSoon: 'Boutique bientôt disponible',
      comingSoonText: 'Le merch officiel LALZIN arrive très vite : t-shirts, vinyles & goodies. Reste connecté.',
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
    plugins: {
      nav: 'Plugins',
      eyebrow: 'Groove Knobs',
      title: 'Les plugins',
      suiteIntro:
        'Des plugins pensés pour le dancefloor : un seul knob, une seule idée, zéro mode d’emploi. Gratuits, VST3 / AU / Standalone.',
      teaserTitle: 'Groove Knobs',
      teaserCta: 'Découvrir les plugins',
      free: 'Gratuit',
      download: 'Télécharger gratuitement',
      downloadShort: 'Télécharger',
      version: 'Version',
      by: 'par',
      discover: 'Voir le plugin',
      soon: 'Bientôt',
      soonOther: 'Les deux autres plugins de la suite arrivent très vite.',
      highlights: 'Points forts',
      presets: 'Presets',
      states: 'En images',
      requirements: 'Configuration requise',
      formats: 'Formats',
      size: 'Taille',
      osUnavailable: 'La version Windows arrive bientôt.',
      installGuide: 'Guide d’installation',
      backToPlugins: '← Tous les plugins',
      /* Formulaire */
      form: {
        title: 'Reçois le plugin par email',
        subtitle:
          'On t’envoie le lien de téléchargement tout de suite. Gratuit, sans compte à créer.',
        email: 'Ton email',
        emailPlaceholder: 'toi@exemple.com',
        os: 'Ton système',
        alsoWant: 'J’en profite pour prendre aussi :',
        newsletter:
          'Je veux recevoir les nouveaux plugins et les sorties de LALZIN (facultatif, désinscription en un clic).',
        privacy: 'Politique de confidentialité',
        privacyNote: 'Ton email sert à t’envoyer les liens. Rien d’autre sans ton accord. Voir la',
        submit: 'Recevoir le lien',
        sending: 'Envoi…',
        errorEmail: 'Email invalide.',
        errorOS: 'Choisis ton système.',
        errorGeneric: 'Échec de l’envoi. Réessaie dans un instant.',
        errorRate: 'Trop de demandes. Réessaie plus tard.',
        errorCaptcha: 'Vérification anti-robot échouée. Recharge la page.',
      },
      /* Page merci */
      thanks: {
        title: 'Regarde ta boîte mail 📬',
        subtitle:
          'Le lien de téléchargement vient de partir. Il est valable 7 jours. Pense à regarder dans les spams.',
        nothing: 'Je n’ai rien reçu',
        resent: 'C’est reparti ! Vérifie ta boîte mail.',
        wait: 'Patiente encore {s} s',
        donateTitle: 'Les plugins sont gratuits',
        donateText:
          'Si celui-là te sert, un petit don aide à en sortir d’autres. C’est libre, et ça ne change rien à ton téléchargement.',
        donateFree: 'Montant libre',
        donateThanks: 'Merci 🙏',
        installCta: 'Comment l’installer',
      },
      /* Guide d'installation */
      install: {
        title: 'Installer les plugins',
        subtitle: 'Deux minutes, et le knob est dans ton DAW.',
        macTitle: 'macOS',
        macSteps: [
          'Ouvre le fichier .pkg téléchargé et laisse-toi guider.',
          'Si macOS bloque l’installation : Réglages Système → Confidentialité et sécurité → descends jusqu’au message sur le plugin → « Ouvrir quand même ».',
        ],
        winTitle: 'Windows',
        winSteps: [
          'Lance le fichier .exe téléchargé.',
          'Si SmartScreen affiche un avertissement : « Informations complémentaires » → « Exécuter quand même ».',
        ],
        dawTitle: 'Dans ton DAW (exemple Ableton Live)',
        dawSteps: [
          'Réglages → Plug-Ins → Rescan.',
          'Les plugins apparaissent dans VST3 / Audio Units → LALZIN.',
        ],
        noteTitle: 'Bon à savoir',
        notes: [
          'Backwash démarre en mode LIVE (zéro latence) : il écoute la première mesure avant de produire son souffle.',
        ],
        problem: 'Un souci ? Écris-moi :',
      },
      /* Lien expiré */
      expired: {
        title: 'Ce lien a expiré',
        text: 'Les liens sont valables 7 jours. Redemande-en un, c’est immédiat.',
      },
      /* Fichier pas encore en ligne */
      notYet: {
        title: 'Le fichier arrive',
        text: 'Le plugin est en cours de validation chez Apple. Laisse ton email ci-dessous, tu seras prévenu dès qu’il est téléchargeable.',
      },
    },
    privacy: {
      title: 'Politique de confidentialité',
      updated: 'Dernière mise à jour',
      intro:
        'Ce site collecte le minimum : voici exactement quoi, pourquoi, et comment t’en débarrasser.',
      sections: [
        {
          title: 'Ce qui est collecté',
          body: 'Quand tu demandes un plugin : ton adresse email, le système choisi (macOS ou Windows), les plugins demandés, la langue du site, ton choix concernant la newsletter, une empreinte de ton adresse IP (hachée, non réversible) et ton navigateur. Le formulaire de contact envoie simplement un email.',
        },
        {
          title: 'À quoi ça sert',
          body: 'À t’envoyer tes liens de téléchargement, à compter les téléchargements par plugin et par système, et à limiter les abus (robots, envois en masse). Rien d’autre.',
        },
        {
          title: 'Emails',
          body: 'L’email qui contient tes liens est transactionnel : tu le reçois parce que tu l’as demandé. Aucun email promotionnel ne part sans la case newsletter cochée, et chaque newsletter contient un lien de désinscription.',
        },
        {
          title: 'Durée de conservation',
          body: 'Les demandes et les statistiques de téléchargement sont conservées 24 mois, puis supprimées.',
        },
        {
          title: 'Sous-traitants',
          body: 'Resend (envoi des emails), Supabase (base de données), Cloudflare (protection anti-robot et stockage des fichiers), Vercel (hébergement du site).',
        },
        {
          title: 'Tes droits',
          body: 'Tu peux demander l’accès, la correction ou la suppression de tes données à tout moment, par email. La suppression est faite sous 30 jours.',
        },
      ],
      contact: 'Contact :',
    },
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
      plugins: 'Plugins',
    },
    hero: { listen: 'Listen', booking: 'Booking', loading: 'Loading the disco ball…' },
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
      subtitle: 'Tees, vinyl & goodies, coming soon.',
      soon: 'Soon',
      soonBtn: 'Coming soon',
      visit: 'Visit the shop',
      comingSoon: 'Shop coming soon',
      comingSoonText: 'Official LALZIN merch is on the way: tees, vinyl & goodies. Stay tuned.',
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
    plugins: {
      nav: 'Plugins',
      eyebrow: 'Groove Knobs',
      title: 'The plugins',
      suiteIntro:
        'Plugins made for the dancefloor: one knob, one idea, no manual. Free, VST3 / AU / Standalone.',
      teaserTitle: 'Groove Knobs',
      teaserCta: 'See the plugins',
      free: 'Free',
      download: 'Download for free',
      downloadShort: 'Download',
      version: 'Version',
      by: 'by',
      discover: 'View plugin',
      soon: 'Soon',
      soonOther: 'The other two plugins of the suite are coming very soon.',
      highlights: 'Highlights',
      presets: 'Presets',
      states: 'In pictures',
      requirements: 'Requirements',
      formats: 'Formats',
      size: 'Size',
      osUnavailable: 'The Windows build is coming soon.',
      installGuide: 'Installation guide',
      backToPlugins: '← All plugins',
      /* Form */
      form: {
        title: 'Get the plugin by email',
        subtitle: 'We send the download link right away. Free, no account needed.',
        email: 'Your email',
        emailPlaceholder: 'you@example.com',
        os: 'Your system',
        alsoWant: 'While you’re here, also send me:',
        newsletter:
          'I want to hear about new plugins and LALZIN releases (optional, one-click unsubscribe).',
        privacy: 'Privacy policy',
        privacyNote: 'Your email is only used to send the links. Nothing else without your consent. See the',
        submit: 'Send me the link',
        sending: 'Sending…',
        errorEmail: 'Invalid email.',
        errorOS: 'Pick your system.',
        errorGeneric: 'Sending failed. Please try again in a moment.',
        errorRate: 'Too many requests. Please try again later.',
        errorCaptcha: 'Anti-bot check failed. Please reload the page.',
      },
      /* Thanks page */
      thanks: {
        title: 'Check your inbox 📬',
        subtitle:
          'The download link is on its way. It stays valid for 7 days. Have a look in your spam folder too.',
        nothing: 'I got nothing',
        resent: 'Sent again! Check your inbox.',
        wait: 'Please wait {s} s',
        donateTitle: 'The plugins are free',
        donateText:
          'If this one earns its place, a small tip helps me make more. Entirely optional, and it changes nothing about your download.',
        donateFree: 'Any amount',
        donateThanks: 'Thank you 🙏',
        installCta: 'How to install it',
      },
      /* Install guide */
      install: {
        title: 'Installing the plugins',
        subtitle: 'Two minutes, and the knob is in your DAW.',
        macTitle: 'macOS',
        macSteps: [
          'Open the downloaded .pkg file and follow the installer.',
          'If macOS blocks it: System Settings → Privacy & Security → scroll to the message about the plugin → “Open Anyway”.',
        ],
        winTitle: 'Windows',
        winSteps: [
          'Run the downloaded .exe file.',
          'If SmartScreen warns you: “More info” → “Run anyway”.',
        ],
        dawTitle: 'In your DAW (Ableton Live example)',
        dawSteps: [
          'Settings → Plug-Ins → Rescan.',
          'The plugins show up under VST3 / Audio Units → LALZIN.',
        ],
        noteTitle: 'Good to know',
        notes: [
          'Backwash starts in LIVE mode (zero latency): it listens to the first bar before producing its swell.',
        ],
        problem: 'Something wrong? Write to me:',
      },
      /* Expired link */
      expired: {
        title: 'This link has expired',
        text: 'Links stay valid for 7 days. Ask for a new one, it’s instant.',
      },
      /* File not online yet */
      notYet: {
        title: 'The file is on its way',
        text: 'The plugin is going through Apple’s notarisation. Leave your email below and you’ll hear from us as soon as it can be downloaded.',
      },
    },
    privacy: {
      title: 'Privacy policy',
      updated: 'Last updated',
      intro: 'This site collects the bare minimum: here is exactly what, why, and how to get rid of it.',
      sections: [
        {
          title: 'What is collected',
          body: 'When you request a plugin: your email address, the system you picked (macOS or Windows), the plugins requested, the site language, your newsletter choice, a fingerprint of your IP address (hashed, not reversible) and your browser. The contact form simply sends an email.',
        },
        {
          title: 'What it is used for',
          body: 'To send you your download links, to count downloads per plugin and per system, and to limit abuse (bots, bulk sign-ups). Nothing else.',
        },
        {
          title: 'Emails',
          body: 'The email with your links is transactional: you get it because you asked for it. No promotional email is ever sent without the newsletter box ticked, and every newsletter carries an unsubscribe link.',
        },
        {
          title: 'How long it is kept',
          body: 'Requests and download statistics are kept for 24 months, then deleted.',
        },
        {
          title: 'Processors',
          body: 'Resend (sending emails), Supabase (database), Cloudflare (anti-bot protection and file storage), Vercel (website hosting).',
        },
        {
          title: 'Your rights',
          body: 'You can ask for access, correction or deletion of your data at any time, by email. Deletion is done within 30 days.',
        },
      ],
      contact: 'Contact:',
    },
    promo: {
      badge: 'New track',
      out: 'Out now',
      listen: 'Listen',
      later: 'Later',
    },
  },
} as const;

export type UI = (typeof ui)[Lang];
