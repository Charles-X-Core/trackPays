export interface SavingGoal {
  id:                   string;
  user_id:              string;
  name:                 string;
  target_amount:        number;
  current_amount:       number;
  monthly_contribution: number;
  months_to_goal:       number | null;
  created_at:           string;
  updated_at:           string;
}