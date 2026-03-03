import { MonthlySuggestion } from '../../services/suggestionsService';
import Accordion from '../ui/Accordion';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { CropSuggestion } from '../../services/suggestionsService';

interface MonthlySuggestionsProps {
  suggestions: MonthlySuggestion[];
  onAddToPlan: (suggestion: CropSuggestion, quantity?: number) => Promise<void>;
}

export default function MonthlySuggestions({
  suggestions,
  onAddToPlan,
}: MonthlySuggestionsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Suggestions mensuelles</h3>
      {suggestions.map((month) => (
        <Accordion key={month.month} title={month.monthName} defaultOpen={month.month === new Date().getMonth() + 1}>
          <div className="space-y-3">
            {month.suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.crop.id}-${suggestion.action}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{suggestion.crop.emoji || '🌱'}</span>
                  <div>
                    <p className="font-medium">{suggestion.crop.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={suggestion.action === 'sowing' ? 'info' : 'success'}
                      >
                        {suggestion.action === 'sowing' ? 'Semis' : 'Plantation'}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Semaine {suggestion.week}
                      </span>
                    </div>
                    {suggestion.reason && (
                      <p className="text-xs text-gray-500 mt-1">{suggestion.reason}</p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => onAddToPlan(suggestion)}
                  variant="primary"
                  className="text-sm"
                >
                  Ajouter
                </Button>
              </div>
            ))}
          </div>
        </Accordion>
      ))}
    </div>
  );
}
