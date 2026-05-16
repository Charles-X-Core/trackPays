export interface Transaction {
  id: string;
  userId: string;
  categoryId: string | null;
  amount: number;
  description: string | null;
  date: string;
  type: 'income' | 'expense';
  category?: { name: string; icon: string; rule_type: string };
  createdAt: string;
  updatedAt: string;
}

export interface TransactionPayload {
  categoryId: string | null;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
}