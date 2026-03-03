# Backend API (Express + Supabase)

Ce serveur expose une API REST protégée par JWT Supabase (access_token) et utilise Supabase (PostgreSQL) pour la persistance.

## Configuration

### 1. Variables d'environnement

Créer un fichier `.env` à la racine du projet avec :

```
# Supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
# JWT Secret (Project Settings > API > JWT Secret) - pour vérifier les access_token
SUPABASE_JWT_SECRET=<jwt-secret>
```

- **SUPABASE_JWT_SECRET** : secret utilisé par Supabase pour signer les JWT (dashboard Supabase > Project Settings > API > JWT Secret).
- **SUPABASE_SERVICE_ROLE_KEY** : clé à privilèges élevés (ne pas exposer côté client).

### 2. Démarrer le serveur

```bash
npm run dev:server
# ou
npm run server
```

Le serveur écoute sur `http://localhost:3001` par défaut (`PORT`).

## Endpoints

Les routes marquées (auth) exigent l'en-tête `Authorization: Bearer <access_token>` (session Supabase : `session.access_token`).

- **GET /health** – Santé du serveur
- **GET /api/crops** (auth) – Liste des cultures
- **GET /api/crops/:id** (auth) – Détail d’une culture
- **POST /api/crops** (auth) – Créer une culture
- **PUT /api/crops/:id** (auth) – Modifier une culture
- **DELETE /api/crops/:id** (auth) – Supprimer une culture
- **GET /api/plans** (auth) – Liste des plans
- **GET /api/plans/system** – Plans système (public)
- **POST /api/plans** (auth) – Créer un plan
- **PUT /api/plans/:id** (auth) – Modifier un plan
- **DELETE /api/plans/:id** (auth) – Supprimer un plan
- **DELETE /api/plans** (auth) – Supprimer tous les plans
- **GET /api/preferences** (auth) – Préférences
- **PUT /api/preferences** (auth) – Créer / mettre à jour les préférences
- **POST /api/migrate-guest-data** (auth) – Migrer les données invité
- **POST /api/system-crops/replace** (auth) – Remplacer les cultures système

## Scripts de seed

- `npm run seed:cultures` – Cultures système depuis `data/Basile - cultures.csv`
- `npm run seed:plans` – Plan système depuis `data/Basile - Plan de culture.csv`

Variables requises : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
