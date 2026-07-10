# LALZIN — Site officiel

DJ & producteur **funky house / disco funk / bass house**. Site premium avec
boule disco 3D animée **habillée du logo** (Three.js / react-three-fiber),
animations groovy (Framer Motion), bilingue **FR / EN**, page **Linktree** et
**panel d'admin** intégré.

## Stack
- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** (palette disco custom)
- **react-three-fiber / drei / three** — boule disco du hero (logo mappé)
- **Framer Motion** — reveals scroll-triggered & micro-interactions

## Pages
| Route | Rôle |
|---|---|
| `/` | Site principal (8 sections) |
| `/links` | Page **Linktree** (avatar, liens plateformes, booking) |
| `/admin` | **Panel d'administration** de tout le contenu |

## Démarrer
```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build production
```

## ✏️ Gérer le contenu

### Option 1 — Panel admin (`/admin`)
Édite **tout** depuis l'interface : textes (FR + EN), liens réseaux, sorties,
clip, dates, produits boutique, SEO. Les modifications sont **enregistrées dans
le navigateur** (localStorage) et le site les affiche aussitôt.
- **Exporter JSON** : sauvegarde le contenu dans un fichier.
- **Importer** : recharge un fichier JSON exporté.
- **Réinitialiser** : revient aux valeurs par défaut.

> Stockage local pour l'instant (aucun backend) — l'architecture est prête à
> être branchée sur Supabase plus tard : il suffit de remplacer la
> lecture/écriture du `ContentProvider`.

### Option 2 — Code (`lib/content.ts`)
Valeurs par défaut du site. Les champs `L` ont une version `fr` et `en`.
Liens marqués `TODO` à compléter (réseaux, écoute Hypeddit, `video.youtubeId`).
Les libellés d'interface (titres de sections, boutons) sont dans `lib/i18n.ts`.

## 🌐 Langue
Sélecteur **FR / EN** dans la navbar (et sur /links). Le choix est mémorisé.

## 🖼️ Médias
- `public/images/artist/` — photos (portrait, live, casual)
- `public/images/brand/` — logo LALZIN (aussi **mappé sur la boule 3D**)
- `public/images/covers/` — déposer `better-with-you.png` & autres covers.
  Sans image, un visuel disco est **généré automatiquement**.

## Performance & accessibilité
- Boule 3D allégée sur mobile (moins de facettes, DPR réduit)
- Respect de `prefers-reduced-motion`, responsive mobile-first
