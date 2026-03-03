import { getGuestData, clearGuestData } from './guestStorage';

const API_URL = import.meta.env.VITE_API_URL || '';

export interface MigrateGuestDataResult {
  success: boolean;
  cropsCount?: number;
  plansCount?: number;
  error?: string;
}

/**
 * Sends guest data (localStorage) to the API to migrate into the user's account.
 * On success, clears localStorage guest data.
 */
export async function migrateGuestDataToServer(token: string): Promise<MigrateGuestDataResult> {
  const { crops, plans, preferences } = getGuestData();

  if (crops.length === 0 && plans.length === 0 && !preferences) {
    return { success: true, cropsCount: 0, plansCount: 0 };
  }

  try {
    const res = await fetch(`${API_URL}/api/migrate-guest-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        crops,
        plans,
        preferences: preferences ?? undefined,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: text || res.statusText };
    }

    const data = (await res.json()) as { cropsCount?: number; plansCount?: number };
    clearGuestData();
    return {
      success: true,
      cropsCount: data.cropsCount ?? crops.length,
      plansCount: data.plansCount ?? plans.length,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
