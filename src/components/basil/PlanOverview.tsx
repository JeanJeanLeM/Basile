import { useState } from 'react';
import { GeneratedPlanItem } from '../../services/planGeneratorService';
import { Crop } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { getWeekDates, formatWeekRange } from '../../utils/weekUtils';

interface PlanOverviewProps {
  planItems: GeneratedPlanItem[];
  year: number;
  onItemUpdate: (index: number, updates: Partial<GeneratedPlanItem>) => void;
  onItemRemove: (index: number) => void;
  onItemAdd: (item: GeneratedPlanItem) => void;
  onApply: () => Promise<void>;
  onEditPreferences: () => void;
  availableCrops: Crop[];
  loading?: boolean;
}

export default function PlanOverview({
  planItems,
  year,
  onItemUpdate,
  onItemRemove,
  onItemAdd,
  onApply,
  onEditPreferences,
  availableCrops,
  loading = false,
}: PlanOverviewProps) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<Partial<GeneratedPlanItem>>({
    quantity: 1,
  });

  // Grouper les items par semaine de plantation
  const itemsByWeek = planItems.reduce((acc, item, index) => {
    if (!acc[item.plantingWeek]) {
      acc[item.plantingWeek] = [];
    }
    acc[item.plantingWeek].push({ item, index });
    return acc;
  }, {} as Record<number, Array<{ item: GeneratedPlanItem; index: number }>>);

  const weeks = Object.keys(itemsByWeek)
    .map(Number)
    .sort((a, b) => a - b);

  const toggleWeek = (week: number) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(week)) {
      newExpanded.delete(week);
    } else {
      newExpanded.add(week);
    }
    setExpandedWeeks(newExpanded);
  };

  const handleAddItem = () => {
    if (newItem.crop && newItem.plantingWeek && newItem.sowingWeek) {
      onItemAdd(newItem as GeneratedPlanItem);
      setNewItem({ quantity: 1 });
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Plan de culture {year}</h2>
          <p className="text-gray-600">
            {planItems.length} {planItems.length > 1 ? 'plantations' : 'plantation'} planifiée{planItems.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onEditPreferences}>
            Modifier les préférences
          </Button>
          <Button onClick={onApply} disabled={loading || planItems.length === 0}>
            {loading ? 'Application...' : 'Appliquer le plan'}
          </Button>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-3">Ajouter une plantation</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select
              value={newItem.crop?.id || ''}
              onChange={(e) => {
                const crop = availableCrops.find((c) => c.id === e.target.value);
                if (crop) {
                  const plantingWeek = newItem.plantingWeek || 1;
                  const sowingWeek = plantingWeek - crop.weeksBetweenSowingAndPlanting;
                  setNewItem({
                    ...newItem,
                    crop,
                    plantingWeek,
                    sowingWeek: sowingWeek < 1 ? 52 + sowingWeek : sowingWeek,
                    reason: 'Ajout manuel',
                  });
                }
              }}
              options={[
                { value: '', label: 'Sélectionner une culture' },
                ...availableCrops.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <Input
              type="number"
              label="Semaine plantation"
              placeholder="1-52"
              value={newItem.plantingWeek || ''}
              onChange={(e) => {
                const plantingWeek = parseInt(e.target.value) || 1;
                const crop = newItem.crop;
                if (crop) {
                  const sowingWeek = plantingWeek - crop.weeksBetweenSowingAndPlanting;
                  setNewItem({
                    ...newItem,
                    plantingWeek,
                    sowingWeek: sowingWeek < 1 ? 52 + sowingWeek : sowingWeek,
                  });
                } else {
                  setNewItem({ ...newItem, plantingWeek });
                }
              }}
              min={1}
              max={52}
            />
            <Input
              type="number"
              label="Quantité"
              placeholder="1"
              value={newItem.quantity || ''}
              onChange={(e) =>
                setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })
              }
              min={1}
            />
            <div className="flex gap-2">
              <Button onClick={handleAddItem} disabled={!newItem.crop}>
                Ajouter
              </Button>
              <Button variant="secondary" onClick={() => setShowAddForm(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      {!showAddForm && (
        <Button variant="secondary" onClick={() => setShowAddForm(true)}>
          + Ajouter une plantation
        </Button>
      )}

      {/* Liste des semaines */}
      <div className="space-y-2">
        {weeks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucune plantation planifiée. Modifiez vos préférences ou ajoutez des plantations manuellement.
          </div>
        ) : (
          weeks.map((week) => {
            const { start, end } = getWeekDates(week, year);
            const isExpanded = expandedWeeks.has(week);
            const weekItems = itemsByWeek[week];

            return (
              <div key={week} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleWeek(week)}
                  className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-lg">Semaine {week}</span>
                    <span className="text-sm text-gray-600">
                      {formatWeekRange(start, end)}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {weekItems.length} {weekItems.length > 1 ? 'plantations' : 'plantation'}
                    </span>
                  </div>
                  <span className="text-gray-400">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </button>

                {isExpanded && (
                  <div className="p-4 border-t border-gray-200 space-y-3">
                    {weekItems.map(({ item, index }) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-2xl">{item.crop.emoji || '🌱'}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{item.crop.name}</h4>
                            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                              {item.reason}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <Input
                                type="number"
                                label="Semaine semis"
                                value={item.sowingWeek}
                                onChange={(e) => {
                                  const sowingWeek = parseInt(e.target.value) || 1;
                                  onItemUpdate(index, { sowingWeek });
                                }}
                                min={1}
                                max={52}
                              />
                            </div>
                            <div>
                              <Input
                                type="number"
                                label="Semaine plantation"
                                value={item.plantingWeek}
                                onChange={(e) => {
                                  const plantingWeek = parseInt(e.target.value) || 1;
                                  const sowingWeek =
                                    plantingWeek - item.crop.weeksBetweenSowingAndPlanting;
                                  onItemUpdate(index, {
                                    plantingWeek,
                                    sowingWeek: sowingWeek < 1 ? 52 + sowingWeek : sowingWeek,
                                  });
                                }}
                                min={1}
                                max={52}
                              />
                            </div>
                            <div>
                              <Input
                                type="number"
                                label="Quantité"
                                value={item.quantity}
                                onChange={(e) =>
                                  onItemUpdate(index, {
                                    quantity: parseInt(e.target.value) || 1,
                                  })
                                }
                                min={1}
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                variant="danger"
                                onClick={() => onItemRemove(index)}
                                className="text-sm"
                              >
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
