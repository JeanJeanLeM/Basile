import { Crop, CropType, PlantingMethod } from '../types';
import { createCrop } from '../services/cropsService';
import { replaceSystemCrops } from '../services/api';
import { getMonthFromWeek, getWeekNumber, getWeeksForMonthRange, normalizeWeeks } from './weekUtils';

/**
 * Parse le CSV des légumes et retourne un tableau de cultures
 * Utilise aussi le plan de culture pour enrichir les données
 */
export function parseLegumesCSV(
  csvContent: string,
  planCsvContent?: string
): Partial<Crop>[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const crops: Partial<Crop>[] = [];
  
  // Parser le plan de culture pour enrichir les données
  const planData = planCsvContent ? parsePlanCSV(planCsvContent) : [];
  const cropPlanMap = new Map<string, any[]>();
  
  planData.forEach((plan) => {
    const cropName = plan.culture.toLowerCase();
    if (!cropPlanMap.has(cropName)) {
      cropPlanMap.set(cropName, []);
    }
    cropPlanMap.get(cropName)!.push(plan);
  });
  
  // Ignorer la première ligne (en-têtes)
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const columns = line.split(',');
    if (columns.length < 5) continue;
    
    const name = columns[0]?.trim();
    const weeksInNursery = parseInt(columns[1]?.trim() || '0');
    const weeksInCulture = parseInt(columns[2]?.trim() || '0');
    
    if (!name) continue;
    
    // Déterminer le type de culture
    const cropType = inferCropType(name);
    
    // Récupérer les données du plan pour cette culture
    const cropPlans = cropPlanMap.get(name.toLowerCase()) || [];
    
  // Calculer les semaines de semis et plantation depuis le plan
  const weeks = calculateWeeksFromPlan(cropPlans);
  const currentYear = new Date().getFullYear();
  const fallbackMonths = calculateMonthsFromPlan(cropPlans);
  const sowingWeeks =
    weeks.sowingWeeks.length > 0
      ? weeks.sowingWeeks
      : getWeeksForMonthRange(
          fallbackMonths.sowingStart || 2,
          fallbackMonths.sowingEnd || 6,
          currentYear
        );
  const plantingWeeks =
    weeks.plantingWeeks.length > 0
      ? weeks.plantingWeeks
      : getWeeksForMonthRange(
          fallbackMonths.plantingStart || 4,
          fallbackMonths.plantingEnd || 8,
          currentYear
        );
    
    // Déterminer la méthode de plantation depuis le plan
    const plantingMethod = inferPlantingMethod(cropPlans);
    
    crops.push({
      name: capitalizeFirst(name),
      type: cropType,
      weeksBetweenSowingAndPlanting: weeksInNursery || 0,
      weeksBetweenPlantingAndHarvest: weeksInCulture || 0,
      sowingWeeks,
      plantingWeeks,
      plantingMethod,
      emoji: getEmojiForCrop(name),
    });
  }
  
  return crops;
}

/**
 * Calcule les mois de semis et plantation depuis le plan
 * Utilise les dates réelles du CSV pour plus de précision
 */
function calculateMonthsFromPlan(plans: any[]): {
  sowingStart: number;
  sowingEnd: number;
  plantingStart: number;
  plantingEnd: number;
} {
  const sowingMonths: number[] = [];
  const plantingMonths: number[] = [];
  
  plans.forEach((plan) => {
    let month: number | null = null;
    
    // Essayer d'extraire le mois depuis la date (format DD/MM/YYYY)
    if (plan.date) {
      const dateParts = plan.date.split('/');
      if (dateParts.length >= 2) {
        month = parseInt(dateParts[1]);
      }
    }
    
    // Sinon, utiliser le numéro de semaine pour estimer
    if (!month && plan.weekNumber) {
      // Approximation : semaine 1-4 = janvier, 5-8 = février, etc.
      month = Math.ceil((plan.weekNumber / 4.33)) || 1;
      if (month > 12) month = 12;
    }
    
    if (!month) return;
    
    if (plan.action?.toLowerCase().includes('semis')) {
      sowingMonths.push(month);
    } else if (plan.action?.toLowerCase().includes('plantation')) {
      plantingMonths.push(month);
    }
  });
  
  // Trier et dédupliquer
  const uniqueSowingMonths = [...new Set(sowingMonths)].sort((a, b) => a - b);
  const uniquePlantingMonths = [...new Set(plantingMonths)].sort((a, b) => a - b);
  
  return {
    sowingStart: uniqueSowingMonths[0] || 2,
    sowingEnd: uniqueSowingMonths[uniqueSowingMonths.length - 1] || 6,
    plantingStart: uniquePlantingMonths[0] || 4,
    plantingEnd: uniquePlantingMonths[uniquePlantingMonths.length - 1] || 8,
  };
}

