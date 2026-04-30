export interface Transaction {
  id:          string;
  user_id:     string;
  category_id: string | null;
  amount:      number;        // negativo = gasto, positivo = ingreso
  description: string | null;
  date:        string;
  created_at:  string;
  updated_at:  string;
  category?:   { name: string; icon: string; rule_type: string }; // join
}

export interface TransactionPayload {
  category_id: string | null;
  amount:      number;
  description: string;
  date:        string;
}