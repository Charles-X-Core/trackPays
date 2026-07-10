// ============================================
// EXPENSE MODEL - Sistema Dual de Gastos (EXTENSIBLE)
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
  | 'subscriptions'  // Suscripciones varias
  | 'other';          // Otros gastos varios

// ============================================
// CATEGORÍAS EXPANDIBLES (para futuro)
// ============================================

// Extendible: agregar más categorías aquí sin romper
export type ExtendedPrimordialCategory = 
  | PrimordialCategory
  | 'insurance'           // Seguros específicos
  | 'childcare'           // Cuidado de niños
  | 'maintenance'         // Mantenimiento del hogar
  | 'legal'               // Servicios legales
  | 'taxes'               // Impuestos
  | 'retirement'          // Aportes a jubilación adicional
  | 'professional'        // Colegiaturas profesionales
  | 'custom_primordial';  // Personalizado

export type ExtendedNonPrimordialCategory = 
  | NonPrimordialCategory
  | 'gifts'               // Regalos
  | 'sports'              // Deportes / Gimnasio
  | 'hobbies'             // Pasatiempos
  | 'technology'          // Tecnología / Gadgets
  | 'beauty'              // Cuidado personal / Belleza
  | 'home_improvement'    // Mejoras del hogar
  | 'subscriptions_software' // Software / Apps
  | 'bank_fees'          // Comisiones bancarias
  | 'fines'              // Multas / Tarifas
  | 'custom_non_primordial'; // Personalizado

export type ExpenseCategory = PrimordialCategory | NonPrimordialCategory;

// Estados de pago
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';

// Frecuencia de gasto
export type ExpenseFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

// ============================================
// INTERFACE PRINCIPAL (EXTENSIBLE)
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
  availableDate?: string;               // Fecha de inicio de ventana (YYYY-MM-DD)
  dueDate?: string;                     // Fecha de vencimiento completa (YYYY-MM-DD)
  optimalPaymentDay?: number;           // Día óptimo para pagar (calculado)
  paymentDate?: string;                 // Fecha cuando se pagó
  startDate: string;                    // Desde cuándo aplica
  endDate?: string;                     // Hasta cuándo aplica (null = indefinido)
  
  // Estado
  status: PaymentStatus;
  isRecurring: boolean;
  frequency: ExpenseFrequency;
  isActive: boolean;
  
  // Transacción asociada (cuando se marca como pagado)
  transactionId?: string;
  
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
  
  // ============================================
  // CAMPOS EXTENSIBLES (para futuro)
  // ============================================
  
  // Detalle del proveedor (extensible)
  providerDetails?: {
    accountNumber?: string;      // Número de cuenta
    contractNumber?: string;     // Número de contrato
    planType?: string;          // Tipo de plan (ej: "Premium", "Básico")
    billingCycle?: string;      // Ciclo de facturación
    contactPhone?: string;      // Teléfono de contacto
    website?: string;           // Web del proveedor
  };
  
  // Deudas específicas (extensible)
  debtDetails?: {
    debtType: 'personal' | 'credit_card' | 'car_loan' | 'mortgage' | 'student_loan' | 'friend' | 'other';
    creditorName: string;       // A quién debes
    interestRate?: number;      // Tasa de interés
    totalDebt?: number;         // Deuda total original
    remainingPayments?: number; // Cuotas restantes
    isConsolidated?: boolean;   // Si está consolidado
  };
  
  // Servicios detallados (extensible)
  serviceDetails?: {
    serviceType?: string;       // Tipo de servicio específico
    usage?: string;             // Consumo (kWh, m3, GB)
    previousReading?: number;   // Lectura anterior (para variables)
    currentReading?: number;    // Lectura actual
    tariffType?: string;       // Tipo de tarifa
  };
  
  // Tags personalizados (extensible)
  tags?: string[];
  
  // Metadatos adicionales (extensible - key-value)
  metadata?: Record<string, any>;
  
  // Notas estructuradas
  notes?: string;
  
  // ============================================
  // Para sincronización y versionado
  // ============================================
  version?: number;
  lastSyncedAt?: string;
  
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
  availableDate?: string;
  dueDate?: string;
  isRecurring: boolean;
  frequency: ExpenseFrequency;
  isSubscription?: boolean;
  subscriptionPrice?: number;
  isVariable?: boolean;
  dangerThreshold?: number;
  metadata?: Record<string, any>;
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
  housing: { name: 'Vivienda', icon: 'house' },
  utilities: { name: 'Servicios', icon: 'lightbulb' },
  transport: { name: 'Transporte', icon: 'bus' },
  health: { name: 'Salud', icon: 'hospital' },
  debt: { name: 'Deudas', icon: 'landmark' },
  groceries: { name: 'Supermercado', icon: 'shopping-cart' },
  education: { name: 'Educación', icon: 'graduation-cap' }
};

export const NON_PRIMORDIAL_CATEGORIES: Record<NonPrimordialCategory, { name: string; icon: string }> = {
  dining_out: { name: 'Comida fuera', icon: 'utensils' },
  entertainment: { name: 'Entretenimiento', icon: 'clapperboard' },
  streaming: { name: 'Streaming', icon: 'tv' },
  pets: { name: 'Mascotas', icon: 'dog' },
  clothing: { name: 'Ropa', icon: 'shirt' },
  travel: { name: 'Viajes', icon: 'plane' },
  shopping: { name: 'Compras', icon: 'shopping-bag' },
  subscriptions: { name: 'Suscripciones', icon: 'repeat' },
  other: { name: 'Otros', icon: 'package' }
};

// ============================================
// SUBCATEGORÍAS PREDEFINIDAS POR CATEGORÍA
// ============================================

export const SUBCATEGORIES_BY_CATEGORY: Record<string, string[]> = {
  // Primordiales
  housing:    ['Alquiler', 'Hipoteca', 'Cuota de casa'],
  utilities:  ['Luz', 'Agua', 'Internet', 'Gas', 'Teléfono'],
  transport:  ['Pasajes', 'Gasolina', 'Peaje', 'Taxi', 'Mantenimiento'],
  health:     ['EPS', 'Seguro', 'Medicamentos', 'Consulta', 'Dentista'],
  groceries:  ['Supermercado', 'Verdulería', 'Carnicería', 'Mercado'],
  education:  ['Colegiatura', 'Universidad', 'Curso', 'Libros'],
  debt:       ['Tarjeta crédito', 'Préstamo', 'Crédito', 'Cuota'],
  // No primordiales
  streaming:     ['Netflix', 'Spotify', 'Amazon Prime', 'Disney+', 'HBO Max', 'Crunchyroll'],
  dining_out:    ['Restaurantes', 'Delivery', 'Café', 'Fast Food'],
  entertainment: ['Cine', 'Concierto', 'Bar', 'Juego', 'Deporte'],
  pets:          ['Alimento', 'Veterinaria', 'Accesorios', 'Peluquería'],
  clothing:      ['Ropa', 'Calzado', 'Accesorios'],
  travel:        ['Pasaje aéreo', 'Hotel', 'Alojamiento', 'Alquiler auto'],
  shopping:      ['Compras', 'Regalos', 'Hogar', 'Tecnología'],
  subscriptions: ['Gimnasio', 'Software', 'Apps', 'Membresía'],
  other:         ['Otro']
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