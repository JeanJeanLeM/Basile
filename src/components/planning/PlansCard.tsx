import { Plan } from '../../types';
import PlanActions from './PlanActions';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface PlansCardProps {
  plans: Plan[];
  onEdit: (plan: Plan) => void;
  onCopy: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
}

export default function PlansCard({
  plans,
  onEdit,
  onCopy,
  onDelete,
}: PlansCardProps) {
  // Fonction pour déterminer le badge à afficher
  const getTypeBadge = (plan: Plan) => {
    // Si semis et plantation sont dans la même semaine → Badge "Semis" (semis direct en place)
    if (plan.sowingWeek === plan.plantingWeek) {
      return <Badge variant="info">Semis</Badge>;
    }
    // Si semis et plantation sont dans des semaines différentes → Badge "Plantation" (semis en pépinière puis repiquage)
    return <Badge variant="secondary">Plantation</Badge>;
  };

  if (plans.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Aucun plan</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {plans.map((plan) => (
        <Card key={plan.id}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{plan.cropName}</h3>
                {getTypeBadge(plan)}
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <strong>Quantité :</strong> {plan.quantity}
                </p>
                <p>
                  <strong>Semis :</strong> Semaine {plan.sowingWeek}
                </p>
                <p>
                  <strong>Plantation :</strong> Semaine {plan.plantingWeek}
                </p>
                {plan.notes && (
                  <p className="mt-2 text-gray-500 italic">{plan.notes}</p>
                )}
              </div>
            </div>
            <PlanActions
              plan={plan}
              onEdit={onEdit}
              onCopy={onCopy}
              onDelete={onDelete}
            />
          </div>
        </Card>
      ))}
    </div>
  );
}
