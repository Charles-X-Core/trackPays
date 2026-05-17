// ============================================
// SAVING GOALS MODEL - Múltiples Metas
// ============================================

export type GoalCategory = 
  | 'emergency'       // Fondo de emergencia
  | 'travel'          // Viaje
  | 'vehicle'         // Auto / Moto
  | 'house'           // Casa / Departamento
  | 'education'       // Educación / Cursos
  | 'technology'      // Computadora / Celular
  | 'wedding'        // Boda
  | 'investment'      // Inversión
  | 'retirement'      // Jubilación
  | 'debt_payoff'    // Pagar deudas
  | 'business'       // Negocio propio
  | 'other';         // Otro

export type GoalPriority = 'high' | 'medium' | 'low';

export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';

export interface SavingGoal {
  id: string;
  userId: string;
  
  // Información básica
  name: string;
  description?: string;
  category: GoalCategory;
  
  // Montos
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  
  // Fechas
  targetDate?: string;          // Fecha objetivo específica
  createdAt: string;
  updatedAt: string;
  
  // Estado
  status: GoalStatus;
  priority: GoalPriority;
  isCompleted: boolean;
  
  // Proyecciones calculadas
  monthsToGoal: number | null;
  projectedCompletionDate?: string;
  
  // Historial
  contributions: GoalContribution[];
  
  // Notas
  notes?: string;
  
  // Metadata
  tags?: string[];
  version?: number;
}

export interface GoalContribution {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface GoalPayload {
  name: string;
  description?: string;
  category: GoalCategory;
  targetAmount: number;
  currentAmount?: number;
  monthlyContribution: number;
  targetDate?: string;
  priority?: GoalPriority;
  notes?: string;
  tags?: string[];
}

// ============================================
// CÁLCULOS
// ============================================

export function calculateMonthsToGoal(
  targetAmount: number,
  currentAmount: number,
  monthlyContribution: number
): number | null {
  const remaining = targetAmount - currentAmount;
  if (remaining <= 0) return 0;
  if (monthlyContribution <= 0) return null;
  return Math.ceil(remaining / monthlyContribution);
}

export function calculateProjectedDate(monthsToGoal: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + monthsToGoal);
  return date.toISOString().split('T')[0];
}

export function calculateProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

export function calculateMonthlyNeeded(
  targetAmount: number,
  currentAmount: number,
  monthsRemaining: number
): number {
  const remaining = targetAmount - currentAmount;
  if (remaining <= 0 || monthsRemaining <= 0) return 0;
  return Math.ceil(remaining / monthsRemaining);
}

// ============================================
// CATEGORÍAS PREDEFINIDAS
// ============================================

export const GOAL_CATEGORIES: Record<GoalCategory, { name: string; icon: string }> = {
  emergency: { name: 'Fondo de emergencia', icon: '🛡️' },
  travel: { name: 'Viaje', icon: '✈️' },
  vehicle: { name: 'Vehículo', icon: '🚗' },
  house: { name: 'Casa / Depto', icon: '🏠' },
  education: { name: 'Educación', icon: '🎓' },
  technology: { name: 'Tecnología', icon: '💻' },
  wedding: { name: 'Boda', icon: '💒' },
  investment: { name: 'Inversión', icon: '📈' },
  retirement: { name: 'Jubilación', icon: '🏖️' },
  debt_payoff: { name: 'Pagar deudas', icon: '🏦' },
  business: { name: 'Negocio', icon: '💼' },
  other: { name: 'Otro', icon: '🎯' }
};

export const GOAL_PRIORITIES: Record<GoalPriority, { label: string; color: string }> = {
  high: { label: 'Alta', color: '#EF4444' },
  medium: { label: 'Media', color: '#F59E0B' },
  low: { label: 'Baja', color: '#10B981' }
};