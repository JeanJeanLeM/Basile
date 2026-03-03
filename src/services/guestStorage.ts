import type { Crop, Plan, UserPreferences } from '../types';

const STORAGE_KEYS = {
  crops: 'basile_guest_crops',
  plans: 'basile_guest_plans',
  preferences: 'basile_guest_preferences',
} as const;

const GUEST_USER_ID = 'guest';

function now(): string {
  return new Date().toISOString();
}

// --- Crops ---

export function getGuestCrops(): Crop[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.crops);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Crop[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function getGuestCrop(id: string): Crop | null {
  return getGuestCrops().find((c) => c.id === id) ?? null;
}

export function saveGuestCrop(
  data: Omit<Crop, 'id' | 'createdAt' | 'updatedAt'> | Crop
): Crop {
  const crops = getGuestCrops();
  const ts = now();
  const crop: Crop = 'id' in data && data.id
    ? { ...data, updatedAt: ts, createdAt: (data as Crop).createdAt }
    : {
        ...data,
        id: crypto.randomUUID(),
        userId: GUEST_USER_ID,
        createdAt: ts,
        updatedAt: ts,
      };
  const index = crops.findIndex((c) => c.id === crop.id);
  if (index >= 0) {
    crops[index] = crop;
  } else {
    crops.push(crop);
  }
  localStorage.setItem(STORAGE_KEYS.crops, JSON.stringify(crops));
  return crop;
}

export function deleteGuestCrop(id: string): void {
  const crops = getGuestCrops().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.crops, JSON.stringify(crops));
}

// --- Plans ---

export function getGuestPlans(): Plan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.plans);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Plan[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function getGuestPlan(id: string): Plan | null {
  return getGuestPlans().find((p) => p.id === id) ?? null;
}

export function saveGuestPlan(
  data: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'> | Plan
): Plan {
  const plans = getGuestPlans();
  const ts = now();
  const plan: Plan = 'id' in data && data.id
    ? { ...data, updatedAt: ts, createdAt: (data as Plan).createdAt }
    : {
        ...data,
        id: crypto.randomUUID(),
        userId: GUEST_USER_ID,
        sowingDone: false,
        plantingDone: false,
        createdAt: ts,
        updatedAt: ts,
      };
  const index = plans.findIndex((p) => p.id === plan.id);
  if (index >= 0) {
    plans[index] = plan;
  } else {
    plans.push(plan);
  }
  localStorage.setItem(STORAGE_KEYS.plans, JSON.stringify(plans));
  return plan;
}

export function deleteGuestPlan(id: string): void {
  const plans = getGuestPlans().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.plans, JSON.stringify(plans));
}

export function deleteAllGuestPlans(): void {
  localStorage.setItem(STORAGE_KEYS.plans, '[]');
}

// --- Preferences ---

const DEFAULT_PREFERENCES: Omit<UserPreferences, 'userId' | 'createdAt' | 'updatedAt'> = {
  hasGreenhouse: false,
  directSowing: false,
  yearLongCrops: [],
  excludedCrops: [],
  excludedCropNames: [],
  winterCultivation: 'no',
  seasonExtension: 'none',
};

export function getGuestPreferences(): UserPreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.preferences);
    if (!raw) return null;
    const prefs = JSON.parse(raw) as UserPreferences;
    return prefs && typeof prefs.userId === 'string' ? prefs : null;
  } catch {
    return null;
  }
}

export function saveGuestPreferences(
  updates: Partial<Omit<UserPreferences, 'userId' | 'createdAt' | 'updatedAt'>>
): UserPreferences {
  const existing = getGuestPreferences();
  const ts = now();
  const prefs: UserPreferences = {
    ...DEFAULT_PREFERENCES,
    ...existing,
    ...updates,
    userId: GUEST_USER_ID,
    createdAt: existing?.createdAt ?? ts,
    updatedAt: ts,
  };
  localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(prefs));
  return prefs;
}

// --- Aggregate ---

export function getGuestData(): {
  crops: Crop[];
  plans: Plan[];
  preferences: UserPreferences | null;
} {
  return {
    crops: getGuestCrops(),
    plans: getGuestPlans(),
    preferences: getGuestPreferences(),
  }
}

export function clearGuestData(): void {
  localStorage.removeItem(STORAGE_KEYS.crops);
  localStorage.removeItem(STORAGE_KEYS.plans);
  localStorage.removeItem(STORAGE_KEYS.preferences);
}

export function hasGuestData(): boolean {
  const { crops, plans } = getGuestData();
  return crops.length > 0 || plans.length > 0;
}
