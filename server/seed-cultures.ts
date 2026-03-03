import 'dotenv/config';
/**
 * Script pour créer/mettre à jour la table Supabase "crops"
 * avec les données par défaut du CSV Basile - cultures.csv
 *
 * Usage: npm run seed:cultures
 * Prérequis: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY dans .env
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { supabase } from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const CSV_PATH = join(projectRoot, 'data', 'Basile - cultures.csv');

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

function parseWeekRanges(s: string): number[] {
  if (!s || !s.trim()) return [];
  const out: number[] = [];
  const parts = s.split('|').map((p) => p.trim());
  for (const part of parts) {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map((x) => parseInt(x.trim(), 10));
      if (!Number.isNaN(a) && !Number.isNaN(b)) {
        for (let w = a; w <= b; w++) {
          if (w >= 1 && w <= 52) out.push(w);
        }
      }
    } else {
      const w = parseInt(part, 10);
      if (!Number.isNaN(w) && w >= 1 && w <= 52) out.push(w);
    }
  }
  return [...new Set(out)].sort((a, b) => a - b);
}

function mapCropType(typeStr: string, name: string): string {
  const t = (typeStr || '').toLowerCase();
  const n = (name || '').toLowerCase();
  if (t.includes('fruit')) return 'Légume-fruit';
  if (t.includes('feuille') || t.includes('chou')) return 'Légume-feuille';
  if (t.includes('racine') || t.includes('tubercule') || t.includes('bulbe')) return 'Légume-racine';
  if (t.includes('legumineuse') || t.includes('grain')) return 'Légume-graine';
  if (t.includes('aromatique') || t.includes('perenne')) return 'Aromatique';
  if (n.includes('tomate') || n.includes('aubergine') || n.includes('poivron') || n.includes('piment') ||
      n.includes('concombre') || n.includes('courgette') || n.includes('courge') || n.includes('melon') || n.includes('pastèque')) return 'Légume-fruit';
  if (n.includes('chou') || n.includes('laitue') || n.includes('épinard') || n.includes('blette') ||
      n.includes('mâche') || n.includes('roquette') || n.includes('mesclun') || n.includes('chicorée') ||
      n.includes('endive') || n.includes('fenouil') || n.includes('céléri') || n.includes('pourpier')) return 'Légume-feuille';
  if (n.includes('carotte') || n.includes('radis') || n.includes('navet') || n.includes('betterave') ||
      n.includes('panais') || n.includes('oignon') || n.includes('échalote') || n.includes('ail') ||
      n.includes('poireau') || n.includes('pomme de terre') || n.includes('patate')) return 'Légume-racine';
  if (n.includes('haricot') || n.includes('petit pois') || n.includes('fève')) return 'Légume-graine';
  if (n.includes('aromati') || n.includes('rhubarbe')) return 'Aromatique';
  return 'Légume-fruit';
}

function mapPlantingMethod(s: string): 'serre' | 'plein_champ' | 'both' {
  const m = (s || '').toLowerCase();
  if (m === 'plantation' || m === 'serre') return 'serre';
  if (m === 'semis' || m === 'plein_champ') return 'plein_champ';
  return 'both';
}

function getEmoji(name: string): string {
  const n = name.toLowerCase();
  const map: Record<string, string> = {
    'tomate': '🍅', 'carotte': '🥕', 'salade': '🥬', 'laitue': '🥬', 'courgette': '🥒',
    'poivron': '🫑', 'piment': '🌶️', 'aubergine': '🍆', 'concombre': '🥒', 'courge': '🎃',
    'melon': '🍈', 'pastèque': '🍉', 'haricot': '🫘', 'petit pois': '🫛', 'fève': '🫘',
    'radis': '🌶️', 'betterave': '🫐', 'oignon': '🧅', 'ail': '🧄', 'poireau': '🧄',
    'épinard': '🥬', 'chou': '🥬', 'pomme de terre': '🥔', 'patate': '🥔', 'navet': '🥕',
    'fenouil': '🌿', 'céléri': '🥬', 'roquette': '🌿', 'mâche': '🥬', 'mesclun': '🥬',
    'chicorée': '🥬', 'endive': '🥬', 'blette': '🥬', 'panais': '🥕', 'pourpier': '🌿',
    'rhubarbe': '🌿',
  };
  for (const [k, v] of Object.entries(map)) {
    if (n.includes(k)) return v;
  }
  return '🌱';
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

interface CropRow {
  name: string;
  type: string;
  weeksBetweenSowingAndPlanting: number;
  weeksBetweenPlantingAndHarvest: number;
  sowingWeeks: number[];
  plantingWeeks: number[];
  plantingMethod: 'serre' | 'plein_champ' | 'both';
  emoji: string;
}

function parseCsvToCrops(csvContent: string): CropRow[] {
  const lines = csvContent.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) => h.trim().toLowerCase());

  const nameIdx = headers.findIndex((h) => h.includes('name'));
  const typeIdx = headers.findIndex((h) => h.includes('type'));
  const nurseryIdx = headers.findIndex((h) => h.includes('nursury') || h.includes('nursery'));
  const beforeHarvestIdx = headers.findIndex((h) => h.includes('beforeharvest') || h.includes('weeksbeforeharvest'));
  const harvestingIdx = headers.findIndex((h) => h.includes('harvesting') || h.includes('weeksharvesting'));
  const methodIdx = headers.findIndex((h) => h.includes('plantingmethod'));
  const sowingIdx = headers.findIndex((h) => h.includes('sowingweeks'));
  const plantingIdx = headers.findIndex((h) => h.includes('plantingweeks'));

  if (nameIdx < 0) return [];

  const crops: CropRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const name = (cols[nameIdx] || '').trim();
    if (!name) continue;

    const typeStr = cols[typeIdx] ?? '';
    const weeksNursery = parseInt(cols[nurseryIdx] ?? '0', 10) || 0;
    const weeksBeforeHarvest = parseInt(cols[beforeHarvestIdx] ?? '0', 10) || 0;
    const weeksCulture = weeksBeforeHarvest || 12;
    const methodStr = (cols[methodIdx] ?? '').trim();
    const sowingStr = (cols[sowingIdx] ?? '').trim();
    const plantingStr = (cols[plantingIdx] ?? '').trim();

    crops.push({
      name: capitalize(name),
      type: mapCropType(typeStr, name),
      weeksBetweenSowingAndPlanting: weeksNursery,
      weeksBetweenPlantingAndHarvest: weeksCulture,
      sowingWeeks: parseWeekRanges(sowingStr),
      plantingWeeks: parseWeekRanges(plantingStr),
      plantingMethod: mapPlantingMethod(methodStr),
      emoji: getEmoji(name),
    });
  }
  return crops;
}

async function deleteSystemCrops(): Promise<number> {
  const { data: rows } = await supabase.from('crops').select('id').eq('user_id', SYSTEM_USER_ID);
  const ids = (rows ?? []).map((r) => r.id);
  if (ids.length > 0) {
    await supabase.from('crops').delete().in('id', ids);
  }
  return ids.length;
}

async function main() {
  console.log('🌱 Seed cultures – lecture du CSV...');
  const csvContent = readFileSync(CSV_PATH, 'utf-8');
  const crops = parseCsvToCrops(csvContent);
  console.log(`   ${crops.length} cultures lues depuis data/Basile - cultures.csv`);

  console.log('🗑️  Suppression des cultures système existantes...');
  const deleted = await deleteSystemCrops();
  console.log(`   ${deleted} document(s) supprimé(s)`);

  console.log('📤 Insertion dans Supabase (table crops)...');
  const rows = crops.map((c) => ({
    name: c.name,
    type: c.type,
    image_url: null,
    emoji: c.emoji,
    weeks_between_sowing_and_planting: c.weeksBetweenSowingAndPlanting,
    weeks_between_planting_and_harvest: c.weeksBetweenPlantingAndHarvest,
    weeks_between_harvest_and_destruction: null,
    sowing_weeks: c.sowingWeeks,
    planting_weeks: c.plantingWeeks,
    planting_method: c.plantingMethod,
    user_id: SYSTEM_USER_ID,
  }));

  const BATCH_SIZE = 100;
  let written = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('crops').insert(chunk);
    if (error) throw error;
    written += chunk.length;
  }

  console.log(`✅ ${written} cultures créées dans Supabase (table crops) avec user_id="${SYSTEM_USER_ID}".`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
