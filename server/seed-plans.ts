import 'dotenv/config';
/**
 * Script pour créer/mettre à jour la table Supabase "plans"
 * avec le plan par défaut Basile depuis data/Basile - Plan de culture.csv
 *
 * Usage: npm run seed:plans
 * Prérequis: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY et seed:cultures déjà exécuté
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { supabase } from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const CSV_PATH = join(projectRoot, 'data', 'Basile - Plan de culture.csv');

const SYSTEM_USER_ID = 'system';

function parseCSVLine(line: string): string[] {
  const cols: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      cols.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += c;
    }
  }
  cols.push(current.trim().replace(/^"|"$/g, ''));
  return cols;
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

interface CropInfo {
  id: string;
  weeksBetweenSowingAndPlanting: number;
}

function calculateSowingWeek(plantingWeek: number, weeksBetween: number): number {
  let sowingWeek = plantingWeek - weeksBetween;
  if (sowingWeek < 1) {
    sowingWeek = 52 + sowingWeek;
  }
  return sowingWeek;
}

async function getSystemCropsMap(): Promise<Map<string, CropInfo>> {
  const { data: rows } = await supabase
    .from('crops')
    .select('id, weeks_between_sowing_and_planting, name')
    .eq('user_id', SYSTEM_USER_ID);

  const map = new Map<string, CropInfo>();
  (rows ?? []).forEach((r) => {
    const name = (r.name || '').trim();
    if (!name) return;
    const key = name.toLowerCase().trim();
    map.set(key, {
      id: r.id,
      weeksBetweenSowingAndPlanting: Number(r.weeks_between_sowing_and_planting) || 0,
    });
  });
  return map;
}

interface PlanRow {
  culture: string;
  action: string;
  weekNumber: number;
}

function parsePlanCSV(csvContent: string): PlanRow[] {
  const lines = csvContent.split('\n').filter((l) => l.trim());
  if (lines.length < 3) return [];

  const rows: PlanRow[] = [];
  for (let i = 2; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const culture = (cols[0] || '').trim();
    const action = (cols[1] || '').trim().toLowerCase();
    const weekStr = (cols[3] || '').trim();
    const weekNumber = parseInt(weekStr, 10);

    if (!culture || !weekStr || Number.isNaN(weekNumber) || weekNumber < 1 || weekNumber > 52) {
      continue;
    }

    rows.push({
      culture: capitalize(culture),
      action,
      weekNumber,
    });
  }
  return rows;
}

async function deleteSystemPlans(): Promise<number> {
  const { data: rows } = await supabase.from('plans').select('id').eq('user_id', SYSTEM_USER_ID);
  const ids = (rows ?? []).map((r) => r.id);
  if (ids.length > 0) {
    await supabase.from('plans').delete().in('id', ids);
  }
  return ids.length;
}

async function main() {
  console.log('🌱 Seed plans Basile – chargement des cultures système...');
  const cropsMap = await getSystemCropsMap();
  console.log(`   ${cropsMap.size} cultures système trouvées`);

  console.log('📄 Lecture du CSV plan...');
  const csvContent = readFileSync(CSV_PATH, 'utf-8');
  const planRows = parsePlanCSV(csvContent);
  console.log(`   ${planRows.length} lignes lues depuis data/Basile - Plan de culture.csv`);

  console.log('🗑️  Suppression des plans système existants...');
  const deleted = await deleteSystemPlans();
  console.log(`   ${deleted} plan(s) supprimé(s)`);

  const toInsert: Record<string, unknown>[] = [];
  let skipped = 0;

  for (const row of planRows) {
    const cropKey = row.culture.toLowerCase().trim();
    const cropInfo = cropsMap.get(cropKey);
    if (!cropInfo) {
      skipped++;
      continue;
    }

    const isSowing = row.action.includes('semis');
    let plantingWeek: number;
    let sowingWeek: number;

    if (isSowing) {
      sowingWeek = row.weekNumber;
      plantingWeek = row.weekNumber + cropInfo.weeksBetweenSowingAndPlanting;
      if (plantingWeek > 52) {
        plantingWeek = plantingWeek - 52;
      }
    } else {
      plantingWeek = row.weekNumber;
      sowingWeek = calculateSowingWeek(
        plantingWeek,
        cropInfo.weeksBetweenSowingAndPlanting
      );
    }

    toInsert.push({
      crop_id: cropInfo.id,
      crop_name: row.culture,
      quantity: 1,
      planting_week: plantingWeek,
      sowing_week: sowingWeek,
      sowing_done: false,
      planting_done: false,
      user_id: SYSTEM_USER_ID,
    });
  }

  const BATCH_SIZE = 100;
  let written = 0;
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const chunk = toInsert.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('plans').insert(chunk);
    if (error) throw error;
    written += chunk.length;
  }

  console.log(`✅ ${written} plans créés dans Supabase (table plans) avec user_id="${SYSTEM_USER_ID}".`);
  if (skipped > 0) {
    console.log(`   (${skipped} ligne(s) ignorée(s) : culture non trouvée dans les cultures système)`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