/**
 * Calcule les semaines de semis et plantation depuis le plan
 */
function calculateWeeksFromPlan(plans: any[]): {
  sowingWeeks: number[];
  plantingWeeks: number[];
} {
  const sowingWeeks: number[] = [];
  const plantingWeeks: number[] = [];
  const currentYear = new Date().getFullYear();

  plans.forEach((plan) => {
    let weekNumber: number | null = null;
    let month: number | null = null;

    if (plan.weekNumber) {
      weekNumber = parseInt(plan.weekNumber, 10);
      if (!Number.isNaN(weekNumber)) {
        month = getMonthFromWeek(weekNumber, currentYear);
      }
    }

    if (!weekNumber && plan.date) {
      const dateParts = plan.date.split('/');
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0], 10);
        const monthValue = parseInt(dateParts[1], 10);
        const year = parseInt(dateParts[2], 10);
        if (!Number.isNaN(day) && !Number.isNaN(monthValue) && !Number.isNaN(year)) {
          const date = new Date(year, monthValue - 1, day);
          weekNumber = getWeekNumber(date);
          month = monthValue;
        }
      }
    }

    if (!weekNumber && month) {
      weekNumber = getWeeksForMonthRange(month, month, currentYear)[0] || null;
    }

    if (!weekNumber) return;

    if (plan.action?.toLowerCase().includes('semis')) {
      sowingWeeks.push(weekNumber);
    } else if (plan.action?.toLowerCase().includes('plantation')) {
      plantingWeeks.push(weekNumber);
    }
  });

  return {
    sowingWeeks: normalizeWeeks(sowingWeeks),
    plantingWeeks: normalizeWeeks(plantingWeeks),
  };
}

/**
 * Infère la méthode de plantation depuis le plan
 */
function inferPlantingMethod(plans: any[]): PlantingMethod {
  if (plans.length === 0) return 'both';
  
  const greenhouseValues = plans
    .map((p) => p.greenhouse?.toLowerCase())
    .filter(Boolean);
  
  if (greenhouseValues.every((v) => v === 'true')) {
    return 'serre';
  }
  if (greenhouseValues.every((v) => v === 'false')) {
    return 'plein_champ';
  }
  
  return 'both';
}

/**
 * Parse le CSV du plan de culture (référence, pas pour créer des plans utilisateur)
 */
export function parsePlanCSV(csvContent: string): any[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const plans: any[] = [];
  
  // Ignorer la première ligne (en-têtes)
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const columns = line.split(',');
    if (columns.length < 7) continue;
    
    const culture = columns[0]?.trim();
    const action = columns[1]?.trim().toLowerCase();
    const date = columns[2]?.trim();
    const weekNumber = parseInt(columns[3]?.trim() || '0');
    const type = columns[4]?.trim();
    const winter = columns[5]?.trim();
    const greenhouse = columns[6]?.trim();
    
    if (!culture || !weekNumber) continue;
    
    plans.push({
      culture: capitalizeFirst(culture),
      action,
      date,
      weekNumber,
      type,
      winter,
      greenhouse,
    });
  }
  
  return plans;
}

/**
 * Infère le type de culture depuis le nom
 */
