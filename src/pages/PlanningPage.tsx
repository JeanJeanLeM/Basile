import { useState, useMemo } from 'react';
import { Plan } from '../types';
import { useAuth } from '../hooks/useAuth';
import { usePlans } from '../hooks/usePlans';
import { useCrops } from '../hooks/useCrops';
import { useSidebar } from '../hooks/useSidebar';
import { useToast } from '../hooks/useToast';
import PlanForm from '../components/planning/PlanForm';
import PlansTable from '../components/planning/PlansTable';
import PlansCard from '../components/planning/PlansCard';
import PlanningCalendarView from '../components/planning/PlanningCalendarView';
import Input from '../components/ui/Input';
import Pagination from '../components/ui/Pagination';
import Button from '../components/ui/Button';
import { ToastContainer } from '../components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import { UI_MESSAGES } from '../utils/constants';
import { Calendar, Table } from 'lucide-react';

export default function PlanningPage() {
  const { user } = useAuth();
  const { plans, loading, createPlan, updatePlan, deletePlan, deleteAllPlans, copyPlan } =
    usePlans();
  const { crops } = useCrops();
  const { isMobile } = useSidebar();
  const { toasts, showToast, removeToast } = useToast();
  const navigate = useNavigate();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'plantingWeek' | 'sowingWeek' | 'cropName' | 'quantity'>('plantingWeek');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('calendar');
  const itemsPerPage = 10;

  const filteredAndSorted = useMemo(() => {
    let filtered = plans.filter((plan) =>
      plan.cropName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const mult = sortOrder === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'plantingWeek':
          cmp = a.plantingWeek - b.plantingWeek;
          break;
        case 'sowingWeek':
          cmp = a.sowingWeek - b.sowingWeek;
          break;
        case 'cropName':
          cmp = a.cropName.localeCompare(b.cropName);
          break;
        case 'quantity':
          cmp = a.quantity - b.quantity;
          break;
        default:
          return 0;
      }
      return cmp * mult;
    });

    return filtered;
  }, [plans, searchTerm, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const paginatedPlans = filteredAndSorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAdd = () => {
    if (crops.length === 0) {
      showToast('Veuillez d\'abord ajouter des cultures', 'warning');
      return;
    }
    setEditingPlan(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setIsFormOpen(true);
  };

  const handleSubmit = async (
    planData: Omit<Plan, 'id' | 'sowingWeek' | 'createdAt' | 'updatedAt' | 'sowingDone' | 'plantingDone'>
  ) => {
    try {
      if (editingPlan) {
        await updatePlan(editingPlan.id, planData);
        showToast('Plan modifié avec succès', 'success');
      } else {
        await createPlan(planData);
        showToast('Plan ajouté avec succès', 'success');
      }
      setIsFormOpen(false);
      setEditingPlan(undefined);
    } catch (error) {
      showToast('Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleCopy = async (plan: Plan) => {
    try {
      await copyPlan(plan);
      showToast('Plan copié avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de la copie', 'error');
    }
  };

  const handleDelete = async (plan: Plan) => {
    try {
      await deletePlan(plan.id);
      showToast('Plan supprimé avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const selectedPlans = useMemo(
    () => plans.filter((p) => selectedIds.has(p.id)),
    [plans, selectedIds]
  );

  const handleBulkCopy = async () => {
    if (selectedPlans.length === 0) return;
    try {
      for (const plan of selectedPlans) {
        await copyPlan(plan);
      }
      showToast(
        `${selectedPlans.length} plan(s) copié(s) avec succès`,
        'success'
      );
      setSelectedIds(new Set());
    } catch (error) {
      showToast('Erreur lors de la copie', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPlans.length === 0) return;
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer ${selectedPlans.length} plan(s) ?`
      )
    ) {
      return;
    }
    try {
      for (const plan of selectedPlans) {
        await deletePlan(plan.id);
      }
      showToast(
        `${selectedPlans.length} plan(s) supprimé(s) avec succès`,
        'success'
      );
      setSelectedIds(new Set());
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleDeleteAllPlans = async () => {
    try {
      const count = plans.length;
      await deleteAllPlans();
      showToast(`${count} plan(s) supprimé(s) avec succès`, 'success');
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  return (
    <div className="p-4 pl-[3.75rem] md:pl-6 md:p-6 min-w-0">
      <header className="mb-4 sm:mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold truncate">{UI_MESSAGES.PLANNING_TITLE}</h1>
            <p className="text-gray-600 text-sm sm:text-base mt-0.5">{UI_MESSAGES.PLANNING_DESCRIPTION}</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant={viewMode === 'table' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('table')}
              className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-base"
              title="Vue tableau"
            >
              <Table className="w-4 h-4 sm:mr-2 shrink-0" />
              <span className="hidden sm:inline">Tableau</span>
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('calendar')}
              className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-base"
              title="Vue calendrier"
            >
              <Calendar className="w-4 h-4 sm:mr-2 shrink-0" />
              <span className="hidden sm:inline">Calendrier</span>
            </Button>
            {viewMode === 'table' && (
              <Button onClick={handleAdd} className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-base">
                {UI_MESSAGES.PLANNING_ADD_BUTTON}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => navigate('/planning/suggestions')}
              className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-base"
              title={UI_MESSAGES.PLANNING_SUGGESTIONS_BUTTON}
            >
              {UI_MESSAGES.PLANNING_SUGGESTIONS_BUTTON}
            </Button>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {viewMode === 'table' && (
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher un plan..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        )}

        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 py-2 px-3 bg-primary-50 border border-primary-200 rounded-lg">
            <span className="text-sm font-medium text-primary-800">
              {selectedIds.size} plan(s) sélectionné(s)
            </span>
            <Button
              variant="secondary"
              onClick={handleBulkCopy}
            >
              Copier la sélection
            </Button>
            <Button
              variant="secondary"
              onClick={handleBulkDelete}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Supprimer la sélection
            </Button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-primary-600 hover:text-primary-800 underline"
            >
              Tout désélectionner
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Chargement...</div>
        ) : viewMode === 'calendar' ? (
          <PlanningCalendarView
            plans={filteredAndSorted}
            crops={crops}
            onUpdatePlan={async (planId, updates) => {
              await updatePlan(planId, updates);
              showToast('Plan mis à jour', 'success');
            }}
            onCreatePlan={async (planData) => {
              await createPlan(planData);
              showToast('Plan ajouté avec succès', 'success');
            }}
            onDeletePlan={async (planId) => {
              await deletePlan(planId);
              showToast('Plan supprimé avec succès', 'success');
            }}
            onDeleteAllPlans={handleDeleteAllPlans}
          />
        ) : isMobile ? (
          <PlansCard
            plans={paginatedPlans}
            onEdit={handleEdit}
            onCopy={handleCopy}
            onDelete={handleDelete}
          />
        ) : (
          <PlansTable
            plans={paginatedPlans}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={(key) => {
              setSortBy(key);
              setSortOrder((prev) => (sortBy === key ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
            }}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onEdit={handleEdit}
            onCopy={handleCopy}
            onDelete={handleDelete}
          />
        )}

        {viewMode === 'table' && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      <PlanForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPlan(undefined);
        }}
        onSubmit={handleSubmit}
        crops={crops}
        userId={user?.uid ?? ''}
        initialData={editingPlan}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
