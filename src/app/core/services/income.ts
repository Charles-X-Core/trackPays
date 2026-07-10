import { Injectable, inject } from '@angular/core';
import { FirebaseService } from './firebase';
import { Auth } from './auth';
import { TransactionService } from './transaction';
import {
  IncomeSource,
  IncomeSourcePayload,
  MonthlyIncome,
  MonthlyIncomeSource,
  IncomeCategory,
  IncomeType,
  generateOccurrences,
  nextOccurrence,
  calculatePaymentStatus,
  predictFutureIncome,
  INCOME_TYPES,
  isQuickIncome,
  calculateDeductions
} from '../models/income.model';

@Injectable({ providedIn: 'root' })
export class IncomeService {
  private firebase = inject(FirebaseService);
  private authService = inject(Auth);
  private transactionService = inject(TransactionService);

  private localToday(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // ── CRUD ──

  async getAll(): Promise<IncomeSource[]> {
    const userId = this.authService.getUserId();
    if (!userId) return [];
    const data = await this.firebase.getIncomeSources(userId);
    return data.map((src: any) => this.enrich(src));
  }

  async getActive(): Promise<IncomeSource[]> {
    const sources = await this.getAll();
    return sources.filter(s => s.isActive);
  }

  async create(payload: IncomeSourcePayload): Promise<IncomeSource> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    // Asegurar alertBeforeDays mínimo 1 para recurrentes
    const alertBeforeDays = payload.recurrence.frequency === 'variable'
      ? null
      : (payload.alertBeforeDays == null || payload.alertBeforeDays < 1 ? 3 : payload.alertBeforeDays);

    const nextOccurrences = generateOccurrences(payload.recurrence, 6);
    const paymentStatus = calculatePaymentStatus(
      payload.recurrence, nextOccurrences, undefined, alertBeforeDays ?? 3
    );

    const data = {
      ...payload,
      alertBeforeDays,
      userId,
      isActive: true,
      actualAmount: 0,
      currency: payload.currency || 'PEN',
      nextOccurrences,
      paymentStatus,
      lastReceivedDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await this.firebase.createIncomeSource(userId, data);
    return this.enrich(result);
  }

  async update(sourceId: string, payload: Partial<IncomeSourcePayload>): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    const updates: any = { ...payload, updatedAt: new Date().toISOString() };

    if (payload.recurrence) {
      const alertDays = payload.alertBeforeDays == null || payload.alertBeforeDays < 1 ? 3 : payload.alertBeforeDays;
      updates.alertBeforeDays = payload.recurrence.frequency === 'variable' ? null : alertDays;
      updates.nextOccurrences = generateOccurrences(payload.recurrence, 6);
      updates.paymentStatus = calculatePaymentStatus(payload.recurrence, updates.nextOccurrences, undefined, alertDays);
    }

    await this.firebase.updateIncomeSource(userId, sourceId, updates);
  }