function inferCropType(name: string): CropType {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('tomate') || lowerName.includes('aubergine') || 
      lowerName.includes('poivron') || lowerName.includes('piment') ||
      lowerName.includes('concombre') || lowerName.includes('courgette') ||
      lowerName.includes('courge') || lowerName.includes('melon') ||
      lowerName.includes('pastèque')) {
    return 'Légume-fruit';
  }
  
  if (lowerName.includes('chou') || lowerName.includes('laitue') ||
      lowerName.includes('épinard') || lowerName.includes('blette') ||
      lowerName.includes('mâche') || lowerName.includes('roquette') ||
      lowerName.includes('mesclun') || lowerName.includes('chicorée') ||
      lowerName.includes('endive') || lowerName.includes('fenouil') ||
      lowerName.includes('céléri') || lowerName.includes('pourpier')) {
    return 'Légume-feuille';
  }
  
  if (lowerName.includes('carotte') || lowerName.includes('radis') ||
      lowerName.includes('navet') || lowerName.includes('betterave') ||
      lowerName.includes('panais') || lowerName.includes('oignon') ||
      lowerName.includes('échalote') || lowerName.includes('ail') ||
      lowerName.includes('poireau') || lowerName.includes('pomme de terre') ||
      lowerName.includes('patate')) {
    return 'Légume-racine';
  }
  
  if (lowerName.includes('haricot') || lowerName.includes('petit pois') ||
      lowerName.includes('fève')) {
    return 'Légume-graine';
  }
  
  if (lowerName.includes('aromati') || lowerName.includes('rhubarbe')) {
    return 'Aromatique';
  }
  
  return 'Légume-fruit'; // Par défaut
}

/**
 * Capitalise la première lettre
 */
function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Retourne un emoji pour la culture
 */
function getEmojiForCrop(name: string): string {
  const lowerName = name.toLowerCase();
  
  const emojiMap: { [key: string]: string } = {
    'tomate': '🍅',
    'carotte': '🥕',
    'salade': '🥬',
    'laitue': '🥬',
    'courgette': '🥒',
    'poivron': '🫑',
    'piment': '🌶️',
    'aubergine': '🍆',
    'concombre': '🥒',
    'courge': '🎃',
    'melon': '🍈',
    'pastèque': '🍉',
    'haricot': '🫘',
    'petit pois': '🫛',
    'fève': '🫘',
    'radis': '🌶️',
    'betterave': '🫐',
    'oignon': '🧅',
    'ail': '🧄',
    'poireau': '🧄',
    'épinard': '🥬',
    'chou': '🥬',
    'pomme de terre': '🥔',
    'patate': '🥔',
    'navet': '🥕',
    'fenouil': '🌿',
    'céléri': '🥬',
    'roquette': '🌿',
    'mâche': '🥬',
    'mesclun': '🥬',
    'chicorée': '🥬',
    'endive': '🥬',
    'blette': '🥬',
    'panais': '🥕',
    'pourpier': '🌿',
    'aromati': '🌿',
    'rhubarbe': '🌿',
  };
  
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (lowerName.includes(key)) {
      return emoji;
    }
  }
  
  return '🌱'; // Emoji par défaut
}

/**
 * Parse les plages de semaines (ex: "41-47", "9-17 | 40-48") en tableau de numéros
 */
function parseWeekRanges(weekString: string): number[] {
  if (!weekString || !weekString.trim()) return [];
  
  const weeks: number[] = [];
  // Séparer par | pour gérer plusieurs plages
  const ranges = weekString.split('|').map(r => r.trim());
  
  for (const range of ranges) {
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(s => parseInt(s.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let week = start; week <= end; week++) {
          if (week >= 1 && week <= 52) {
            weeks.push(week);
          }
        }
      }
    } else {
      const week = parseInt(range.trim(), 10);
      if (!isNaN(week) && week >= 1 && week <= 52) {
        weeks.push(week);
      }
    }
  }
  
  return normalizeWeeks(weeks);
}

/**
 * Parse le nouveau format CSV avec semaines directement dans les colonnes
 */
