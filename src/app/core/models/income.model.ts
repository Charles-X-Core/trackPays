// ============================================
// SISTEMA PROFESIONAL DE INGRESOS v2
// Recurrencia inteligente + predicciones
// ============================================

export type IncomeCategory =
  | 'active'
  | 'passive'
  | 'eventual'
  | 'digital'
  | 'transfer'
  | 'state'
  | 'business'
  | 'other';

export type IncomeType =
  | 'salary' | 'fees' | 'commissions' | 'overtime'
  | 'rental' | 'interest' | 'dividends' | 'royalties'
  | 'gratification' | 'cts' | 'bonus' | 'settlement'
  | 'content' | 'affiliates' | 'digital_products' | 'crypto'
  | 'family' | 'pension_alimony'
  | 'subsidies' | 'state_pension'
  | 'business_sales' | 'business_services' | 'business_investment_return'
  | 'prize' | 'refund' | 'unique_income' | 'unexpected_event'
  | 'other';

export type IncomeFrequency =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'bimonthly'
  | 'quarterly'
  | 'semi_annual'
  | 'annual'
  | 'variable';

export type MonthlyRule =
  | { kind: 'day'; day: number }           // día 5, día 15, día 30
  | { kind: 'last_day' }                   // último día del mes
  | { kind: 'first_weekday'; weekday: number }; // primer lunes, primer viernes

export interface RecurrenceRule {
  frequency: IncomeFrequency;
  startDate: string;                       // Fecha de inicio obligatoria (YYYY-MM-DD)
  // Semanal
  weeklyDays?: number[];                   // [1,3,5] = lunes, miércoles, viernes
  // Quincenal
  biweeklyMode?: 'two_dates' | 'every_15'; // dos días del mes vs cada 15 días
  biweeklyDates?: [number, number];        // [10, 25] – dos días fijos
  // Mensual y superiores
  monthlyRule?: MonthlyRule;
  // Anual
  annualMonth?: number;                    // 2 = febrero
  annualDay?: number;                      // 15
  // Variable / puntual
  endDate?: string | null;                 // Fecha final opcional
}

export interface IncomeSource {
  id: string;
  userId: string;
  category: IncomeCategory;
  type: IncomeType;
  name: string;
  description?: string;
  amount: number;
  actualAmount?: number;
  currency?: string;

  // Recurrencia inteligente
  recurrence: RecurrenceRule;
  nextOccurrences: string[];               // Próximas 6 fechas calculadas
  lastReceivedDate?: string;               // Última vez que se recibió

  // Estado actual
  paymentStatus: {
    status: 'pending' | 'received' | 'overdue' | 'upcoming' | 'scheduled';
    nextDate: string | null;
    daysUntil: number | null;
    isLate: boolean;
    missedCount: number;
    missedMonths: string[];
  };

  // Solo para ingresos recurrentes (no 'other' rápido)
  alertBeforeDays?: number | null;
  autoCreateTransaction?: boolean;

