import { useState, useRef, useMemo } from 'react';
import { Plan, Crop } from '../../types';
import { getWeeksForYear, getWeekTooltipLabel } from '../../utils/weekUtils';
import { MONTH_NAMES } from '../../utils/constants';
import Combobox from '../ui/Combobox';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { X, Check, Trash2 } from 'lucide-react';

interface PlanningCalendarViewProps {
  plans: Plan[];
  crops: Crop[];
  onUpdatePlan: (planId: string, updates: Partial<Plan>) => Promise<void>;
  onCreatePlan: (plan: Omit<Plan, 'id' | 'sowingWeek' | 'createdAt' | 'updatedAt' | 'sowingDone' | 'plantingDone'>) => Promise<void>;
  onDeletePlan: (planId: string) => Promise<void>;
  onDeleteAllPlans: () => Promise<void>;
}

type CellType = 'empty' | 'nursery' | 'planting' | 'culture' | 'harvest';

interface CalendarRow {
  planId?: string;
  cropId: string;
  cropName: string;
  quantity: number;
  plantingWeek: number;
  nurseryWeeks: number;
  cultureWeeks: number;
  harvestWeeks: number;
  isEditing?: boolean;
  isNew?: boolean;
}

export default function PlanningCalendarView({
  plans,
  crops,
  onUpdatePlan,
  onCreatePlan,
  onDeletePlan,
  onDeleteAllPlans,
}: PlanningCalendarViewProps) {
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingRowData, setEditingRowData] = useState<{
    quantity: number;
    plantingWeek: number;
    nurseryWeeks: number;
    cultureWeeks: number;
    harvestWeeks: number;
  } | null>(null);
  const [filterCropName, setFilterCropName] = useState('');
  const [sortBy, setSortBy] = useState<'cropName' | 'plantingWeek'>('plantingWeek');
  const [selectedCropForPlanning, setSelectedCropForPlanning] = useState<string | null>(null);
  const [planningMode, setPlanningMode] = useState<'sowing' | 'planting' | 'harvest'>('sowing');
  const [previewWeek, setPreviewWeek] = useState<number | null>(null); // Semaine sélectionnée en attente de validation
  
  // Durées personnalisées pour le plan en cours de création
  const [customNurseryWeeks, setCustomNurseryWeeks] = useState<number | null>(null);
  const [customCultureWeeks, setCustomCultureWeeks] = useState<number | null>(null);
  const [customHarvestWeeks, setCustomHarvestWeeks] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const year = new Date().getFullYear();

  // Récupérer la culture sélectionnée
  const selectedCrop = useMemo(() => {
    if (!selectedCropForPlanning) return null;
    return crops.find((c) => c.id === selectedCropForPlanning) || null;
  }, [selectedCropForPlanning, crops]);

  // Durées effectives (custom si défini, sinon valeur de la culture)
  const effectiveNurseryWeeks = customNurseryWeeks ?? selectedCrop?.weeksBetweenSowingAndPlanting ?? 0;
  const effectiveCultureWeeks = customCultureWeeks ?? selectedCrop?.weeksBetweenPlantingAndHarvest ?? 0;
  const effectiveHarvestWeeks = customHarvestWeeks ?? selectedCrop?.weeksBetweenHarvestAndDestruction ?? 0;

  // Calculer la semaine de plantation à partir de la semaine de preview selon le mode
  const previewPlantingWeek = useMemo(() => {
    if (!previewWeek || !selectedCrop) return null;

    let plantingWeek = previewWeek;
    if (planningMode === 'sowing') {
      plantingWeek = previewWeek + effectiveNurseryWeeks;
      if (plantingWeek > 52) plantingWeek -= 52;
    } else if (planningMode === 'harvest') {
      plantingWeek = previewWeek - effectiveCultureWeeks;
      if (plantingWeek < 1) plantingWeek += 52;
    }
    return plantingWeek;
  }, [previewWeek, selectedCrop, planningMode, effectiveNurseryWeeks, effectiveCultureWeeks]);

  // Obtenir les semaines recommandées selon le mode
  const recommendedWeeks = useMemo(() => {
    if (!selectedCrop) return new Set<number>();
    
    if (planningMode === 'sowing') {
      return new Set(selectedCrop.sowingWeeks || []);
    } else if (planningMode === 'planting') {
      return new Set(selectedCrop.plantingWeeks || []);
    } else {
      // Pour le mode récolte, calculer les semaines de récolte à partir des semaines de plantation
      const harvestWeeks = new Set<number>();
      (selectedCrop.plantingWeeks || []).forEach((pw) => {
        let hw = pw + (selectedCrop.weeksBetweenPlantingAndHarvest ?? 0);
        if (hw > 52) hw -= 52;
        harvestWeeks.add(hw);
      });
      return harvestWeeks;
    }
  }, [selectedCrop, planningMode]);

  const allWeeks = getWeeksForYear(year);
  const weeksByMonth = useMemo(() => {
    return allWeeks.reduce(
      (acc, w) => {
        const m = w.month;
        if (!acc[m]) acc[m] = [];
        acc[m].push(w.number);
        return acc;
      },
      {} as Record<number, number[]>
    );
  }, [allWeeks]);

  const monthOrder = useMemo(
    () => (Object.keys(weeksByMonth) as unknown as number[]).sort((a, b) => a - b),
    [weeksByMonth]
  );

  // Convertir les plans en lignes de calendrier
  const calendarRows = useMemo(() => {
    const rows: CalendarRow[] = plans
      .filter((plan) =>
        filterCropName
          ? plan.cropName.toLowerCase().includes(filterCropName.toLowerCase())
          : true
      )
      .map((plan) => {
        const crop = crops.find((c) => c.id === plan.cropId);
        // Utiliser les valeurs custom du plan si elles existent, sinon celles de la culture
        return {
          planId: plan.id,
          cropId: plan.cropId,
          cropName: plan.cropName,
          quantity: plan.quantity,
          plantingWeek: plan.plantingWeek,
          nurseryWeeks: plan.customNurseryWeeks ?? crop?.weeksBetweenSowingAndPlanting ?? 0,
          cultureWeeks: plan.customCultureWeeks ?? crop?.weeksBetweenPlantingAndHarvest ?? 0,
          harvestWeeks: plan.customHarvestWeeks ?? crop?.weeksBetweenHarvestAndDestruction ?? 0,
        };
      });

    // Tri
    rows.sort((a, b) => {
      if (sortBy === 'cropName') {
        return a.cropName.localeCompare(b.cropName);
      }
      return a.plantingWeek - b.plantingWeek;
    });

    return rows;
  }, [plans, crops, filterCropName, sortBy]);

  const cropOptions = useMemo(
    () =>
      crops.map((crop) => ({
        value: crop.id,
        label: crop.name,
      })),
    [crops]
  );

  const getCellType = (row: CalendarRow, weekNum: number): CellType => {
    const P = row.plantingWeek; // Semaine de plantation
    
    // Calculer la semaine de semis (début de la pépinière)
    let S = P - row.nurseryWeeks;
    if (S < 1) S += 52; // Gérer le passage d'année
    
    // Calculer la première semaine de récolte
    let H = P + row.cultureWeeks;
    if (H > 52) H -= 52; // Gérer le passage d'année

    // Pépinière : de S (semis) jusqu'à P-1 (avant plantation)
    if (row.nurseryWeeks > 0) {
      for (let i = 0; i < row.nurseryWeeks; i++) {
        const week = S + i;
        const normalizedWeek = week > 52 ? week - 52 : week;
        if (weekNum === normalizedWeek) return 'nursery';
      }
    }

    // Plantation : exactement la semaine P
    if (weekNum === P) return 'planting';

    // Culture : de P+1 jusqu'à H-1 (avant récolte)
    if (row.cultureWeeks > 0) {
      for (let i = 1; i < row.cultureWeeks; i++) {
        const week = P + i;
        const normalizedWeek = week > 52 ? week - 52 : week;
        if (weekNum === normalizedWeek) return 'culture';
      }
    }

    // Récolte : de H pendant harvestWeeks semaines
    if (row.harvestWeeks > 0) {
      for (let i = 0; i < row.harvestWeeks; i++) {
        const week = H + i;
        const normalizedWeek = week > 52 ? week - 52 : week;
        if (weekNum === normalizedWeek) return 'harvest';
      }
    }

    return 'empty';
  };

  const handleWeekMouseEnter = (weekNum: number, e: React.MouseEvent<HTMLDivElement>) => {
    setHoveredWeek(weekNum);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const container = containerRef.current?.getBoundingClientRect();
    if (container) {
      setTooltipPos({
        x: rect.left - container.left + rect.width / 2,
        y: rect.top - container.top,
      });
    }
  };

  const handleWeekMouseLeave = () => setHoveredWeek(null);

  // Clic sur une semaine → définit le preview (étape 1)
  const handleWeekClick = (weekNum: number) => {
    setPreviewWeek(weekNum);
  };

  // Validation du plan (étape 2)
  const handleValidatePlan = async () => {
    if (!selectedCrop || !previewPlantingWeek) return;

    try {
      // Déterminer si des valeurs custom ont été définies (différentes de la culture)
      const hasCustomNursery = customNurseryWeeks !== null && 
        customNurseryWeeks !== selectedCrop.weeksBetweenSowingAndPlanting;
      const hasCustomCulture = customCultureWeeks !== null && 
        customCultureWeeks !== selectedCrop.weeksBetweenPlantingAndHarvest;
      const hasCustomHarvest = customHarvestWeeks !== null && 
        customHarvestWeeks !== (selectedCrop.weeksBetweenHarvestAndDestruction ?? 0);

      await onCreatePlan({
        cropId: selectedCrop.id,
        cropName: selectedCrop.name,
        quantity: 1,
        plantingWeek: previewPlantingWeek,
        notes: '',
        userId: '',
        // Inclure les durées custom seulement si modifiées
        ...(hasCustomNursery && { customNurseryWeeks }),
        ...(hasCustomCulture && { customCultureWeeks }),
        ...(hasCustomHarvest && { customHarvestWeeks }),
      });
      // Réinitialiser le preview mais garder la culture sélectionnée pour ajouter d'autres dates
      setPreviewWeek(null);
      // Réinitialiser aussi les durées custom
      setCustomNurseryWeeks(null);
      setCustomCultureWeeks(null);
      setCustomHarvestWeeks(null);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    }
  };

  // Annuler le preview
  const handleCancelPreview = () => {
    setPreviewWeek(null);
  };

  // Réinitialiser tout
  const handleResetPlanning = () => {
    setSelectedCropForPlanning(null);
    setPreviewWeek(null);
    setPlanningMode('sowing');
    setCustomNurseryWeeks(null);
    setCustomCultureWeeks(null);
    setCustomHarvestWeeks(null);
  };

  const renderWeekCell = (
    weekNum: number,
    cellType: CellType,
    options: { 
      interactive?: boolean; 
      onClick?: () => void;
      isRecommended?: boolean;
      isSelected?: boolean;
    } = {}
  ) => {
    const { interactive = false, onClick, isRecommended = false, isSelected = false } = options;
    const tooltip = getWeekTooltipLabel(weekNum, year);

    let bg = 'bg-gray-50';
    let borderColor = 'border-gray-200';
    
    // Couleurs similaires au mode simulation de l'écran culture
    if (cellType === 'nursery') {
      bg = 'bg-sky-100';
      borderColor = 'border-sky-200';
    } else if (cellType === 'planting') {
      bg = 'bg-emerald-300';
      borderColor = 'border-emerald-400';
    } else if (cellType === 'culture') {
      bg = 'bg-emerald-100';
      borderColor = 'border-emerald-200';
    } else if (cellType === 'harvest') {
      bg = 'bg-amber-200';
      borderColor = 'border-amber-300';
    }

    // Style pour la semaine sélectionnée
    const selectedStyle = isSelected ? 'ring-2 ring-primary-600 ring-offset-1' : '';
    
    // Style pour les semaines recommandées (bordure épaisse)
    const recommendedStyle = isRecommended && !isSelected ? 'ring-2 ring-green-500 ring-inset' : '';

    return (
      <div
        key={weekNum}
        title={tooltip}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        onMouseEnter={(e) => handleWeekMouseEnter(weekNum, e)}
        onMouseLeave={handleWeekMouseLeave}
        onClick={onClick}
        className={`h-6 sm:h-8 rounded-sm transition-colors flex-shrink-0 ${bg} border ${borderColor} ${selectedStyle} ${recommendedStyle} ${
          interactive ? 'cursor-pointer hover:ring-2 hover:ring-primary-500' : ''
        }`}
        style={{ flexGrow: 1, flexBasis: 0, minWidth: 6 }}
      />
    );
  };

  const handleStartEdit = (row: CalendarRow) => {
    setEditingRowId(row.planId!);
    setEditingRowData({
      quantity: row.quantity,
      plantingWeek: row.plantingWeek,
      nurseryWeeks: row.nurseryWeeks,
      cultureWeeks: row.cultureWeeks,
      harvestWeeks: row.harvestWeeks,
    });
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditingRowData(null);
  };

  const handleSaveRow = async (row: CalendarRow) => {
    if (!row.planId || !editingRowData) return;
    
    // Trouver la culture pour comparer avec les valeurs par défaut
    const crop = crops.find((c) => c.id === row.cropId);
    
    try {
      // Construire l'objet de mise à jour sans les valeurs undefined
      const updates: Record<string, unknown> = {
        quantity: editingRowData.quantity,
        plantingWeek: editingRowData.plantingWeek,
      };
      
      // Ajouter les valeurs custom seulement si différentes de la culture
      if (crop) {
        if (editingRowData.nurseryWeeks !== crop.weeksBetweenSowingAndPlanting) {
          updates.customNurseryWeeks = editingRowData.nurseryWeeks;
        } else {
          updates.customNurseryWeeks = null; // Supprimer la valeur custom
        }
        
        if (editingRowData.cultureWeeks !== crop.weeksBetweenPlantingAndHarvest) {
          updates.customCultureWeeks = editingRowData.cultureWeeks;
        } else {
          updates.customCultureWeeks = null; // Supprimer la valeur custom
        }
        
        if (editingRowData.harvestWeeks !== (crop.weeksBetweenHarvestAndDestruction ?? 0)) {
          updates.customHarvestWeeks = editingRowData.harvestWeeks;
        } else {
          updates.customHarvestWeeks = null; // Supprimer la valeur custom
        }
      }
      
      await onUpdatePlan(row.planId, updates);
      setEditingRowId(null);
      setEditingRowData(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleDeleteRow = async (planId: string) => {
    if (!confirm('Supprimer ce plan ?')) return;
    try {
      await onDeletePlan(planId);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Supprimer TOUS les plans de planification ? Cette action est irréversible.')) return;
    try {
      await onDeleteAllPlans();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  return (
    <div ref={containerRef} className="relative max-w-full min-w-0">
      {/* Filtres et tri */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Filtrer par culture..."
            value={filterCropName}
            onChange={(e) => setFilterCropName(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="w-full sm:w-40">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'cropName' | 'plantingWeek')}
              options={[
                { value: 'plantingWeek', label: 'Trier par semaine' },
                { value: 'cropName', label: 'Trier par culture' },
              ]}
              className="py-1.5 text-sm sm:text-sm"
            />
          </div>
          {plans.length > 0 && (
            <Button
              variant="danger"
              onClick={handleDeleteAll}
              className="inline-flex items-center gap-1.5 text-xs px-2 py-1.5 sm:px-3 sm:py-2 shrink-0"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Supprimer tout</span>
            </Button>
          )}
        </div>
      </div>

      {/* Sélection de culture et mode pour ajout */}
      <div className="mb-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
          <span className="text-sm font-medium text-gray-700 shrink-0">
            Ajouter une culture :
          </span>
          <div className="flex-1 min-w-0 w-full">
            <Combobox
              options={cropOptions}
              value={selectedCropForPlanning ?? undefined}
              onChange={(value) => {
                setSelectedCropForPlanning(value);
                setPreviewWeek(null); // Reset preview when changing crop
              }}
              placeholder="Sélectionner une culture..."
            />
          </div>
          {selectedCropForPlanning && (
            <button
              type="button"
              onClick={handleResetPlanning}
              className="text-xs sm:text-sm text-primary-600 hover:underline shrink-0"
            >
              Annuler
            </button>
          )}
        </div>
        
        {selectedCropForPlanning && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
              <span className="text-[11px] sm:text-xs font-medium text-gray-600 shrink-0">
                Mode de planification :
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { setPlanningMode('sowing'); setPreviewWeek(null); }}
                  className={`px-2 py-1 text-[11px] sm:px-3 sm:py-1.5 sm:text-xs rounded-md transition-colors ${
                    planningMode === 'sowing'
                      ? 'bg-sky-500 text-white font-medium'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  🌱 Semis
                </button>
                <button
                  type="button"
                  onClick={() => { setPlanningMode('planting'); setPreviewWeek(null); }}
                  className={`px-2 py-1 text-[11px] sm:px-3 sm:py-1.5 sm:text-xs rounded-md transition-colors ${
                    planningMode === 'planting'
                      ? 'bg-emerald-500 text-white font-medium'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  🌿 Plantation
                </button>
                <button
                  type="button"
                  onClick={() => { setPlanningMode('harvest'); setPreviewWeek(null); }}
                  className={`px-2 py-1 text-[11px] sm:px-3 sm:py-1.5 sm:text-xs rounded-md transition-colors ${
                    planningMode === 'harvest'
                      ? 'bg-amber-500 text-white font-medium'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  🌾 Récolte
                </button>
              </div>
            </div>
            
            <div className="text-[10px] sm:text-xs text-gray-600 flex flex-wrap items-center gap-2 sm:gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-gray-100 ring-2 ring-green-500 ring-inset" />
                Semaines recommandées
              </span>
              <span>
                {planningMode === 'sowing' && '→ Cliquez sur une semaine de semis'}
                {planningMode === 'planting' && '→ Cliquez sur une semaine de plantation'}
                {planningMode === 'harvest' && '→ Cliquez sur une semaine de récolte'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Calendrier avec scroll horizontal sur mobile */}
      <div className="overflow-x-auto -mx-1 px-1" style={{ minHeight: 0 }}>
        <div className="min-w-[520px]">
          {/* En-têtes des mois */}
          <div className="flex mb-2">
            <div className="w-20 sm:w-48 flex-shrink-0" />
            <div className="flex gap-px flex-1">
              {monthOrder.map((monthNum) => (
                <div
                  key={monthNum}
                  className="flex justify-center items-center text-[10px] sm:text-xs font-medium text-gray-600 border-b border-gray-300 pb-1"
                  style={{ flex: weeksByMonth[monthNum].length }}
                >
                  <span className="sm:hidden">{MONTH_NAMES[monthNum - 1].substring(0, 3)}</span>
                  <span className="hidden sm:inline">{MONTH_NAMES[monthNum - 1]}</span>
                </div>
              ))}
            </div>
          </div>

      {/* Lignes de plans existants */}
      {calendarRows.map((row) => (
        <div key={row.planId} className={`mb-1 ${editingRowId === row.planId ? 'bg-yellow-50 border border-yellow-200 rounded-lg p-2' : ''}`}>
          {editingRowId === row.planId && editingRowData ? (
            <>
              {/* Mode édition étendu */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {row.cropName} - Modification
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    <X className="w-3 h-3 inline mr-1" />
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveRow(row)}
                    className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <Check className="w-3 h-3 inline mr-1" />
                    Enregistrer
                  </button>
                </div>
              </div>
              
              {/* Champs éditables */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-end gap-3 sm:gap-4 mb-2 p-2 bg-white rounded border border-gray-200">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] sm:text-xs text-gray-600">Quantité</label>
                  <input
                    type="number"
                    min="1"
                    value={editingRowData.quantity}
                    onChange={(e) => setEditingRowData({
                      ...editingRowData,
                      quantity: Math.max(1, parseInt(e.target.value) || 1)
                    })}
                    className="w-14 px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] sm:text-xs text-gray-600">Sem. plantation</label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={editingRowData.plantingWeek}
                    onChange={(e) => setEditingRowData({
                      ...editingRowData,
                      plantingWeek: Math.min(52, Math.max(1, parseInt(e.target.value) || 1))
                    })}
                    className="w-14 px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>

                <span className="text-[10px] sm:text-xs font-medium text-gray-500 col-span-2 sm:col-span-1 pt-1">Durées :</span>
                  
                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] sm:text-xs text-sky-700">Pépinière</label>
                  <input
                    type="number"
                    min="0"
                    max="52"
                    value={editingRowData.nurseryWeeks}
                    onChange={(e) => setEditingRowData({
                      ...editingRowData,
                      nurseryWeeks: Math.max(0, parseInt(e.target.value) || 0)
                    })}
                    className="w-12 px-2 py-1 text-xs border border-sky-300 rounded bg-sky-50"
                  />
                </div>

                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] sm:text-xs text-emerald-700">Culture</label>
                  <input
                    type="number"
                    min="0"
                    max="52"
                    value={editingRowData.cultureWeeks}
                    onChange={(e) => setEditingRowData({
                      ...editingRowData,
                      cultureWeeks: Math.max(0, parseInt(e.target.value) || 0)
                    })}
                    className="w-12 px-2 py-1 text-xs border border-emerald-300 rounded bg-emerald-50"
                  />
                </div>

                <div className="flex flex-col gap-0.5">
                  <label className="text-[10px] sm:text-xs text-amber-700">Récolte</label>
                  <input
                    type="number"
                    min="0"
                    max="52"
                    value={editingRowData.harvestWeeks}
                    onChange={(e) => setEditingRowData({
                      ...editingRowData,
                      harvestWeeks: Math.max(0, parseInt(e.target.value) || 0)
                    })}
                    className="w-12 px-2 py-1 text-xs border border-amber-300 rounded bg-amber-50"
                  />
                </div>
              </div>

              {/* Calendrier avec les valeurs en cours d'édition */}
              <div className="overflow-x-auto">
                <div className="flex items-center min-w-[520px]">
                <div className="w-20 sm:w-48 flex-shrink-0 pr-2">
                  <span className="text-[10px] sm:text-xs text-gray-500">
                    Aperçu avec modifications
                  </span>
                </div>
                <div className="flex gap-px flex-1">
                  {allWeeks.map(({ number: weekNum }) => {
                    const editingRow: CalendarRow = {
                      ...row,
                      plantingWeek: editingRowData.plantingWeek,
                      nurseryWeeks: editingRowData.nurseryWeeks,
                      cultureWeeks: editingRowData.cultureWeeks,
                      harvestWeeks: editingRowData.harvestWeeks,
                    };
                    return renderWeekCell(weekNum, getCellType(editingRow, weekNum), {
                      interactive: false,
                    });
                  })}
                </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center group">
              <div className="w-20 sm:w-48 flex-shrink-0 pr-2 flex items-center gap-2 min-w-0">
                <span className="text-[10px] sm:text-sm font-medium text-gray-900 truncate flex-1 min-w-0">
                  {row.cropName} ({row.quantity})
                </span>
                <button
                  type="button"
                  onClick={() => handleStartEdit(row)}
                  className="opacity-0 group-hover:opacity-100 text-xs text-primary-600 hover:underline"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteRow(row.planId!)}
                  className="opacity-0 group-hover:opacity-100 text-xs text-red-600 hover:underline"
                >
                  Suppr.
                </button>
              </div>
              <div className="flex gap-px flex-1">
                {allWeeks.map(({ number: weekNum }) =>
                  renderWeekCell(weekNum, getCellType(row, weekNum), {
                    interactive: false,
                  })
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Ligne interactive pour sélectionner une semaine */}
      {selectedCrop && !previewWeek && (
        <div className="flex mb-1 items-center border-t-2 border-primary-300 pt-2 mt-2 bg-gradient-to-r from-primary-50 to-transparent">
          <div className="w-20 sm:w-48 flex-shrink-0 pr-2 flex items-center gap-2 min-w-0">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] sm:text-sm font-medium text-primary-900 truncate">
                {selectedCrop.name}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-600 hidden sm:block">
                Sélectionnez une semaine de {planningMode === 'sowing' ? 'semis' : planningMode === 'planting' ? 'plantation' : 'récolte'}
              </span>
            </div>
          </div>
          <div className="flex gap-px flex-1">
            {allWeeks.map(({ number: weekNum }) => {
              const isRecommended = recommendedWeeks.has(weekNum);
              
              return renderWeekCell(weekNum, 'empty', {
                interactive: true,
                onClick: () => handleWeekClick(weekNum),
                isRecommended,
                isSelected: false,
              });
            })}
          </div>
        </div>
      )}

      {/* Ligne de prévisualisation après sélection d'une semaine */}
      {selectedCrop && previewWeek && previewPlantingWeek && (
        <div className="border-t-2 border-green-400 pt-2 mt-2 bg-gradient-to-r from-green-50 to-transparent rounded-lg p-3">
          {/* Info sur la sélection et boutons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-sm font-medium text-green-900">
                {selectedCrop.name} - Aperçu
              </span>
              <span className="text-[10px] sm:text-xs text-gray-600">
                {planningMode === 'sowing' && `Semis semaine ${previewWeek} → Plantation semaine ${previewPlantingWeek}`}
                {planningMode === 'planting' && `Plantation semaine ${previewPlantingWeek}`}
                {planningMode === 'harvest' && `Récolte semaine ${previewWeek} → Plantation semaine ${previewPlantingWeek}`}
              </span>
              {!recommendedWeeks.has(previewWeek) && (
                <span className="text-[10px] sm:text-xs text-orange-600 font-medium">
                  ⚠️ Hors période recommandée
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <Button
                variant="secondary"
                onClick={handleCancelPreview}
                className="w-full sm:w-auto"
              >
                <X className="w-4 h-4 mr-1" />
                Modifier
              </Button>
              <Button
                variant="primary"
                onClick={handleValidatePlan}
                className="w-full sm:w-auto"
              >
                <Check className="w-4 h-4 mr-1" />
                Ajouter au plan
              </Button>
            </div>
          </div>

          {/* Champs éditables pour les durées */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 sm:gap-6 mb-3 p-2 bg-white rounded border border-gray-200">
            <span className="text-[10px] sm:text-xs font-medium text-gray-700 col-span-2 sm:col-span-1">Durées (semaines) :</span>
            
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] sm:text-xs text-sky-700 font-medium">Pépinière</label>
              <input
                type="number"
                min="0"
                max="52"
                value={effectiveNurseryWeeks}
                onChange={(e) => setCustomNurseryWeeks(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-14 px-2 py-1 text-xs border border-sky-300 rounded focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-sky-50"
              />
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] sm:text-xs text-emerald-700 font-medium">Culture</label>
              <input
                type="number"
                min="0"
                max="52"
                value={effectiveCultureWeeks}
                onChange={(e) => setCustomCultureWeeks(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-14 px-2 py-1 text-xs border border-emerald-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50"
              />
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] sm:text-xs text-amber-700 font-medium">Récolte</label>
              <input
                type="number"
                min="0"
                max="52"
                value={effectiveHarvestWeeks}
                onChange={(e) => setCustomHarvestWeeks(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-14 px-2 py-1 text-xs border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-amber-50"
              />
            </div>

            {(customNurseryWeeks !== null || customCultureWeeks !== null || customHarvestWeeks !== null) && (
              <button
                type="button"
                onClick={() => {
                  setCustomNurseryWeeks(null);
                  setCustomCultureWeeks(null);
                  setCustomHarvestWeeks(null);
                }}
                className="text-[10px] sm:text-xs text-gray-500 hover:text-gray-700 underline col-span-2 sm:col-span-1"
              >
                Réinitialiser aux valeurs par défaut
              </button>
            )}
          </div>

          {/* Calendrier de prévisualisation */}
          <div className="overflow-x-auto">
            <div className="flex items-center min-w-[520px]">
              <div className="w-20 sm:w-48 flex-shrink-0 pr-2">
                <span className="text-xs text-gray-500">
                  Semaine plantation: {previewPlantingWeek}
                </span>
              </div>
              <div className="flex gap-px flex-1">
              {allWeeks.map(({ number: weekNum }) => {
                const previewRow: CalendarRow = {
                  cropId: selectedCrop.id,
                  cropName: selectedCrop.name,
                  quantity: 1,
                  plantingWeek: previewPlantingWeek,
                  nurseryWeeks: effectiveNurseryWeeks,
                  cultureWeeks: effectiveCultureWeeks,
                  harvestWeeks: effectiveHarvestWeeks,
                };

                return renderWeekCell(weekNum, getCellType(previewRow, weekNum), {
                  interactive: false,
                  isSelected: weekNum === previewWeek,
                });
              })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message si aucune culture sélectionnée */}
      {!selectedCrop && (
        <div className="flex mb-1 items-center border-t-2 border-gray-300 pt-2 mt-2">
          <div className="w-20 sm:w-48 flex-shrink-0 pr-2">
            <span className="text-xs sm:text-sm text-gray-500 italic">
              Sélectionnez une culture ci-dessus
            </span>
          </div>
          <div className="flex gap-px flex-1">
            {allWeeks.map(({ number: weekNum }) =>
              renderWeekCell(weekNum, 'empty', { interactive: false })
            )}
          </div>
        </div>
      )}
        </div>
      </div>

      {/* Tooltip au survol */}
      {hoveredWeek !== null && (
        <div
          className="absolute z-10 px-2 py-1.5 text-xs font-medium text-gray-800 bg-white border border-gray-200 rounded shadow-lg whitespace-nowrap pointer-events-none"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y - 32,
            transform: 'translateX(-50%)',
          }}
        >
          {getWeekTooltipLabel(hoveredWeek, year)}
        </div>
      )}

      {/* Légende */}
      <div className="mt-4 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-x-2 sm:gap-x-6 gap-y-2 text-[10px] sm:text-xs text-gray-700">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-sky-100 border border-sky-200 shrink-0" />
            <span className="font-medium">Pépinière</span>
            <span className="text-gray-500 hidden sm:inline">(semis)</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-emerald-300 border border-emerald-400 shrink-0" />
            <span className="font-medium">Plantation</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-emerald-100 border border-emerald-200 shrink-0" />
            <span className="font-medium">Culture</span>
            <span className="text-gray-500 hidden sm:inline">(croissance)</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-amber-200 border border-amber-300 shrink-0" />
            <span className="font-medium">Récolte</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 sm:border-l sm:pl-4 sm:ml-2">
            <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-gray-100 ring-2 ring-green-500 ring-inset shrink-0" />
            <span className="font-medium text-green-700">Recommandé</span>
          </div>
        </div>
      </div>

      {calendarRows.length === 0 && !filterCropName && (
        <div className="text-center py-12 text-gray-500">
          Aucun plan. Ajoutez-en un ci-dessus.
        </div>
      )}
      {calendarRows.length === 0 && filterCropName && (
        <div className="text-center py-12 text-gray-500">
          Aucun plan ne correspond au filtre.
        </div>
      )}
    </div>
  );
}
