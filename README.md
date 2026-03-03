# Basile v1 – Gestion de plans de cultures potagères

**Version figée (v1.0.0).** Ce dépôt est en mode maintenance : correctifs critiques uniquement, pas de nouvelles fonctionnalités. Pour la version orientée pro, voir le dépôt dédié [Basile Pro](https://github.com/JeanJeanLeM/basile-pro) (nouveau repo).

Application React + TypeScript avec **Supabase** (authentification + base de données) pour gérer des plans de cultures potagères avec une interface entièrement en français.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ et npm
- Projet [Supabase](https://supabase.com) avec le schéma initial appliqué

### Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer l'environnement :
   - Copier `.env.example` vers `.env` et `.env.development`
   - Remplir les variables Supabase (URL, anon key pour le frontend ; service_role + JWT secret pour le backend)

3. Appliquer le schéma SQL Supabase :
   - Exécuter le contenu de `supabase/migrations/001_initial_schema.sql` dans l’éditeur SQL du projet Supabase

4. Lancer le projet (un seul terminal) :
```bash
npm run dev:all
```
Cela démarre l’API Express (port 3001) et le frontend Vite (port 5173) en parallèle.

Ou en deux terminaux :
```bash
# Terminal 1 - API
npm run dev:server

# Terminal 2 - Frontend
npm run dev
```

## 📁 Structure du projet

```
src/
├── components/       # Composants React
│   ├── layout/      # Layout et navigation
│   ├── ui/          # Composants UI de base
│   ├── planning/    # Composants planning
│   ├── crops/       # Composants cultures
│   ├── todo/        # Calendrier
│   └── basil/       # Assistant Basil
├── pages/           # Pages principales
├── hooks/           # Hooks React (useAuth, useCrops, usePlans, etc.)
├── services/        # API client, stockage invité, migration
├── utils/           # Utilitaires
├── types/           # Types TypeScript
└── styles/          # Styles globaux

server/              # API Express (JWT Supabase + Supabase DB)
├── middleware/      # Vérification JWT Supabase
└── supabase.ts      # Client Supabase (service_role)
```

## 🔐 Authentification Supabase

- Dans le projet Supabase : **Authentication** > **Providers** pour activer Email/Password et Google
- Configurer les **URLs de redirection** (site URL, redirect URLs) dans Authentication > URL Configuration
- Le frontend utilise le client Supabase (anon key) pour `signInWithPassword`, `signUp`, `signInWithOAuth`

## 🗄️ Base de données Supabase

- Tables : `crops`, `plans`, `user_preferences`
- Le schéma et les index sont dans `supabase/migrations/001_initial_schema.sql`
- Les scripts de seed : `npm run seed:cultures`, `npm run seed:plans` (avec `data/` et variables d’environnement serveur)

## 🛠️ Technologies

- **React 18** avec TypeScript
- **Vite** pour le build
- **Supabase Auth** (email/mot de passe, Google)
- **Supabase** (PostgreSQL)
- **Express** (API REST, validation JWT)
- **React Router v6**, **Tailwind CSS**, **Lucide React**

## 📝 Fonctionnalités

- Mode invité (données en localStorage) avec migration à la création de compte
- Authentification Supabase (email/mot de passe, Google)
- Gestion des cultures et des plans (CRUD)
- Planification avec calcul automatique des semaines
- Calendrier annuel des tâches
- Assistant Basil avec suggestions personnalisées
- Interface responsive (desktop/mobile)

## 📄 Licence

MIT

---

*Basile v1 – Dernière release : v1.0.0. Maintenance minimale.*