  // Deducciones (solo salarios)
  deductions?: {
    afpPercent?: number;
    insurancePercent?: number;
    fifthCategoryPercent?: number;
    otherDeductions?: { name: string; percent?: number; amount?: number; isFixed: boolean }[];
  };

  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeSourcePayload {
  category: IncomeCategory;
  type: IncomeType;
  name: string;
  description?: string;
  amount: number;
  currency?: string;
  recurrence: RecurrenceRule;
  alertBeforeDays?: number | null;
  autoCreateTransaction?: boolean;
  deductions?: IncomeSource['deductions'];
  notes?: string;
}

export interface MonthlyIncome {
  monthId: string;
  year: number;
  month: number;
  byCategory: Record<IncomeCategory, number>;
  totalBudgeted: number;
  totalReceived: number;
  totalPending: number;
  receivedPercentage: number;
  sources: MonthlyIncomeSource[];
  predictions: {
    nextPaymentDate: string | null;
    nextPaymentAmount: number;
    expectedEndOfMonth: number;
  };
  initialBalance: number;
  availableNow: number;
  lastUpdated: string;
}

export interface MonthlyIncomeSource {
  sourceId: string;
  name: string;
  category: IncomeCategory;
  type: IncomeType;
  budgeted: number;
  received: number;
  expectedDate: string | null;
  receivedDate?: string | null;
  status: 'pending' | 'received' | 'overdue' | 'upcoming' | 'scheduled';
  daysUntilPayment: number | null;
}

// ============================================
// MAPAS DE CATEGORÍAS Y TIPOS
// ============================================

export const INCOME_CATEGORIES: Record<IncomeCategory, { label: string; icon: string; description: string }> = {
  active: { label: 'Ingresos Activos', icon: 'briefcase', description: 'Trabajo dependiente o independiente' },
  passive: { label: 'Ingresos Pasivos', icon: 'trending-up', description: 'Dinero que trabaja por ti' },
  eventual: { label: 'Ingresos Eventuales', icon: 'gift', description: 'Pagos extraordinarios' },
  digital: { label: 'Ingresos Digitales', icon: 'monitor', description: 'Plataformas y contenido online' },
  transfer: { label: 'Transferencias', icon: 'users', description: 'Apoyo familiar o pensiones' },
  state: { label: 'Beneficios del Estado', icon: 'landmark', description: 'Subsidios y pensiones' },
  business: { label: 'Negocio / Emprendimiento', icon: 'store', description: 'Ventas, servicios e inversiones del negocio' },
  other: { label: 'Otros Ingresos', icon: 'coins', description: 'Ingresos varios e inesperados' }
};

export const INCOME_TYPES: Record<IncomeType, {
  label: string;
  category: IncomeCategory;
  icon: string;
  description: string;
  typicalFrequency: IncomeFrequency;
  isQuick?: boolean; // true = ingreso puntual, sin recurrencia compleja
}> = {
  salary: { label: 'Sueldo / Remuneración', category: 'active', icon: 'briefcase', description: 'Pago mensual fijo por trabajo dependiente', typicalFrequency: 'monthly' },
  fees: { label: 'Honorarios', category: 'active', icon: 'file-text', description: 'Recibos por honorarios (independientes)', typicalFrequency: 'monthly' },
  commissions: { label: 'Comisiones', category: 'active', icon: 'chart-bar-increasing', description: 'Pago por ventas o metas cumplidas', typicalFrequency: 'monthly' },
  overtime: { label: 'Horas Extras', category: 'active', icon: 'clock', description: 'Pago adicional por tiempo extra', typicalFrequency: 'monthly' },

  rental: { label: 'Alquileres', category: 'passive', icon: 'house', description: 'Ingresos por propiedades', typicalFrequency: 'monthly' },
  interest: { label: 'Intereses', category: 'passive', icon: 'percent', description: 'Cuentas de ahorro, depósitos a plazo', typicalFrequency: 'monthly' },
  dividends: { label: 'Dividendos', category: 'passive', icon: 'trending-up', description: 'Ganancias de acciones o inversiones', typicalFrequency: 'quarterly' },
  royalties: { label: 'Regalías', category: 'passive', icon: 'scroll-text', description: 'Derechos de autor, contenido', typicalFrequency: 'monthly' },

  gratification: { label: 'Gratificación', category: 'eventual', icon: 'party-popper', description: 'Julio y diciembre (1 sueldo)', typicalFrequency: 'semi_annual' },
  cts: { label: 'CTS', category: 'eventual', icon: 'calendar-check', description: 'Compensación por Tiempo de Servicio', typicalFrequency: 'semi_annual' },
  bonus: { label: 'Bonos', category: 'eventual', icon: 'award', description: 'Por desempeño o campañas', typicalFrequency: 'annual' },
  settlement: { label: 'Liquidación', category: 'eventual', icon: 'file-check', description: 'Al terminar relación laboral', typicalFrequency: 'variable' },

  content: { label: 'Contenido Digital', category: 'digital', icon: 'circle-play', description: 'YouTube, TikTok, Twitch', typicalFrequency: 'monthly' },
  affiliates: { label: 'Afiliados', category: 'digital', icon: 'link', description: 'Comisiones por referidos', typicalFrequency: 'monthly' },
  digital_products: { label: 'Productos Digitales', category: 'digital', icon: 'package', description: 'Cursos, ebooks, software', typicalFrequency: 'monthly' },
  crypto: { label: 'Cripto / Trading', category: 'digital', icon: 'bitcoin', description: 'Ganancias por trading', typicalFrequency: 'variable' },

  family: { label: 'Transferencias Familiares', category: 'transfer', icon: 'heart', description: 'Apoyo de familiares', typicalFrequency: 'monthly' },
  pension_alimony: { label: 'Pensión / Manutención', category: 'transfer', icon: 'scale', description: 'Pensión alimenticia', typicalFrequency: 'monthly' },

  subsidies: { label: 'Subsidios', category: 'state', icon: 'ticket', description: 'Apoyo del gobierno', typicalFrequency: 'monthly' },
  state_pension: { label: 'Pensión del Estado', category: 'state', icon: 'building-2', description: 'ONP o AFP (jubilación)', typicalFrequency: 'monthly' },

  business_sales: { label: 'Ventas del Negocio', category: 'business', icon: 'shopping-bag', description: 'Productos o servicios vendidos', typicalFrequency: 'monthly' },
  business_services: { label: 'Servicios Profesionales', category: 'business', icon: 'wrench', description: 'Consultoría, asesoría, freelance corporativo', typicalFrequency: 'monthly' },
  business_investment_return: { label: 'Retorno de Inversión', category: 'business', icon: 'trending-up', description: 'Ganancias reinvertidas del negocio', typicalFrequency: 'quarterly' },

  prize: { label: 'Premio / Rifa', category: 'other', icon: 'trophy', description: 'Sorteos, concursos, rifas ganadas', typicalFrequency: 'variable', isQuick: true },
  refund: { label: 'Reembolso', category: 'other', icon: 'rotate-ccw', description: 'Devolución de dinero por compra o servicio', typicalFrequency: 'variable', isQuick: true },
  unique_income: { label: 'Ingreso Único', category: 'other', icon: 'sparkles', description: 'Pago puntual no recurrente', typicalFrequency: 'variable', isQuick: true },
  unexpected_event: { label: 'Evento Inesperado', category: 'other', icon: 'zap', description: 'Herencia, donación, situación imprevista', typicalFrequency: 'variable', isQuick: true },
  other: { label: 'Otros', category: 'other', icon: 'circle-dollar-sign', description: 'Cualquier otro ingreso no clasificado', typicalFrequency: 'variable', isQuick: true }
};

// Helpers
export function getIncomeTypesByCategory(category: IncomeCategory): IncomeType[] {
  return (Object.keys(INCOME_TYPES) as IncomeType[]).filter(t => INCOME_TYPES[t].category === category);
}
export function getCategoryLabel(c: IncomeCategory): string { return INCOME_CATEGORIES[c]?.label || c; }
export function getTypeLabel(t: IncomeType): string { return INCOME_TYPES[t]?.label || t; }
export function getTypeIcon(t: IncomeType): string { return INCOME_TYPES[t]?.icon || 'coins'; }
export function getTypeInfo(t: IncomeType) { return INCOME_TYPES[t]; }
export function isQuickIncome(t: IncomeType): boolean { return !!INCOME_TYPES[t]?.isQuick; }

// ============================================
// MOTOR DE RECURRENCIA INTELIGENTE
// ============================================

/** Devuelve el último día válido de un mes/año */
function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Ajusta un día solicitado si excede los días del mes */
function clampDay(year: number, month: number, day: number): number {
  return Math.min(day, lastDayOfMonth(year, month));
}

/** Primer día de la semana (0=domingo) en un mes/año */
function firstWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const d = new Date(year, month, 1);
  let daysToAdd = (weekday - d.getDay() + 7) % 7;
  if (daysToAdd < 0) daysToAdd += 7;
  d.setDate(1 + daysToAdd);
  return d;
}

