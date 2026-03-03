import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useCrops } from '../hooks/useCrops';
import { generateMonthlySuggestions, addSuggestionToPlan, MonthlySuggestion } from '../services/suggestionsService';
import MonthlySuggestions from '../components/basil/MonthlySuggestions';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

export default function SuggestionsPage() {
  const { user, isGuest, getToken } = useAuth();
  const navigate = useNavigate();
  const { preferences, loading: prefsLoading } = useUserPreferences();
  const { crops, loading: cropsLoading } = useCrops();
  const { toasts, showToast, removeToast } = useToast();
  const [suggestions, setSuggestions] = useState<MonthlySuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (preferences && crops.length > 0) {
      loadSuggestions();
    }
  }, [preferences, crops, user?.uid, isGuest]);

  const loadSuggestions = async () => {
    const userId = user?.uid ?? 'guest';
    if (!userId) return;
    setLoadingSuggestions(true);
    try {
      const token = isGuest ? undefined : await getToken();
      const monthlySuggestions = await generateMonthlySuggestions(userId, new Date().getFullYear(), token);
      setSuggestions(monthlySuggestions);
    } catch (error) {
      console.error('Erreur lors du chargement des suggestions:', error);
      showToast('Erreur lors du chargement des suggestions', 'error');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAddToPlan = async (suggestion: any, quantity: number = 1) => {
    const userId = user?.uid ?? 'guest';
    if (!userId) return;
    try {
      const token = isGuest ? undefined : await getToken();
      await addSuggestionToPlan(userId, suggestion, quantity, token);
      showToast('Plan ajouté avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de l\'ajout du plan', 'error');
    }
  };

  const hasCompletedQuestionnaire = preferences !== null;

  return (
    <div className="p-4 pl-[3.75rem] md:pl-6 md:p-6 min-w-0">
      <header className="mb-6">
        <h1 className="text-xl sm:text-3xl font-bold mb-2 truncate">Suggestions</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Suggestions personnalisées basées sur vos préférences
        </p>
      </header>

      {prefsLoading || cropsLoading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : !hasCompletedQuestionnaire ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Vous devez d'abord remplir le questionnaire Basil pour recevoir
              des suggestions personnalisées.
            </p>
            <Button onClick={() => navigate('/basil')}>
              Aller au questionnaire
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {loadingSuggestions ? (
            <div className="text-center py-12 text-gray-500">
              Génération des suggestions...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <MonthlySuggestions
                suggestions={suggestions}
                onAddToPlan={handleAddToPlan}
              />
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Aucune suggestion disponible pour le moment
            </div>
          )}
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
