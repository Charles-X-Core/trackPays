import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { Auth } from './auth';
import { Transaction, TransactionPayload } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {

  private supabase    = inject(Supabase).getClient();
  private authService = inject(Auth);

  // Trae todas las transacciones del mes actual con su categoría
  async getByMonth(year: number, month: number): Promise<Transaction[]> {
    const userId = this.authService.getUserId();
    if (!userId) return [];

    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const to   = new Date(year, month, 0).toISOString().split('T')[0]; // último día

    const { data, error } = await this.supabase
      .from('transactions')
      .select(`
        *,
        category:categories(name, icon, rule_type)
      `)
      .eq('user_id', userId)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  // Trae todas sin filtro de mes (para historial completo)
  async getAll(): Promise<Transaction[]> {
    const userId = this.authService.getUserId();
    if (!userId) return [];

    const { data, error } = await this.supabase
      .from('transactions')
      .select(`
        *,
        category:categories(name, icon, rule_type)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async create(payload: TransactionPayload): Promise<Transaction> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    const { data, error } = await this.supabase
      .from('transactions')
      .insert({ ...payload, user_id: userId })
      .select(`*, category:categories(name, icon, rule_type)`)
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, payload: Partial<TransactionPayload>): Promise<Transaction> {
    const { data, error } = await this.supabase
      .from('transactions')
      .update(payload)
      .eq('id', id)
      .select(`*, category:categories(name, icon, rule_type)`)
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ─── Helpers de cálculo ───────────────────────────────────
  calcTotals(transactions: Transaction[]) {
    const income   = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const balance  = income - expenses;
    return { income, expenses, balance };
  }

  // Gastos agrupados por rule_type para la regla 50/30/20
  calcByRuleType(transactions: Transaction[]) {
    const result = { need: 0, want: 0, saving: 0 };
    transactions
      .filter(t => t.amount < 0 && t.category)
      .forEach(t => {
        const type = t.category!.rule_type as keyof typeof result;
        if (type in result) result[type] += Math.abs(t.amount);
      });
    return result;
  }

  // Gastos agrupados por categoría (para el gráfico de torta)
  calcByCategory(transactions: Transaction[]) {
    const map = new Map<string, { name: string; icon: string; total: number }>();
    transactions
      .filter(t => t.amount < 0 && t.category)
      .forEach(t => {
        const key  = t.category_id ?? 'sin-categoría';
        const prev = map.get(key) ?? { name: t.category!.name, icon: t.category!.icon, total: 0 };
        map.set(key, { ...prev, total: prev.total + Math.abs(t.amount) });
      });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }
}