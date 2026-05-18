import { Injectable, inject } from '@angular/core';
import { FirebaseService } from './firebase';
import { Auth } from './auth';
import { Transaction, TransactionPayload } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private firebase = inject(FirebaseService);
  private authService = inject(Auth);

  async getByMonth(year: number, month: number): Promise<Transaction[]> {
    const userId = this.authService.getUserId();
    if (!userId) return [];

    const data = await this.firebase.getTransactionsByMonth(userId, year, month);
    return data as Transaction[];
  }

  async getAll(): Promise<Transaction[]> {
    const userId = this.authService.getUserId();
    if (!userId) return [];

    const data = await this.firebase.getTransactions(userId);
    return data as Transaction[];
  }

  async create(payload: TransactionPayload): Promise<Transaction> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    const now = new Date().toISOString();
    const data = {
      userId,
      categoryId: payload.categoryId,
      amount: payload.amount,
      description: payload.description,
      date: payload.date,
      type: payload.type,
      // Include ruleType for financial calculations
      ruleType: payload.type === 'income' ? 'income' : 'need',
      createdAt: now,
      updatedAt: now
    };

    const result = await this.firebase.createTransaction(userId, data);
    return result as Transaction;
  }

  async update(id: string, payload: Partial<TransactionPayload>): Promise<Transaction> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    const data: any = {
      ...payload,
      updatedAt: new Date().toISOString()
    };

    // Include ruleType for financial calculations
    if (payload.type) {
      data.ruleType = payload.type === 'income' ? 'income' : 'need';
    }

    await this.firebase.updateTransaction(userId, id, data);
    return (await this.getByMonth(
      new Date().getFullYear(), 
      new Date().getMonth() + 1
    )).find(t => t.id === id) as Transaction;
  }

  async delete(id: string): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    await this.firebase.deleteTransaction(userId, id);
  }

  calcTotals(transactions: Transaction[]) {
    const income = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const balance = income - expenses;
    return { income, expenses, balance };
  }

  calcByRuleType(transactions: Transaction[]) {
    const result = { need: 0, want: 0, saving: 0 };
    transactions
      .filter(t => t.amount < 0 && t.category)
      .forEach(t => {
        const type = (t.category as any)?.rule_type as keyof typeof result;
        if (type in result) result[type] += Math.abs(t.amount);
      });
    return result;
  }

  calcByCategory(transactions: Transaction[]) {
    const map = new Map<string, { name: string; icon: string; total: number }>();
    transactions
      .filter(t => t.amount < 0 && t.category)
      .forEach(t => {
        const key = t.categoryId ?? 'sin-categoría';
        const prev = map.get(key) ?? { name: (t.category as any)?.name ?? 'Sin categoría', icon: (t.category as any)?.icon ?? '📦', total: 0 };
        map.set(key, { ...prev, total: prev.total + Math.abs(t.amount) });
      });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }
}