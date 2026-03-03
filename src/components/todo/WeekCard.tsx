import { Week, WeekTask } from '../../types';
import { formatWeekRange, isCurrentWeek } from '../../utils/weekUtils';
import TaskEvent from './TaskEvent';
import Badge from '../ui/Badge';
import { Calendar, Sparkles } from 'lucide-react';

interface WeekCardProps {
  week: Week;
  tasks: WeekTask | null;
  onToggleTask: (planId: string, type: 'sowing' | 'planting', done: boolean) => void;
}

// Fonction pour générer un gradient basé sur le numéro de semaine
function getWeekGradient(weekNumber: number, isCurrent: boolean): string {
  if (isCurrent) {
    return 'from-primary-400 via-primary-500 to-primary-600';
  }
  
  // Gradients colorés basés sur la position de la semaine dans l'année
  const gradients = [
    'from-blue-400 via-purple-400 to-pink-400',      // Semaines 1-13 (hiver/début printemps)
    'from-green-400 via-emerald-400 to-teal-400',    // Semaines 14-26 (printemps)
    'from-yellow-400 via-orange-400 to-red-400',     // Semaines 27-39 (été)
    'from-amber-400 via-orange-400 to-red-400',      // Semaines 40-52 (automne/hiver)
  ];
  
  const gradientIndex = Math.floor((weekNumber - 1) / 13);
  return gradients[gradientIndex] || gradients[0];
}

// Fonction pour obtenir une couleur de bordure subtile
function getBorderColor(weekNumber: number, isCurrent: boolean): string {
  if (isCurrent) {
    return 'border-primary-500';
  }
  const colors = [
    'border-blue-200',
    'border-green-200',
    'border-yellow-200',
    'border-orange-200',
  ];
  const colorIndex = Math.floor((weekNumber - 1) / 13);
  return colors[colorIndex] || colors[0];
}

export default function WeekCard({ week, tasks, onToggleTask }: WeekCardProps) {
  const isCurrent = isCurrentWeek(week.number);
  const hasTasks = tasks && (tasks.sowingTasks.length > 0 || tasks.plantingTasks.length > 0);
  const taskCount = tasks 
    ? tasks.sowingTasks.length + tasks.plantingTasks.length 
    : 0;

  return (
    <div
        className={`
        relative overflow-hidden rounded-xl border-2 transition-all duration-300
        ${isCurrent 
          ? 'shadow-lg scale-105 border-primary-500 ring-2 ring-primary-200' 
          : 'shadow-md hover:shadow-lg hover:scale-[1.02] border-gray-200'
        }
        ${getBorderColor(week.number, isCurrent)}
      `}
    >
      {/* Gradient background */}
      <div
        className={`
          absolute inset-0 bg-gradient-to-br opacity-10
          ${getWeekGradient(week.number, isCurrent)}
          ${isCurrent ? 'opacity-20' : ''}
        `}
      />
      
      {/* Decorative corner accent */}
      {isCurrent && (
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary-400/30 to-transparent rounded-bl-full" />
      )}

      {/* Content */}
      <div className="relative p-5 bg-white/95 backdrop-blur-sm">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Calendar className={`w-5 h-5 flex-shrink-0 ${isCurrent ? 'text-primary-600' : 'text-gray-400'}`} />
            <h3 className={`font-bold text-lg flex-1 min-w-0 ${isCurrent ? 'text-primary-700' : 'text-gray-800'}`}>
              Semaine {week.number}
            </h3>
            {isCurrent && (
              <>
                <Sparkles className="w-4 h-4 text-primary-500 animate-pulse flex-shrink-0" />
                <Badge variant="info" className="text-xs px-1.5 py-0.5 flex-shrink-0">
                  Actuelle
                </Badge>
              </>
            )}
          </div>
          <p className="text-sm text-gray-600 ml-7">
            {formatWeekRange(week.startDate, week.endDate)}
          </p>
        </div>

        {/* Task count badge */}
        {hasTasks && (
          <div className="mb-3 ml-7">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
              {taskCount} {taskCount === 1 ? 'tâche' : 'tâches'}
            </span>
          </div>
        )}

        {/* Tasks or empty state */}
        {hasTasks ? (
          <div className="space-y-2 mt-4">
            {tasks.sowingTasks.map((plan) => (
              <TaskEvent
                key={`sowing-${plan.id}`}
                plan={plan}
                type="sowing"
                onToggle={onToggleTask}
              />
            ))}
            {tasks.plantingTasks.map((plan) => (
              <TaskEvent
                key={`planting-${plan.id}`}
                plan={plan}
                type="planting"
                onToggle={onToggleTask}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 ml-7 text-center py-4">
            <p className="text-sm text-gray-400 italic flex items-center justify-center gap-2">
              <span className="text-2xl">🌱</span>
              <span>Aucune tâche cette semaine</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
