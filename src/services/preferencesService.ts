import { UserPreferences } from '../types';
import * as api from './api';
import * as guest from './guestStorage';

/** When token is provided, uses API; otherwise uses guest localStorage. */
export async function getUserPreferences(_userId: string, token?: string): Promise<UserPreferences | null> {
  if (token) return api.preferencesApi.get(token);
  return guest.getGuestPreferences();
}

export async function createUserPreferences(
  preferences: Omit<UserPreferences, 'createdAt' | 'updatedAt'>,
  token?: string
): Promise<void> {
  if (token) return api.preferencesApi.upsert(preferences, token);
  guest.saveGuestPreferences(preferences);
}

export async function updateUserPreferences(
  _userId: string,
  updates: Partial<Omit<UserPreferences, 'userId' | 'createdAt' | 'updatedAt'>>,
  token?: string
): Promise<void> {
  if (token) return api.preferencesApi.upsert(updates, token);
  guest.saveGuestPreferences(updates);
}
