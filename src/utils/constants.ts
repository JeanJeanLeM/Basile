// Messages UI en français
export const UI_MESSAGES = {
  // Navigation
  NAV_PLANNING: 'Planification',
  NAV_TODO: 'To-do',
  NAV_CROPS: 'Cultures',
  NAV_BASIL: 'Basil',
  NAV_SHARE: 'Partager',
  
  // Auth
  AUTH_ANONYMOUS: 'Anonyme',
  AUTH_SIGN_IN: 'Se connecter',
  AUTH_SIGN_UP: 'S\'inscrire',
  AUTH_SIGN_OUT: 'Se déconnecter',
  AUTH_CREATE_ACCOUNT: 'Créer un compte',
  
  // Planning
  PLANNING_TITLE: 'Planification',
  PLANNING_DESCRIPTION: 'Gérez vos plans de cultures potagères',
  PLANNING_ADD_BUTTON: 'Planifier une culture',
  PLANNING_SUGGESTIONS_BUTTON: 'Suggestions',
  
  // Crops
  CROPS_TITLE: 'Cultures',
  CROPS_DESCRIPTION: 'Bibliothèque de toutes vos cultures',
  CROPS_ADD_BUTTON: 'Ajouter une culture',
  
  // Todo
  TODO_TITLE: 'Calendrier',
  TODO_DESCRIPTION: 'Vue annuelle de toutes vos tâches de jardinage',
  
  // Basil
  BASIL_TITLE: 'Basil',
  BASIL_DESCRIPTION: 'Votre assistant personnel pour créer un plan de culture personnalisé',
  
  // Share
  SHARE_TITLE: 'Partager',
  SHARE_FEEDBACK: 'Envoyer un retour',
  
  // Actions
  ACTION_EDIT: 'Modifier',
  ACTION_COPY: 'Copier',
  ACTION_DELETE: 'Supprimer',
  ACTION_ADD: 'Ajouter',
  ACTION_SAVE: 'Enregistrer',
  ACTION_CANCEL: 'Annuler',
  ACTION_CONFIRM: 'Confirmer',
  
  // Confirmations
  CONFIRM_DELETE_PLAN: 'Êtes-vous sûr de vouloir supprimer ce plan ?',
  CONFIRM_DELETE_CROP: 'Êtes-vous sûr de vouloir supprimer cette culture ?',
  
  // Errors
  ERROR_GENERIC: 'Une erreur est survenue',
  ERROR_AUTH: 'Erreur d\'authentification',
  ERROR_LOADING: 'Erreur lors du chargement',
  ERROR_SAVING: 'Erreur lors de l\'enregistrement',
  
  // Success
  SUCCESS_SAVED: 'Enregistré avec succès',
  SUCCESS_DELETED: 'Supprimé avec succès',
};

// Types de cultures
export const CROP_TYPES: Array<{ value: string; label: string }> = [
  { value: 'Légume-fruit', label: 'Légume-fruit' },
  { value: 'Légume-feuille', label: 'Légume-feuille' },
  { value: 'Légume-racine', label: 'Légume-racine' },
  { value: 'Légume-graine', label: 'Légume-graine' },
  { value: 'Aromatique', label: 'Aromatique' },
  { value: 'Fleur comestible', label: 'Fleur comestible' },
];

// Méthodes de plantation
export const PLANTING_METHODS: Array<{ value: string; label: string }> = [
  { value: 'serre', label: 'En serre uniquement' },
  { value: 'plein_champ', label: 'Plein champ uniquement' },
  { value: 'both', label: 'Plein champ et/ou sous serre' },
];

// Options de culture hivernale
export const WINTER_CULTIVATION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'yes', label: 'Oui' },
  { value: 'little', label: 'Un peu' },
  { value: 'no', label: 'Non' },
];

// Options d'extension de saison
export const SEASON_EXTENSION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'early', label: 'Planter tôt' },
  { value: 'late', label: 'Planter tard' },
  { value: 'both', label: 'Les deux' },
  { value: 'none', label: 'Aucun' },
];

// Noms des mois en français
export const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// Breakpoints responsive
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
};
