import { useState, useEffect } from 'react';
import { Plan, Crop } from '../../types';
import Combobox from '../ui/Combobox';
import WeekSelect from '../ui/WeekSelect';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { calculateSowingWeek } from '../../utils/weekUtils';

interface PlanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (plan: Omit<Plan, 'id' | 'sowingWeek' | 'createdAt' | 'updatedAt' | 'sowingDone' | 'plantingDone'>) => Promise<void>;
  crops: Crop[];
  userId: string;
  initialData?: Plan;
}

export default function PlanForm({
  isOpen,
  onClose,
  onSubmit,
  crops,
  userId,
  initialData,
}: PlanFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cropId: '',
    cropName: '',
    quantity: 1,
    plantingWeek: 1,
    notes: '',
  });
  const [calculatedSowingWeek, setCalculatedSowingWeek] = useState<number | null>(null);
  
  // Récupérer la culture sélectionnée
  const selectedCrop = crops.find((c) => c.id === formData.cropId) || null;

  // Inclure la culture du plan en édition si elle n'est plus dans la liste (ex: culture supprimée)
  const cropOptions = (() => {
    const fromCrops = crops.map((crop) => ({
      value: crop.id,
      label: crop.name,
    }));
    if (initialData?.cropId && initialData?.cropName) {
      const exists = fromCrops.some((o) => o.value === initialData.cropId);
      if (!exists) {
        return [
          { value: initialData.cropId, label: initialData.cropName },
          ...fromCrops,
        ];
      }
    }
    return fromCrops;
  })();

  useEffect(() => {
    if (initialData) {
      setFormData({
        cropId: initialData.cropId,
        cropName: initialData.cropName,
        quantity: initialData.quantity,
        plantingWeek: initialData.plantingWeek,
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        cropId: '',
        cropName: '',
        quantity: 1,
        plantingWeek: 1,
        notes: '',
      });
    }
    setCalculatedSowingWeek(null);
  }, [initialData, isOpen]);

  useEffect(() => {
    if (formData.cropId && formData.plantingWeek) {
      const selectedCrop = crops.find((c) => c.id === formData.cropId);
      if (selectedCrop) {
        const sowingWeek = calculateSowingWeek(
          formData.plantingWeek,
          selectedCrop.weeksBetweenSowingAndPlanting
        );
        setCalculatedSowingWeek(sowingWeek);
      }
    }
  }, [formData.cropId, formData.plantingWeek, crops]);

  const handleCropChange = (cropId: string) => {
    const selectedCrop = crops.find((c) => c.id === cropId);
    if (selectedCrop) {
      setFormData({
        ...formData,
        cropId: selectedCrop.id,
        cropName: selectedCrop.name,
      });
    }
  };

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
      title={initialData ? 'Modifier le plan' : 'Planifier une culture'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Combobox
          label="Culture"
          options={cropOptions}
          value={formData.cropId}
          onChange={handleCropChange}
          placeholder="Sélectionner une culture..."
          required
        />

        <WeekSelect
          label="Semaine de plantation"
          value={String(formData.plantingWeek)}
          onChange={(value) =>
            setFormData({
              ...formData,
              plantingWeek: parseInt(value),
            })
          }
          crop={selectedCrop}
          required
        />

        {calculatedSowingWeek !== null && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Semaine de semis calculée :</strong> Semaine {calculatedSowingWeek}
            </p>
          </div>
        )}

        <Input
          label="Quantité"
          type="number"
          min="1"
          value={formData.quantity}
          onChange={(e) =>
            setFormData({
              ...formData,
              quantity: parseInt(e.target.value) || 1,
            })
          }
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={3}
          />
        </div>

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
