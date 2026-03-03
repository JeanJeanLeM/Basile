import type { Crop, Plan, UserPreferences } from '../types';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function apiCall<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// --- Crops ---

export const cropsApi = {
  getAll: (token: string) =>
    apiCall<{ crops: Crop[] }>('/api/crops', {}, token).then((r) => r.crops),

  get: (id: string, token: string) =>
    apiCall<Crop>(`/api/crops/${id}`, {}, token),

  create: (crop: Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>, token: string) =>
    apiCall<{ id: string }>('/api/crops', { method: 'POST', body: JSON.stringify(crop) }, token).then((r) => r.id),

  update: (
    id: string,
    data: Partial<Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>>,
    token: string
  ) => apiCall<void>(`/api/crops/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),

  delete: (id: string, token: string) =>
    apiCall<void>(`/api/crops/${id}`, { method: 'DELETE' }, token),
};

// --- Plans ---

export const plansApi = {
  getAll: (token: string) =>
    apiCall<{ plans: Plan[] }>('/api/plans', {}, token).then((r) => r.plans),

  getSystemPlans: () =>
    apiCall<{ plans: Plan[] }>('/api/plans/system', {}).then((r) => r.plans),

  get: (id: string, token: string) =>
    apiCall<Plan>(`/api/plans/${id}`, {}, token),

  create: (plan: Omit<Plan, 'id' | 'createdAt' | 'updatedAt' | 'sowingDone' | 'plantingDone'>, token: string) =>
    apiCall<{ id: string }>('/api/plans', { method: 'POST', body: JSON.stringify(plan) }, token).then((r) => r.id),

  update: (
    id: string,
    data: Partial<Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>>,
    token: string
  ) => apiCall<void>(`/api/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),

  delete: (id: string, token: string) =>
    apiCall<void>(`/api/plans/${id}`, { method: 'DELETE' }, token),

  deleteAll: (token: string) =>
    apiCall<{ deleted: number }>('/api/plans', { method: 'DELETE' }, token).then((r) => r.deleted),
};

// --- Preferences ---

export const preferencesApi = {
  get: (token: string) =>
    apiCall<UserPreferences | null>('/api/preferences', {}, token),

  upsert: (data: Partial<Omit<UserPreferences, 'userId' | 'createdAt' | 'updatedAt'>>, token: string) =>
    apiCall<void>('/api/preferences', { method: 'PUT', body: JSON.stringify(data) }, token),
};

// --- System crops (admin / import) ---

export function replaceSystemCrops(
  crops: Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>[],
  token: string
) {
  return apiCall<{ deleted: number; imported: number; errors: number }>(
    '/api/system-crops/replace',
    { method: 'POST', body: JSON.stringify({ crops }) },
    token
  );
}

// --- Migrate guest data ---

export function migrateGuestData(
  payload: { crops: Crop[]; plans: Plan[]; preferences?: UserPreferences | null },
  token: string
) {
  return apiCall<{ cropsCount: number; plansCount: number }>(
    '/api/migrate-guest-data',
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
}
