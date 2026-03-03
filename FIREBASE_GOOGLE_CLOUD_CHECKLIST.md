# Checklist Firebase & Google Cloud — Mettre Basile en ligne

Ce guide liste **tout ce que vous devez faire côté Firebase / Google Cloud** pour que l’application soit en ligne et utilisable par le plus grand nombre.

---

## 1. Firebase Console — Projet et facturation

| Étape | Où | Action |
|-------|-----|--------|
| 1.1 | [Console Firebase](https://console.firebase.google.com/) → Votre projet `studio-5657773632-5d791` | Vérifier que le projet existe et que vous êtes propriétaire. |
| 1.2 | **Paramètres du projet** (engrenage) → **Utilisation et facturation** | Passer sur le **plan Blaze (facturation à l’usage)** si vous voulez dépasser les quotas gratuits (Hosting, Auth, Firestore). Pour débuter, le plan **Spark (gratuit)** suffit. |

---

## 2. Authentication — Activer les méthodes de connexion

| Étape | Où | Action |
|-------|-----|--------|
| 2.1 | **Authentication** → **Sign-in method** | Activer **Email/Password** (créer compte + connexion). |
| 2.2 | **Sign-in method** | Activer **Anonymous** (connexion anonyme pour essai sans compte). |
| 2.3 | **Sign-in method** | Activer **Google** et configurer (nom du projet public, email de support). |
| 2.4 | **Authentication** → **Settings** → **Authorized domains** | Ajouter le domaine de votre app en production (ex. `votre-app.web.app` ou votre domaine personnalisé). `localhost` est déjà autorisé en dev. |

Sans ces étapes, les connexions (email, anonyme, Google) échoueront en production.

---

## 3. Firestore — Règles, index et données

| Étape | Où | Action |
|-------|-----|--------|
| 3.1 | **Firestore Database** → **Règles** | Déployer vos règles depuis le projet : `firebase deploy --only firestore:rules` (fichier `firestore.rules`). |
| 3.2 | **Firestore Database** → **Index** | Déployer les index : `firebase deploy --only firestore:indexes` (fichier `firestore.indexes.json`). |
| 3.3 | Données initiales | Lancer une fois : `npm run init:firestore` puis `npm run seed:cultures` et `npm run seed:plans` si vous utilisez ces scripts (cultures système, etc.). |

Détails : voir `FIREBASE_SETUP.md`.

---

## 4. Hosting — Mettre l’app web en ligne

| Étape | Où | Action |
|-------|-----|--------|
| 4.1 | Projet local | Le fichier `firebase.json` contient déjà une section **hosting** qui sert le dossier `dist` (build Vite). |
| 4.2 | Build | En production, build avec les bonnes variables d’environnement : créer un `.env.production` (voir section 7) puis exécuter `npm run build`. |
| 4.3 | Déploiement | `firebase deploy --only hosting` (ou `firebase deploy` pour tout). L’app sera disponible sur `https://<projectId>.web.app` et `https://<projectId>.firebaseapp.com`. |
| 4.4 | **Hosting** → **Domaines** (Console) | Vérifier que le domaine par défaut est bien actif ; ajouter un domaine personnalisé si besoin. |

Les **rewrites** dans `firebase.json` envoient toutes les routes vers `index.html` (SPA), ce qui est correct pour une app React/Vite.

---

## 5. (Recommandé) Sécurité et abus — App Check

| Étape | Où | Action |
|-------|-----|--------|
| 5.1 | **App Check** (menu gauche Firebase) | Activer App Check pour votre application web (reCAPTCHA v3). |
| 5.2 | **Firestore** → **Règles** | Optionnel : exiger `request.auth.token.firebase.app_check == true` dans les règles pour renforcer la protection. |

Cela limite les abus et les appels non légitimes à Firestore/Auth.

---

## 6. (Optionnel) Domaine personnalisé et SEO

| Étape | Où | Action |
|-------|-----|--------|
| 6.1 | **Hosting** → **Domaines** | Ajouter un domaine personnalisé (ex. `basile.votredomaine.fr`) et suivre les instructions (enregistrement DNS). |
| 6.2 | **Authentication** → **Authorized domains** | Ajouter ce même domaine pour que l’Auth fonctionne dessus. |

Cela améliore la crédibilité et le référencement.

---

## 7. Variables d’environnement en production

Pour que l’app fonctionne une fois déployée :

- Les variables `VITE_*` doivent être définies **au moment du build** (pas au runtime).
- En local : utilisez `.env.production` ou les variables d’environnement de votre CI.
- **Ne pas** commiter de fichier contenant de vraies clés ; utiliser un `.env.production` ignoré par Git (comme `.env`).

Exemple `.env.production` (à créer, même valeurs que votre config Firebase actuelle, avec l’URL de prod) :

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=studio-5657773632-5d791.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=studio-5657773632-5d791
VITE_FIREBASE_STORAGE_BUCKET=studio-5657773632-5d791.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_APP_ENV=production
VITE_BASE_URL=https://studio-5657773632-5d791.web.app
```

Puis :

```bash
npm run build
firebase deploy --only hosting
```

---

## 8. Résumé des commandes utiles

```bash
# Connexion Firebase (une fois)
firebase login

# Déployer uniquement Firestore (règles + index)
firebase deploy --only firestore

# Build de l’app (avec .env.production chargé si présent)
npm run build

# Déployer l’app sur Hosting
firebase deploy --only hosting

# Tout déployer (Firestore + Hosting)
firebase deploy
```

---

## 9. Pour toucher le plus grand nombre

- **Auth** : Garder Anonymous + Email + Google activés pour réduire la friction (essai sans compte, puis compte simple ou Google).
- **Hosting** : Utiliser le domaine par défaut `.web.app` (gratuit, HTTPS) ; ajouter un domaine perso si vous avez une marque.
- **Quotas** : Rester en Spark pour commencer ; passer en Blaze si vous dépassez les limites (notamment Firestore / Auth).
- **Performance** : Le build Vite est déjà optimisé ; vous pouvez ajouter plus tard Firebase Performance Monitoring si besoin.
- **SEO** : Un domaine propre + métadonnées dans `index.html` (titre, description) aident le référencement.

Une fois les étapes 1 à 4 et 7 faites, l’application est en ligne et utilisable par le plus grand nombre ; 5 et 6 renforcent la sécurité et la visibilité.
