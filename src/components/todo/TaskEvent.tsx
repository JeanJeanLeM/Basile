import { Plan } from '../../types';
import Badge from '../ui/Badge';
import { Check } from 'lucide-react';

interface TaskEventProps {
  plan: Plan;
  type: 'sowing' | 'planting';
  onToggle: (planId: string, type: 'sowing' | 'planting', done: boolean) => void;
}

export default function TaskEvent({ plan, type, onToggle }: TaskEventProps) {
  const isDone = type === 'sowing' ? plan.sowingDone : plan.plantingDone;
  const label = type === 'sowing' ? 'Semis' : 'Plantation';

  return (
    <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-50">
      <button
        onClick={() => onToggle(plan.id, type, !isDone)}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          isDone
            ? 'bg-primary-600 border-primary-600'
            : 'border-gray-300 bg-white'
        }`}
      >
        {isDone && <Check className="w-3 h-3 text-white" />}
      </button>
      <Badge variant={type === 'sowing' ? 'info' : 'success'}>{label}</Badge>
      <span className="text-sm text-gray-700">{plan.cropName}</span>
      {plan.quantity > 1 && (
        <span className="text-xs text-gray-500">(x{plan.quantity})</span>
      )}
    </div>
  );
}