/** Calcula la siguiente ocurrencia a partir de una fecha base */
function nextOccurrence(rule: RecurrenceRule, from: Date): Date | null {
  const { frequency, monthlyRule, weeklyDays, biweeklyMode, biweeklyDates, annualMonth, annualDay } = rule;
  const result = new Date(from);

  switch (frequency) {
    case 'weekly': {
      if (!weeklyDays?.length) return null;
      const currentWeekday = result.getDay();
      const nextDay = weeklyDays.find(d => d > currentWeekday) ?? weeklyDays[0];
      const daysToAdd = nextDay > currentWeekday
        ? nextDay - currentWeekday
        : (7 - currentWeekday) + nextDay;
      result.setDate(result.getDate() + daysToAdd);
      return result;
    }

    case 'biweekly': {
      if (biweeklyMode === 'two_dates' && biweeklyDates?.length === 2) {
        const [d1, d2] = biweeklyDates;
        const currentDay = result.getDate();
        const year = result.getFullYear();
        const month = result.getMonth();
        if (currentDay < d1) {
          result.setDate(clampDay(year, month, d1));
        } else if (currentDay < d2) {
          result.setDate(clampDay(year, month, d2));
        } else {
          result.setMonth(month + 1);
          result.setDate(clampDay(result.getFullYear(), result.getMonth(), d1));
        }
        return result;
      }
      // every_15: cada 15 días desde startDate
      result.setDate(result.getDate() + 14);
      return result;
    }

    case 'monthly':
    case 'bimonthly':
    case 'quarterly':
    case 'semi_annual': {
      const interval =
        frequency === 'monthly' ? 1 :
        frequency === 'bimonthly' ? 2 :
        frequency === 'quarterly' ? 3 : 6;

      let targetMonth = result.getMonth() + interval;
      let targetYear = result.getFullYear();
      while (targetMonth > 11) { targetMonth -= 12; targetYear++; }

      if (monthlyRule?.kind === 'day') {
        result.setFullYear(targetYear, targetMonth, clampDay(targetYear, targetMonth, monthlyRule.day));
      } else if (monthlyRule?.kind === 'last_day') {
        result.setFullYear(targetYear, targetMonth, lastDayOfMonth(targetYear, targetMonth));
      } else if (monthlyRule?.kind === 'first_weekday') {
        const d = firstWeekdayOfMonth(targetYear, targetMonth, monthlyRule.weekday);
        result.setTime(d.getTime());
      } else {
        // fallback: mismo día del mes
        const originalDay = new Date(rule.startDate).getDate();
        result.setFullYear(targetYear, targetMonth, clampDay(targetYear, targetMonth, originalDay));
      }
      return result;
    }

    case 'annual': {
      const start = new Date(rule.startDate);
      const month = annualMonth ?? start.getMonth();
      const day = annualDay ?? start.getDate();
      let targetYear = result.getFullYear();
      const candidate = new Date(targetYear, month, day);
      if (candidate <= from) candidate.setFullYear(targetYear + 1);
      // Ajuste bisiesto: si el día es 29 de febrero y no es bisiesto, usar 28
      if (month === 1 && day === 29 && !isLeapYear(candidate.getFullYear())) {
        candidate.setDate(28);
      }
      return candidate;
    }

    case 'variable':
    default:
      return null;
  }
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/** Genera las próximas N ocurrencias */
export function generateOccurrences(rule: RecurrenceRule | undefined | null, count = 6): string[] {
  if (!rule || rule.frequency === 'variable') return [];
  const results: string[] = [];
  let cursor = new Date(rule.startDate);
  const today = new Date();
  if (cursor < today) cursor = today;

  let safety = 0;
  while (results.length < count && safety < 100) {
    safety++;
    const next = nextOccurrence(rule, cursor);
    if (!next) break;
    // Evitar duplicados
    const iso = next.toISOString().split('T')[0];
    if (!results.includes(iso)) results.push(iso);
    cursor = new Date(next);
    cursor.setDate(cursor.getDate() + 1); // avanzar un día para no quedarse en loop

    if (rule.endDate && iso > rule.endDate) break;
  }
  return results;
}

/** Calcula el estado de pago actual */
export function calculatePaymentStatus(
  rule: RecurrenceRule,
  nextDates: string[],
  lastReceivedDate?: string,
  alertBeforeDays: number = 3
): IncomeSource['paymentStatus'] {
  // Ingreso puntual/variable: no tiene próximas fechas
  if (rule.frequency === 'variable') {
    return { status: 'received', nextDate: null, daysUntil: null, isLate: false, missedCount: 0, missedMonths: [] };
  }

  if (nextDates.length === 0) {
    return { status: 'pending', nextDate: null, daysUntil: null, isLate: false, missedCount: 0, missedMonths: [] };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Buscar la primera fecha futura en el array
  let futureIndex = -1;
  for (let i = 0; i < nextDates.length; i++) {
    const d = new Date(nextDates[i]);
    d.setHours(0, 0, 0, 0);
    if (d >= today) { futureIndex = i; break; }
  }

  let missedCount = 0;
  let missedMonths: string[] = [];
  let chosenDateStr: string | null = null;

  if (futureIndex >= 0) {
    chosenDateStr = nextDates[futureIndex];
    missedCount = futureIndex;
    for (let i = 0; i < futureIndex; i++) {
      const d = new Date(nextDates[i] + 'T12:00:00');
      missedMonths.push(d.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }));
    }
  } else {
    // Todos los nextDates son pasados — regenerar desde recurrence
    const newDates = generateOccurrences(rule, 6);
    if (newDates.length > 0) {
      chosenDateStr = newDates[0];
      missedCount = nextDates.length;
      for (const dateStr of nextDates) {
        const d = new Date(dateStr + 'T12:00:00');
        missedMonths.push(d.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }));
      }
    }
  }

  if (!chosenDateStr) {
    return { status: 'pending', nextDate: null, daysUntil: null, isLate: false, missedCount: 0, missedMonths: [] };
  }

  const chosenDate = new Date(chosenDateStr);
  chosenDate.setHours(0, 0, 0, 0);

  const diffMs = chosenDate.getTime() - today.getTime();
  const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // Si ya recibió esta ocurrencia
  if (lastReceivedDate && missedCount === 0) {
    const last = new Date(lastReceivedDate);
    last.setHours(0, 0, 0, 0);
    if (last >= chosenDate) {
      return { status: 'received', nextDate: chosenDateStr, daysUntil: null, isLate: false, missedCount: 0, missedMonths: [] };
    }
  }

  // Si hay pagos perdidos pero ya estamos en fecha futura, status es upcoming/scheduled
  if (missedCount > 0) {
    if (daysUntil <= alertBeforeDays && daysUntil >= 0) {
      return { status: 'upcoming', nextDate: chosenDateStr, daysUntil, isLate: false, missedCount, missedMonths };
    }
    return { status: 'scheduled', nextDate: chosenDateStr, daysUntil, isLate: false, missedCount, missedMonths };
  }

  if (daysUntil < 0) {
    return { status: 'overdue', nextDate: chosenDateStr, daysUntil, isLate: true, missedCount: 0, missedMonths: [] };
  }
  if (daysUntil <= alertBeforeDays && daysUntil >= 0) {
    return { status: 'upcoming', nextDate: chosenDateStr, daysUntil, isLate: false, missedCount: 0, missedMonths: [] };
  }
  return { status: 'scheduled', nextDate: chosenDateStr, daysUntil, isLate: false, missedCount: 0, missedMonths: [] };
}

