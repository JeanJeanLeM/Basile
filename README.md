# Basile - Gestion de plans de cultures potagères

Application React + TypeScript + Firebase pour gérer des plans de cultures potagères avec une interface entièrement en français.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ et npm
- Compte Firebase avec projet configuré

### Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer Firebase :
   - Copier `envexample` vers `.env`
   - Remplir les variables d'environnement Firebase

3. Lancer le serveur de développement :
```bash
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
│   ├── todo/        # Composants calendrier
│   └── basil/       # Composants assistant
├── pages/           # Pages/écrans principaux
├── hooks/           # Hooks React personnalisés
├── services/        # Services Firebase et logique métier
├── utils/           # Utilitaires
├── types/           # Types TypeScript
└── styles/          # Styles globaux
```

## 🔥 Configuration Firebase

### Collections Firestore

- `crops` : Cultures disponibles
- `plans` : Plans de cultures de l'utilisateur
- `userPreferences` : Préférences utilisateur pour les suggestions

### Indexes Firestore requis

Les index composites suivants sont nécessaires pour les requêtes :

1. **Collection `plans`** : `userId` (ascending) + `plantingWeek` (ascending)
2. **Collection `crops`** : `userId` (ascending) + `name` (ascending)

#### Création des index

**Option 1 - Via les liens d'erreur (recommandé)** :
Lorsque vous voyez une erreur dans la console indiquant qu'un index est requis, cliquez sur le lien fourni. Firebase créera automatiquement l'index.

**Option 2 - Via Firebase CLI** :
```bash
# Installer Firebase CLI si ce n'est pas déjà fait
npm install -g firebase-tools

# Se connecter à Firebase
firebase login

# Initialiser Firebase dans le projet (si pas déjà fait)
firebase init firestore

# Déployer les index
firebase deploy --only firestore:indexes
```

Le fichier `firestore.indexes.json` contient déjà la configuration des index nécessaires.

### Règles de sécurité

Toutes les collections doivent avoir des règles permettant la lecture/écriture uniquement si `userId == request.auth.uid`.

## 🛠️ Technologies

- **React 18** avec TypeScript
- **Vite** pour le build
- **Firebase** (Auth + Firestore)
- **React Router v6** pour la navigation
- **Tailwind CSS** pour le styling
- **Lucide React** pour les icônes

## 📝 Fonctionnalités

- ✅ Authentification anonyme automatique
- ✅ Conversion compte anonyme → permanent
- ✅ Gestion des cultures (CRUD)
- ✅ Planification avec calcul automatique des semaines
- ✅ Calendrier annuel des tâches
- ✅ Assistant Basil avec suggestions personnalisées
- ✅ Interface responsive (desktop/mobile)

## 🎯 Prochaines étapes

Voir le plan de développement dans `.cursor/plans/` pour l'ordre d'implémentation des features.

## 📄 Licence

MIT
