import { useState, useEffect } from 'react';
import { Plan } from '../types';
import * as plansService from '../services/plansService';
import { useAuth } from './useAuth';

export function usePlans() {
  const { user, isGuest, getToken } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadPlans = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      if (isGuest) {
        const list = await plansService.getUserPlans('guest');
        setPlans(list);
      } else if (user) {
        const token = await getToken();
        const list = await plansService.getUserPlans(user.uid, token);
        setPlans(list);
      } else {
        setPlans([]);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [user?.uid, isGuest]);

  const createPlan = async (
    planData: Omit<Plan, 'id' | 'sowingWeek' | 'createdAt' | 'updatedAt' | 'sowingDone' | 'plantingDone'>
  ) => {
    const userId = user?.uid ?? 'guest';
    if (isGuest) {
      const id = await plansService.createPlan({ ...planData, userId });
      await loadPlans(false);
      return id;
    }
    const token = await getToken();
    const planId = await plansService.createPlan({ ...planData, userId }, token);
    await loadPlans(false);
    return planId;
  };

  const updatePlan = async (
    planId: string,
    updates: Partial<Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    const token = isGuest ? undefined : await getToken();
    const previousPlans = [...plans];
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, ...updates } : p))
    );
    try {
      await plansService.updatePlan(planId, updates, token);
      await loadPlans(false);
    } catch (err) {
      setPlans(previousPlans);
      throw err;
    }
  };

  const deletePlan = async (planId: string) => {
    const token = isGuest ? undefined : await getToken();
    const previousPlans = [...plans];
    setPlans((prev) => prev.filter((p) => p.id !== planId));
    try {
      await plansService.deletePlan(planId, token);
    } catch (err) {
      setPlans(previousPlans);
      throw err;
    }
  };

  const copyPlan = async (plan: Plan) => {
    const userId = user?.uid ?? 'guest';
    const token = isGuest ? undefined : await getToken();
    await plansService.copyPlan(plan, userId, token);
    await loadPlans(false);
  };

  const markSowingDone = async (planId: string, done: boolean) => {
    const token = isGuest ? undefined : await getToken();
    await plansService.markSowingDone(planId, done, token);
    await loadPlans(false);
  };

  const markPlantingDone = async (planId: string, done: boolean) => {
    const token = isGuest ? undefined : await getToken();
    await plansService.markPlantingDone(planId, done, token);
    await loadPlans(false);
  };

  const deleteAllPlans = async () => {
    const userId = user?.uid ?? 'guest';
    const token = isGuest ? undefined : await getToken();
    const previousPlans = [...plans];
    setPlans([]);
    try {
      await plansService.deleteUserPlans(userId, token);
    } catch (err) {
      setPlans(previousPlans);
      throw err;
    }
  };

  return {
    plans,
    loading,
    error,
    createPlan,
    updatePlan,
    deletePlan,
    deleteAllPlans,
    copyPlan,
    markSowingDone,
    markPlantingDone,
    refresh: loadPlans,
  };
}