  async deactivate(sourceId: string): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');
    await this.firebase.updateIncomeSource(userId, sourceId, { isActive: false, updatedAt: new Date().toISOString() });
  }

  // ── CÁLCULOS ──

  async getMonthlyIncome(year: number, month: number, preloadedSources?: IncomeSource[]): Promise<MonthlyIncome> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    const monthId = `${year}-${String(month).padStart(2, '0')}`;
    const sources = (preloadedSources ?? (await this.getActive())).filter(s => s.isActive);

    const byCategory: Record<IncomeCategory, number> = {
      active: 0, passive: 0, eventual: 0, digital: 0,
      transfer: 0, state: 0, business: 0, other: 0
    };

    const monthlySources: MonthlyIncomeSource[] = [];
    let totalBudgeted = 0;
    let totalReceived = 0;

    for (const source of sources) {
      const budgeted = source.amount || 0;
      const received = source.actualAmount || 0;

      const deductionsTotal = calculateDeductions(budgeted, source.deductions);
      const netBudgeted = Math.max(0, budgeted - deductionsTotal);
      const netReceived = received > 0 ? Math.max(0, received - deductionsTotal) : 0;

      byCategory[source.category] += netBudgeted;
      totalBudgeted += netBudgeted;
      totalReceived += netReceived;

      monthlySources.push({
        sourceId: source.id,
        name: source.name,
        category: source.category,
        type: source.type,
        budgeted: netBudgeted,
        received: netReceived,
        expectedDate: source.paymentStatus?.nextDate || null,
        receivedDate: source.lastReceivedDate || null,
        status: source.paymentStatus?.status || 'pending',
        daysUntilPayment: source.paymentStatus?.daysUntil ?? null
      });
    }

    const predictions = predictFutureIncome(
      sources.map(s => ({ amount: s.amount, recurrence: s.recurrence, nextOccurrences: s.nextOccurrences })),
      3
    );

    return {
      monthId, year, month,
      byCategory,
      totalBudgeted,
      totalReceived,
      totalPending: totalBudgeted - totalReceived,
      receivedPercentage: totalBudgeted > 0 ? (totalReceived / totalBudgeted) * 100 : 0,
      sources: monthlySources,
      predictions: {
        nextPaymentDate: predictions[0]?.predicted ? `${predictions[0].month} ${predictions[0].year}` : null,
        nextPaymentAmount: predictions[0]?.predicted || 0,
        expectedEndOfMonth: totalBudgeted
      },
      initialBalance: 0,
      availableNow: totalReceived,
      lastUpdated: new Date().toISOString()
    };
  }

  async markAsReceived(sourceId: string, actualAmount?: number): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    // Fecha y hora local (no UTC)
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Obtener fuente actual para recalcular próximas fechas
    const sources = await this.getAll();
    const source = sources.find(s => s.id === sourceId);
    if (!source) throw new Error('Fuente no encontrada');

    // Clonar recurrencia y avanzar startDate a la siguiente ocurrencia real
    const updatedRecurrence = { ...source.recurrence };
    const paidDate = source.nextOccurrences?.[0] ?? today;
    const paid = new Date(paidDate + 'T12:00:00');

    if (updatedRecurrence.frequency !== 'variable') {
      const nextAfterPaid = nextOccurrence(updatedRecurrence, paid);
      if (nextAfterPaid) {
        const y = nextAfterPaid.getFullYear();
        const m = String(nextAfterPaid.getMonth() + 1).padStart(2, '0');
        const d = String(nextAfterPaid.getDate()).padStart(2, '0');
        updatedRecurrence.startDate = `${y}-${m}-${d}`;
      } else {
        paid.setDate(paid.getDate() + 1);
        const y = paid.getFullYear();
        const m = String(paid.getMonth() + 1).padStart(2, '0');
        const d = String(paid.getDate()).padStart(2, '0');
        updatedRecurrence.startDate = `${y}-${m}-${d}`;
      }
    } else {
      paid.setDate(paid.getDate() + 1);
      const y = paid.getFullYear();
      const m = String(paid.getMonth() + 1).padStart(2, '0');
      const d = String(paid.getDate()).padStart(2, '0');
      updatedRecurrence.startDate = `${y}-${m}-${d}`;
    }

    // Regenerar ocurrencias con el startDate actualizado
    let nextOccurrences: string[] = [];
    if (updatedRecurrence.frequency !== 'variable') {
      nextOccurrences = generateOccurrences(updatedRecurrence, 6);
    }

    // Recalcular estado con la nueva primera fecha
    const alertDays = source.alertBeforeDays == null || source.alertBeforeDays < 1 ? 3 : source.alertBeforeDays;
    const paymentStatus = calculatePaymentStatus(
      updatedRecurrence, nextOccurrences, today, alertDays
    );

    // Write 1: Update income source (critical — throws on failure)
    await this.firebase.updateIncomeSource(userId, sourceId, {
      actualAmount: actualAmount ?? null,
      lastReceivedDate: today,
      recurrence: updatedRecurrence,
      nextOccurrences,
      paymentStatus,
      updatedAt: new Date().toISOString()
    });

    // Write 2: Create transaction (non-critical — log error but don't block)
    if (source.autoCreateTransaction && actualAmount && actualAmount > 0) {
      try {
        await this.transactionService.create({
          amount: actualAmount,
          description: `Ingreso: ${source.name}`,
          date: today,
          type: 'income',
          categoryId: null
        });
      } catch (txError) {
        console.error('Error creating transaction after income confirmation:', txError);
      }
    }

    // Write 3: Add history entry (non-critical — log error but don't block)
    try {
      await this.firebase.addIncomeHistory(userId, {
        sourceId: source.id,
        sourceName: source.name,
        type: 'transfer',
        amount: actualAmount ?? 0,
        date: today,
        time,
        category: source.category,
        description: ''
      });
    } catch (histError) {
      console.error('Error adding income history entry:', histError);
    }
  }

  // ── HELPERS ──

  private enrich(data: any): IncomeSource {
    const source = data as IncomeSource;

    // MIGRACIÓN: datos antiguos usaban 'paymentSchedule', ahora usamos 'recurrence'
    const anySource = source as any;
    if (!source.recurrence && anySource.paymentSchedule) {
      const old = anySource.paymentSchedule;
      source.recurrence = {
        frequency: old.frequency || 'monthly',
        startDate: old.firstPaymentDate || this.localToday()
      };
      // Mapear campos antiguos a nuevos
      if (old.paymentDayOfWeek != null) {
        source.recurrence.weeklyDays = [old.paymentDayOfWeek];
      }
      if (old.paymentDayOfMonth != null) {
        source.recurrence.monthlyRule = { kind: 'day', day: old.paymentDayOfMonth };
      }
      if (old.secondPaymentDay != null) {
        source.recurrence.biweeklyMode = 'two_dates';
        source.recurrence.biweeklyDates = [old.paymentDayOfMonth || 15, old.secondPaymentDay];
      }
    }
    // Asegurar que siempre haya recurrence
    if (!source.recurrence) {
      source.recurrence = { frequency: 'variable', startDate: this.localToday() };
    }

    // Siempre regenerar nextOccurrences desde la recurrence rule
    if (source.recurrence.frequency !== 'variable') {
      source.nextOccurrences = generateOccurrences(source.recurrence, 6);
    }

    // Siempre recalcular paymentStatus con auto-advance
    const alertDays = source.alertBeforeDays == null || source.alertBeforeDays < 1 ? 3 : source.alertBeforeDays;
    source.paymentStatus = calculatePaymentStatus(
      source.recurrence, source.nextOccurrences || [], source.lastReceivedDate, alertDays
    );

    return source;
  }

  getAvailableTypes(category: IncomeCategory): { value: IncomeType; label: string; icon: string; isQuick?: boolean }[] {
    return (Object.keys(INCOME_TYPES) as IncomeType[])
      .filter(t => INCOME_TYPES[t].category === category)
      .map(t => ({ value: t, label: INCOME_TYPES[t].label, icon: INCOME_TYPES[t].icon, isQuick: INCOME_TYPES[t].isQuick }));
  }

  isQuick(type: IncomeType): boolean {
    return isQuickIncome(type);
  }
}
