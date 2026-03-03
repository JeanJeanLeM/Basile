import { useState, useRef } from 'react';
import { Crop } from '../../types';
import {
  getWeeksForYear,
  getWeeksForMonthRange,
  normalizeWeeks,
  getWeekTooltipLabel,
} from '../../utils/weekUtils';
import { MONTH_NAMES } from '../../utils/constants';

/** Ramène un numéro de semaine dans [1, 52] (année suivante si > 52) */
function wrapWeek(w: number): number {
  return ((w - 1) % 52) + 1;
}

interface MiniCalendarProps {
  crop: Crop;
}

type SimulationCellType = 'empty' | 'semis' | 'pepiniere' | 'plantation' | 'culture' | 'recolte';

export default function MiniCalendar({ crop }: MiniCalendarProps) {
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [simulationSemisWeek, setSimulationSemisWeek] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const year = new Date().getFullYear();

  const fallbackSowingWeeks = getWeeksForMonthRange(
    (crop as any).sowingStartMonth ?? 1,
    (crop as any).sowingEndMonth ?? 12,
    year
  );
  const fallbackPlantingWeeks = getWeeksForMonthRange(
    (crop as any).plantingStartMonth ?? 1,
    (crop as any).plantingEndMonth ?? 12,
    year
  );

  const sowingWeeksSet = new Set(
    normalizeWeeks(
      crop.sowingWeeks && crop.sowingWeeks.length > 0
        ? crop.sowingWeeks
        : fallbackSowingWeeks
    )
  );
  const plantingWeeksSet = new Set(
    normalizeWeeks(
      crop.plantingWeeks && crop.plantingWeeks.length > 0
        ? crop.plantingWeeks
        : fallbackPlantingWeeks
    )
  );

  const allWeeks = getWeeksForYear(year);
  const weeksByMonth = allWeeks.reduce(
    (acc, w) => {
      const m = w.month;
      if (!acc[m]) acc[m] = [];
      acc[m].push(w.number);
      return acc;
    },
    {} as Record<number, number[]>
  );
  const monthOrder = (Object.keys(weeksByMonth) as unknown as number[]).sort((a, b) => a - b);

  const nurseryWeeks = crop.weeksBetweenSowingAndPlanting ?? 0;
  const cultureWeeks = crop.weeksBetweenPlantingAndHarvest ?? 0;
  const harvestWeeks = crop.weeksBetweenHarvestAndDestruction ?? 0;

  /** Pour la ligne simulation : type de cellule pour chaque semaine 1–52 */
  const getSimulationCellType = (weekNum: number): SimulationCellType => {
    if (simulationSemisWeek === null) return 'empty';
    const S = simulationSemisWeek;
    const P = wrapWeek(S + nurseryWeeks);
    const H = wrapWeek(P + cultureWeeks); // première semaine de récolte

    if (weekNum === S) return 'semis';
    if (nurseryWeeks > 0) {
      for (let i = 1; i < nurseryWeeks; i++) {
        if (weekNum === wrapWeek(S + i)) return 'pepiniere';
      }
    }
    if (weekNum === P) return 'plantation';
    if (cultureWeeks > 0) {
      for (let i = 1; i < cultureWeeks; i++) {
        if (weekNum === wrapWeek(P + i)) return 'culture';
      }
    }
    if (harvestWeeks > 0) {
      for (let i = 0; i < harvestWeeks; i++) {
        if (weekNum === wrapWeek(H + i)) return 'recolte';
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

  const renderWeekCell = (
    weekNum: number,
    options: {
      isSowing?: boolean;
      isPlanting?: boolean;
      simType?: SimulationCellType;
      onClick?: () => void;
      interactive?: boolean;
    }
  ) => {
    const { isSowing, isPlanting, simType = 'empty', onClick, interactive } = options;
    const tooltip = getWeekTooltipLabel(weekNum, year);

    let bg = 'bg-gray-100';
    if (simType !== 'empty') {
      if (simType === 'semis') bg = 'bg-sky-300';
      else if (simType === 'pepiniere') bg = 'bg-sky-100';
      else if (simType === 'plantation') bg = 'bg-emerald-300';
      else if (simType === 'culture') bg = 'bg-emerald-100';
      else if (simType === 'recolte') bg = 'bg-amber-200';
    } else if (isSowing !== undefined && isPlanting !== undefined) {
      if (isSowing) bg = 'bg-sky-200';
      if (isPlanting) bg = 'bg-emerald-200';
    }

    return (
      <div
        key={weekNum}
        title={tooltip}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        onMouseEnter={(e) => handleWeekMouseEnter(weekNum, e)}
        onMouseLeave={handleWeekMouseLeave}
        onClick={onClick}
        className={`
          h-6 rounded-sm transition-colors flex-shrink-0
          ${bg}
          ${interactive ? 'cursor-pointer hover:ring-2 hover:ring-primary-500' : 'cursor-default hover:ring-1 hover:ring-gray-400'}
        `}
        style={{ flexGrow: 1, flexBasis: 0, minWidth: 6 }}
      />
    );
  };

  return (
    <div ref={containerRef} className="mt-4 relative">
      {/* En-têtes des mois */}
      <div className="flex gap-px mb-1">
        {monthOrder.map((monthNum) => (
          <div
            key={monthNum}
            className="flex justify-center items-center text-[10px] font-medium text-gray-500 border-b border-gray-200 pb-1"
            style={{ flex: weeksByMonth[monthNum].length }}
          >
            {MONTH_NAMES[monthNum - 1].substring(0, 3)}
          </div>
        ))}
      </div>

      {/* Ligne 1 : Semis uniquement */}
      <div className="flex gap-px mb-0.5">
        {allWeeks.map(({ number: weekNum }) =>
          renderWeekCell(weekNum, {
            isSowing: sowingWeeksSet.has(weekNum),
            isPlanting: false,
          })
        )}
      </div>

      {/* Ligne 2 : Plantation uniquement */}
      <div className="flex gap-px mb-0.5">
        {allWeeks.map(({ number: weekNum }) =>
          renderWeekCell(weekNum, {
            isSowing: false,
            isPlanting: plantingWeeksSet.has(weekNum),
          })
        )}
      </div>

      {/* Ligne 3 : Simulation (clic = placer le semis ici) */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap">
          Simulation
        </span>
        {simulationSemisWeek !== null && (
          <button
            type="button"
            onClick={() => setSimulationSemisWeek(null)}
            className="text-xs text-primary-600 hover:underline"
          >
            Réinitialiser
          </button>
        )}
      </div>
      <div className="flex gap-px">
        {allWeeks.map(({ number: weekNum }) =>
          renderWeekCell(weekNum, {
            simType: getSimulationCellType(weekNum),
            interactive: true,
            onClick: () => setSimulationSemisWeek(weekNum),
          })
        )}
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
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-sky-200" />
          <span>Semis</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-200" />
          <span>Plantation</span>
        </div>
        {simulationSemisWeek !== null && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-sky-100" />
              <span>Pépinière ({nurseryWeeks} sem.)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-100" />
              <span>Culture ({cultureWeeks} sem.)</span>
            </div>
            {harvestWeeks > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-200" />
                <span>Récolte ({harvestWeeks} sem.)</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
