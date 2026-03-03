import { Plan } from '../../types';
import { useWeeks } from '../../hooks/useWeeks';
import Accordion from '../ui/Accordion';
import WeekCard from './WeekCard';

interface WeekCalendarProps {
  plans: Plan[];
  onToggleTask: (planId: string, type: 'sowing' | 'planting', done: boolean) => void;
}

export default function WeekCalendar({ plans, onToggleTask }: WeekCalendarProps) {
  const { weeksByMonth, getTasksForWeeks } = useWeeks();
  const tasksByWeek = getTasksForWeeks(plans);
  const tasksMap = new Map(
    tasksByWeek.map((task) => [task.weekNumber, task])
  );

  const currentMonth = new Date().getMonth() + 1;

  return (
    <div className="space-y-4">
      {weeksByMonth.map((monthData) => {
        const weeks = monthData.weeks;

        return (
          <Accordion
            key={monthData.month}
            title={`${monthData.monthName} (${weeks.length} semaines)`}
            defaultOpen={monthData.month === currentMonth}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {weeks.map((week) => {
                const tasks = tasksMap.get(week.number) || null;
                return (
                  <WeekCard
                    key={week.number}
                    week={week}
                    tasks={tasks}
                    onToggleTask={onToggleTask}
                  />
                );
              })}
            </div>
          </Accordion>
        );
      })}
    </div>
  );
}
