import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GoalService } from '../../core/services/goal';
import { TransactionService } from '../../core/services/transaction';
import { SavingGoal } from '../../core/models/goal.model';

interface Milestone {
  amount: number;
  label:  string;
  reached: boolean;
}

@Component({
  selector: 'app-goal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './goal.html',
  styleUrl: './goal.scss'
})
export class GoalComponent implements OnInit {

  private goalService        = inject(GoalService);
  private transactionService = inject(TransactionService);

  isLoading   = signal(true);
  isSaving    = signal(false);
  goal        = signal<SavingGoal | null>(null);
  errorMsg    = signal('');
  successMsg  = signal('');

  // Panel de edición
  showEditContribution = signal(false);
  showEditTarget       = signal(false);
  newContribution      = 240;
  newTarget            = 10000;

  // Historial de ingresos del mes
  monthlyIncome = 0;

  readonly milestones: Milestone[] = [
    { amount: 1000,  label: '🎯 S/ 1,000',  reached: false },
    { amount: 2500,  label: '⭐ S/ 2,500',  reached: false },
    { amount: 5000,  label: '🔥 S/ 5,000',  reached: false },
    { amount: 7500,  label: '💎 S/ 7,500',  reached: false },
    { amount: 10000, label: '🏆 S/ 10,000', reached: false },
  ];

  get progress(): number {
    return this.goal() ? this.goalService.calcProgress(this.goal()!) : 0;
  }

  get estimatedDate(): string {
    return this.goal() ? this.goalService.calcEstimatedDate(this.goal()!.monthsToGoal) : '';
  }

  get milestonesWithStatus(): Milestone[] {
    const current = this.goal()?.currentAmount ?? 0;
    return this.milestones.map(m => ({ ...m, reached: current >= m.amount }));
  }

  // Proyección: cuántos meses si se aporta X
  projectMonths(contribution: number): number {
    const g = this.goal();
    if (!g || contribution <= 0) return 0;
    const remaining = g.targetAmount - g.currentAmount;
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / contribution);
  }

  // Escenarios de ahorro
  get scenarios() {
    const g = this.goal();
    if (!g) return [];
    return [
      { label: 'Ahorro mínimo (10%)',  contribution: 120,  months: this.projectMonths(120)  },
      { label: 'Regla 20%',           contribution: 240,  months: this.projectMonths(240)  },
      { label: 'Ahorro agresivo (30%)', contribution: 360, months: this.projectMonths(360)  },
      { label: 'Contribución actual',  contribution: g.monthlyContribution, months: g.monthsToGoal ?? 0 },
    ];
  }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const now  = new Date();
      const [goal, txs] = await Promise.all([
        this.goalService.get(),
        this.transactionService.getByMonth(now.getFullYear(), now.getMonth() + 1)
      ]);

      this.goal.set(goal);

      const totals      = this.transactionService.calcTotals(txs);
      this.monthlyIncome = totals.income;

      if (goal) {
        this.newContribution = goal.monthlyContribution;
        this.newTarget       = goal.targetAmount;
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  // ─── Editar contribución ─────────────────────────────────
  async saveContribution() {
    if (this.newContribution <= 0) {
      this.errorMsg.set('La contribución debe ser mayor a 0');
      return;
    }
    this.isSaving.set(true);
    this.errorMsg.set('');
    try {
      const updated = await this.goalService.updateContribution(this.newContribution);
      this.goal.set(updated);
      this.showEditContribution.set(false);
      this.showSuccess('¡Contribución actualizada! Los meses se recalcularon.');
    } catch (e: any) {
      this.errorMsg.set(e.message);
    } finally {
      this.isSaving.set(false);
    }
  }

  // ─── Editar meta ─────────────────────────────────────────
  async saveTarget() {
    if (this.newTarget <= 0) {
      this.errorMsg.set('La meta debe ser mayor a 0');
      return;
    }
    this.isSaving.set(true);
    this.errorMsg.set('');
    try {
      const updated = await this.goalService.updateTarget(this.newTarget);
      this.goal.set(updated);
      this.showEditTarget.set(false);
      this.showSuccess('¡Meta actualizada!');
    } catch (e: any) {
      this.errorMsg.set(e.message);
    } finally {
      this.isSaving.set(false);
    }
  }

  private showSuccess(msg: string) {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 3000);
  }

  formatSol(n: number): string {
    return `S/ ${Math.abs(n).toFixed(2)}`;
  }

  formatMonth(months: number): string {
    if (months === 0) return '¡Meta alcanzada! 🎉';
    if (months === 1) return '1 mes';
    if (months < 12)  return `${months} meses`;
    const years = Math.floor(months / 12);
    const rem   = months % 12;
    return rem > 0 ? `${years} año${years > 1 ? 's' : ''} y ${rem} mes${rem > 1 ? 'es' : ''}` : `${years} año${years > 1 ? 's' : ''}`;
  }
}