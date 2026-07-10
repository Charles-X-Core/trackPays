import { Injectable, inject } from '@angular/core';
import { FirebaseService } from './firebase';
import { Auth } from './auth';
import { 
  Expense, 
  ExpensePayload, 
  MonthlyExpenseSummary,
  calculatePaymentStatus,
  PRIMORDIAL_CATEGORIES,
  NON_PRIMORDIAL_CATEGORIES,
  getAllExpenseCategories
} from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private firebase = inject(FirebaseService);
  private authService = inject(Auth);

  async getAll(): Promise<Expense[]> {
    const userId = this.authService.getUserId();
    if (!userId) return [];

    const data = await this.firebase.getExpenses(userId);
    return data as Expense[];
  }

  async getActive(): Promise<Expense[]> {
    const userId = this.authService.getUserId();
    if (!userId) return [];

    const data = await this.firebase.getActiveExpenses(userId);
    return data as Expense[];
  }

  async create(payload: ExpensePayload): Promise<Expense> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    // Calculate status based on due date
    const status = calculatePaymentStatus(
      payload.dueDayOfMonth,
      0,
      payload.budgetedAmount
    );

    const data = {
      ...payload,
      status,
      actualAmount: 0
    };

    const result = await this.firebase.createExpense(userId, data);
    return result as Expense;
  }

  async update(expenseId: string, payload: Partial<ExpensePayload>): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    await this.firebase.updateExpense(userId, expenseId, payload);
  }

  async markAsPaid(expenseId: string, amount: number): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    // Obtener el gasto antes de marcarlo para saber si es recurrente
    const allExpenses = await this.firebase.getExpenses(userId);
    const expense = allExpenses.find(e => e.id === expenseId);

    await this.firebase.markExpensePaid(userId, expenseId, amount);
    await this.firebase.updateExpense(userId, expenseId, { isActive: false } as any);

    // Si es gasto recurrente mensual, crear la siguiente ocurrencia para el mes próximo
    if (expense && expense.isRecurring && expense.frequency === 'monthly') {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;

      const newStartDate = `${nextMonthStr}-01`;
      const newDueDate = expense.dueDayOfMonth
        ? `${nextMonthStr}-${String(expense.dueDayOfMonth).padStart(2, '0')}`
        : undefined;

      const newStatus = calculatePaymentStatus(
        expense.dueDayOfMonth,
        0,
        expense.budgetedAmount
      );

      await this.firebase.createExpense(userId, {
        isPrimordial: expense.isPrimordial,
        category: expense.category,
        subcategory: expense.subcategory || '',
        name: expense.name,
        provider: expense.provider || '',
        description: expense.description || '',
        budgetedAmount: expense.budgetedAmount,
        dueDayOfMonth: expense.dueDayOfMonth,
        availableDate: newStartDate,
        dueDate: newDueDate,
        startDate: newStartDate,
        isRecurring: true,
        frequency: 'monthly',
        isSubscription: expense.isSubscription || false,
        isVariable: expense.isVariable || false,
        dangerThreshold: expense.dangerThreshold,
        metadata: expense.metadata ? { ...expense.metadata } : undefined,
        notes: expense.notes || '',
        status: newStatus,
        actualAmount: 0,
        isActive: true
      });
    }
  }

  async cancel(expenseId: string): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    await this.firebase.cancelExpense(userId, expenseId);
  }

  async renewRecurringExpenses(allExpenses: Expense[]): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const recurring = allExpenses.filter(e =>
      e.isRecurring && e.frequency === 'monthly' && e.isActive
    );

    for (const exp of recurring) {
      const existing = await this.firebase.getExpenses(userId);
      const alreadyRenewed = existing.some(e =>
        e.name === exp.name &&
        e.category === exp.category &&
        e.startDate?.startsWith(currentMonth) &&
        e.isActive === true
      );
      if (alreadyRenewed) continue;

      if (exp.status === 'pending' && exp.startDate?.startsWith(currentMonth)) {
        continue;
      }

      if (exp.status !== 'paid' && exp.startDate && !exp.startDate.startsWith(currentMonth)) {
        await this.firebase.updateExpense(userId, exp.id, {
          status: 'overdue'
        } as any);
      }

      const newStartDate = `${currentMonth}-01`;
      const newDueDate = exp.dueDayOfMonth
        ? `${currentMonth}-${String(exp.dueDayOfMonth).padStart(2, '0')}`
        : undefined;

      const newStatus = calculatePaymentStatus(
        exp.dueDayOfMonth,
        0,
        exp.budgetedAmount
      );

      await this.firebase.createExpense(userId, {
        isPrimordial: exp.isPrimordial,
        category: exp.category,
        subcategory: exp.subcategory || '',
        name: exp.name,
        provider: exp.provider || '',
        description: exp.description || '',
        budgetedAmount: exp.budgetedAmount,
        dueDayOfMonth: exp.dueDayOfMonth,
        availableDate: newStartDate,
        dueDate: newDueDate,
        startDate: newStartDate,
        isRecurring: true,
        frequency: 'monthly',
        isSubscription: exp.isSubscription || false,
        isVariable: exp.isVariable || false,
        metadata: exp.metadata ? { ...exp.metadata } : undefined,
        notes: exp.notes || ''
      });
    }
  }

  async getMonthlySummary(year: number, month: number): Promise<MonthlyExpenseSummary> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    const data = await this.firebase.calculateMonthlyExpenses(userId, year, month);
    return data as MonthlyExpenseSummary;
  }

  // Helper methods
  getPrimordialCategories() {
    return PRIMORDIAL_CATEGORIES;
  }

  getNonPrimordialCategories() {
    return NON_PRIMORDIAL_CATEGORIES;
  }

  getAllCategories() {
    return getAllExpenseCategories();
  }

  // Get defaults for primordial expenses
  getDefaultPrimordialExpenses(): Partial<ExpensePayload>[] {
    return [
      {
        isPrimordial: true,
        category: 'housing',
        subcategory: 'alquiler',
        budgetedAmount: 0,
        dueDayOfMonth: 1,
        isRecurring: true,
        frequency: 'monthly'
      },
      {
        isPrimordial: true,
        category: 'utilities',
        subcategory: 'electricidad',
        budgetedAmount: 0,
        dueDayOfMonth: 15,
        isRecurring: true,
        frequency: 'monthly',
        isVariable: true
      },
      {
        isPrimordial: true,
        category: 'utilities',
        subcategory: 'agua',
        budgetedAmount: 0,
        dueDayOfMonth: 20,
        isRecurring: true,
        frequency: 'monthly',
        isVariable: true
      },
      {
        isPrimordial: true,
        category: 'utilities',
        subcategory: 'internet',
        budgetedAmount: 0,
        dueDayOfMonth: 1,
        isRecurring: true,
        frequency: 'monthly',
        isSubscription: true
      },
      {
        isPrimordial: true,
        category: 'transport',
        subcategory: 'pasajes',
        budgetedAmount: 0,
        dueDayOfMonth: null,
        isRecurring: true,
        frequency: 'monthly'
      },
      {
        isPrimordial: true,
        category: 'health',
        subcategory: 'eps',
        budgetedAmount: 0,
        dueDayOfMonth: 1,
        isRecurring: true,
        frequency: 'monthly'
      },
      {
        isPrimordial: true,
        category: 'groceries',
        subcategory: 'supermercado',
        budgetedAmount: 0,
        dueDayOfMonth: null,
        isRecurring: true,
        frequency: 'weekly'
      }
    ];
  }

  // Get defaults for non-primordial expenses
  getDefaultNonPrimordialExpenses(): Partial<ExpensePayload>[] {
    return [
      {
        isPrimordial: false,
        category: 'dining_out',
        subcategory: 'comida fuera',
        budgetedAmount: 0,
        dueDayOfMonth: null,
        isRecurring: false,
        frequency: 'monthly'
      },
      {
        isPrimordial: false,
        category: 'streaming',
        subcategory: 'netflix',
        budgetedAmount: 0,
        dueDayOfMonth: 15,
        isRecurring: true,
        frequency: 'monthly',
        isSubscription: true,
        subscriptionPrice: 0
      },
      {
        isPrimordial: false,
        category: 'entertainment',
        subcategory: 'cine',
        budgetedAmount: 0,
        dueDayOfMonth: null,
        isRecurring: false,
        frequency: 'monthly'
      }
    ];
  }
}