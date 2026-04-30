import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { Auth } from './auth';
import { SavingGoal } from '../models/goal.model';

@Injectable({ providedIn: 'root' })
export class GoalService {

  private supabase    = inject(Supabase).getClient();
  private authService = inject(Auth);

  async get(): Promise<SavingGoal | null> {
    const userId = this.authService.getUserId();
    if (!userId) return null;

    const { data, error } = await this.supabase
      .from('saving_goals')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data ?? null;
  }

  // Crea la meta inicial si no existe
  async seedGoal(): Promise<SavingGoal> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    const existing = await this.get();
    if (existing) return existing;

    const { data, error } = await this.supabase
      .from('saving_goals')
      .insert({
        user_id:              userId,
        name:                 'Meta S/ 10,000',
        target_amount:        10000.00,
        current_amount:       0.00,
        monthly_contribution: 240.00
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateContribution(monthlyContribution: number): Promise<SavingGoal> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    const { data, error } = await this.supabase
      .from('saving_goals')
      .update({ monthly_contribution: monthlyContribution })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
    // El trigger SQL recalcula months_to_goal automáticamente
  }

  async updateTarget(targetAmount: number): Promise<SavingGoal> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    const { data, error } = await this.supabase
      .from('saving_goals')
      .update({ target_amount: targetAmount })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Helper: porcentaje de progreso
  calcProgress(goal: SavingGoal): number {
    if (goal.target_amount === 0) return 0;
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  }

  // Helper: fecha estimada de llegada a la meta
  calcEstimatedDate(monthsToGoal: number | null): string {
    if (!monthsToGoal) return 'Meta alcanzada 🎉';
    const date = new Date();
    date.setMonth(date.getMonth() + monthsToGoal);
    return date.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  }
}