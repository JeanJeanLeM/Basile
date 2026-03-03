import { Plan } from './plan';

export interface Week {
  number: number; // 1-52
  startDate: Date;
  endDate: Date;
  month: number; // 1-12
  year: number;
}

export interface WeekTask {
  weekNumber: number;
  sowingTasks: Plan[];
  plantingTasks: Plan[];
}
