import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { checkJwt, getUserId } from './middleware/auth.js';
import { supabase } from './supabase.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Helpers: DB row (snake_case) <-> API (camelCase) ---

function rowToCrop(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    imageUrl: row.image_url,
    emoji: row.emoji,
    weeksBetweenSowingAndPlanting: row.weeks_between_sowing_and_planting,
    weeksBetweenPlantingAndHarvest: row.weeks_between_planting_and_harvest,
    weeksBetweenHarvestAndDestruction: row.weeks_between_harvest_and_destruction,
    sowingWeeks: row.sowing_weeks ?? [],
    plantingWeeks: row.planting_weeks ?? [],
    plantingMethod: row.planting_method,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function cropToRow(crop: Record<string, unknown>) {
  return {
    name: crop.name,
    type: crop.type,
    image_url: crop.imageUrl,
    emoji: crop.emoji,
    weeks_between_sowing_and_planting: crop.weeksBetweenSowingAndPlanting,
    weeks_between_planting_and_harvest: crop.weeksBetweenPlantingAndHarvest,
    weeks_between_harvest_and_destruction: crop.weeksBetweenHarvestAndDestruction ?? null,
    sowing_weeks: crop.sowingWeeks ?? [],
    planting_weeks: crop.plantingWeeks ?? [],
    planting_method: crop.plantingMethod,
    user_id: crop.userId,
  };
}

function rowToPlan(row: Record<string, unknown>) {
  return {
    id: row.id,
    cropId: row.crop_id,
    cropName: row.crop_name,
    quantity: row.quantity,
    plantingWeek: row.planting_week,
    sowingWeek: row.sowing_week,
    notes: row.notes,
    sowingDone: row.sowing_done,
    plantingDone: row.planting_done,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customNurseryWeeks: row.custom_nursery_weeks,
    customCultureWeeks: row.custom_culture_weeks,
    customHarvestWeeks: row.custom_harvest_weeks,
  };
}

function planToRow(plan: Record<string, unknown>) {
  return {
    crop_id: plan.cropId,
    crop_name: plan.cropName,
    quantity: plan.quantity,
    planting_week: plan.plantingWeek,
    sowing_week: plan.sowingWeek,
    notes: plan.notes ?? null,
    sowing_done: plan.sowingDone,
    planting_done: plan.plantingDone,
    user_id: plan.userId,
    custom_nursery_weeks: plan.customNurseryWeeks ?? null,
    custom_culture_weeks: plan.customCultureWeeks ?? null,
    custom_harvest_weeks: plan.customHarvestWeeks ?? null,
  };
}

function rowToPrefs(row: Record<string, unknown>) {
  return {
    userId: row.user_id,
    hasGreenhouse: row.has_greenhouse,
    directSowing: row.direct_sowing,
    yearLongCrops: row.year_long_crops ?? [],
    excludedCrops: row.excluded_crops ?? [],
    excludedCropNames: row.excluded_crop_names ?? [],
    winterCultivation: row.winter_cultivation,
    seasonExtension: row.season_extension,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function prefsToRow(prefs: Record<string, unknown>) {
  return {
    user_id: prefs.userId,
    has_greenhouse: prefs.hasGreenhouse,
    direct_sowing: prefs.directSowing,
    year_long_crops: prefs.yearLongCrops ?? [],
    excluded_crops: prefs.excludedCrops ?? [],
    excluded_crop_names: prefs.excludedCropNames ?? [],
    winter_cultivation: prefs.winterCultivation,
    season_extension: prefs.seasonExtension,
  };
}

// --- Health ---

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// --- Crops (authenticated) ---

app.get('/api/crops', checkJwt, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { data: userRows } = await supabase
      .from('crops')
      .select('*')
      .eq('user_id', userId)
      .order('name');
    const { data: systemRows } = await supabase
      .from('crops')
      .select('*')
      .eq('user_id', 'system')
      .order('name');
    const userCrops = (userRows ?? []).map(rowToCrop);
    const systemCrops = (systemRows ?? []).map(rowToCrop);
    const byName = new Map<string, typeof userCrops[0]>();
    systemCrops.forEach((c) => byName.set(c.name.toLowerCase(), c));
    userCrops.forEach((c) => byName.set(c.name.toLowerCase(), c));
    const crops = Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
    res.json({ crops });
  } catch (e) {
    console.error('GET /api/crops', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

app.get('/api/crops/:id', checkJwt, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { data, error } = await supabase.from('crops').select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: 'Not found' });
    if (data.user_id !== userId && data.user_id !== 'system')
      return res.status(403).json({ error: 'Forbidden' });
    res.json(rowToCrop(data));
  } catch (e) {
    console.error('GET /api/crops/:id', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post('/api/crops', checkJwt, async (req, res) => {
  try {
    const userId = getUserId(req);
    const row = cropToRow({ ...req.body, userId });
    const { data, error } = await supabase.from('crops').insert(row).select('id').single();
    if (error) throw error;
    res.status(201).json({ id: data.id });
  } catch (e) {
    console.error('POST /api/crops', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

app.put('/api/crops/:id', checkJwt, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { data: existing } = await supabase.from('crops').select('user_id').eq('id', req.params.id).single();
    if (!existing || existing.user_id !== userId) return res.status(404).json({ error: 'Not found' });
    const row = cropToRow(req.body);
    delete (row as Record<string, unknown>).user_id;
    const { error } = await supabase.from('crops').update(row).eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (e) {
    console.error('PUT /api/crops/:id', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

app.delete('/api/crops/:id', checkJwt, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { data: existing } = await supabase.from('crops').select('user_id').eq('id', req.params.id).single();
    if (!existing || existing.user_id !== userId) return res.status(404).json({ error: 'Not found' });
    const { error } = await supabase.from('crops').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (e) {
    console.error('DELETE /api/crops/:id', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

// --- Plans (authenticated + public system) ---

app.get('/api/plans/system', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', 'system')
      .order('planting_week');
    if (error) throw error;
    res.json({ plans: (data ?? []).map(rowToPlan) });
  } catch (e) {
    console.error('GET /api/plans/system', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

app.get('/api/plans', checkJwt, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', userId)
      .order('planting_week');
    if (error) throw error;
    res.json({ plans: (data ?? []).map(rowToPlan) });
  } catch (e) {
    console.error('GET /api/plans', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

app.get('/api/plans/:id', checkJwt, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { data, error } = await supabase.from('plans').select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: 'Not found' });
    if (data.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });
    res.json(rowToPlan(data));
  } catch (e) {
    console.error('GET /api/plans/:id', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post('/api/plans', checkJwt, async (req, res) => {
  try {
    const userId = getUserId(req);
    const row = planToRow({ ...req.body, userId });
    const { data, error } = await supabase.from('plans').insert(row).select('id').single();
    if (error) throw error;
    res.status(201).json({ id: data.id });
  } catch (e) {
    console.error('POST /api/plans', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

app.put('/api/plans/:id', checkJwt, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { data: existing } = await supabase.from('plans').select('user_id').eq('id', req.params.id).single();
    if (!existing || existing.user_id !== userId) return res.status(404).json({ error: 'Not found' });
    const row = planToRow(req.body);
    delete (row as Record<string, unknown>).user_id;
    const { error } = await supabase.from('plans').update(row).eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (e) {
    console.error('PUT /api/plans/:id', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

app.delete('/api/plans/:id', checkJwt, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { data: existing } = await supabase.from('plans').select('user_id').eq('id', req.params.id).single();
    if (!existing || existing.user_id !== userId) return res.status(404).json({ error: 'Not found' });
    const { error } = await supabase.from('plans').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (e) {
    console.error('DELETE /api/plans/:id', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

app.delete('/api/plans', checkJwt, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { data: rows } = await supabase.from('plans').select('id').eq('user_id', userId);
    const ids = (rows ?? []).map((r) => r.id);
    if (ids.length > 0) {
      const { error } = await supabase.from('plans').delete().in('id', ids);
      if (error) throw error;
    }
    res.json({ deleted: ids.length });
  } catch (e) {
    console.error('DELETE /api/plans', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

// --- Preferences (authenticated) ---

app.get('/api/preferences', checkJwt, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { data, error } = await supabase.from('user_preferences').select('*').eq('user_id', userId).single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return res.json(null);
    res.json(rowToPrefs(data));
  } catch (e) {
    console.error('GET /api/preferences', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

app.put('/api/preferences', checkJwt, async (req, res) => {
  try {
    const userId = getUserId(req);
    const row = prefsToRow({ ...req.body, userId });
    const { error } = await supabase.from('user_preferences').upsert(row, { onConflict: 'user_id' });
    if (error) throw error;
    res.status(204).send();
  } catch (e) {
    console.error('PUT /api/preferences', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

// --- Migrate guest data ---

app.post('/api/migrate-guest-data', checkJwt, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { crops = [], plans = [], preferences } = req.body as {
      crops?: Record<string, unknown>[];
      plans?: Record<string, unknown>[];
      preferences?: Record<string, unknown> | null;
    };

    let cropsCount = 0;
    for (const c of crops) {
      const row = cropToRow({ ...c, userId }) as Record<string, unknown>;
      if (c.id) row.id = c.id; // preserve guest id so plan crop_id references stay valid
      const { error } = await supabase.from('crops').insert(row);
      if (!error) cropsCount++;
    }

    let plansCount = 0;
    for (const p of plans) {
      const row = planToRow({ ...p, userId }) as Record<string, unknown>;
      if (p.id) row.id = p.id;
      const { error } = await supabase.from('plans').insert(row);
      if (!error) plansCount++;
    }

    if (preferences && typeof preferences === 'object') {
      const row = prefsToRow({ ...preferences, userId });
      await supabase.from('user_preferences').upsert(row, { onConflict: 'user_id' });
    }

    res.json({ cropsCount, plansCount });
  } catch (e) {
    console.error('POST /api/migrate-guest-data', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

// --- System crops replace (authenticated; used by Import page) ---

app.post('/api/system-crops/replace', checkJwt, async (req, res) => {
  try {
    const { crops = [] } = req.body as { crops?: Record<string, unknown>[] };
    const { data: existing } = await supabase.from('crops').select('id').eq('user_id', 'system');
    const ids = (existing ?? []).map((r) => r.id);
    let deleted = 0;
    if (ids.length > 0) {
      const { error: delErr } = await supabase.from('crops').delete().in('id', ids);
      if (delErr) throw delErr;
      deleted = ids.length;
    }
    let imported = 0;
    let errors = 0;
    for (const c of crops) {
      const row = cropToRow({ ...c, userId: 'system' });
      const { error } = await supabase.from('crops').insert(row);
      if (error) errors++;
      else imported++;
    }
    res.json({ deleted, imported, errors });
  } catch (e) {
    console.error('POST /api/system-crops/replace', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});
