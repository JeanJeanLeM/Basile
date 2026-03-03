# Plan de Code - Application Basile

## 📋 Vue d'ensemble

Ce document détaille l'architecture complète de l'application Basile, une application React + TypeScript + Firebase pour la gestion de plans de cultures potagères.

## 🗂️ Structure de dossiers

```
src/
├── components/           # Composants réutilisables
│   ├── layout/          # Layout et navigation
│   │   ├── AppLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MobileSheet.tsx
│   │   └── UserMenu.tsx
│   ├── ui/              # Composants UI de base
│   │   ├── Modal.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Combobox.tsx
│   │   ├── Toast.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Accordion.tsx
│   │   └── Pagination.tsx
│   ├── planning/        # Composants spécifiques planning
│   │   ├── PlanForm.tsx
│   │   ├── PlansTable.tsx
│   │   ├── PlansCard.tsx
│   │   └── PlanActions.tsx
│   ├── crops/           # Composants spécifiques cultures
│   │   ├── CropCard.tsx
│   │   ├── CropForm.tsx
│   │   ├── CropGallery.tsx
│   │   └── MiniCalendar.tsx
│   ├── todo/            # Composants spécifiques calendrier
│   │   ├── WeekCalendar.tsx
│   │   ├── WeekCard.tsx
│   │   └── TaskEvent.tsx
│   └── basil/           # Composants spécifiques assistant
│       ├── Questionnaire.tsx
│       ├── QuestionStep.tsx
│       └── MonthlySuggestions.tsx
├── pages/               # Pages/écrans principaux
│   ├── PlanningPage.tsx
│   ├── SuggestionsPage.tsx
│   ├── TodoPage.tsx
│   ├── CropsPage.tsx
│   ├── BasilPage.tsx
│   ├── SharePage.tsx
│   ├── LoginPage.tsx
│   └── SignupPage.tsx
├── hooks/               # Hooks React personnalisés
│   ├── useAuth.ts ✅
│   ├── usePlans.ts ✅
│   ├── useCrops.ts ✅
│   ├── useUserPreferences.ts ✅
│   ├── useWeeks.ts ✅
│   ├── useSidebar.ts ✅
│   └── useToast.ts ✅
├── services/            # Services Firebase et logique métier
│   ├── firebase/
│   │   ├── config.ts ✅
│   │   ├── auth.ts ✅
│   │   └── firestore.ts ✅
│   ├── plansService.ts ✅
│   ├── cropsService.ts ✅
│   ├── preferencesService.ts ✅
│   └── suggestionsService.ts ✅
├── utils/               # Utilitaires
│   ├── dateUtils.ts ✅
│   ├── weekUtils.ts ✅
│   ├── validation.ts ✅
│   └── constants.ts ✅
├── types/               # Types TypeScript
│   ├── index.ts ✅
│   ├── crop.ts ✅
│   ├── plan.ts ✅
│   ├── user.ts ✅
│   └── week.ts ✅
├── styles/              # Styles globaux
│   ├── globals.css ✅
│   └── variables.css ✅
├── App.tsx ✅
├── main.tsx ✅
└── router.tsx ✅
```

✅ = Implémenté | ⏳ = À implémenter

## 📊 Types TypeScript principaux

