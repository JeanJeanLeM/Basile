/**
 * Retourne le numéro du mois (1-12) depuis une date
 */
export function getMonthNumber(date: Date): number {
  return date.getMonth() + 1;
}

/**
 * Retourne le nom du mois en français
 */
export function getMonthName(monthNumber: number): string {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return months[monthNumber - 1] || '';
}

/**
 * Vérifie si un mois est dans une plage (gère le dépassement d'année)
 */
export function isMonthInRange(month: number, startMonth: number, endMonth: number): boolean {
  if (startMonth <= endMonth) {
    // Plage normale (ex: 3-6 = mars à juin)
    return month >= startMonth && month <= endMonth;
  } else {
    // Plage qui dépasse l'année (ex: 11-2 = novembre à février)
    return month >= startMonth || month <= endMonth;
  }
}

/**
 * Retourne tous les mois d'une plage
 */
export function getMonthsInRange(startMonth: number, endMonth: number): number[] {
  const months: number[] = [];
  
  if (startMonth <= endMonth) {
    for (let m = startMonth; m <= endMonth; m++) {
      months.push(m);
    }
  } else {
    // Plage qui dépasse l'année
    for (let m = startMonth; m <= 12; m++) {
      months.push(m);
    }
    for (let m = 1; m <= endMonth; m++) {
      months.push(m);
    }
  }
  
  return months;
}