/** Detecta patrones simples a partir de fechas históricas */
export function detectPattern(dates: string[]): { frequency: IncomeFrequency | null; confidence: number } {
  if (dates.length < 2) return { frequency: null, confidence: 0 };
  const sorted = dates.map(d => new Date(d).getTime()).sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(Math.round((sorted[i] - sorted[i - 1]) / (1000 * 60 * 60 * 24)));
  }
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const variance = gaps.reduce((sum, g) => sum + Math.abs(g - avg), 0) / gaps.length;

  if (variance <= 2) {
    if (avg >= 13 && avg <= 17) return { frequency: 'biweekly', confidence: 0.9 };
    if (avg >= 27 && avg <= 31) return { frequency: 'monthly', confidence: 0.9 };
    if (avg >= 6 && avg <= 8) return { frequency: 'weekly', confidence: 0.9 };
    if (avg >= 58 && avg <= 62) return { frequency: 'bimonthly', confidence: 0.85 };
    if (avg >= 88 && avg <= 94) return { frequency: 'quarterly', confidence: 0.85 };
    if (avg >= 178 && avg <= 184) return { frequency: 'semi_annual', confidence: 0.85 };
    if (avg >= 360 && avg <= 370) return { frequency: 'annual', confidence: 0.85 };
  }
  return { frequency: null, confidence: 0 };
}

