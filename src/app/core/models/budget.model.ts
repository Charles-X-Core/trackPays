// ============================================
// BUDGET MODEL - Presupuesto por Categoría
// ============================================

import { ExpenseCategory } from './expense.model';

export type BudgetStatus = 'on_track' | 'at_risk' | 'exceeded' | 'unused';

export interface Budget {
  id: string;
  userId: string;
  
  // Categoría
  category: string;
  categoryName: string;
  isPrimordial: boolean;
  
  // Montos
  budgetedAmount: number;    // Lo que planeas gastar
  actualAmount: number;      // Lo que realmente gastaste
  remainingAmount: number;   // Restante (budgeted - actual)
  
  // Porcentaje
  percentageUsed: number;    // % usado
  status: BudgetStatus;
  
  // Configuración
  alertThreshold: number;     // % que activa alerta (default: 80)
  isActive: boolean;
  
  // Mes
  monthId: string;           // "2026-05"
  year: number;
  month: number;
  
  // Historial
  history: BudgetHistory[];
  
  // Notas
  notes?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface BudgetHistory {
  date: string;
  actualAmount: number;
  percentage: number;
}

export interface BudgetPayload {
  category: string;
  categoryName: string;
  isPrimordial: boolean;
  budgetedAmount: number;
  alertThreshold?: number;
  monthId: string;
  year: number;
  month: number;
  notes?: string;
}

// ============================================
// MONTHLY BUDGET SUMMARY
// ============================================

export interface MonthlyBudgetSummary {
  monthId: string;
  
  // Totales
  totalBudgeted: number;
  totalActual: number;
  totalRemaining: number;
  overallPercentage: number;
  overallStatus: BudgetStatus;
  
  // Por tipo
  primordialBudgeted: number;
  primordialActual: number;
  nonPrimordialBudgeted: number;
  nonPrimordialActual: number;
  
  // Por categoría
  budgets: Budget[];
  
  // Alertas
  alerts: {
    category: string;
    name: string;
    budgeted: number;
    actual: number;
    percentage: number;
    status: BudgetStatus;
  }[];
  
  lastUpdated: string;
}

// ============================================
// CÁLCULOS
// ============================================

export function calculateBudgetStatus(
  percentageUsed: number,
  alertThreshold: number = 80
): BudgetStatus {
  if (percentageUsed >= 100) return 'exceeded';
  if (percentageUsed >= alertThreshold) return 'at_risk';
  if (percentageUsed === 0) return 'unused';
  return 'on_track';
}

export function calculateRemaining(budgeted: number, actual: number): number {
  return Math.max(0, budgeted - actual);
}

export function calculatePercentage(budgeted: number, actual: number): number {
  if (budgeted <= 0) return 0;
  return Math.round((actual / budgeted) * 100);
}