# 🚀 Déploiement — GitHub + Vercel + Supabase

## 1. Mot de passe admin
```bash
npm run set-admin
```
Choisis ton mot de passe → écrit `.env.local` et affiche `ADMIN_USERNAME`,
`ADMIN_PASSWORD_HASH`, `AUTH_SECRET` (le mot de passe en clair n'est jamais stocké).

## 2. Supabase (persistance / CMS live)
Sans Supabase, le site marche mais l'admin n'est qu'un éditeur local. Avec
Supabase, **tu modifies dans /admin → c'est live pour tous les visiteurs**.

1. Crée un projet sur https://supabase.com (gratuit).
2. **SQL Editor → New query** → colle tout le contenu de
   [`supabase/setup.sql`](supabase/setup.sql) → **Run**.
   (Crée la table `site_content`, la verrouille, et insère le contenu actuel.)
3. **Settings → API** → récupère :
   - `SUPABASE_URL` = *Project URL*
   - `SUPABASE_SERVICE_ROLE_KEY` = clé **service_role** (⚠️ secrète)

## 3. Pousser sur GitHub
Déjà fait (`git push`). Pour la suite : `git add -A && git commit -m "…" && git push`.

## 4. Vercel — variables d'environnement
Vercel → **Settings → Environment Variables** → ajoute les **5** clés
(Production + Preview + Development) :

| Name | Source |
|---|---|
| `ADMIN_USERNAME` | `npm run set-admin` |
| `ADMIN_PASSWORD_HASH` | `npm run set-admin` |
| `AUTH_SECRET` | `npm run set-admin` |
| `SUPABASE_URL` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (service_role) |

⚠️ **Redéploie** après avoir ajouté/modifié des variables
(Deployments → ⋯ → Redeploy) — sinon elles ne s'appliquent pas.

## 5. Domaine
Quand `lalzin.com` est branché (Vercel → Settings → Domains), mets à jour
`site.url` (via /admin → onglet SEO, ou `lib/content.ts`). Le SEO en dépend.

## Sécurité
- Aucun secret dans le repo (tout en variables d'env, `.env.local` gitignoré).
- Mot de passe en hash PBKDF2 salé ; session cookie httpOnly signé (HMAC).
- Clé Supabase **service_role** utilisée uniquement côté serveur (jamais exposée).
- `/admin` protégé par middleware + `noindex`. Fail-closed si non configuré.

## Comment ça marche
- Le site **lit** le contenu depuis Supabase à chaque requête (repli sur les
  valeurs par défaut de `lib/content.ts` si Supabase indisponible).
- `/admin` (login requis) **écrit** dans Supabase via `/api/admin/content`,
  puis rafraîchit le site immédiatement (revalidation).
