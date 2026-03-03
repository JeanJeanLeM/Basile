import { Crop, UserPreferences } from '../types';
import { getUserCrops } from './cropsService';
import { getUserPreferences } from './preferencesService';
import { createPlan } from './plansService';
import { getMonthFromWeek, getWeeksForMonthRange, normalizeWeeks } from '../utils/weekUtils';

export interface MonthlySuggestion {
  month: number;
  monthName: string;
  suggestions: CropSuggestion[];
}

export interface CropSuggestion {
  crop: Crop;
  action: 'sowing' | 'planting';
  week: number;
  reason: string;
}

/**
 * Génère des suggestions mensuelles basées sur les préférences utilisateur
 */
export async function generateMonthlySuggestions(
  userId: string,
  year: number = new Date().getFullYear(),
  token?: string
): Promise<MonthlySuggestion[]> {
  const crops = await getUserCrops(userId, token);
  const preferences = await getUserPreferences(userId, token);

  if (!preferences) {
    return [];
  }

  const suggestions: MonthlySuggestion[] = [];
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  for (let month = 1; month <= 12; month++) {
    const monthSuggestions: CropSuggestion[] = [];

    for (const crop of crops) {
      // Filtrer selon les préférences
      if (!shouldIncludeCrop(crop, preferences, month)) {
        continue;
      }

      const sowingWeeks = getCropWeeks(crop, 'sowing', year);
      const plantingWeeks = getCropWeeks(crop, 'planting', year);

      const sowingWeeksInMonth = sowingWeeks.filter(
        (week) => getMonthFromWeek(week, year) === month
      );
      if (sowingWeeksInMonth.length > 0) {
        monthSuggestions.push({
          crop,
          action: 'sowing',
          week: sowingWeeksInMonth[0],
          reason: getSowingReason(crop, preferences),
        });
      }

      const plantingWeeksInMonth = plantingWeeks.filter(
        (week) => getMonthFromWeek(week, year) === month
      );
      if (plantingWeeksInMonth.length > 0) {
        monthSuggestions.push({
          crop,
          action: 'planting',
          week: plantingWeeksInMonth[0],
          reason: getPlantingReason(crop, preferences),
        });
      }
    }

    if (monthSuggestions.length > 0) {
      suggestions.push({
        month,
        monthName: monthNames[month - 1],
        suggestions: monthSuggestions,
      });
    }
  }

  return suggestions;
}

/**
 * Vérifie si une culture doit être incluse selon les préférences (toutes les questions du questionnaire)
 */
function shouldIncludeCrop(
  crop: Crop,
  preferences: UserPreferences,
  month: number
): boolean {
  const excludedIds = preferences.excludedCrops ?? [];
  const excludedNames = (preferences.excludedCropNames ?? []).map((n) => n.toLowerCase().trim());

  // Exclure par ID ou par nom
  if (excludedIds.includes(crop.id)) return false;
  if (excludedNames.includes(crop.name.toLowerCase().trim())) return false;

  // Serre : ne pas proposer les cultures "serre uniquement" sans serre
  if (crop.plantingMethod === 'serre' && !preferences.hasGreenhouse) {
    return false;
  }

  // Hiver : pas de cultures hivernales si l'utilisateur ne veut pas cultiver en hiver
  const isWinter = month >= 11 || month <= 2;
  if (isWinter && preferences.winterCultivation === 'no') {
    return false;
  }

  return true;
}

function getCropWeeks(
  crop: Crop,
  type: 'sowing' | 'planting',
  year: number
): number[] {
  const weeks = type === 'sowing' ? crop.sowingWeeks : crop.plantingWeeks;
  if (weeks && weeks.length > 0) {
    return normalizeWeeks(weeks);
  }

  const startMonthKey = type === 'sowing' ? 'sowingStartMonth' : 'plantingStartMonth';
  const endMonthKey = type === 'sowing' ? 'sowingEndMonth' : 'plantingEndMonth';
  const startMonth = (crop as any)?.[startMonthKey];
  const endMonth = (crop as any)?.[endMonthKey];
  if (typeof startMonth === 'number' && typeof endMonth === 'number') {
    return getWeeksForMonthRange(startMonth, endMonth, year);
  }

  return [];
}

function getSowingReason(_crop: Crop, preferences: UserPreferences): string {
  if (preferences.directSowing) {
    return 'Semis direct recommandé';
  }
  return 'Période de semis idéale';
}

function getPlantingReason(crop: Crop, _preferences: UserPreferences): string {
  if (crop.plantingMethod === 'serre') {
    return 'Plantation en serre';
  }
  return 'Période de plantation idéale';
}

/**
 * Ajoute une suggestion au plan de l'utilisateur
 */
export async function addSuggestionToPlan(
  userId: string,
  suggestion: CropSuggestion,
  quantity: number = 1,
  token?: string
): Promise<string> {
  return createPlan({
    userId,
    cropId: suggestion.crop.id,
    cropName: suggestion.crop.name,
    quantity,
    plantingWeek: suggestion.action === 'planting' ? suggestion.week : suggestion.week + suggestion.crop.weeksBetweenSowingAndPlanting,
  }, token);
}
