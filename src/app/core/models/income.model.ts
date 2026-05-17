export interface IncomeSource {
  id: string;
  userId: string;
  
  // Tipo de ingreso
  type: 'salary' | 'freelance' | 'business' | 'afp' | 'rental' | 'dividends' | 'allowance' | 'other';
  name: string; // "Sueldo empresa X", "Freelance diseño"
  
  // Monto
  amount: number; // Monto estimado/presupuestado
  actualAmount?: number; // Monto real recibido este mes
  
  // Frecuencia
  frequency: 'weekly' | 'biweekly' | 'monthly';
  
  // Fecha de pago
  paymentDayOfMonth: number | null; // Día del mes (ej: 15, 30) - null = variable/ocasional
  firstPaymentDate?: string; // Primera fecha de pago
  lastPaymentDate?: string; // Última fecha de pago
  
  // Deducciones (para salary)
  deductions?: {
    afpPercent?: number;      // ej: 13%
    insurancePercent?: number; // ej: 4%
    otherDeductions?: { name: string; percent: number; amount: number }[];
  };
  
  // Estado
  isActive: boolean;
  isRecurring: boolean;
  
  // Notas
  notes?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface IncomeSourcePayload {
  type: IncomeSource['type'];
  name: string;
  amount: number;
  frequency: IncomeSource['frequency'];
  paymentDayOfMonth: number | null;
  deductions?: IncomeSource['deductions'];
  isRecurring: boolean;
  notes?: string;
}

export interface MonthlyIncome {
  monthId: string; // "2026-05"
  
  // Totals presupuestados
  totalBudgeted: number;
  sources: {
    sourceId: string;
    name: string;
    budgeted: number;
    received: number;
    expectedDate: number | null;
    receivedDate?: string;
    status: 'pending' | 'partial' | 'received' | 'overdue';
  }[];
  
  // Totales reales
  totalReceived: number;
  totalPending: number;
  
  // Balance inicial
  initialBalance: number;
  
  // Disponible real
  availableNow: number;
  
  // Updated
  lastUpdated: string;
}