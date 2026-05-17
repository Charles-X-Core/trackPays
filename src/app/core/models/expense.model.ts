// ============================================
// EXPENSE MODEL - Sistema Dual de Gastos
// ============================================

// Categorías predefinidas de gastos primordiales
export type PrimordialCategory = 
  | 'housing'         // Alquiler / Hipoteca
  | 'utilities'       // Servicios (luz, agua, internet, gas, teléfono)
  | 'transport'       // Transporte (pasajes, gasolina, peaje)
  | 'health'          // Salud (EPS, seguros, medicamentos)
  | 'debt'            // Deudas (préstamos, tarjetas, créditos)
  | 'groceries'       // Supermercado / Comida en casa
  | 'education';      // Educación (colegiatura, universidad)

// Categorías predefinidas de gastos no primordiales
export type NonPrimordialCategory = 
  | 'dining_out'      // Comida fuera / Restaurantes
  | 'entertainment'   // Cine, eventos, bars
  | 'streaming'       // Netflix, Spotify, etc.
  | 'pets'            // Mascotas
  | 'clothing'        // Ropa y accesorios
  | 'travel'          // Viajes y vacaciones
  | 'shopping'        // Compras diversas
  | 'subscriptions';  // Suscripciones varias

export type ExpenseCategory = PrimordialCategory | NonPrimordialCategory;

// Estados de pago
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';

// Frecuencia de gasto
export type ExpenseFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

// ============================================
// INTERFACE PRINCIPAL
// ============================================

export interface Expense {
  id: string;
  userId: string;
  
  // Clasificación principal
  isPrimordial: boolean; // true = esencial, false = no esencial
  category: ExpenseCategory;
  subcategory?: string;  // Ej: "luz", "agua", "netflix"
  
  // Información básica
  name: string;           // "Netflix", "Alquiler", "Luz"
  provider?: string;      // "Netflix", "EDEGEL", "BCP"
  description?: string;
  
  // Montos
  budgetedAmount: number;  // Lo que planeas pagar
  actualAmount: number;    // Lo que realmente pagaste
  
  // Fechas
  dueDayOfMonth: number | null;        // Día de vencimiento (ej: 15)
  optimalPaymentDay?: number;           // Día óptimo para pagar (calculado)
  paymentDate?: string;                 // Fecha cuando se pagó
  startDate: string;                    // Desde cuándo aplica
  endDate?: string;                     // Hasta cuándo aplica (null = indefinido)
  
  // Estado
  status: PaymentStatus;
  isRecurring: boolean;
  frequency: ExpenseFrequency;
  
  // Para suscripciones
  isSubscription?: boolean;
  subscriptionPrice?: number;
  subscriptionPeriod?: 'monthly' | 'yearly';
  lastPrice?: number;
  priceChanged?: boolean;
  
  // Para gastos variables
  isVariable?: boolean;        // Si el monto varía (ej: luz)
  averageAmount?: number;      // Promedio histórico
  lastMonthAmount?: number;    // Del mes anterior
  dangerThreshold?: number;     // % que activa alerta
  
  // Notas
  notes?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PAYLOAD PARA CREAR/ACTUALIZAR
// ============================================

export interface ExpensePayload {
  isPrimordial: boolean;
  category: ExpenseCategory;
  subcategory?: string;
  name: string;
  provider?: string;
  description?: string;
  budgetedAmount: number;
  dueDayOfMonth: number | null;
  isRecurring: boolean;
  frequency: ExpenseFrequency;
  isSubscription?: boolean;
  subscriptionPrice?: number;
  isVariable?: boolean;
  notes?: string;
}

// ============================================
// MONTHLY EXPENSE SUMMARY
// ============================================

export interface MonthlyExpenseSummary {
  monthId: string;
  
  // Totals presupuestados
  totalBudgeted: number;
  totalActual: number;
  
  // Primordiales
  primordialBudgeted: number;
  primordialActual: number;
  primordialCount: number;
  
  // No primordiales  
  nonPrimordialBudgeted: number;
  nonPrimordialActual: number;
  nonPrimordialCount: number;
  
  // Por categoría
  byCategory: {
    category: ExpenseCategory;
    name: string;
    budgeted: number;
    actual: number;
    status: PaymentStatus;
  }[];
  
  // Próximos pagos
  upcomingPayments: {
    expenseId: string;
    name: string;
    amount: number;
    dueDate: number;
    isOverdue: boolean;
  }[];
  
  // Alertas
  alerts: {
    type: 'overdue' | 'budget_exceeded' | 'price_change' | 'variable_spike';
    expenseId: string;
    message: string;
  }[];
  
  lastUpdated: string;
}

// ============================================
// CATEGORÍAS PREDEFINIDAS
// ============================================

export const PRIMORDIAL_CATEGORIES: Record<PrimordialCategory, { name: string; icon: string }> = {
  housing: { name: 'Vivienda', icon: '🏠' },
  utilities: { name: 'Servicios', icon: '💡' },
  transport: { name: 'Transporte', icon: '🚌' },
  health: { name: 'Salud', icon: '🏥' },
  debt: { name: 'Deudas', icon: '🏦' },
  groceries: { name: 'Supermercado', icon: '🛒' },
  education: { name: 'Educación', icon: '📚' }
};

export const NON_PRIMORDIAL_CATEGORIES: Record<NonPrimordialCategory, { name: string; icon: string }> = {
  dining_out: { name: 'Comida fuera', icon: '🍔' },
  entertainment: { name: 'Entretenimiento', icon: '🎬' },
  streaming: { name: 'Streaming', icon: '📺' },
  pets: { name: 'Mascotas', icon: '🐕' },
  clothing: { name: 'Ropa', icon: '👕' },
  travel: { name: 'Viajes', icon: '✈️' },
  shopping: { name: 'Compras', icon: '🛍️' },
  subscriptions: { name: 'Suscripciones', icon: '📱' }
};

// Helper para obtener todas las categorías
export function getAllExpenseCategories() {
  return {
    ...PRIMORDIAL_CATEGORIES,
    ...NON_PRIMORDIAL_CATEGORIES
  };
}

// ============================================
// CÁLCULOS DE ESTADO
// ============================================

export function calculatePaymentStatus(
  dueDayOfMonth: number | null,
  actualAmount: number,
  budgetedAmount: number,
  paymentDate?: string
): PaymentStatus {
  const today = new Date();
  const currentDay = today.getDate();
  
  // Si tiene fecha de pago, está pagado
  if (paymentDate) {
    return 'paid';
  }
  
  // Si no hay día de vencimiento, está pendiente
  if (!dueDayOfMonth) {
    return actualAmount > 0 ? 'partial' : 'pending';
  }
  
  // Si ya pasó la fecha y no hay pago, overdue
  if (currentDay > dueDayOfMonth && actualAmount === 0) {
    return 'overdue';
  }
  
  // Si hay pago parcial
  if (actualAmount > 0 && actualAmount < budgetedAmount) {
    return 'partial';
  }
  
  // Si hay pago completo
  if (actualAmount >= budgetedAmount) {
    return 'paid';
  }
  
  // Pendiente
  return 'pending';
}

export function calculateOptimalPaymentDay(
  incomeDay: number,
  dueDay: number
): number {
  // Si el ingreso viene antes del vencimiento, pagar el día del ingreso
  if (incomeDay <= dueDay) {
    return incomeDay;
  }
  // Si el ingreso viene después, pagar el día anterior al vencimiento
  return Math.max(1, dueDay - 3);
}