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
  - Utiliser un palier remet la carte à zéro. Produits à l'unité uniquement ; produit offert ≤ 49 TND.
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
2. _Storage_ → _Neon Postgres_ (Marketplace) → lier au projet. `DATABASE_URL` est ajouté automatiquement, avec une base de prévisualisation par pull request.
3. _Settings → Environment Variables_ :
   - `SESSION_SECRET` : générer avec `openssl rand -base64 48`.
   - `APP_URL` : l'URL de production (ex. `https://fidelite.kinzoils.com`).
4. Déployer. Les migrations s'exécutent automatiquement avant chaque build (`vercel.json`).
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

- Les PIN sont hachés (bcrypt). Après 5 erreurs, le compte est verrouillé 10 minutes.
- Seule l'équipe connectée peut tamponner, et la base de données refuse un 2e tampon le même jour.
- Le lien de carte contient un code secret aléatoire de 128 bits. Il n'est jamais transmis à d'autres sites (`Referrer-Policy: no-referrer`).
- S'inscrire avec un numéro déjà utilisé ne donne **jamais** accès à la carte existante.