### Crop (Culture)
```typescript
interface Crop {
  id: string;
  name: string;
  type: CropType; // 'Légume-fruit' | 'Légume-feuille' | etc.
  imageUrl?: string;
  emoji?: string;
  weeksBetweenSowingAndPlanting: number;
  weeksBetweenPlantingAndHarvest: number;
  sowingStartMonth: number; // 1-12
  sowingEndMonth: number;
  plantingStartMonth: number;
  plantingEndMonth: number;
  plantingMethod: 'serre' | 'plein_champ' | 'both';
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Plan (Plan de culture)
```typescript
interface Plan {
  id: string;
  cropId: string;
  cropName: string; // Denormalisé
  quantity: number;
  plantingWeek: number; // 1-52
  sowingWeek: number; // Calculé automatiquement
  notes?: string;
  sowingDone: boolean;
  plantingDone: boolean;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### UserPreferences (Préférences utilisateur)
```typescript
interface UserPreferences {
  userId: string;
  hasGreenhouse: boolean;
  directSowing: boolean;
  yearLongCrops: string[]; // IDs des cultures
  winterCultivation: 'yes' | 'little' | 'no';
  seasonExtension: 'early' | 'late' | 'both' | 'none';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 🔥 Structure Firestore

### Collection `crops`
```
crops/{cropId}
  - name: string
  - type: CropType
  - imageUrl?: string
  - emoji?: string
  - weeksBetweenSowingAndPlanting: number
  - weeksBetweenPlantingAndHarvest: number
  - sowingStartMonth: number (1-12)
  - sowingEndMonth: number (1-12)
  - plantingStartMonth: number (1-12)
  - plantingEndMonth: number (1-12)
  - plantingMethod: 'serre' | 'plein_champ' | 'both'
  - userId: string
  - createdAt: Timestamp
  - updatedAt: Timestamp
```

**Indexes requis:**
- `userId` (ascending), `name` (ascending)
- `userId` (ascending), `type` (ascending)

### Collection `plans`
```
plans/{planId}
  - cropId: string
  - cropName: string (denormalisé)
  - quantity: number
  - plantingWeek: number (1-52)
  - sowingWeek: number (1-52)
  - notes?: string
  - sowingDone: boolean
  - plantingDone: boolean
  - userId: string
  - createdAt: Timestamp
  - updatedAt: Timestamp
```

**Indexes requis:**
- `userId` (ascending), `plantingWeek` (ascending)
- `userId` (ascending), `sowingWeek` (ascending)
- `userId` (ascending), `cropName` (ascending)

### Collection `userPreferences`
```
userPreferences/{userId}
  - userId: string
  - hasGreenhouse: boolean
  - directSowing: boolean
  - yearLongCrops: string[]
  - winterCultivation: 'yes' | 'little' | 'no'
  - seasonExtension: 'early' | 'late' | 'both' | 'none'
  - createdAt: Timestamp
  - updatedAt: Timestamp
```

**Règles de sécurité Firestore:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /crops/{cropId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /plans/{planId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /userPreferences/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🧭 Routes et Navigation

### Configuration Router
```typescript
Routes:
  / → redirect vers /planning
  /planning → PlanningPage
  /planning/suggestions → SuggestionsPage
  /todo → TodoPage
  /crops → CropsPage
  /basil → BasilPage
  /share → SharePage
  /login → LoginPage
  /signup → SignupPage
```

### Navigation Sidebar
- Planification (`/planning`) - Icône: Calendar
- To-do (`/todo`) - Icône: Checklist
- Cultures (`/crops`) - Icône: Sprout
- Basil (`/basil`) - Icône: Bot
- Partager (`/share`) - Icône: Share

## 🧮 Calculs de semaines

### Fonctions principales (`src/utils/weekUtils.ts`)

1. **`getWeekNumber(date: Date): number`**
   - Calcule numéro semaine ISO (1-52) depuis une date

2. **`getWeekDates(weekNumber: number, year: number)`**
   - Retourne dates début/fin d'une semaine

3. **`calculateSowingWeek(plantingWeek: number, weeksBetween: number): number`**
   - Calcule semaine de semis depuis semaine de plantation
   - Gère dépassement année (semaine 52 → semaine 1)

4. **`getWeeksForYear(year: number): Week[]`**
   - Génère toutes les semaines de l'année
   - Groupées par mois pour accordions

5. **`isCurrentWeek(weekNumber: number): boolean`**
   - Vérifie si semaine courante

**Exemple:**
```typescript
// Si plantation semaine 20 et 6 semaines entre semis/plantation
const sowingWeek = calculateSowingWeek(20, 6); // = 14

// Si plantation semaine 3 et 8 semaines entre
const sowingWeek = calculateSowingWeek(3, 8); // = 47 (année précédente)
```

## 📱 UI Responsive

### Breakpoints
```css
--breakpoint-mobile: 768px;
--breakpoint-tablet: 1024px;
--breakpoint-desktop: 1280px;
```

### Stratégie Desktop vs Mobile

**Sidebar:**
- Desktop: Sidebar fixe gauche (expand/collapse)
- Mobile: Hamburger → MobileSheet slide-in

**Tables:**
- Desktop: Table HTML classique
- Mobile: Cards empilées verticalement

**Calendrier:**
- Desktop: Scroll horizontal par mois
- Mobile: Liste verticale avec accordions

**Grids:**
- Desktop: 3-4 colonnes
- Mobile: 1-2 colonnes

## 🚀 Ordre de développement

### Phase 1: Setup & Infrastructure ✅
- [x] Configuration projet (Vite + React + TypeScript)
- [x] Configuration Firebase
- [x] Setup router
- [x] Structure de dossiers
- [x] Types TypeScript
- [x] Utilitaires de base

### Phase 2: Layout & Navigation ✅
- [x] AppLayout
- [x] Sidebar desktop
- [x] MobileSheet mobile
- [x] UserMenu
- [x] Composants UI de base (Modal, Button, Toast)

### Phase 3: Gestion des Cultures ⏳
- [ ] Page Cultures
- [ ] CropGallery
- [ ] CropCard avec MiniCalendar
- [ ] CropForm modal
- [ ] Recherche, tri, pagination

### Phase 4: Planification ⏳
- [ ] Page Planification
- [ ] PlansTable (desktop) / PlansCard (mobile)
- [ ] PlanForm modal
- [ ] Calcul automatique semaines

### Phase 5: Calendrier To-do ⏳
- [ ] Page To-do
- [ ] WeekCalendar avec accordions
- [ ] WeekCard
- [ ] TaskEvent avec checkboxes

### Phase 6: Assistant Basil ⏳
- [ ] Page Basil
- [ ] Questionnaire multi-étapes
- [ ] Sauvegarde préférences
- [ ] Suggestions basées sur préférences

### Phase 7: Finalisation ⏳
- [ ] Page Partager
- [ ] Pages Login/Signup
- [ ] Gestion erreurs
- [ ] Loading states
- [ ] Optimisations performance
- [ ] Tests responsive
- [ ] Accessibilité

## 📝 Notes importantes

1. **Performance Firestore:**
   - Denormalisation `cropName` dans `Plan`
   - Indexes correctement configurés
   - Pagination pour grandes listes

2. **Calculs semaines:**
   - Gérer changement d'année (semaine 52 → 1)
   - Timezone: utiliser UTC pour cohérence

3. **Authentification anonyme:**
   - Prompts clairs pour conversion compte
   - Migration données si conversion

4. **Accessibilité:**
   - ARIA labels sur icônes
   - Navigation clavier
   - Contraste couleurs

5. **Internationalisation:**
   - Tout le texte en français
   - Format dates français (DD/MM/YYYY)
   - Noms mois en français
