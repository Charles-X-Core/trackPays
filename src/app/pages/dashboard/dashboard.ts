import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth } from '../../core/services/auth';
import { TransactionService } from '../../core/services/transaction';
import { GoalService } from '../../core/services/goal';
import { IncomeService } from '../../core/services/income';
import { FirebaseService } from '../../core/services/firebase';
import { Transaction } from '../../core/models/transaction.model';
import { SavingGoal } from '../../core/models/goal.model';
import { MonthlyIncome } from '../../core/models/income.model';

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
  private goalService        = inject(GoalService);
  private incomeService      = inject(IncomeService);
  private firebaseService    = inject(FirebaseService);
  
  isLoading      = signal(true);
  transactions   = signal<Transaction[]>([]);
  goal           = signal<SavingGoal | null>(null);
  monthlyIncome  = signal<MonthlyIncome | null>(null);
  actualBalance  = signal<number>(0);

  now       = new Date();
  monthName = this.now.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  currentMonthName = this.now.toLocaleDateString('es-PE', { month: 'long' });
  lastMonthName = new Date(this.now.getFullYear(), this.now.getMonth() - 1, 1).toLocaleDateString('es-PE', { month: 'long' });

  get income(): number {
    return this.monthlyIncome()?.totalBudgeted ?? 0;
  }

  get limits() {
    return { 
      need: this.income * 0.5, 
      want: this.income * 0.3, 
      saving: this.income * 0.2 
    };
  }

  // Calculados
  totals    = { income: 0, expenses: 0, balance: 0 };
  byRule    = { need: 0, want: 0, saving: 0 };
  byCategory: { name: string; icon: string; total: number }[] = [];
  
  // Ingreso configurado vs real
  configuredIncome = 0;
  actualIncome = 0;

  // Historial para gráficos (últimos 6 meses)
  monthlyHistory = signal<{ month: number; year: number; income: number; expenses: number; savings: number }[]>([]);
  
  // Comparación con mes anterior
  incomeChange = 0;
  expenseChange = 0;
  savingsChange = 0;

  // Sobrante del mes
  monthlySurplus = 0;
  lastMonthSurplus = 0;
  surplusTrend: 'up' | 'down' | 'stable' = 'stable';

  // Quick entry
  showQuickEntry = signal(false);
  
  // Quick entry form
  quickAmount      = '';
  quickDescription = '';
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

  // Cargar historial de meses para gráficos
  async loadMonthlyHistory() {
    const history: { month: number; year: number; income: number; expenses: number; savings: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const txs = await this.transactionService.getByMonth(d.getFullYear(), d.getMonth() + 1);
      const totals = this.transactionService.calcTotals(txs);
      
      history.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        income: totals.income,
        expenses: Math.abs(totals.expenses),
        savings: totals.balance
      });
    }

    this.monthlyHistory.set(history);
  }

  // Comparación vs mes anterior
  calculateMonthOverMonth() {
    const history = this.monthlyHistory();
    if (history.length < 2) return;

    const current = history[history.length - 1];
    const previous = history[history.length - 2];

    this.incomeChange = previous.income > 0 ? ((current.income - previous.income) / previous.income) * 100 : 0;
    this.expenseChange = previous.expenses > 0 ? ((current.expenses - previous.expenses) / previous.expenses) * 100 : 0;
    this.savingsChange = previous.savings > 0 ? ((current.savings - previous.savings) / Math.abs(previous.savings)) * 100 : 0;

    // Calcular tendencia del sobrante
    this.lastMonthSurplus = previous.savings;
    if (this.monthlySurplus > this.lastMonthSurplus) {
      this.surplusTrend = 'up';
    } else if (this.monthlySurplus < this.lastMonthSurplus) {
      this.surplusTrend = 'down';
    } else {
      this.surplusTrend = 'stable';
    }
  }

  // Generar path SVG para gráfico de línea
  getChartPath(values: number[], height: number = 40, padding: number = 5): string {
    const data = values.filter(v => v > 0);
    if (data.length < 2) return '';
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 200 - padding * 2;
    const step = width / (data.length - 1);

    return data.map((v, i) => 
      `${i === 0 ? 'M' : 'L'} ${i * step + padding},${height - padding - ((v - min) / range) * (height - padding * 2)}`
    ).join(' ');
  }

  // Generar área bajo la curva
  getChartArea(values: number[], height: number = 40, padding: number = 5): string {
    const path = this.getChartPath(values, height, padding);
    if (!path) return '';
    const width = 200 - padding * 2;
    return `${path} L ${width + padding},${height - padding} L ${padding},${height - padding} Z`;
  }

  // Mini chart para métricas pequeñas (60x20 viewBox)
  getMiniChartPath(values: number[]): string {
    const data = values.filter(v => v >= 0);
    if (data.length < 2) return '';
    
    const max = Math.max(...data, 1);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 58;
    const height = 18;
    const padding = 2;
    const step = width / (data.length - 1);

    return data.map((v, i) => 
      `${i === 0 ? 'M' : 'L'} ${i * step + padding},${height - padding - ((v - min) / range) * (height - padding * 2)}`
    ).join(' ');
  }

  // Getter para paths dinámicos
  get balanceChartPath(): string {
    const values = this.monthlyHistory().map(h => h.savings);
    return this.getChartPath(values);
  }

  get balanceChartArea(): string {
    const values = this.monthlyHistory().map(h => h.savings);
    return this.getChartArea(values);
  }

  get incomeChartPath(): string {
    const values = this.monthlyHistory().map(h => h.income);
    return this.getChartPath(values);
  }

  get expenseChartPath(): string {
    const values = this.monthlyHistory().map(h => h.expenses);
    return this.getChartPath(values);
  }

  get savingsChartPath(): string {
    const values = this.monthlyHistory().map(h => h.savings > 0 ? h.savings : 0);
    return this.getChartPath(values);
  }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const userId = this.authService.getUserId();
      if (!userId) return;

      // Cargar fuentes de ingreso activas
      let activeIncomes: any[] = [];
      let totalConfiguredIncome = 0;
      try {
        activeIncomes = await this.incomeService.getActive();
        totalConfiguredIncome = activeIncomes.reduce((sum, src) => sum + (src.amount || 0), 0);
      } catch (e) {
        console.error('Error loading income sources:', e);
      }

      // Cargar metas y transacciones
      const [txs, goals] = await Promise.all([
        this.transactionService.getByMonth(this.now.getFullYear(), this.now.getMonth() + 1),
        this.goalService.getAll()
      ]);

      this.transactions.set(txs);
      const activeGoal = goals.find(g => g.status === 'active') || goals[0] || null;
      this.goal.set(activeGoal);

      // Obtener estado financiero real (initialBalance + recibido - gastos)
      let fs: any = null;
      try {
        fs = await this.firebaseService.getFinancialState(userId, this.now.getFullYear(), this.now.getMonth() + 1);
      } catch (e) { /* ignore */ }

      const txTotals = this.transactionService.calcTotals(txs);
      const initialBalance = fs?.initialBalance ?? 0;
      const receivedIncome = txTotals.income;
      const actualBalanceVal = initialBalance + receivedIncome - Math.abs(txTotals.expenses);

this.actualBalance.set(actualBalanceVal);
      this.totals = {
        income: totalConfiguredIncome,
        expenses: txTotals.expenses,
        balance: actualBalanceVal
      };

      this.configuredIncome = totalConfiguredIncome;
      this.actualIncome = txTotals.income;

      // Calcular sobrante del mes
      this.monthlySurplus = this.totals.income - this.totals.expenses;

      // Cargar historial para gráficos
      await this.loadMonthlyHistory();
      
      // Calcular comparación con mes anterior
      this.calculateMonthOverMonth();
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
    this.quickError = '';
    this.quickDate = new Date().toISOString().split('T')[0];
  }

  formatSol(n: number): string {
    return `S/ ${Math.abs(n).toFixed(2)}`;
  }

  async logout() { await this.authService.signOut(); }
}