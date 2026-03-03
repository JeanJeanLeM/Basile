/**
 * Valide un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valide un mot de passe (minimum 6 caractères)
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Valide un numéro de semaine (1-52)
 */
export function isValidWeek(week: number): boolean {
  return Number.isInteger(week) && week >= 1 && week <= 52;
}

/**
 * Valide un numéro de mois (1-12)
 */
export function isValidMonth(month: number): boolean {
  return Number.isInteger(month) && month >= 1 && month <= 12;
}

/**
 * Messages d'erreur de validation
 */
export const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: 'L\'email est requis',
  EMAIL_INVALID: 'L\'email n\'est pas valide',
  PASSWORD_REQUIRED: 'Le mot de passe est requis',
  PASSWORD_TOO_SHORT: 'Le mot de passe doit contenir au moins 6 caractères',
  PASSWORD_MISMATCH: 'Les mots de passe ne correspondent pas',
  NAME_REQUIRED: 'Le nom est requis',
  WEEK_INVALID: 'Le numéro de semaine doit être entre 1 et 52',
  MONTH_INVALID: 'Le numéro de mois doit être entre 1 et 12',
  QUANTITY_REQUIRED: 'La quantité est requise',
  QUANTITY_POSITIVE: 'La quantité doit être positive',
};
