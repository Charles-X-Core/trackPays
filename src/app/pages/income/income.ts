import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IncomeService } from '../../core/services/income';
import { Auth } from '../../core/services/auth';
import { IncomeSource, MonthlyIncome } from '../../core/models/income.model';

interface IncomeWithHistory extends IncomeSource {
  history: { month: string; amount: number }[];
}

@Component({
  selector: 'app-income',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './income.html',
  styleUrl: './income.scss'
})
export class IncomeComponent implements OnInit {
  private incomeService = inject(IncomeService);
  private authService = inject(Auth);

  incomeSources = signal<IncomeSource[]>([]);
  monthlyIncome = signal<MonthlyIncome | null>(null);
  isLoading = signal(true);
  showModal = signal(false);

  editingSource = signal<IncomeSource | null>(null);
  formName = '';
  formAmount: number | null = null;
  formFrequency: 'monthly' | 'biweekly' | 'weekly' = 'monthly';
  formIsActive = true;

  now = new Date();
  currentMonth = this.now.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  lastMonthName = new Date(this.now.getFullYear(), this.now.getMonth() - 1, 1)
    .toLocaleDateString('es-PE', { month: 'long' });

  get totalMonthly(): number {
    return this.incomeSources()
      .filter(s => s.isActive)
      .reduce((sum, s) => sum + s.amount, 0);
  }

  get lastMonthTotal(): number {
    return this.monthlyIncome()?.totalBudgeted ?? this.totalMonthly;
  }

  get monthChange(): number {
    if (this.lastMonthTotal === 0) return 0;
    return ((this.totalMonthly - this.lastMonthTotal) / this.lastMonthTotal) * 100;
  }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const [sources, monthly] = await Promise.all([
        this.incomeService.getAll(),
        this.incomeService.getMonthlyIncome(this.now.getFullYear(), this.now.getMonth() + 1)
      ]);
      this.incomeSources.set(sources);
      this.monthlyIncome.set(monthly as MonthlyIncome);
    } finally {
      this.isLoading.set(false);
    }
  }

  openAddModal() {
    this.editingSource.set(null);
    this.formName = '';
    this.formAmount = null;
    this.formFrequency = 'monthly';
    this.formIsActive = true;
    this.showModal.set(true);
  }

  openEditModal(source: IncomeSource) {
    this.editingSource.set(source);
    this.formName = source.name;
    this.formAmount = source.amount;
    this.formFrequency = source.frequency as any;
    this.formIsActive = source.isActive;
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingSource.set(null);
  }

  async saveSource() {
    const name = this.formName.trim();
    const amount = this.formAmount;

    if (!name || !amount || amount <= 0) return;

    const editing = this.editingSource();

    try {
      if (editing) {
        await this.incomeService.update(editing.id, {
          name,
          amount,
          frequency: this.formFrequency
        });
      } else {
        await this.incomeService.create({
          type: 'other',
          name,
          amount,
          frequency: this.formFrequency,
          paymentDayOfMonth: null,
          isRecurring: true
        });
      }
      this.closeModal();
      await this.loadData();
    } catch (e) {
      console.error('Error saving income source:', e);
    }
  }

  async toggleActive(source: IncomeSource) {
    try {
      if (source.isActive) {
        await this.incomeService.deactivate(source.id);
      } else {
        await this.incomeService.update(source.id, { isRecurring: true });
      }
      await this.loadData();
    } catch (e) {
      console.error('Error toggling source:', e);
    }
  }

  formatSol(n: number): string {
    return `S/ ${n.toFixed(2)}`;
  }

  getFrequencyLabel(freq: string): string {
    const labels: Record<string, string> = {
      monthly: 'Mensual',
      biweekly: 'Quincenal',
      weekly: 'Semanal',
      annual: 'Anual'
    };
    return labels[freq] || freq;
  }
}