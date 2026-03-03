import { useRef, useEffect } from 'react';
import { Plan } from '../../types';
import PlanActions from './PlanActions';
import Badge from '../ui/Badge';
import { ChevronUp, ChevronDown } from 'lucide-react';

export type SortKey = 'cropName' | 'quantity' | 'sowingWeek' | 'plantingWeek';

interface PlansTableProps {
  plans: Plan[];
  sortBy?: SortKey;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: SortKey) => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onEdit: (plan: Plan) => void;
  onCopy: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
}

export default function PlansTable({
  plans,
  sortBy = 'plantingWeek',
  sortOrder = 'asc',
  onSort,
  selectedIds = new Set(),
  onSelectionChange,
  onEdit,
  onCopy,
  onDelete,
}: PlansTableProps) {
  const allOnPageSelected =
    plans.length > 0 && plans.every((p) => selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0;

  const handleToggleOne = (planId: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(planId)) next.delete(planId);
    else next.add(planId);
    onSelectionChange(next);
  };

  const handleToggleAll = () => {
    if (!onSelectionChange) return;
    if (allOnPageSelected) {
      const next = new Set(selectedIds);
      plans.forEach((p) => next.delete(p.id));
      onSelectionChange(next);
    } else {
      const next = new Set(selectedIds);
      plans.forEach((p) => next.add(p.id));
      onSelectionChange(next);
    }
  };

  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = selectAllRef.current;
    if (el) el.indeterminate = someSelected && !allOnPageSelected;
  }, [someSelected, allOnPageSelected]);

  const SortHeader = ({
    label,
    sortKey,
  }: {
    label: string;
    sortKey: SortKey;
  }) => (
    <th className="px-6 py-3 text-left">
      <button
        type="button"
        onClick={() => onSort?.(sortKey)}
        className="group flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 focus:outline-none"
      >
        {label}
        {onSort && (
          <span className="flex flex-col">
            <ChevronUp
              className={`w-3.5 h-3.5 -mb-0.5 ${
                sortBy === sortKey && sortOrder === 'asc'
                  ? 'text-primary-600'
                  : 'text-gray-300 group-hover:text-gray-400'
              }`}
            />
            <ChevronDown
              className={`w-3.5 h-3.5 -mt-0.5 ${
                sortBy === sortKey && sortOrder === 'desc'
                  ? 'text-primary-600'
                  : 'text-gray-300 group-hover:text-gray-400'
              }`}
            />
          </span>
        )}
      </button>
    </th>
  );

  // Fonction pour déterminer le badge à afficher
  const getTypeBadge = (plan: Plan) => {
    // Si semis et plantation sont dans la même semaine → Badge "Semis" (semis direct en place)
    if (plan.sowingWeek === plan.plantingWeek) {
      return <Badge variant="info">Semis</Badge>;
    }
    // Si semis et plantation sont dans des semaines différentes → Badge "Plantation" (semis en pépinière puis repiquage)
    return <Badge variant="secondary">Plantation</Badge>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {onSelectionChange && (
              <th className="px-4 py-3 w-10">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={handleToggleAll}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  aria-label="Tout sélectionner"
                />
              </th>
            )}
            <SortHeader label="Culture" sortKey="cropName" />
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <SortHeader label="Quantité" sortKey="quantity" />
            <SortHeader label="Semaine semis" sortKey="sowingWeek" />
            <SortHeader label="Semaine plantation" sortKey="plantingWeek" />
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {plans.length === 0 ? (
            <tr>
              <td
                colSpan={onSelectionChange ? 7 : 6}
                className="px-6 py-4 text-center text-gray-500"
              >
                Aucun plan
              </td>
            </tr>
          ) : (
            plans.map((plan) => (
              <tr key={plan.id} className="hover:bg-gray-50">
                {onSelectionChange && (
                  <td className="px-4 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(plan.id)}
                      onChange={() => handleToggleOne(plan.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      aria-label={`Sélectionner ${plan.cropName}`}
                    />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {plan.cropName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getTypeBadge(plan)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {plan.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Semaine {plan.sowingWeek}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  Semaine {plan.plantingWeek}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <PlanActions
                    plan={plan}
                    onEdit={onEdit}
                    onCopy={onCopy}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
