import { useState, useEffect } from 'react';
import { Crop } from '../types';
import * as cropsService from '../services/cropsService';
import { useAuth } from './useAuth';

export function useCrops() {
  const { user, isGuest, getToken } = useAuth();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadCrops = async () => {
    try {
      setLoading(true);
      setError(null);
      if (isGuest) {
        const list = await cropsService.getUserCrops('guest');
        setCrops(list);
      } else if (user) {
        const token = await getToken();
        const list = await cropsService.getUserCrops(user.uid, token);
        setCrops(list);
      } else {
        setCrops([]);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCrops();
  }, [user?.uid, isGuest]);

  const createCrop = async (cropData: Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>) => {
    const userId = user?.uid ?? 'guest';
    if (isGuest) {
      const id = await cropsService.createCrop({ ...cropData, userId });
      await loadCrops();
      return id;
    }
    const token = await getToken();
    const cropId = await cropsService.createCrop({ ...cropData, userId }, token);
    await loadCrops();
    return cropId;
  };

  const updateCrop = async (
    cropId: string,
    updates: Partial<Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    const token = isGuest ? undefined : await getToken();
    await cropsService.updateCrop(cropId, updates, token);
    await loadCrops();
  };

  const deleteCrop = async (cropId: string) => {
    const token = isGuest ? undefined : await getToken();
    await cropsService.deleteCrop(cropId, token);
    await loadCrops();
  };

  const copyCrop = async (crop: Crop) => {
    const userId = user?.uid ?? 'guest';
    const token = isGuest ? undefined : await getToken();
    await cropsService.copyCrop(crop, userId, token);
    await loadCrops();
  };

  return {
    crops,
    loading,
    error,
    createCrop,
    updateCrop,
    deleteCrop,
    copyCrop,
    refresh: loadCrops,
  };
}