/** Predice montos futuros para dashboards */
export function predictFutureIncome(
  sources: Array<{ amount: number; recurrence: RecurrenceRule; nextOccurrences: string[] }>,
  monthsAhead = 3
): Array<{ month: string; year: number; monthNum: number; predicted: number }> {
  const results: Array<{ month: string; year: number; monthNum: number; predicted: number }> = [];
  const now = new Date();

  for (let i = 0; i < monthsAhead; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const year = d.getFullYear();
    const monthNum = d.getMonth() + 1;
    const monthLabel = d.toLocaleDateString('es-PE', { month: 'long' });

    let predicted = 0;
    for (const src of sources) {
      if (src.recurrence.frequency === 'variable') continue;
      const hasOccurrenceInMonth = src.nextOccurrences.some(dateStr => {
        const date = new Date(dateStr);
        return date.getFullYear() === year && date.getMonth() + 1 === monthNum;
      });
      if (hasOccurrenceInMonth) predicted += src.amount;
    }

    results.push({ month: monthLabel, year, monthNum, predicted });
  }

  return results;
}

// ============================================
// HISTORIAL PERMANENTE DE MOVIMIENTOS
// ============================================

export interface IncomeHistoryEntry {
  id: string;
  sourceId: string;
  sourceName: string;
  type: 'transfer' | 'deletion' | 'reactivation';
  amount: number;
  date: string;       // Fecha local: "2026-05-24"
  time: string;       // Hora local: "15:45"
  category: string;
  description: string;
}
