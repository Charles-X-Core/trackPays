export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string;
  ruleType: 'need' | 'want' | 'saving';
  budgetLimit: number | null;
  isDefault: boolean;
  createdAt: string;
}