export function parseNewCulturesCSV(csvContent: string): Partial<Crop>[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const crops: Partial<Crop>[] = [];
  
  // Parser l'en-tête pour trouver les index des colonnes
  const headerLine = lines[0];
  if (!headerLine) return crops;
  
  const headers = headerLine.split(',').map(h => h.trim().toLowerCase());
  const nameIndex = headers.findIndex(h => h.includes('name'));
  const typeIndex = headers.findIndex(h => h.includes('type'));
  const weeksInNurseryIndex = headers.findIndex(h => h.includes('nursury') || h.includes('nursery'));
  const weeksBeforeHarvestIndex = headers.findIndex(h => h.includes('beforeharvest') || h.includes('weeksbeforeharvest'));
  const plantingMethodIndex = headers.findIndex(h => h.includes('plantingmethod'));
  const sowingWeeksIndex = headers.findIndex(h => h.includes('sowingweeks'));
  const plantingWeeksIndex = headers.findIndex(h => h.includes('plantingweeks'));
  
  // Parser les lignes de données (ignorer la première ligne d'en-tête)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Parser CSV en gérant les guillemets
    const columns: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        columns.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    columns.push(current.trim());
    
    if (columns.length < nameIndex + 1) continue;
    
    const name = columns[nameIndex]?.trim().replace(/^"|"$/g, '');
    if (!name) continue;
    
    // Extraire les valeurs
    const typeStr = columns[typeIndex]?.trim().replace(/^"|"$/g, '') || '';
    const weeksInNursery = parseInt(columns[weeksInNurseryIndex]?.trim() || '0', 10) || 0;
    const weeksBeforeHarvest = parseInt(columns[weeksBeforeHarvestIndex]?.trim() || '0', 10) || 0;
    const plantingMethodStr = columns[plantingMethodIndex]?.trim().replace(/^"|"$/g, '').toLowerCase() || 'both';
    const sowingWeeksStr = columns[sowingWeeksIndex]?.trim().replace(/^"|"$/g, '') || '';
    const plantingWeeksStr = columns[plantingWeeksIndex]?.trim().replace(/^"|"$/g, '') || '';
    
    // Convertir le type
    let cropType: CropType = inferCropType(name);
    if (typeStr) {
      const typeLower = typeStr.toLowerCase();
      if (typeLower.includes('fruit')) cropType = 'Légume-fruit';
      else if (typeLower.includes('feuille') || typeLower.includes('chou')) cropType = 'Légume-feuille';
      else if (typeLower.includes('racine') || typeLower.includes('tubercule') || typeLower.includes('bulbe')) cropType = 'Légume-racine';
      else if (typeLower.includes('legumineuse') || typeLower.includes('grain')) cropType = 'Légume-graine';
      else if (typeLower.includes('aromatique') || typeLower.includes('perenne')) cropType = 'Aromatique';
    }
    
    // Convertir la méthode de plantation
    let plantingMethod: PlantingMethod = 'both';
    if (plantingMethodStr === 'serre' || plantingMethodStr === 'plantation') {
      plantingMethod = 'serre';
    } else if (plantingMethodStr === 'semis' || plantingMethodStr === 'plein_champ') {
      plantingMethod = 'plein_champ';
    } else if (plantingMethodStr === 'both') {
      plantingMethod = 'both';
    }
    
    // Parser les semaines
    const sowingWeeks = parseWeekRanges(sowingWeeksStr);
    const plantingWeeks = parseWeekRanges(plantingWeeksStr);
    
    crops.push({
      name: capitalizeFirst(name),
      type: cropType,
      weeksBetweenSowingAndPlanting: weeksInNursery,
      weeksBetweenPlantingAndHarvest: weeksBeforeHarvest,
      sowingWeeks,
      plantingWeeks,
      plantingMethod,
      emoji: getEmojiForCrop(name),
    });
  }
  
  return crops;
}

/**
 * Importe les cultures (utilisateur ou invité)
 */
export async function importCropsToFirestore(
  csvContent: string,
  userId: string,
  planCsvContent?: string,
  token?: string
): Promise<{ success: number; errors: number }> {
  const crops = parseLegumesCSV(csvContent, planCsvContent);
  let success = 0;
  let errors = 0;

  for (const cropData of crops) {
    try {
      await createCrop(
        {
          ...cropData,
          userId,
        } as Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>,
        token
      );
      success++;
    } catch (error) {
      console.error(`Erreur lors de l'import de ${cropData.name}:`, error);
      errors++;
    }
  }

  return { success, errors };
}

/**
 * Met à jour les cultures système depuis le nouveau format CSV via l'API.
 * Supprime les cultures système existantes puis importe les nouvelles.
 */
export async function updateSystemCropsFromCSV(
  csvContent: string,
  token: string
): Promise<{ deleted: number; imported: number; errors: number }> {
  const crops = parseNewCulturesCSV(csvContent);
  const systemCrops = crops.map((c) => ({
    ...c,
    userId: 'system',
  })) as Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>[];

  const result = await replaceSystemCrops(systemCrops, token);
  return {
    deleted: result.deleted ?? 0,
    imported: result.imported ?? systemCrops.length,
    errors: result.errors ?? 0,
  };
}
