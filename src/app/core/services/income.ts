import { Injectable, inject } from '@angular/core';
import { FirebaseService } from './firebase';
import { Auth } from './auth';
import { IncomeSource, IncomeSourcePayload, MonthlyIncome } from '../models/income.model';

@Injectable({ providedIn: 'root' })
export class IncomeService {
  private firebase = inject(FirebaseService);
  private authService = inject(Auth);

  async getAll(): Promise<IncomeSource[]> {
    const userId = this.authService.getUserId();
    if (!userId) return [];

    const data = await this.firebase.getIncomeSources(userId);
    return data as IncomeSource[];
  }

  async getActive(): Promise<IncomeSource[]> {
    const userId = this.authService.getUserId();
    if (!userId) return [];

    const data = await this.firebase.getActiveIncomeSources(userId);
    return data as IncomeSource[];
  }

  async create(payload: IncomeSourcePayload): Promise<IncomeSource> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    const result = await this.firebase.createIncomeSource(userId, payload);
    return result as IncomeSource;
  }

  async update(sourceId: string, payload: Partial<IncomeSourcePayload>): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    await this.firebase.updateIncomeSource(userId, sourceId, payload);
  }

  async deactivate(sourceId: string): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    await this.firebase.deactivateIncomeSource(userId, sourceId);
  }

  async getMonthlyIncome(year: number, month: number): Promise<MonthlyIncome> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    const data = await this.firebase.calculateMonthlyIncome(userId, year, month);
    return data as MonthlyIncome;
  }

  async getInitialBalance(): Promise<number> {
    const userId = this.authService.getUserId();
    if (!userId) return 0;

    return this.firebase.getInitialBalance(userId);
  }

  async setInitialBalance(amount: number): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    await this.firebase.setInitialBalance(userId, amount);
  }

  // Helper to calculate total monthly income
  async calculateTotalMonthlyIncome(year: number, month: number): Promise<number> {
    const monthly = await this.getMonthlyIncome(year, month);
    return monthly.totalBudgeted;
  }

  // Helper to get available now
  async getAvailableNow(year: number, month: number): Promise<number> {
    const monthly = await this.getMonthlyIncome(year, month);
    return monthly.availableNow;
  }
}