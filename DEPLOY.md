# 🚀 Déploiement — GitHub + Vercel

## 1. Choisis TON mot de passe admin (important)
Le mot de passe n'est jamais stocké en clair. Génère le hash avec :

```bash
npm run set-admin
```

Il te demande un mot de passe (min. 8 caractères), écrit `.env.local` et affiche
3 valeurs (`ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `AUTH_SECRET`) à copier dans Vercel.
👉 Choisis un mot de passe que **toi seul** connais.

## 2. Pousser sur GitHub
Crée un dépôt **vide** sur https://github.com/new (ex. `lalzin-site`, privé ou public), puis :

```bash
git remote add origin https://github.com/TON-COMPTE/lalzin-site.git
git push -u origin main
```

> `.env.local` n'est **jamais** poussé (il est dans `.gitignore`). Seuls tes secrets
> restent sur ta machine et dans Vercel.

## 3. Importer sur Vercel
1. https://vercel.com/new → **Import** ton dépôt GitHub.
2. Framework détecté automatiquement : **Next.js**. Laisse les réglages par défaut.
3. Avant de déployer, ouvre **Environment Variables** et ajoute les 3 clés
   affichées par `npm run set-admin` (Production + Preview) :
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD_HASH`
   - `AUTH_SECRET`
4. **Deploy**.

## 4. Domaine
Une fois le domaine branché (ex. `lalzin.com`), mets à jour `site.url` dans
[`lib/content.ts`](lib/content.ts) — tout le SEO (canonical, OG, sitemap, JSON-LD)
en dépend. Puis Vercel → Settings → **Domains** pour connecter `lalzin.com`.

## Sécurité en résumé
- Aucun secret dans le code / le dépôt.
- Mot de passe stocké uniquement en **hash PBKDF2 salé** (irréversible).
- Session = cookie **httpOnly** signé (HMAC), `Secure` en production.
- `/admin` protégé par middleware (redirection login) + `noindex`.
- Refus par défaut si les variables d'environnement manquent (fail-closed).

## Mettre à jour le site plus tard
```bash
git add -A && git commit -m "maj contenu" && git push
```
Vercel redéploie automatiquement à chaque push sur `main`.
