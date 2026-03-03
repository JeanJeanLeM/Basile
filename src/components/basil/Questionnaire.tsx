import { useState } from 'react';
import { UserPreferences } from '../../types';
import QuestionStep from './QuestionStep';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { WINTER_CULTIVATION_OPTIONS, SEASON_EXTENSION_OPTIONS } from '../../utils/constants';
import { Crop } from '../../types';

interface QuestionnaireProps {
  preferences: UserPreferences | null;
  crops: Crop[];
  onSave: (preferences: Partial<UserPreferences>) => Promise<void>;
}

export default function Questionnaire({
  preferences,
  crops,
  onSave,
}: QuestionnaireProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    hasGreenhouse: preferences?.hasGreenhouse ?? false,
    directSowing: preferences?.directSowing ?? false,
    yearLongCrops: preferences?.yearLongCrops ?? ([] as string[]),
    excludedCrops: preferences?.excludedCrops ?? ([] as string[]),
    excludedCropNames: preferences?.excludedCropNames ?? ([] as string[]),
    winterCultivation: preferences?.winterCultivation ?? ('no' as const),
    seasonExtension: preferences?.seasonExtension ?? ('none' as const),
  });
  const [loading, setLoading] = useState(false);

  const totalSteps = 6;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  const toggleYearLongCrop = (cropId: string) => {
    setFormData({
      ...formData,
      yearLongCrops: formData.yearLongCrops.includes(cropId)
        ? formData.yearLongCrops.filter((id) => id !== cropId)
        : [...formData.yearLongCrops, cropId],
    });
  };

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Question {step} sur {totalSteps}</span>
          <span>{Math.round((step / totalSteps) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Greenhouse */}
      {step === 1 && (
        <QuestionStep
          title="Avez-vous une serre ?"
          description="Cela nous aidera à personnaliser vos suggestions"
        >
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasGreenhouse}
                onChange={(e) =>
                  setFormData({ ...formData, hasGreenhouse: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span>Oui, j'ai une serre</span>
            </label>
          </div>
        </QuestionStep>
      )}

      {/* Step 2: Direct Sowing */}
      {step === 2 && (
        <QuestionStep
          title="Souhaitez-vous semer directement en pleine terre ?"
          description="Ou préférez-vous uniquement planter des plants déjà développés ?"
        >
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.directSowing}
                onChange={(e) =>
                  setFormData({ ...formData, directSowing: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span>Oui, je veux semer directement en pleine terre</span>
            </label>
          </div>
        </QuestionStep>
      )}

      {/* Step 3: Year-long crops */}
      {step === 3 && (
        <QuestionStep
          title="Quelles cultures souhaitez-vous récolter toute l'année ?"
          description="Sélectionnez les cultures que vous voulez planter plusieurs fois dans l'année"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {crops.map((crop) => (
              <label
                key={crop.id}
                className={`flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50 ${
                  formData.yearLongCrops.includes(crop.id)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.yearLongCrops.includes(crop.id)}
                  onChange={() => toggleYearLongCrop(crop.id)}
                  className="w-4 h-4"
                />
                <span className="text-lg">{crop.emoji || '🌱'}</span>
                <span className="text-sm">{crop.name}</span>
              </label>
            ))}
          </div>
        </QuestionStep>
      )}

      {/* Step 4: Winter cultivation */}
      {step === 4 && (
        <QuestionStep
          title="Souhaitez-vous cultiver en hiver ?"
          description="Certaines cultures peuvent être cultivées pendant la saison froide"
        >
          <Select
            value={formData.winterCultivation}
            onChange={(e) =>
              setFormData({
                ...formData,
                winterCultivation: e.target.value as 'yes' | 'little' | 'no',
              })
            }
            options={WINTER_CULTIVATION_OPTIONS}
          />
        </QuestionStep>
      )}

      {/* Step 5: Excluded crops */}
      {step === 5 && (
        <QuestionStep
          title="Quelles cultures ne voulez-vous pas avoir ?"
          description="Sélectionnez les cultures que vous ne souhaitez pas cultiver"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {crops.map((crop) => (
              <label
                key={crop.id}
                className={`flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50 ${
                  (formData.excludedCrops.includes(crop.id) || formData.excludedCropNames.includes(crop.name.toLowerCase().trim()))
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={
                    formData.excludedCrops.includes(crop.id) ||
                    formData.excludedCropNames.includes(crop.name.toLowerCase().trim())
                  }
                  onChange={() => {
                    const nameNorm = crop.name.toLowerCase().trim();
                    const isExcluded = formData.excludedCrops.includes(crop.id);
                    setFormData({
                      ...formData,
                      excludedCrops: isExcluded
                        ? formData.excludedCrops.filter((id) => id !== crop.id)
                        : [...formData.excludedCrops, crop.id],
                      excludedCropNames: isExcluded
                        ? formData.excludedCropNames.filter((n) => n !== nameNorm)
                        : [...formData.excludedCropNames, nameNorm],
                    });
                  }}
                  className="w-4 h-4"
                />
                <span className="text-lg">{crop.emoji || '🌱'}</span>
                <span className="text-sm">{crop.name}</span>
              </label>
            ))}
          </div>
        </QuestionStep>
      )}

      {/* Step 6: Season extension */}
      {step === 6 && (
        <QuestionStep
          title="Voulez-vous faire des séries de culture ?"
          description="Planter tôt, tard, ou les deux pour prolonger la période de récolte, ou uniquement en pleine saison"
        >
          <Select
            value={formData.seasonExtension}
            onChange={(e) =>
              setFormData({
                ...formData,
                seasonExtension: e.target.value as 'early' | 'late' | 'both' | 'none',
              })
            }
            options={SEASON_EXTENSION_OPTIONS}
          />
        </QuestionStep>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          variant="secondary"
          onClick={handlePrevious}
          disabled={step === 1}
        >
          Précédent
        </Button>
        {step < totalSteps ? (
          <Button onClick={handleNext}>Suivant</Button>
        ) : (
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer les préférences'}
          </Button>
        )}
      </div>
    </div>
  );
}
