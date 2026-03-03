import { useState, useRef } from 'react';
import { Crop } from '../../types';
import { MoreVertical, Edit, Copy, Trash2, RotateCcw } from 'lucide-react';
import Card from '../ui/Card';
import MiniCalendar from './MiniCalendar';
import { formatWeekRanges, formatWeekRangesDetail } from '../../utils/weekUtils';

interface CropCardProps {
  crop: Crop;
  onEdit: (crop: Crop) => void;
  onCopy: (crop: Crop) => void;
  onDelete: (crop: Crop) => void;
  onRestoreDefault?: (crop: Crop) => void;
}

function plantingMethodLabel(method: string): string {
  if (method === 'serre') return 'Serre';
  if (method === 'plein_champ') return 'Plein champ';
  return 'Plein champ / Serre';
}

export default function CropCard({
  crop,
  onEdit,
  onCopy,
  onDelete,
  onRestoreDefault,
}: CropCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [showCalendar, setShowCalendar] = useState(true);
  const [periodTooltip, setPeriodTooltip] = useState<{ type: 'sowing' | 'planting'; x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const year = new Date().getFullYear();

  const handlePeriodMouseEnter = (type: 'sowing' | 'planting', e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const card = cardRef.current?.getBoundingClientRect();
    if (card) {
      setPeriodTooltip({
        type,
        x: rect.left - card.left + rect.width / 2,
        y: rect.top - card.top,
      });
    }
  };

  const handlePeriodMouseLeave = () => setPeriodTooltip(null);

  return (
    <Card className="relative overflow-hidden">
      <div ref={cardRef} className="relative">
      {/* En-tête : icône + nom */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span
            className="flex items-center justify-center w-12 h-12 rounded-full text-2xl shrink-0"
            style={{
              backgroundColor: 'rgb(220 252 231)', // green-100
              color: 'rgb(30 58 42)', // green-900
            }}
          >
            {crop.emoji || '🌱'}
          </span>
          <div>
            <h3 className="font-bold text-xl text-gray-800">{crop.name}</h3>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {showActions && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
              <button
                onClick={() => {
                  onEdit(crop);
                  setShowActions(false);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </button>
              <button
                onClick={() => {
                  onCopy(crop);
                  setShowActions(false);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
              >
                <Copy className="w-4 h-4" />
                Copier
              </button>
              {crop.userId !== 'system' && onRestoreDefault && (
                <button
                  onClick={() => {
                    onRestoreDefault(crop);
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-amber-700"
                >
                  <RotateCcw className="w-4 h-4" />
                  Réinitialiser par défaut
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm('Êtes-vous sûr de vouloir supprimer cette culture ?')) {
                    onDelete(crop);
                  }
                  setShowActions(false);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 space-y-4">
        {/* TYPES DE CULTURE */}
        <div>
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Types de culture
          </h4>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
              {crop.type}
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
              {plantingMethodLabel(crop.plantingMethod)}
            </span>
          </div>
        </div>

        {/* RENDEMENT ESTIMÉ */}
        <div>
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Rendement estimé
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-3">
              <p className="text-xs text-gray-500">Semis → Plantation</p>
              <p className="text-lg font-bold text-orange-600">
                {crop.weeksBetweenSowingAndPlanting} sem.
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 px-3 py-3">
              <p className="text-xs text-gray-500">Plantation → Récolte</p>
              <p className="text-lg font-bold text-emerald-700">
                {crop.weeksBetweenPlantingAndHarvest} sem.
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50/30 px-3 py-3">
              <p className="text-xs text-gray-500">Récolte → Destruction</p>
              <p className="text-lg font-bold text-amber-700">
                {(crop.weeksBetweenHarvestAndDestruction ?? 0)} sem.
              </p>
            </div>
          </div>
        </div>

        {/* PÉRIODES DE CULTURE */}
        <div>
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Périodes de culture
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div
              className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-3 cursor-help"
              onMouseEnter={(e) => handlePeriodMouseEnter('sowing', e)}
              onMouseLeave={handlePeriodMouseLeave}
              title={formatWeekRangesDetail(crop.sowingWeeks, year)}
            >
              <p className="text-xs text-gray-500">Période de semis</p>
              <p className="text-sm font-semibold text-gray-800">
                {formatWeekRanges(crop.sowingWeeks)}
              </p>
            </div>
            <div
              className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-3 cursor-help"
              onMouseEnter={(e) => handlePeriodMouseEnter('planting', e)}
              onMouseLeave={handlePeriodMouseLeave}
              title={formatWeekRangesDetail(crop.plantingWeeks, year)}
            >
              <p className="text-xs text-gray-500">Période de plantation</p>
              <p className="text-sm font-semibold text-gray-800">
                {formatWeekRanges(crop.plantingWeeks)}
              </p>
            </div>
          </div>
          {periodTooltip && (
            <div
              className="absolute z-20 px-3 py-2 text-xs font-medium text-gray-800 bg-white border border-gray-200 rounded-lg shadow-lg pointer-events-none whitespace-pre-line"
              style={{
                left: periodTooltip.x,
                top: periodTooltip.y - 8,
                transform: 'translate(-50%, -100%)',
              }}
            >
              {periodTooltip.type === 'sowing'
                ? formatWeekRangesDetail(crop.sowingWeeks, year)
                : formatWeekRangesDetail(crop.plantingWeeks, year)}
            </div>
          )}
        </div>

        {/* Calendrier de culture */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Calendrier de culture
            </h4>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {showCalendar ? 'Masquer' : 'Afficher'}
            </button>
          </div>
          {showCalendar && <MiniCalendar crop={crop} />}
        </div>
      </div>
      </div>
    </Card>
  );
}
