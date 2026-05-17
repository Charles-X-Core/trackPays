import { Injectable, inject, signal, computed } from '@angular/core';
import { AppState } from '../../../core/stores/app-state';
import { GoalService } from '../../../core/services/goal';
import { Transaction, TransactionPayload } from '../../../core/models/transaction.model';

@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private appState = inject(AppState);
  private goalService = inject(GoalService);

  // State
  readonly isLoading = this.appState.isLoading;
  readonly error = this.appState.error;
  readonly userName = signal('Usuario');
  
  // Data
  readonly transactions = this.appState.transactions;
  readonly categories = this.appState.categories;
  readonly goal = this.appState.goal;
  
  // Computed
  readonly totals = this.appState.totals;
  readonly byCategory = this.appState.byCategory;
  
  readonly goalProgress = computed(() => {
    const g = this.goal();
    if (!g) return 0;
    return Math.min((g.currentAmount / g.targetAmount) * 100, 100);
  });

  // Quick Entry state
  showQuickEntry = signal(false);
  quickAmount = signal('');
  quickDescription = signal('');
  quickCategoryId = signal('');
  quickDate = signal(new Date().toISOString().split('T')[0]);
  quickLoading = signal(false);
  quickError = signal<string | null>(null);

  readonly isExpense = computed(() => this.quickAmount().startsWith('-'));

  async initialize(): Promise<void> {
    const now = new Date();
    await this.appState.loadInitialData(now.getFullYear(), now.getMonth() + 1);
  }

  // Quick Entry methods
  openQuickEntry() {
    this.quickAmount.set('');
    this.quickDescription.set('');
    this.quickCategoryId.set('');
    this.quickDate.set(new Date().toISOString().split('T')[0]);
    this.quickError.set(null);
    this.showQuickEntry.set(true);
  }

  closeQuickEntry() {
    this.showQuickEntry.set(false);
  }

  appendDigit(d: string) {
    const current = this.quickAmount();
    if (current.includes('.') && current.split('.')[1]?.length >= 2) return;
    if (d === '.' && current.includes('.')) return;
    if (d === '.' && current === '') this.quickAmount.set('0');
    this.quickAmount.update(v => v + d);
  }

  deleteDigit() {
    this.quickAmount.update(v => v.slice(0, -1));
  }

  setSign(sign: 'income' | 'expense') {
    const clean = this.quickAmount().replace('-', '');
    this.quickAmount.set(sign === 'expense' ? `-${clean}` : clean);
  }

  async saveQuickEntry(): Promise<void> {
    const amount = parseFloat(this.quickAmount());
    if (isNaN(amount) || amount === 0) {
      this.quickError.set('Ingresa un monto válido');
      return;
    }

    this.quickLoading.set(true);
    this.quickError.set(null);

    try {
      const tx: TransactionPayload = {
        amount,
        description: this.quickDescription() || (amount < 0 ? 'Gasto' : 'Ingreso'),
        categoryId: this.quickCategoryId() || null,
        date: this.quickDate(),
        type: amount < 0 ? 'expense' : 'income'
      };
      
      await this.appState.addTransaction(tx as any);
      this.closeQuickEntry();
    } catch (e: any) {
      this.quickError.set(e.message);
    } finally {
      this.quickLoading.set(false);
    }
  }

  formatSol(n: number): string {
    return `S/ ${Math.abs(n).toFixed(2)}`;
  }

  pct(spent: number, limit: number): number {
    return Math.min(Math.round((spent / limit) * 100), 100);
  }

  barColor(spent: number, limit: number): string {
    const p = (spent / limit) * 100;
    if (p >= 90) return '#ef4444';
    if (p >= 70) return '#f59e0b';
    return '#6366f1';
  }

  // Limits for 50/30/20 rule
  get limits() {
    return { need: 600, want: 360, saving: 240 };
  }

  getRule503020() {
    const income = this.totals().income;
    const expenses = Math.abs(this.totals().expenses);
    
    const need = this.transactions()
      .filter(t => t.amount < 0 && t.category?.rule_type === 'need')
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    
    const want = this.transactions()
      .filter(t => t.amount < 0 && t.category?.rule_type === 'want')
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    
    const saving = this.transactions()
      .filter(t => t.amount > 0 && t.category?.rule_type === 'saving')
      .reduce((s, t) => s + t.amount, 0);

    return { need, want, saving };
  }
}