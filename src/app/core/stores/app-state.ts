import { Injectable, signal, computed } from '@angular/core';
import { Auth } from '../services/auth';
import { TransactionService } from '../services/transaction';
import { CategoryService } from '../services/category';
import { GoalService } from '../services/goal';
import { Transaction } from '../models/transaction.model';
import { SavingGoal } from '../models/goal.model';
import { Category } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class AppState {
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  
  // Current user state
  readonly userId = computed(() => this.auth.getUserId());
  readonly isAuthenticated = computed(() => this.auth.isAuthenticated());
  
  // Data signals
  readonly transactions = signal<Transaction[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly goal = signal<SavingGoal | null>(null);
  
  // Computed states
  readonly totals = computed(() => {
    const txs = this.transactions();
    const income = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expenses = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    return { income, expenses, balance: income - expenses };
  });
  
  readonly byCategory = computed(() => {
    const map = new Map<string, { name: string; icon: string; total: number }>();
    this.transactions()
      .filter(t => t.amount < 0 && t.category)
      .forEach(t => {
        const key = t.categoryId ?? 'sin-categoría';
        const prev = map.get(key) ?? { name: t.category!.name, icon: t.category!.icon, total: 0 };
        map.set(key, { ...prev, total: prev.total + Math.abs(t.amount) });
      });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  });

  constructor(
    private auth: Auth,
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private goalService: GoalService
  ) {}

  async loadInitialData(year: number, month: number): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      const [txs, cats, goal] = await Promise.all([
        this.transactionService.getByMonth(year, month),
        this.categoryService.getAll(),
        this.goalService.get()
      ]);
      
      this.transactions.set(txs);
      this.categories.set(cats);
      this.goal.set(goal);
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async addTransaction(tx: any): Promise<void> {
    const created = await this.transactionService.create(tx);
    this.transactions.update(txs => [created, ...txs]);
  }

  async refreshGoal(): Promise<void> {
    const goal = await this.goalService.get();
    this.goal.set(goal);
  }
}