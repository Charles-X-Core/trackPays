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
  calculatePaymentStatus,
  predictFutureIncome,
  INCOME_TYPES,
  isQuickIncome
} from '../models/income.model';

@Injectable({ providedIn: 'root' })
export class IncomeService {
  private firebase = inject(FirebaseService);
  private authService = inject(Auth);
  private transactionService = inject(TransactionService);

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

  async getByCategory(category: IncomeCategory): Promise<IncomeSource[]> {
    return (await this.getActive()).filter(s => s.category === category);
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

  async delete(sourceId: string): Promise<void> {
    await this.deactivate(sourceId);
  }

  // ── CÁLCULOS ──

  async getMonthlyIncome(year: number, month: number): Promise<MonthlyIncome> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    const monthId = `${year}-${String(month).padStart(2, '0')}`;
    const sources = await this.getActive();

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
      byCategory[source.category] += budgeted;
      totalBudgeted += budgeted;
      totalReceived += received;

      monthlySources.push({
        sourceId: source.id,
        name: source.name,
        category: source.category,
        type: source.type,
        budgeted,
        received,
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

  async getTotalsByCategory(): Promise<Record<IncomeCategory, { budgeted: number; received: number; count: number }>> {
    const sources = await this.getActive();
    const result = {
      active: { budgeted: 0, received: 0, count: 0 },
      passive: { budgeted: 0, received: 0, count: 0 },
      eventual: { budgeted: 0, received: 0, count: 0 },
      digital: { budgeted: 0, received: 0, count: 0 },
      transfer: { budgeted: 0, received: 0, count: 0 },
      state: { budgeted: 0, received: 0, count: 0 },
      business: { budgeted: 0, received: 0, count: 0 },
      other: { budgeted: 0, received: 0, count: 0 }
    };
    for (const s of sources) {
      result[s.category].budgeted += s.amount || 0;
      result[s.category].received += s.actualAmount || 0;
      result[s.category].count += 1;
    }
    return result;
  }

  async getUpcomingPayments(daysAhead = 3): Promise<IncomeSource[]> {
    const sources = await this.getActive();
    return sources.filter(s => {
      const days = s.paymentStatus?.daysUntil;
      return days !== null && days >= 0 && days <= daysAhead;
    });
  }

  async getOverduePayments(): Promise<IncomeSource[]> {
    return (await this.getActive()).filter(s => s.paymentStatus?.status === 'overdue');
  }

  async markAsReceived(sourceId: string, actualAmount?: number): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');
    const today = new Date().toISOString().split('T')[0];

    // Obtener fuente actual para recalcular próximas fechas
    const sources = await this.getAll();
    const source = sources.find(s => s.id === sourceId);
    if (!source) throw new Error('Fuente no encontrada');

    // Clonar recurrencia y avanzar startDate al día DESPUÉS de la fecha pagada
    // para que la próxima ocurrencia sea la siguiente (no la misma)
    const updatedRecurrence = { ...source.recurrence };
    const paidDate = source.nextOccurrences?.[0] ?? today;
    const paid = new Date(paidDate);
    paid.setDate(paid.getDate() + 1); // día siguiente al pago
    updatedRecurrence.startDate = paid.toISOString().split('T')[0];

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

    await this.firebase.updateIncomeSource(userId, sourceId, {
      actualAmount: actualAmount || null,
      lastReceivedDate: today,
      recurrence: updatedRecurrence,
      nextOccurrences,
      paymentStatus,
      updatedAt: new Date().toISOString()
    });

    // Crear transacción automáticamente
    if (actualAmount && actualAmount > 0) {
      await this.transactionService.create({
        amount: actualAmount,
        description: `Ingreso: ${source.name}`,
        date: today,
        type: 'income',
        categoryId: null
      });
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
        startDate: old.firstPaymentDate || new Date().toISOString().split('T')[0]
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
      source.recurrence = { frequency: 'variable', startDate: new Date().toISOString().split('T')[0] };
    }

    // Recalcular si no hay nextOccurrences o están vacíos
    if (!source.nextOccurrences?.length && source.recurrence.frequency !== 'variable') {
      source.nextOccurrences = generateOccurrences(source.recurrence, 6);
    }
    if (!source.paymentStatus || !source.paymentStatus.nextDate) {
      const alertDays = source.alertBeforeDays == null || source.alertBeforeDays < 1 ? 3 : source.alertBeforeDays;
      source.paymentStatus = calculatePaymentStatus(
        source.recurrence, source.nextOccurrences || [], source.lastReceivedDate, alertDays
      );
    }
    return source;
  }

  getAvailableTypes(category: IncomeCategory): { value: IncomeType; label: string; icon: string; isQuick?: boolean }[] {
    return (Object.keys(INCOME_TYPES) as IncomeType[])
      .filter(t => INCOME_TYPES[t].category === category)
      .map(t => ({ value: t, label: INCOME_TYPES[t].label, icon: INCOME_TYPES[t].icon, isQuick: INCOME_TYPES[t].isQuick }));
  }

  getSuggestedFrequency(type: IncomeType): string {
    return INCOME_TYPES[type]?.typicalFrequency || 'monthly';
  }

  isQuick(type: IncomeType): boolean {
    return isQuickIncome(type);
  }
}
