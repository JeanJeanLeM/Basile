import { useMemo } from 'react';
import { Week, WeekTask } from '../types';
import { Plan } from '../types';
import { getWeeksForYear } from '../utils/weekUtils';
import { MONTH_NAMES } from '../utils/constants';

export function useWeeks(year: number = new Date().getFullYear()) {
  const weeks = useMemo(() => getWeeksForYear(year), [year]);

  const weeksByMonth = useMemo(() => {
    const grouped: { [month: number]: Week[] } = {};
    
    for (const week of weeks) {
      if (!grouped[week.month]) {
        grouped[week.month] = [];
      }
      grouped[week.month].push(week);
    }

    return Object.entries(grouped).map(([month, weekList]) => ({
      month: parseInt(month),
      monthName: MONTH_NAMES[parseInt(month) - 1],
      weeks: weekList,
    }));
  }, [weeks]);

  const getTasksForWeeks = (plans: Plan[]): WeekTask[] => {
    const tasksByWeek: { [weekNumber: number]: WeekTask } = {};

    for (const plan of plans) {
      // Tâches de semis
      if (!tasksByWeek[plan.sowingWeek]) {
        tasksByWeek[plan.sowingWeek] = {
          weekNumber: plan.sowingWeek,
          sowingTasks: [],
          plantingTasks: [],
        };
      }
      tasksByWeek[plan.sowingWeek].sowingTasks.push(plan);

      // Tâches de plantation
      if (!tasksByWeek[plan.plantingWeek]) {
        tasksByWeek[plan.plantingWeek] = {
          weekNumber: plan.plantingWeek,
          sowingTasks: [],
          plantingTasks: [],
        };
      }
      tasksByWeek[plan.plantingWeek].plantingTasks.push(plan);
    }

    return Object.values(tasksByWeek).sort((a, b) => a.weekNumber - b.weekNumber);
  };

  return {
    weeks,
    weeksByMonth,
    getTasksForWeeks,
  };
}
