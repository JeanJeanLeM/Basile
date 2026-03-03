import { usePlans } from '../hooks/usePlans';
import WeekCalendar from '../components/todo/WeekCalendar';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/ui/Toast';
import { UI_MESSAGES } from '../utils/constants';

export default function TodoPage() {
  const { plans, loading, markSowingDone, markPlantingDone } = usePlans();
  const { toasts, showToast, removeToast } = useToast();

  const handleToggleTask = async (
    planId: string,
    type: 'sowing' | 'planting',
    done: boolean
  ) => {
    try {
      if (type === 'sowing') {
        await markSowingDone(planId, done);
      } else {
        await markPlantingDone(planId, done);
      }
      showToast(
        `Tâche ${done ? 'marquée comme terminée' : 'marquée comme non terminée'}`,
        'success'
      );
    } catch (error) {
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  return (
    <div className="p-4 pl-[3.75rem] md:pl-6 md:p-6 min-w-0">
      <header className="mb-6">
        <h1 className="text-xl sm:text-3xl font-bold mb-2 truncate">{UI_MESSAGES.TODO_TITLE}</h1>
        <p className="text-gray-600 text-sm sm:text-base">{UI_MESSAGES.TODO_DESCRIPTION}</p>
      </header>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : (
        <WeekCalendar plans={plans} onToggleTask={handleToggleTask} />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
