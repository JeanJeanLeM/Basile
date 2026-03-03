import { useState, useEffect } from 'react';
import { UserPreferences } from '../types';
import * as preferencesService from '../services/preferencesService';
import { useAuth } from './useAuth';

export function useUserPreferences() {
  const { user, isGuest, getToken } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      if (isGuest) {
        const prefs = await preferencesService.getUserPreferences('guest');
        setPreferences(prefs);
      } else if (user) {
        const token = await getToken();
        const prefs = await preferencesService.getUserPreferences(user.uid, token);
        setPreferences(prefs);
      } else {
        setPreferences(null);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, [user?.uid, isGuest]);

  const updatePreferences = async (
    updates: Partial<Omit<UserPreferences, 'userId' | 'createdAt' | 'updatedAt'>>
  ) => {
    const userId = user?.uid ?? 'guest';
    const token = isGuest ? undefined : await getToken();
    await preferencesService.updateUserPreferences(userId, updates, token);
    await loadPreferences();
  };

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    refresh: loadPreferences,
  };
}
