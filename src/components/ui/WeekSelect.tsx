import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import Badge from './Badge';
import { Crop } from '../../types';
import { getWeekDates, getWeeksForMonthRange, normalizeWeeks } from '../../utils/weekUtils';
import {
  GreenhouseType,
  SeasonType,
  getGreenhouseBadgeText,
  getSeasonTypeBadgeText,
} from '../../utils/weekData';

interface WeekSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  crop?: Crop | null; // Culture sélectionnée pour calculer les badges
}

export default function WeekSelect({
  label,
  value,
  onChange,
  error,
  disabled,
  required,
  crop,
}: WeekSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();

  // Formater la date en français (ex: "4 janvier")
  const formatDateFrench = (date: Date): string => {
    const day = date.getDate();
    const monthNames = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    const month = monthNames[date.getMonth()];
    return `${day} ${month}`;
  };

  // Générer les options de semaines (1-52) avec dates
  const weekOptions = useMemo(() => {
    return Array.from({ length: 52 }, (_, i) => {
      const weekNumber = i + 1;
      const { start } = getWeekDates(weekNumber, currentYear);
      const dateStr = formatDateFrench(start);
      return {
        value: String(weekNumber),
        label: `Semaine ${weekNumber} - ${dateStr}`,
        weekNumber,
      };
    });
  }, [currentYear]);

  // Calculer les métadonnées pour une semaine basées sur la culture
  const getWeekMetadata = (weekNumber: number): {
    greenhouse: GreenhouseType;
    seasonType: SeasonType;
    isInPlantingPeriod: boolean;
  } => {
    if (!crop) {
      return {
        greenhouse: 'both',
        seasonType: 'main',
        isInPlantingPeriod: false,
      };
    }

    const fallbackPlantingWeeks = getWeeksForMonthRange(
      (crop as any).plantingStartMonth ?? 1,
      (crop as any).plantingEndMonth ?? 12,
      currentYear
    );
    const plantingWeeks = normalizeWeeks(
      crop.plantingWeeks && crop.plantingWeeks.length > 0
        ? crop.plantingWeeks
        : fallbackPlantingWeeks
    );

    const isInPlantingPeriod = plantingWeeks.includes(weekNumber);

    // Déterminer le type de saison basé sur la position dans la liste
    let seasonType: SeasonType = 'main';
    if (isInPlantingPeriod && plantingWeeks.length > 0) {
      const weekIndex = plantingWeeks.indexOf(weekNumber);
      const third = plantingWeeks.length / 3;
      if (weekIndex < third) {
        seasonType = 'early';
      } else if (weekIndex >= plantingWeeks.length - third) {
        seasonType = 'late';
      } else {
        seasonType = 'main';
      }
    }

    return {
      greenhouse: crop.plantingMethod,
      seasonType,
      isInPlantingPeriod,
    };
  };

  const selectedOption = weekOptions.find((opt) => opt.value === value);
  const selectedWeekNumber = selectedOption ? parseInt(selectedOption.value) : null;
  const selectedMetadata = selectedWeekNumber
    ? getWeekMetadata(selectedWeekNumber)
    : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center justify-between ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
              {selectedOption ? selectedOption.label : 'Sélectionner une semaine...'}
            </span>
            {selectedMetadata && crop && selectedMetadata.isInPlantingPeriod && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {selectedMetadata.greenhouse !== 'both' && (
                  <Badge
                    variant="info"
                    className="text-xs"
                  >
                    {getGreenhouseBadgeText(selectedMetadata.greenhouse)}
                  </Badge>
                )}
                {selectedMetadata.seasonType !== 'main' && (
                  <Badge
                    variant={
                      selectedMetadata.seasonType === 'early'
                        ? 'warning'
                        : selectedMetadata.seasonType === 'late'
                        ? 'error'
                        : 'success'
                    }
                    className="text-xs"
                  >
                    {getSeasonTypeBadgeText(selectedMetadata.seasonType)}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-auto">
            <div className="py-1">
              {weekOptions.map((option) => {
                const metadata = getWeekMetadata(option.weekNumber);
                const isSelected = value === option.value;
                
                // Dégradé de vert basé sur le type de saison dans la période de plantation
                let bgColor = '';
                if (metadata.isInPlantingPeriod && !isSelected) {
                  if (metadata.seasonType === 'early') {
                    bgColor = 'bg-green-50'; // Vert très clair pour précoces
                  } else if (metadata.seasonType === 'late') {
                    bgColor = 'bg-green-200'; // Vert moyen pour tardif
                  } else {
                    bgColor = 'bg-green-100'; // Vert clair pour saison principale
                  }
                }

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : metadata.isInPlantingPeriod
                        ? 'hover:bg-green-300'
                        : 'hover:bg-gray-100'
                    } ${bgColor} border-l-4 ${
                      isSelected 
                        ? 'border-primary-500' 
                        : metadata.isInPlantingPeriod 
                        ? 'border-green-400' 
                        : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{option.label}</span>
                      {crop && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {metadata.greenhouse !== 'both' && (
                            <Badge
                              variant="info"
                              className="text-xs"
                            >
                              {getGreenhouseBadgeText(metadata.greenhouse)}
                            </Badge>
                          )}
                          {metadata.isInPlantingPeriod && metadata.seasonType !== 'main' && (
                            <Badge
                              variant={
                                metadata.seasonType === 'early'
                                  ? 'warning'
                                  : metadata.seasonType === 'late'
                                  ? 'error'
                                  : 'success'
                              }
                              className="text-xs"
                            >
                              {getSeasonTypeBadgeText(metadata.seasonType)}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
