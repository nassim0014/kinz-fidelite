# KINZ Fidélité — « Le Code KINZ »

Carte de fidélité digitale de la boutique KINZ (Tunis). Le client garde sa carte sur son
téléphone, l'équipe la tamponne en scannant son QR code, et un jeu de niveaux (1 → 50)
fondé sur les nombres premiers et la suite de Fibonacci récompense les plus fidèles.

Spécification complète : [`docs/superpowers/specs/2026-09-30-kinz-fidelite-design.md`](docs/superpowers/specs/2026-09-30-kinz-fidelite-design.md)

## Les règles en bref

| Ticket    | Tampons |
| --------- | ------- |
| ≥ 40 TND  | 1       |
| ≥ 120 TND | 2       |
| ≥ 300 TND | 3       |

- **Un seul passage tamponné par client et par jour.**
- **Paliers de la carte (nombres premiers)** :
  - 3 → −20 % sur 1 produit
  - 5 → −50 % sur 1 produit
  - 7 → −50 % sur 2 produits
  - 11 → 1 produit offert + 11 pépins
  - 13 → 1 produit offert + −50 % sur un 2e + 13 pépins
  - Utiliser un palier remet la carte à zéro (à 1 dès le niveau 17, à 2 dès le niveau 23). Produits à l'unité uniquement ; produit offert ≤ 49 TND.
- **Pépins** : 1 pépin par tranche de 40 TND. Passer du niveau n au niveau n+1 coûte n pépins (niveau 50 = 1 225 pépins).
- **Multiplicateurs (Fibonacci)** : ×2 dès le niveau 13, ×3 dès le 21, ×5 dès le 34.
- **Avantages** : aux niveaux premiers (2, 3, 5, 7, 11, 13, 17…), avec des niveaux d'or (premiers _et_ Fibonacci : 2, 3, 5, 13). Au niveau 34, les nouveautés sont livrées gratuitement en avant-première. Au niveau 50 : Légende — Le Figuier d'Or.

## Les trois espaces

| Adresse      | Pour qui                              | Usage                                                       |
| ------------ | ------------------------------------- | ----------------------------------------------------------- |
| `/rejoindre` | Clients (QR de l'affiche au comptoir) | Créer sa carte                                              |
| `/c/<code>`  | Client                                | Sa carte : QR, tampons, niveau, avantages                   |
| `/staff`     | Équipe (nom + PIN à 6 chiffres)       | Scanner, tamponner, appliquer les récompenses               |
| `/admin`     | Propriétaires                         | Équipe, journal, Figuiers à livrer, exports CSV, affiche QR |

## Installation au magasin (Wi-Fi, sans Internet public)

Pour faire tourner l'application sur le PC Windows du magasin, accessible aux téléphones du
Wi-Fi, suivez le guide [`docs/magasin.md`](docs/magasin.md). Il utilise Docker Desktop et une
seule commande : `store\demarrer.ps1`.

## Développement local

Prérequis : Node 20+, Docker.

```bash
npm ci
cp .env.example .env.local              # puis mettre un SESSION_SECRET aléatoire (32+ caractères)
npm run db:up                           # Postgres local sur le port 5433
npm run db:migrate
npm run db:seed-owner -- "Prénom" 123456
npm run dev                             # http://localhost:3000
```

Tests : `npm run test:unit`, `npm run test:integration`, `npm run test:e2e`.
La CI GitHub lance tout à chaque pull request.

## Déploiement (Vercel + Neon)

1. Vercel → _Add New Project_ → importer `nassim0014/kinz-fidelite`.
2. _Storage_ → _Neon Postgres_ (Marketplace) → lier au projet. Utiliser l'URL **poolée** de Neon (hôte `-pooler`). Les prévisualisations utilisent leur propre base (branches Neon créées par l'intégration).
3. _Settings → Environment Variables_ : définir chaque variable par environnement, sans partager de secret entre Production et Preview.
   - **Production uniquement** : `DATABASE_URL` (base de production), `SESSION_SECRET` (générer avec `openssl rand -base64 48`), `APP_URL` (l'URL de production, ex. `https://fidelite.kinzoils.com`).
   - **Preview** : sa propre `DATABASE_URL` (base séparée, jamais celle de production), son propre `SESSION_SECRET` et son propre `APP_URL`.
   - `ALLOW_PREVIEW_MIGRATIONS=1` : à définir **uniquement dans l'environnement Preview**, et seulement une fois confirmé que la base de prévisualisation est bien séparée de la production.
4. Déployer. Les migrations (`vercel.json` → `npm run db:migrate`) s'exécutent avant chaque build, mais seulement en Production (ou en Preview si `ALLOW_PREVIEW_MIGRATIONS=1`) ; sinon elles sont ignorées avec un message dans les logs. Un verrou PostgreSQL évite que deux builds simultanés migrent en même temps. Comme les migrations passent avant que la nouvelle version soit en ligne, elles doivent rester rétrocompatibles (_expand/contract_) : ajouter avant de retirer, jamais de suppression ou renommage brutal.
5. Créer le premier compte propriétaire sur la base de production :
   ```bash
   vercel env pull .env.production.local --environment=production
   ENV_FILE=.env.production.local npm run db:seed-owner -- "Prénom" 123456
   ```
6. Imprimer l'affiche QR : `/admin/affiche`.

**Sauvegardes** : Neon conserve un historique qui permet de restaurer la base à un instant
passé (_point-in-time restore_, durée selon le plan). Exporter aussi régulièrement les CSV
depuis `/admin`.

## Sécurité

- Les PIN sont hachés (bcrypt). Après 5 erreurs **depuis un même appareil**, cet appareil est verrouillé 10 minutes pour ce compte : un inconnu ne peut donc pas bloquer le téléphone de l'équipe. L'appareil est reconnu par son adresse IP, fournie par Vercel, ou par le proxy du magasin si `TRUST_PROXY=1`.
- Seule l'équipe connectée peut tamponner, et la base de données refuse un 2e tampon le même jour.
- Le lien de carte contient un code secret aléatoire de 128 bits. Il n'est jamais transmis à d'autres sites (`Referrer-Policy: no-referrer`).
- S'inscrire avec un numéro déjà utilisé ne donne **jamais** accès à la carte existante.
