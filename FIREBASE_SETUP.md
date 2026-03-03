# Configuration Firebase - Guide de déploiement

## 1. Déployer les règles de sécurité Firestore

Les règles de sécurité sont définies dans `firestore.rules`. Pour les déployer :

### Option A: Via Firebase CLI (recommandé)

1. Installer Firebase CLI si ce n'est pas déjà fait :
   ```bash
   npm install -g firebase-tools
   ```

2. Se connecter à Firebase :
   ```bash
   firebase login
   ```

3. Initialiser Firebase dans le projet (si pas déjà fait) :
   ```bash
   firebase init firestore
   ```
   - Sélectionnez votre projet Firebase
   - Utilisez `firestore.rules` comme fichier de règles
   - Utilisez `firestore.indexes.json` pour les index (créer un fichier vide si nécessaire)

4. Déployer les règles :
   ```bash
   firebase deploy --only firestore:rules
   ```

### Option B: Via Firebase Console

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet: `studio-5657773632-5d791`
3. Allez dans **Firestore Database** → **Règles**
4. Copiez le contenu de `firestore.rules`
5. Collez-le dans l'éditeur
6. Cliquez sur **Publier**

## 2. Déployer les index Firestore

Les index sont nécessaires pour les requêtes complexes. Déployez-les :

### Option A: Via Firebase CLI

```bash
firebase deploy --only firestore:indexes
```

### Option B: Via Firebase Console

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet: `studio-5657773632-5d791`
3. Allez dans **Firestore Database** → **Index**
4. Cliquez sur le lien dans l'erreur de la console du navigateur (Firestore vous donnera un lien direct)
5. Ou créez manuellement les index suivants :
   - Collection: `crops`, Champs: `userId` (Ascending), `name` (Ascending)
   - Collection: `plans`, Champs: `userId` (Ascending), `plantingWeek` (Ascending)
   - Collection: `plans`, Champs: `userId` (Ascending), `sowingWeek` (Ascending)

## 3. Initialiser les données Firestore

Exécutez le script d'initialisation pour créer les collections et charger les données des CSV :

```bash
npm run init:firestore
```

Ce script va :
- Parser les fichiers CSV (`Plan de culture - Légumes.csv`)
- Créer la collection `crops` avec les cultures de base
- Les cultures seront créées avec `userId: 'system'` pour être accessibles à tous

## 4. Vérifier que tout fonctionne

1. Vérifiez dans Firebase Console que les collections sont créées
2. Testez l'application - les erreurs de permissions devraient disparaître
3. Les utilisateurs peuvent maintenant créer leurs propres cultures et plans

## Structure des collections

### `crops`
- Contient les cultures disponibles
- Chaque culture a un `userId` (propriétaire)
- Les cultures système ont `userId: 'system'`

### `plans`
- Contient les plans de culture des utilisateurs
- Chaque plan est lié à une culture (`cropId`)
- Chaque plan a un `userId` (propriétaire)

### `userPreferences`
- Contient les préférences utilisateur
- Chaque préférence a un `userId` (propriétaire)

## Notes importantes

- Les règles Firestore permettent uniquement aux utilisateurs authentifiés d'accéder à leurs propres données
- Les utilisateurs anonymes peuvent aussi créer et gérer leurs données
- Pour partager des cultures entre utilisateurs, vous devrez modifier les règles ou créer une logique de partage
