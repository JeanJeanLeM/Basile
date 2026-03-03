import { Crop } from '../types';
import * as api from './api';
import * as guest from './guestStorage';

/** When token is provided, uses API; otherwise uses guest localStorage. */
export async function getCrop(cropId: string, token?: string): Promise<Crop | null> {
  if (token) return api.cropsApi.get(cropId, token).catch(() => null);
  return guest.getGuestCrop(cropId);
}

export async function getUserCrops(_userId: string, token?: string): Promise<Crop[]> {
  if (token) return api.cropsApi.getAll(token);
  const crops = guest.getGuestCrops();
  // For guest we don't have system crops from API; could merge with system from a public endpoint if needed
  return crops.sort((a, b) => a.name.localeCompare(b.name));
}

export async function searchCrops(userId: string, searchTerm: string, token?: string): Promise<Crop[]> {
  const crops = await getUserCrops(userId, token);
  const term = searchTerm.toLowerCase();
  return crops.filter(
    (c) =>
      c.name.toLowerCase().includes(term) || c.type.toLowerCase().includes(term)
  );
}

export async function createCrop(
  crop: Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>,
  token?: string
): Promise<string> {
  if (token) return api.cropsApi.create(crop, token);
  const created = guest.saveGuestCrop(crop);
  return created.id;
}

export async function updateCrop(
  cropId: string,
  updates: Partial<Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>>,
  token?: string
): Promise<void> {
  if (token) return api.cropsApi.update(cropId, updates, token);
  const existing = guest.getGuestCrop(cropId);
  if (!existing) throw new Error('Culture introuvable');
  guest.saveGuestCrop({ ...existing, ...updates });
}

export async function deleteCrop(cropId: string, token?: string): Promise<void> {
  if (token) return api.cropsApi.delete(cropId, token);
  guest.deleteGuestCrop(cropId);
}

export async function copyCrop(crop: Crop, newUserId?: string, token?: string): Promise<string> {
  const { id, createdAt, updatedAt, ...cropData } = crop;
  const newCrop = { ...cropData, userId: newUserId || crop.userId };
  return createCrop(newCrop, token);
}
