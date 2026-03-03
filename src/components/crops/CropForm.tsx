import { useState, useEffect } from 'react';
import { Crop, CropType, PlantingMethod } from '../../types';
import Input from '../ui/Input';
import Select from '../ui/Select';
import MultiWeekSelect from '../ui/MultiWeekSelect';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { CROP_TYPES, PLANTING_METHODS } from '../../utils/constants';
import { getWeeksForMonthRange, normalizeWeeks } from '../../utils/weekUtils';

interface CropFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (crop: Omit<Crop, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  userId: string;
  initialData?: Crop;
}

export default function CropForm({
  isOpen,
  onClose,
  onSubmit,
  userId,
  initialData,
}: CropFormProps) {
  const [loading, setLoading] = useState(false);
  const currentYear = new Date().getFullYear();
  const fullYearWeeks = getWeeksForMonthRange(1, 12, currentYear);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Légume-fruit' as CropType,
    emoji: '🌱',
    weeksBetweenSowingAndPlanting: 0,
    weeksBetweenPlantingAndHarvest: 0,
    weeksBetweenHarvestAndDestruction: 0,
    sowingWeeks: fullYearWeeks,
    plantingWeeks: fullYearWeeks,
    plantingMethod: 'both' as PlantingMethod,
  });

  useEffect(() => {
    if (initialData) {
      const getInitialWeeks = (type: 'sowing' | 'planting') => {
        const weeks = type === 'sowing' ? initialData.sowingWeeks : initialData.plantingWeeks;
        if (weeks && weeks.length > 0) {
          return normalizeWeeks(weeks);
        }
        const startMonthKey = type === 'sowing' ? 'sowingStartMonth' : 'plantingStartMonth';
        const endMonthKey = type === 'sowing' ? 'sowingEndMonth' : 'plantingEndMonth';
        const startMonth = (initialData as any)?.[startMonthKey];
        const endMonth = (initialData as any)?.[endMonthKey];
        if (typeof startMonth === 'number' && typeof endMonth === 'number') {
          return getWeeksForMonthRange(startMonth, endMonth, currentYear);
        }
        return fullYearWeeks;
      };

      setFormData({
        name: initialData.name,
        type: initialData.type,
        emoji: initialData.emoji || '🌱',
        weeksBetweenSowingAndPlanting:
          initialData.weeksBetweenSowingAndPlanting,
        weeksBetweenPlantingAndHarvest:
          initialData.weeksBetweenPlantingAndHarvest,
        weeksBetweenHarvestAndDestruction:
          initialData.weeksBetweenHarvestAndDestruction ?? 0,
        sowingWeeks: getInitialWeeks('sowing'),
        plantingWeeks: getInitialWeeks('planting'),
        plantingMethod: initialData.plantingMethod,
      });
    } else {
      setFormData({
        name: '',
        type: 'Légume-fruit',
        emoji: '🌱',
        weeksBetweenSowingAndPlanting: 0,
        weeksBetweenPlantingAndHarvest: 0,
        weeksBetweenHarvestAndDestruction: 0,
        sowingWeeks: fullYearWeeks,
        plantingWeeks: fullYearWeeks,
        plantingMethod: 'both',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ ...formData, userId });
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Modifier la culture' : 'Ajouter une culture'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nom"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Input
          label="Emoji"
          value={formData.emoji}
          onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
          placeholder="🌱"
        />

        <Select
          label="Type"
          value={formData.type}
          onChange={(e) =>
            setFormData({ ...formData, type: e.target.value as CropType })
          }
          options={CROP_TYPES}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Semaines semis → plantation"
            type="number"
            min="0"
            value={formData.weeksBetweenSowingAndPlanting}
            onChange={(e) =>
              setFormData({
                ...formData,
                weeksBetweenSowingAndPlanting: parseInt(e.target.value) || 0,
              })
            }
            required
          />

          <Input
            label="Semaines plantation → récolte"
            type="number"
            min="0"
            value={formData.weeksBetweenPlantingAndHarvest}
            onChange={(e) =>
              setFormData({
                ...formData,
                weeksBetweenPlantingAndHarvest: parseInt(e.target.value) || 0,
              })
            }
            required
          />

          <Input
            label="Semaines récolte → destruction"
            type="number"
            min="0"
            value={formData.weeksBetweenHarvestAndDestruction}
            onChange={(e) =>
              setFormData({
                ...formData,
                weeksBetweenHarvestAndDestruction: parseInt(e.target.value) || 0,
              })
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MultiWeekSelect
            label="Semaines de semis"
            value={formData.sowingWeeks}
            onChange={(weeks) =>
              setFormData({
                ...formData,
                sowingWeeks: weeks,
              })
            }
            required
          />

          <MultiWeekSelect
            label="Semaines de plantation"
            value={formData.plantingWeeks}
            onChange={(weeks) =>
              setFormData({
                ...formData,
                plantingWeeks: weeks,
              })
            }
            required
          />
        </div>

        <Select
          label="Méthode de plantation"
          value={formData.plantingMethod}
          onChange={(e) =>
            setFormData({
              ...formData,
              plantingMethod: e.target.value as PlantingMethod,
            })
          }
          options={PLANTING_METHODS}
          required
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
