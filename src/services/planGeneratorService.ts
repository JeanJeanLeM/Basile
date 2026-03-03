import { Crop, UserPreferences } from '../types';
import { getUserCrops } from './cropsService';
import { getUserPreferences } from './preferencesService';
import { createPlan, deleteUserPlans } from './plansService';
import { getWeekNumber, calculateSowingWeek } from '../utils/weekUtils';

const LOG_PREFIX = '[Basil Plan]';

export interface GeneratedPlanItem {
  crop: Crop;
  plantingWeek: number;
  sowingWeek: number;
  quantity: number;
  reason: string;
}

export interface GeneratedPlan {
  items: GeneratedPlanItem[];
  year: number;
}

/** Ligne du CSV plan de culture : Culture, semis plantation, date, week number, Type, Winter, Greenhouse */
export interface BasePlanRow {
  culture: string;
  action: string;
  date: string;
  weekNumber: number;
  type: string;
  winter: string;
  greenhouse: string;
}

const PLAN_CSV_URL = '/plan-culture.csv';

/**
 * Charge et parse le CSV du plan de culture de base
 */
async function loadBasePlanCSV(): Promise<BasePlanRow[]> {
  const response = await fetch(PLAN_CSV_URL);
  if (!response.ok) {
    console.warn('Plan de culture CSV non disponible, retour plan vide');
    return [];
  }
  const text = await response.text();
  return parsePlanCSV(text);
}

/**
 * Parse le CSV (format : Culture, semis plantation, date de plantation, week number, Type, Winter, Greenhouse)
 */
function parsePlanCSV(csvContent: string): BasePlanRow[] {
  const lines = csvContent.split('\n').filter((line) => line.trim());
  const rows: BasePlanRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (i < 2) continue; // ignorer lignes vides et en-têtes
    const line = lines[i];
    const columns = line.split(',');
    if (columns.length < 7) continue;

    const culture = columns[0]?.trim();
    const action = (columns[1]?.trim() || '').toLowerCase();
    const date = columns[2]?.trim();
    const weekNumber = parseInt(columns[3]?.trim() || '0', 10);
    const type = (columns[4]?.trim() || '').toLowerCase();
    const winter = (columns[5]?.trim() || '').toLowerCase();
    const greenhouse = (columns[6]?.trim() || '').toLowerCase();

    if (!culture || !weekNumber || weekNumber < 1 || weekNumber > 52) continue;

    rows.push({
      culture,
      action,
      date,
      weekNumber,
      type,
      winter,
      greenhouse,
    });
  }
  return rows;
}

/**
 * Retourne true si la ligne doit être exclue selon les préférences utilisateur
 */
function shouldExcludeRow(
  row: BasePlanRow,
  preferences: UserPreferences,
  excludedNames: Set<string>
): boolean {
  const cultureNorm = row.culture.toLowerCase().trim();
  if (excludedNames.has(cultureNorm)) return true;

  // Hiver : "no" = exclure full et little, "little" = exclure full uniquement
  if (preferences.winterCultivation === 'no') {
    if (row.winter === 'full' || row.winter === 'little') return true;
  } else if (preferences.winterCultivation === 'little') {
    if (row.winter === 'full') return true;
  }

  // Serre : pas de serre = exclure les lignes Greenhouse TRUE uniquement
  if (!preferences.hasGreenhouse) {
    if (row.greenhouse === 'true' || row.greenhouse === '1') return true;
  }

  // Extension de saison : filtrer par Type (Early, Main, Late)
  const seasonExtension = preferences.seasonExtension ?? 'none';
  const typeNorm = row.type || 'main';
  if (seasonExtension === 'none') {
    // Uniquement pleine saison (Main)
    if (typeNorm !== 'main') return true;
  } else if (seasonExtension === 'early') {
    if (typeNorm !== 'early' && typeNorm !== 'main') return true;
  } else if (seasonExtension === 'late') {
    if (typeNorm !== 'late' && typeNorm !== 'main') return true;
  }
  // "both" => on garde tout (Early, Main, Late)

  return false;
}

/**
 * Trouve une culture par nom (insensible à la casse)
 */
function findCropByName(crops: Crop[], cultureName: string): Crop | null {
  const norm = cultureName.toLowerCase().trim();
  return crops.find((c) => c.name.toLowerCase().trim() === norm) ?? null;
}

/**
 * Génère un plan de culture à partir du plan de base (CSV) filtré selon les préférences
 */
