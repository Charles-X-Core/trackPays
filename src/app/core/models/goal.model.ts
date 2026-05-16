export interface SavingGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  monthsToGoal: number | null;
  createdAt: string;
  updatedAt: string;
}