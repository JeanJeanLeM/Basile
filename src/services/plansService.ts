import { Plan } from '../types';
import { calculateSowingWeek } from '../utils/weekUtils';
import * as api from './api';
import * as guest from './guestStorage';
import { getCrop } from './cropsService';

export const SYSTEM_PLAN_USER_ID = 'system';

/** When token is provided, uses API; otherwise uses guest localStorage. */
export async function getPlan(planId: string, token?: string): Promise<Plan | null> {
  if (token) return api.plansApi.get(planId, token).catch(() => null);
  return guest.getGuestPlan(planId);
}

export async function getUserPlans(_userId: string, token?: string): Promise<Plan[]> {
  if (token) return api.plansApi.getAll(token);
  return guest.getGuestPlans().sort((a, b) => a.plantingWeek - b.plantingWeek);
}

export async function getSystemPlans(_token?: string): Promise<Plan[]> {
  // System plans are public - no auth required
  return api.plansApi.getSystemPlans();
}

export async function getPlansByWeek(
  userId: string,
  _weekNumber: number,
  token?: string
): Promise<Plan[]> {
  return getUserPlans(userId, token);
}

export async function searchPlans(
  userId: string,
  searchTerm: string,
  token?: string
): Promise<Plan[]> {
  const plans = await getUserPlans(userId, token);
  const term = searchTerm.toLowerCase();
  return plans.filter((p) => p.cropName.toLowerCase().includes(term));
}

export async function createPlan(
  plan: Omit<Plan, 'id' | 'sowingWeek' | 'createdAt' | 'updatedAt' | 'sowingDone' | 'plantingDone'>,
  token?: string
): Promise<string> {
  const crop = await getCrop(plan.cropId, token);
  if (!crop) throw new Error('Culture introuvable');
  const nurseryWeeks = plan.customNurseryWeeks ?? crop.weeksBetweenSowingAndPlanting;
  const sowingWeek = calculateSowingWeek(plan.plantingWeek, nurseryWeeks);
  const fullPlan = { ...plan, sowingWeek, sowingDone: false, plantingDone: false };

  if (token) return api.plansApi.create(fullPlan, token);
  const created = guest.saveGuestPlan(fullPlan);
  return created.id;
}

export async function updatePlan(
  planId: string,
  updates: Partial<Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>>,
  token?: string
): Promise<void> {
  if (updates.plantingWeek !== undefined || updates.customNurseryWeeks !== undefined) {
    const currentPlan = await getPlan(planId, token);
    if (currentPlan) {
      const crop = await getCrop(currentPlan.cropId, token);
      if (crop) {
        const plantingWeek = updates.plantingWeek ?? currentPlan.plantingWeek;
        const nurseryWeeks =
          updates.customNurseryWeeks ??
          currentPlan.customNurseryWeeks ??
          crop.weeksBetweenSowingAndPlanting;
        updates.sowingWeek = calculateSowingWeek(plantingWeek, nurseryWeeks);
      }
    }
  }

  if (token) return api.plansApi.update(planId, updates, token);
  const existing = guest.getGuestPlan(planId);
  if (!existing) throw new Error('Plan introuvable');
  guest.saveGuestPlan({ ...existing, ...updates });
}

export async function deletePlan(planId: string, token?: string): Promise<void> {
  if (token) return api.plansApi.delete(planId, token);
  guest.deleteGuestPlan(planId);
}

export async function deleteUserPlans(_userId: string, token?: string): Promise<number> {
  if (token) return api.plansApi.deleteAll(token);
  const plans = guest.getGuestPlans();
  guest.deleteAllGuestPlans();
  return plans.length;
}

export async function copyPlan(plan: Plan, newUserId?: string, token?: string): Promise<string> {
  const { id, createdAt, updatedAt, ...planData } = plan;
  const newPlan = { ...planData, userId: newUserId || plan.userId };
  return createPlan(newPlan, token);
}

export async function markSowingDone(planId: string, done: boolean, token?: string): Promise<void> {
  return updatePlan(planId, { sowingDone: done }, token);
}

export async function markPlantingDone(planId: string, done: boolean, token?: string): Promise<void> {
  return updatePlan(planId, { plantingDone: done }, token);
}
