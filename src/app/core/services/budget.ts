import { Injectable, inject } from '@angular/core';
import { FirebaseService } from './firebase';
import { Auth } from './auth';
import { Budget, BudgetPayload, MonthlyBudgetSummary, calculateBudgetStatus } from '../models/budget.model';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private firebase = inject(FirebaseService);
  private authService = inject(Auth);

  async getByMonth(year: number, month: number): Promise<Budget[]> {
    const userId = this.authService.getUserId();
    if (!userId) return [];

    const data = await this.firebase.getBudgetsByMonth(userId, year, month);
    return data as Budget[];
  }

  async createOrUpdate(payload: BudgetPayload): Promise<Budget> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    const result = await this.firebase.setBudget(userId, payload);
    return result as Budget;
  }

  async getMonthlySummary(year: number, month: number): Promise<MonthlyBudgetSummary> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    const data = await this.firebase.calculateMonthlyBudgetSummary(userId, year, month);
    return data as MonthlyBudgetSummary;
  }

  // Helper: Set budget for all categories based on income
  async autoCreateBudgetsFromIncome(incomeBudgeted: number, year: number, month: number): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) return;

    // Default percentages based on 50/30/20 rule
    const primordialRatio = 0.50;
    const nonPrimordialRatio = 0.20;
    const savingsRatio = 0.20;

    // But we need to get actual expenses to map them
    const existingBudgets = await this.getByMonth(year, month);
    
    if (existingBudgets.length > 0) {
      // If budgets exist, just recalculate with actuals
      return;
    }

    // Get expenses to know which categories exist
    const expenses = await this.getExpensesByCategory(year, month);
    
    // Create budgets based on existing expenses
    for (const [category, amount] of Object.entries(expenses)) {
      const isPrimordial = this.isPrimordialCategory(category);
      const ratio = isPrimordial ? primordialRatio : nonPrimordialRatio;
      const budgetAmount = Math.round(incomeBudgeted * ratio);
      
      await this.createOrUpdate({
        category,
        categoryName: this.getCategoryDisplayName(category),
        isPrimordial,
        budgetedAmount: budgetAmount,
        monthId: `${year}-${String(month).padStart(2, '0')}`,
        year,
        month
      });
    }
  }

  private async getExpensesByCategory(year: number, month: number): Promise<Record<string, number>> {
    const userId = this.authService.getUserId();
    if (!userId) return {};

    const transactions = await this.firebase.getTransactionsByMonth(userId, year, month);
    const expenses = transactions.filter((t: any) => t.amount < 0);

    const byCategory: Record<string, number> = {};
    expenses.forEach((t: any) => {
      const cat = t.category || 'other';
      byCategory[cat] = (byCategory[cat] || 0) + Math.abs(t.amount);
    });

    return byCategory;
  }

  private isPrimordialCategory(category: string): boolean {
    const primordialCategories = ['housing', 'utilities', 'transport', 'health', 'debt', 'groceries', 'education'];
    return primordialCategories.includes(category);
  }

  private getCategoryDisplayName(category: string): string {
    const names: Record<string, string> = {
      housing: 'Vivienda',
      utilities: 'Servicios',
      transport: 'Transporte',
      health: 'Salud',
      debt: 'Deudas',
      groceries: 'Supermercado',
      education: 'Educación',
      dining_out: 'Comida fuera',
      entertainment: 'Entretenimiento',
      streaming: 'Streaming',
      pets: 'Mascotas',
      clothing: 'Ropa',
      travel: 'Viajes',
      shopping: 'Compras',
      subscriptions: 'Suscripciones'
    };
    return names[category] || category;
  }

  // Calculate how much budget remains
  async getRemainingBudget(year: number, month: number): Promise<number> {
    const summary = await this.getMonthlySummary(year, month);
    return summary.totalRemaining;
  }

  // Get categories that are at risk
  async getAtRiskCategories(year: number, month: number): Promise<Budget[]> {
    const budgets = await this.getByMonth(year, month);
    return budgets.filter(b => b.status === 'at_risk' || b.status === 'exceeded');
  }
}