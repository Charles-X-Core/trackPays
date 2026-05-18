import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth } from '../../core/services/auth';
import { TransactionService } from '../../core/services/transaction';
import { CategoryService } from '../../core/services/category';
import { GoalService } from '../../core/services/goal';
// Debug services removed
import { Transaction } from '../../core/models/transaction.model';
import { SavingGoal } from '../../core/models/goal.model';
import { Category } from '../../core/models/category.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {

  private authService        = inject(Auth);
  private transactionService = inject(TransactionService);
  private categoryService    = inject(CategoryService);
  private goalService        = inject(GoalService);
  

  // Estado
  isLoading      = signal(true);
  transactions   = signal<Transaction[]>([]);
  goal           = signal<SavingGoal | null>(null);
  categories     = signal<Category[]>([]);
  showQuickEntry = signal(false);

  // Mes actual
  now       = new Date();
  monthName = this.now.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });

  // Regla 50/30/20 basada en S/ 1,200
  readonly income    = 1200;
  readonly limits    = { need: 600, want: 360, saving: 240 };

  // Calculados
  totals    = { income: 0, expenses: 0, balance: 0 };
  byRule    = { need: 0, want: 0, saving: 0 };
  byCategory: { name: string; icon: string; total: number }[] = [];

  // Quick entry form
  quickAmount      = '';
  quickDescription = '';
  quickCategoryId  = '';
  quickDate        = new Date().toISOString().split('T')[0];
  quickError       = '';
  quickLoading     = false;

  get userName(): string {
    const user = this.authService.currentUser();
    return user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Usuario';
  }

  get goalProgress(): number {
    const g = this.goal();
    return g ? this.goalService.calcProgress(g) : 0;
  }

  get estimatedDate(): string {
    const g = this.goal();
    return g ? this.goalService.calcEstimatedDate(g.monthsToGoal) : '';
  }

  // Porcentaje gastado de cada bucket 50/30/20
  pct(spent: number, limit: number): number {
    return Math.min(Math.round((spent / limit) * 100), 100);
  }

  // Color de la barra según % gastado
  barColor(spent: number, limit: number): string {
    const p = (spent / limit) * 100;
    if (p >= 90) return '#ef4444';
    if (p >= 70) return '#f59e0b';
    return '#6366f1';
  }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const [txs, goal, cats] = await Promise.all([
        this.transactionService.getByMonth(this.now.getFullYear(), this.now.getMonth() + 1),
        this.goalService.get(),
        this.categoryService.getAll()
      ]);

      this.transactions.set(txs);
      this.goal.set(goal);
      this.categories.set(cats);

      this.totals     = this.transactionService.calcTotals(txs);
      this.byRule     = this.transactionService.calcByRuleType(txs);
      this.byCategory = this.transactionService.calcByCategory(txs);
    } finally {
      this.isLoading.set(false);
    }
  }

  // ─── Quick Entry ─────────────────────────────────────────
  openQuickEntry()  { this.showQuickEntry.set(true); this.resetQuick(); }
  closeQuickEntry() { this.showQuickEntry.set(false); }

  appendDigit(d: string) {
    if (this.quickAmount.includes('.') && this.quickAmount.split('.')[1]?.length >= 2) return;
    if (d === '.' && this.quickAmount.includes('.')) return;
    if (d === '.' && this.quickAmount === '') this.quickAmount = '0';
    this.quickAmount += d;
  }

  deleteDigit() { this.quickAmount = this.quickAmount.slice(0, -1); }

  setSign(sign: 'income' | 'expense') {
    const clean = this.quickAmount.replace('-', '');
    this.quickAmount = sign === 'expense' ? `-${clean}` : clean;
  }

  get isExpense(): boolean { return this.quickAmount.startsWith('-'); }

  async saveQuickEntry() {
    const amount = parseFloat(this.quickAmount);
    if (isNaN(amount) || amount === 0) { this.quickError = 'Ingresa un monto válido'; return; }

    this.quickLoading = true;
    this.quickError   = '';
    try {
      await this.transactionService.create({
        amount,
        description: this.quickDescription || (amount < 0 ? 'Gasto' : 'Ingreso'),
        categoryId: this.quickCategoryId || null,
        date: this.quickDate,
        type: amount < 0 ? 'expense' : 'income'
      });
      this.closeQuickEntry();
      await this.loadData();
    } catch (e: any) {
      this.quickError = e.message;
    } finally {
      this.quickLoading = false;
    }
  }

  private resetQuick() {
    this.quickAmount = ''; this.quickDescription = '';
    this.quickCategoryId = ''; this.quickError = '';
    this.quickDate = new Date().toISOString().split('T')[0];
  }

  formatSol(n: number): string {
    return `S/ ${Math.abs(n).toFixed(2)}`;
  }

  async logout() { await this.authService.signOut(); }
}