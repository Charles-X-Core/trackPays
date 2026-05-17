import { Injectable, inject } from '@angular/core';
import { FirebaseService } from './firebase';
import { Auth } from './auth';
import { 
  SavingGoal, 
  GoalPayload,
  calculateMonthsToGoal,
  calculateProjectedDate,
  calculateProgress,
  GOAL_CATEGORIES,
  GOAL_PRIORITIES
} from '../models/goal.model';

@Injectable({ providedIn: 'root' })
export class GoalService {
  private firebase = inject(FirebaseService);
  private authService = inject(Auth);

  // ============================================
  // CRUD Múltiples Goals
  // ============================================
  
  async getAll(): Promise<SavingGoal[]> {
    const userId = this.authService.getUserId();
    if (!userId) return [];

    const data = await this.firebase.getGoals(userId);
    return data as SavingGoal[];
  }

  async getAllIncludingInactive(): Promise<SavingGoal[]> {
    const userId = this.authService.getUserId();
    if (!userId) return [];

    const data = await this.firebase.getAllGoals(userId);
    return data as SavingGoal[];
  }

  async getById(goalId: string): Promise<SavingGoal | null> {
    const userId = this.authService.getUserId();
    if (!userId) return null;

    const data = await this.firebase.getGoalById(userId, goalId);
    return data as SavingGoal | null;
  }

  async create(payload: GoalPayload): Promise<SavingGoal> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    // Calculate months to goal
    const monthsToGoal = calculateMonthsToGoal(
      payload.targetAmount,
      payload.currentAmount || 0,
      payload.monthlyContribution
    );

    const data = {
      ...payload,
      currentAmount: payload.currentAmount || 0,
      monthlyContribution: payload.monthlyContribution,
      monthsToGoal,
      projectedCompletionDate: monthsToGoal ? calculateProjectedDate(monthsToGoal) : undefined,
      priority: payload.priority || 'medium',
      status: 'active',
      isCompleted: false,
      contributions: []
    };

    const result = await this.firebase.createGoal(userId, data);
    return result as SavingGoal;
  }

  async update(goalId: string, payload: Partial<GoalPayload>): Promise<SavingGoal> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    // Get existing goal
    const existing = await this.getById(goalId);
    if (!existing) throw new Error('Meta no encontrada');

    // Calculate new values
    const targetAmount = payload.targetAmount ?? existing.targetAmount;
    const currentAmount = payload.currentAmount ?? existing.currentAmount;
    const monthlyContribution = payload.monthlyContribution ?? existing.monthlyContribution;

    const monthsToGoal = calculateMonthsToGoal(targetAmount, currentAmount, monthlyContribution);
    const projectedCompletionDate = monthsToGoal ? calculateProjectedDate(monthsToGoal) : undefined;

    const updated = {
      ...existing,
      ...payload,
      monthsToGoal,
      projectedCompletionDate,
      updatedAt: new Date().toISOString()
    };

    await this.firebase.updateGoal(userId, goalId, updated);
    return updated as SavingGoal;
  }

  async delete(goalId: string): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    await this.firebase.deleteGoal(userId, goalId);
  }

  // ============================================
  // Contribuciones
  // ============================================
  
  async addContribution(goalId: string, amount: number, note?: string): Promise<SavingGoal> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    await this.firebase.addContribution(userId, goalId, amount, note);
    return this.getById(goalId) as Promise<SavingGoal>;
  }

  // ============================================
  // Métodos Legacy (compatibilidad)
  // ============================================
  
  async get(): Promise<SavingGoal | null> {
    const userId = this.authService.getUserId();
    if (!userId) return null;

    const data = await this.firebase.getGoal(userId);
    return data as SavingGoal | null;
  }

  async seedGoal(): Promise<SavingGoal> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    const existing = await this.get();
    if (existing) return existing;

    const goal = {
      name: 'Meta S/ 10,000',
      targetAmount: 10000,
      currentAmount: 0,
      monthlyContribution: 240,
      monthsToGoal: 42,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.firebase.createOrUpdateGoal(userId, goal as any);
    return goal as SavingGoal;
  }

  // ============================================
  // Helpers
  // ============================================
  
  calcProgress(goal: SavingGoal): number {
    return calculateProgress(goal.currentAmount, goal.targetAmount);
  }

  calcEstimatedDate(monthsToGoal: number | null): string {
    if (!monthsToGoal) return 'Meta alcanzada 🎉';
    const date = new Date();
    date.setMonth(date.getMonth() + monthsToGoal);
    return date.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  }

  getCategories() {
    return GOAL_CATEGORIES;
  }

  getPriorities() {
    return GOAL_PRIORITIES;
  }

  // Get goals by priority
  async getByPriority(priority: 'high' | 'medium' | 'low'): Promise<SavingGoal[]> {
    const all = await this.getAll();
    return all.filter(g => g.priority === priority);
  }

  // Get goals by category
  async getByCategory(category: string): Promise<SavingGoal[]> {
    const all = await this.getAll();
    return all.filter(g => g.category === category);
  }

  // Get total savings across all goals
  async getTotalSaved(): Promise<number> {
    const all = await this.getAll();
    return all
      .filter(g => g.status === 'active')
      .reduce((sum, g) => sum + g.currentAmount, 0);
  }

  // Get total target across all goals
  async getTotalTarget(): Promise<number> {
    const all = await this.getAll();
    return all
      .filter(g => g.status === 'active')
      .reduce((sum, g) => sum + g.targetAmount, 0);
  }
}