export async function generateCompletePlan(
  userId: string,
  year: number = new Date().getFullYear(),
  token?: string
): Promise<GeneratedPlan> {
  console.log(`${LOG_PREFIX} Génération du plan (userId=${userId?.slice(0, 8)}..., year=${year})`);

  const [crops, preferences, baseRows] = await Promise.all([
    getUserCrops(userId, token),
    getUserPreferences(userId, token),
    loadBasePlanCSV(),
  ]);

  console.log(`${LOG_PREFIX} Données chargées: ${baseRows.length} lignes CSV, ${crops.length} cultures`);

  if (!preferences) {
    console.warn(`${LOG_PREFIX} Aucune préférence utilisateur → plan vide`);
    return { items: [], year };
  }

  console.log(`${LOG_PREFIX} Filtres actifs:`, {
    hasGreenhouse: preferences.hasGreenhouse,
    winterCultivation: preferences.winterCultivation,
    seasonExtension: preferences.seasonExtension,
    excludedCrops: (preferences.excludedCrops ?? []).length,
    excludedCropNames: (preferences.excludedCropNames ?? []).length,
  });

  const excludedIds = new Set(preferences.excludedCrops ?? []);
  let excludedNames = new Set(
    (preferences.excludedCropNames ?? []).map((n) => n.toLowerCase().trim())
  );
  if (excludedNames.size === 0 && excludedIds.size > 0) {
    crops
      .filter((c) => excludedIds.has(c.id))
      .forEach((c) => excludedNames.add(c.name.toLowerCase().trim()));
  }
  if (excludedNames.size > 0) {
    console.log(`${LOG_PREFIX} Cultures exclues (noms):`, [...excludedNames]);
  }

  const currentWeek = getWeekNumber(new Date());
  const planItems: GeneratedPlanItem[] = [];
  const seen = new Set<string>();

  const plantationRows = baseRows.filter(
    (r) => r.action === 'plantation' || r.action === 'planting'
  );
  console.log(`${LOG_PREFIX} Lignes "plantation" dans le CSV: ${plantationRows.length}`);

  const filterStats = {
    excludedByFilter: 0,
    excludedNoCrop: 0,
    excludedById: 0,
    excludedDuplicate: 0,
    excludedPast: 0,
  };

  for (const row of plantationRows) {
    if (shouldExcludeRow(row, preferences, excludedNames)) {
      filterStats.excludedByFilter++;
      continue;
    }

    const crop = findCropByName(crops, row.culture);
    if (!crop) {
      filterStats.excludedNoCrop++;
      continue;
    }

    if (excludedIds.has(crop.id)) {
      filterStats.excludedById++;
      continue;
    }

    const key = `${crop.id}-${row.weekNumber}`;
    if (seen.has(key)) {
      filterStats.excludedDuplicate++;
      continue;
    }
    seen.add(key);

    if (row.weekNumber < currentWeek && row.weekNumber > currentWeek - 10) {
      filterStats.excludedPast++;
      continue;
    }

    const plantingWeek = row.weekNumber;
    const sowingWeek = calculateSowingWeek(
      plantingWeek,
      crop.weeksBetweenSowingAndPlanting
    );

    let reason = 'Plan de base';
    if (row.winter === 'full' || row.winter === 'little') reason = 'Culture hiver';
    else if (row.type === 'early') reason = 'Précoce';
    else if (row.type === 'late') reason = 'Tardif';
    if (row.greenhouse === 'true' || row.greenhouse === '1') reason += ' (serre)';

    planItems.push({
      crop,
      plantingWeek,
      sowingWeek,
      quantity: 1,
      reason,
    });
  }

  console.log(`${LOG_PREFIX} Filtres appliqués:`, filterStats);
  console.log(`${LOG_PREFIX} Plan généré: ${planItems.length} plantations`);

  planItems.sort((a, b) => a.plantingWeek - b.plantingWeek);

  return {
    items: planItems,
    year,
  };
}

/**
 * Applique le plan généré : reset du plan actif puis création des nouveaux plans
 */
export async function applyGeneratedPlan(
  userId: string,
  generatedPlan: GeneratedPlan,
  token?: string
): Promise<string[]> {
  console.log(`${LOG_PREFIX} Application du plan (userId=${userId?.slice(0, 8)}..., ${generatedPlan.items.length} items)`);

  const deletedCount = await deleteUserPlans(userId, token);
  if (deletedCount > 0) {
    console.log(`${LOG_PREFIX} Plan actif réinitialisé: ${deletedCount} plan(s) supprimé(s)`);
  }

  const planIds: string[] = [];
  for (const item of generatedPlan.items) {
    const planId = await createPlan({
      userId,
      cropId: item.crop.id,
      cropName: item.crop.name,
      quantity: item.quantity,
      plantingWeek: item.plantingWeek,
    }, token);
    planIds.push(planId);
  }
  console.log(`${LOG_PREFIX} ${planIds.length} plan(s) créé(s) avec les filtres appliqués`);
  return planIds;
}
