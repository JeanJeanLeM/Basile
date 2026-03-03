import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { getWeekDates, normalizeWeeks, formatWeekRanges } from '../../utils/weekUtils';

interface MultiWeekSelectProps {
  label?: string;
  value: number[];
  onChange: (value: number[]) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function MultiWeekSelect({
  label,
  value,
  onChange,
  error,
  disabled,
  required,
}: MultiWeekSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();

  const selectedWeeks = useMemo(() => normalizeWeeks(value), [value]);

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

  const weekOptions = useMemo(() => {
    return Array.from({ length: 52 }, (_, i) => {
      const weekNumber = i + 1;
      const { start } = getWeekDates(weekNumber, currentYear);
      const dateStr = formatDateFrench(start);
      return {
        value: weekNumber,
        label: `Semaine ${weekNumber} - ${dateStr}`,
      };
    });
  }, [currentYear]);

  const toggleWeek = (weekNumber: number) => {
    const hasWeek = selectedWeeks.includes(weekNumber);
    const updated = hasWeek
      ? selectedWeeks.filter((week) => week !== weekNumber)
      : [...selectedWeeks, weekNumber];
    onChange(normalizeWeeks(updated));
  };

  const clearWeeks = () => {
    onChange([]);
  };

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

  const summary = selectedWeeks.length
    ? formatWeekRanges(selectedWeeks)
    : 'Sélectionner des semaines...';

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
          <span className={selectedWeeks.length ? 'text-gray-900' : 'text-gray-500'}>
            {summary}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-auto">
            <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {selectedWeeks.length} sélectionnée{selectedWeeks.length > 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={clearWeeks}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Effacer
              </button>
            </div>
            <div className="py-1">
              {weekOptions.map((option) => {
                const isSelected = selectedWeeks.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleWeek(option.value)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'hover:bg-gray-100'
                    } border-l-4 ${
                      isSelected ? 'border-primary-500' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{option.label}</span>
                      {isSelected && (
                        <span className="text-xs text-primary-600">Sélectionnée</span>
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
