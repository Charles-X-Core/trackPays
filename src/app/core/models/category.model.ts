export interface Category {
  id:           string;
  user_id:      string;
  name:         string;
  icon:         string;
  rule_type:    'need' | 'want' | 'saving';
  budget_limit: number | null;
  is_default:   boolean;
  created_at:   string;
}