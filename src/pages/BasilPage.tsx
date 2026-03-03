import { useState, useEffect } from 'react';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { useCrops } from '../hooks/useCrops';
import { generateMonthlySuggestions, addSuggestionToPlan, MonthlySuggestion } from '../services/suggestionsService';
import { generateCompletePlan, applyGeneratedPlan, GeneratedPlanItem } from '../services/planGeneratorService';
import Questionnaire from '../components/basil/Questionnaire';
import MonthlySuggestions from '../components/basil/MonthlySuggestions';
import PlanOverview from '../components/basil/PlanOverview';
import Button from '../components/ui/Button';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/ui/Toast';
import { UI_MESSAGES } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';

export default function BasilPage() {
  const { user, isGuest, getToken } = useAuth();
  const { preferences, loading: prefsLoading, updatePreferences } =
    useUserPreferences();
  const { crops, loading: cropsLoading } = useCrops();
  const { toasts, showToast, removeToast } = useToast();
  const [suggestions, setSuggestions] = useState<MonthlySuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [planItems, setPlanItems] = useState<GeneratedPlanItem[]>([]);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [applyingPlan, setApplyingPlan] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [viewMode, setViewMode] = useState<'plan' | 'suggestions'>('plan');

  useEffect(() => {
    if (preferences && crops.length > 0) {
      loadPlan();
      loadSuggestions();
    }
  }, [preferences, crops]);

  const loadPlan = async () => {
    const userId = user?.uid ?? 'guest';
    if (!userId) return;
    setLoadingPlan(true);
    try {
      console.log('[Basil Page] Chargement du plan (toujours selon préférences / filtres)');
      const token = isGuest ? undefined : await getToken();
      const generatedPlan = await generateCompletePlan(userId, new Date().getFullYear(), token);
      setPlanItems(generatedPlan.items);
      console.log('[Basil Page] Plan affiché:', generatedPlan.items.length, 'plantations');
    } catch (error) {
      console.error('[Basil Page] Erreur lors du chargement du plan:', error);
      showToast('Erreur lors du chargement du plan', 'error');
    } finally {
      setLoadingPlan(false);
    }
  };

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
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSavePreferences = async (
    prefs: Partial<typeof preferences> | null
  ) => {
    if (prefs == null) return;
    try {
      console.log('[Basil Page] Enregistrement des préférences → régénération du plan avec filtres');
      await updatePreferences(prefs);
      showToast('Préférences enregistrées avec succès', 'success');
      setShowQuestionnaire(false);
      await loadPlan();
      await loadSuggestions();
      console.log('[Basil Page] Plan régénéré après réponse au questionnaire');
    } catch (error) {
      showToast('Erreur lors de l\'enregistrement', 'error');
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

  const handleApplyPlan = async () => {
    const userId = user?.uid ?? 'guest';
    if (!userId) return;
    setApplyingPlan(true);
    try {
      console.log('[Basil Page] Application du plan (reset du plan actif puis création)');
      const token = isGuest ? undefined : await getToken();
      await applyGeneratedPlan(userId, {
        items: planItems,
        year: new Date().getFullYear(),
      }, token);
      showToast('Plan appliqué avec succès !', 'success');
      await loadPlan();
    } catch (error) {
      console.error('[Basil Page] Erreur lors de l\'application du plan:', error);
      showToast('Erreur lors de l\'application du plan', 'error');
    } finally {
      setApplyingPlan(false);
    }
  };

  const handleItemUpdate = (index: number, updates: Partial<GeneratedPlanItem>) => {
    setPlanItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], ...updates };
      return newItems;
    });
  };

  const handleItemRemove = (index: number) => {
    setPlanItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemAdd = (item: GeneratedPlanItem) => {
    setPlanItems((prev) => [...prev, item].sort((a, b) => a.plantingWeek - b.plantingWeek));
  };

  const hasCompletedQuestionnaire = preferences !== null;

  return (
    <div className="p-4 pl-[3.75rem] md:pl-6 md:p-6 min-w-0">
      <header className="mb-6">
        <h1 className="text-xl sm:text-3xl font-bold mb-2 truncate">{UI_MESSAGES.BASIL_TITLE}</h1>
        <p className="text-gray-600 text-sm sm:text-base">{UI_MESSAGES.BASIL_DESCRIPTION}</p>
      </header>

      {prefsLoading || cropsLoading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : !hasCompletedQuestionnaire || showQuestionnaire ? (
        <div className="bg-white rounded-lg shadow p-6">
          {hasCompletedQuestionnaire && (
            <div className="mb-4">
              <Button variant="secondary" onClick={() => setShowQuestionnaire(false)}>
                Retour au plan
              </Button>
            </div>
          )}
          <Questionnaire
            preferences={preferences}
            crops={crops}
            onSave={handleSavePreferences}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Mode selector */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setViewMode('plan')}
              className={`px-4 py-2 font-medium transition-colors ${
                viewMode === 'plan'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Plan complet
            </button>
            <button
              onClick={() => setViewMode('suggestions')}
              className={`px-4 py-2 font-medium transition-colors ${
                viewMode === 'suggestions'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Suggestions mensuelles
            </button>
          </div>

          {viewMode === 'plan' ? (
            <div className="bg-white rounded-lg shadow p-6">
              {loadingPlan ? (
                <div className="text-center py-12 text-gray-500">
                  Génération du plan...
                </div>
              ) : (
                <PlanOverview
                  planItems={planItems}
                  year={new Date().getFullYear()}
                  onItemUpdate={handleItemUpdate}
                  onItemRemove={handleItemRemove}
                  onItemAdd={handleItemAdd}
                  onApply={handleApplyPlan}
                  onEditPreferences={() => setShowQuestionnaire(true)}
                  availableCrops={crops}
                  loading={applyingPlan}
                />
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  Voici vos suggestions mensuelles personnalisées. Vous pouvez les ajouter individuellement à votre plan.
                </p>
              </div>

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
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
