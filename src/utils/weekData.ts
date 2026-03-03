/**
 * Utilitaire pour analyser les données CSV et générer les métadonnées des semaines
 * pour l'affichage dans la liste déroulante avec badges et dégradé de vert
 */

export type GreenhouseType = 'serre' | 'plein_champ' | 'both';
export type SeasonType = 'early' | 'main' | 'late';

export interface WeekMetadata {
  weekNumber: number;
  greenhouse: GreenhouseType;
  seasonType: SeasonType;
  suitabilityScore: number; // 0-100 pour le dégradé de vert
  cropCount: number; // Nombre de cultures pour cette semaine
}

/**
 * Parse le CSV du plan de culture et génère les métadonnées pour chaque semaine
 */
export function parseWeekMetadataFromCSV(csvContent: string): Map<number, WeekMetadata> {
  const weekMap = new Map<number, WeekMetadata>();
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  // Ignorer la première ligne (en-têtes)
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const columns = line.split(',');
    if (columns.length < 7) continue;
    
    const weekNumber = parseInt(columns[3]?.trim() || '0');
    if (!weekNumber || weekNumber < 1 || weekNumber > 52) continue;
    
    const greenhouseStr = columns[6]?.trim().toLowerCase() || '';
    const typeStr = columns[4]?.trim().toLowerCase() || '';
    
    // Déterminer le type de greenhouse
    let greenhouse: GreenhouseType = 'both';
    if (greenhouseStr === 'true' || greenhouseStr === '1') {
      greenhouse = 'serre';
    } else if (greenhouseStr === 'false' || greenhouseStr === '0') {
      greenhouse = 'plein_champ';
    } else if (greenhouseStr === 'both' || greenhouseStr === '') {
      greenhouse = 'both';
    }
    
    // Déterminer le type de saison (gérer les variations de casse)
    let seasonType: SeasonType = 'main';
    const normalizedType = typeStr.toLowerCase();
    if (normalizedType === 'early' || normalizedType === 'précoce' || normalizedType === 'precoce') {
      seasonType = 'early';
    } else if (normalizedType === 'late' || normalizedType === 'tardif' || normalizedType === 'tardive') {
      seasonType = 'late';
    } else if (normalizedType === 'main' || normalizedType === 'saison' || normalizedType === '') {
      seasonType = 'main';
    }
    
    // Récupérer ou créer les métadonnées de la semaine
    let metadata = weekMap.get(weekNumber);
    if (!metadata) {
      metadata = {
        weekNumber,
        greenhouse: 'both',
        seasonType: 'main',
        suitabilityScore: 0,
        cropCount: 0,
      };
      weekMap.set(weekNumber, metadata);
    }
    
    // Mettre à jour le greenhouse (priorité: both > serre/plein_champ)
    if (greenhouse === 'both' || metadata.greenhouse === 'both') {
      metadata.greenhouse = 'both';
    } else if (metadata.greenhouse !== greenhouse) {
      metadata.greenhouse = 'both';
    }
    
    // Mettre à jour le seasonType (priorité: early/late > main)
    if (seasonType === 'early' || seasonType === 'late') {
      metadata.seasonType = seasonType;
    }
    
    // Incrémenter le compteur de cultures
    metadata.cropCount++;
  }
  
  // Calculer le score de suitability pour chaque semaine
  // Basé sur le nombre de cultures (plus il y a de cultures, plus c'est approprié)
  const cropCounts = Array.from(weekMap.values()).map(m => m.cropCount);
  const maxCropCount = cropCounts.length > 0 ? Math.max(...cropCounts) : 1;
  const minCropCount = cropCounts.length > 0 ? Math.min(...cropCounts.filter(c => c > 0)) : 1;
  
  weekMap.forEach((metadata) => {
    if (metadata.cropCount === 0) {
      metadata.suitabilityScore = 0;
    } else {
      // Score basé sur le nombre de cultures (0-100)
      // Normalisation pour avoir un meilleur dégradé
      const normalizedScore = ((metadata.cropCount - minCropCount) / (maxCropCount - minCropCount)) * 100;
      metadata.suitabilityScore = Math.min(100, Math.max(0, Math.round(normalizedScore)));
    }
  });
  
  return weekMap;
}

/**
 * Charge les métadonnées des semaines depuis les fichiers CSV
 * Si les données sont déjà en base, cette fonction peut être adaptée pour les charger depuis Firestore
 */
export async function loadWeekMetadata(): Promise<Map<number, WeekMetadata>> {
  try {
    // En production, ces données devraient être en base de données
    // Pour l'instant, on retourne une map vide et on génère les données à la volée
    // ou on les charge depuis un service
    
    // TODO: Charger depuis Firestore si les données y sont stockées
    return new Map();
  } catch (error) {
    console.error('Erreur lors du chargement des métadonnées des semaines:', error);
    return new Map();
  }
}

/**
 * Génère les métadonnées par défaut pour une semaine
 */
export function getDefaultWeekMetadata(weekNumber: number): WeekMetadata {
  return {
    weekNumber,
    greenhouse: 'both',
    seasonType: 'main',
    suitabilityScore: 0, // Pas de score par défaut (pas de dégradé)
    cropCount: 0,
  };
}

/**
 * Obtient la couleur de fond en dégradé de vert basée sur le score de suitability
 */
export function getSuitabilityColor(score: number): string {
  // Dégradé de vert : plus le score est élevé, plus c'est vert
  // Score 0: pas de couleur (blanc)
  // Score 1-25: vert très clair (green-50)
  // Score 26-50: vert clair (green-100)
  // Score 51-75: vert moyen (green-200)
  // Score 76-100: vert foncé (green-300)
  
  if (score === 0) {
    return '';
  } else if (score >= 76) {
    return 'bg-green-300';
  } else if (score >= 51) {
    return 'bg-green-200';
  } else if (score >= 26) {
    return 'bg-green-100';
  } else {
    return 'bg-green-50';
  }
}

/**
 * Obtient le texte du badge greenhouse
 */
export function getGreenhouseBadgeText(greenhouse: GreenhouseType): string {
  switch (greenhouse) {
    case 'serre':
      return 'Sous serres';
    case 'plein_champ':
      return 'Plein champ';
    case 'both':
      return 'Les deux';
    default:
      return 'Les deux';
  }
}

/**
 * Obtient le texte du badge season type
 */
export function getSeasonTypeBadgeText(seasonType: SeasonType): string {
  switch (seasonType) {
    case 'early':
      return 'Précoces';
    case 'late':
      return 'Tardif';
    case 'main':
      return 'Saison';
    default:
      return 'Saison';
  }
}
