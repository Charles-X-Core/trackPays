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

    await this.firebase.markExpensePaid(userId, expenseId, amount);
  }

  async cancel(expenseId: string): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    await this.firebase.cancelExpense(userId, expenseId);
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