import { Injectable, inject } from '@angular/core';
import { FirebaseService } from './firebase';
import { Auth } from './auth';
import { SavingGoal } from '../models/goal.model';

@Injectable({ providedIn: 'root' })
export class GoalService {
  private firebase = inject(FirebaseService);
  private authService = inject(Auth);

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

  async updateContribution(monthlyContribution: number): Promise<SavingGoal> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    const existing = await this.get();
    if (!existing) throw new Error('No existe meta');

    const monthsToGoal = Math.ceil((existing.targetAmount - existing.currentAmount) / monthlyContribution);
    
    const updated = {
      ...existing,
      monthlyContribution,
      monthsToGoal,
      updatedAt: new Date().toISOString()
    };

    await this.firebase.createOrUpdateGoal(userId, updated as any);
    return updated as SavingGoal;
  }

  async updateTarget(targetAmount: number): Promise<SavingGoal> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    const existing = await this.get();
    if (!existing) throw new Error('No existe meta');

    const monthsToGoal = Math.ceil((targetAmount - existing.currentAmount) / existing.monthlyContribution);
    
    const updated = {
      ...existing,
      targetAmount,
      monthsToGoal,
      updatedAt: new Date().toISOString()
    };

    await this.firebase.createOrUpdateGoal(userId, updated as any);
    return updated as SavingGoal;
  }

  calcProgress(goal: SavingGoal): number {
    if (goal.targetAmount === 0) return 0;
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  }

  calcEstimatedDate(monthsToGoal: number | null): string {
    if (!monthsToGoal) return 'Meta alcanzada 🎉';
    const date = new Date();
    date.setMonth(date.getMonth() + monthsToGoal);
    return date.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  }
}