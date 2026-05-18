import { Injectable, inject } from '@angular/core';
import { FirebaseService } from './firebase';
import { Auth } from './auth';

export type AlertType = 
  | 'overdue_expense'
  | 'budget_exceeded'
  | 'budget_at_risk'
  | 'income_pending'
  | 'income_overdue'
  | 'goal_behind_schedule'
  | 'high_spending_category'
  | 'low_savings_rate';

export interface Alert {
  id: string;
  type: AlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  category?: string;
  amount?: number;
  threshold?: number;
  actionUrl?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AlertsService {
  private firebase = inject(FirebaseService);
  private authService = inject(Auth);

  async getAllAlerts(year: number, month: number): Promise<Alert[]> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    const alerts: Alert[] = [];

    // 1. Budget alerts
    const budgetAlerts = await this.getBudgetAlerts(userId, year, month);
    alerts.push(...budgetAlerts);

    // 2. Expense alerts
    const expenseAlerts = await this.getExpenseAlerts(userId, year, month);
    alerts.push(...expenseAlerts);

    // 3. Income alerts
    const incomeAlerts = await this.getIncomeAlerts(userId, year, month);
    alerts.push(...incomeAlerts);

    // 4. Goal alerts
    const goalAlerts = await this.getGoalAlerts(userId);
    alerts.push(...goalAlerts);

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return alerts;
  }

  private async getBudgetAlerts(userId: string, year: number, month: number): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const summary = await this.firebase.calculateMonthlyBudgetSummary(userId, year, month);

    if (summary?.alerts) {
      for (const alert of summary.alerts) {
        alerts.push({
          id: `budget-${alert.category}-${month}`,
          type: alert.status === 'exceeded' ? 'budget_exceeded' : 'budget_at_risk',
          severity: alert.status === 'exceeded' ? 'high' : 'medium',
          title: alert.status === 'exceeded' 
            ? `Presupuesto excedido: ${alert.name}`
            : `Presupuesto en riesgo: ${alert.name}`,
          message: alert.status === 'exceeded'
            ? `Has gastado S/ ${alert.actual} de S/ ${alert.budgeted} (${alert.percentage}%)`
            : `Has usado el ${alert.percentage}% del presupuesto de ${alert.name}`,
          category: alert.category,
          amount: alert.actual,
          threshold: alert.budgeted,
          createdAt: new Date().toISOString()
        });
      }
    }

    return alerts;
  }

  private async getExpenseAlerts(userId: string, year: number, month: number): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const summary = await this.firebase.calculateMonthlyExpenses(userId, year, month);

    if (summary?.alerts) {
      for (const alert of summary.alerts) {
        let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
        let type: AlertType = 'overdue_expense';

        switch (alert.type) {
          case 'overdue':
            type = 'overdue_expense';
            severity = 'high';
            break;
          case 'budget_exceeded':
            type = 'budget_exceeded';
            severity = 'critical';
            break;
          case 'price_change':
            type = 'high_spending_category';
            severity = 'low';
            break;
          case 'variable_spike':
            type = 'high_spending_category';
            severity = 'medium';
            break;
        }

        alerts.push({
          id: `expense-${alert.expenseId}-${month}`,
          type,
          severity,
          title: this.getAlertTitle(alert.type),
          message: alert.message,
          createdAt: new Date().toISOString()
        });
      }
    }

    return alerts;
  }

  private async getIncomeAlerts(userId: string, year: number, month: number): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const monthlyIncome = await this.firebase.calculateMonthlyIncome(userId, year, month);

    if (monthlyIncome?.sources) {
      for (const source of monthlyIncome.sources) {
        if (source.status === 'overdue') {
          alerts.push({
            id: `income-overdue-${source.sourceId}`,
            type: 'income_overdue',
            severity: 'high',
            title: `Ingreso vencido: ${source.name}`,
            message: `Se esperaba recibir S/ ${source.budgeted} el día ${source.expectedDate} pero aún no se ha recibido`,
            category: source.type,
            amount: source.budgeted,
            createdAt: new Date().toISOString()
          });
        } else if (source.status === 'pending' && source.expectedDate) {
          const today = new Date().getDate();
          if (source.expectedDate - today <= 3) {
            alerts.push({
              id: `income-pending-${source.sourceId}`,
              type: 'income_pending',
              severity: 'low',
              title: `Ingreso próximo: ${source.name}`,
              message: `Se recibirá S/ ${source.budgeted} el día ${source.expectedDate}`,
              category: source.type,
              amount: source.budgeted,
              createdAt: new Date().toISOString()
            });
          }
        }
      }
    }

    return alerts;
  }

  private async getGoalAlerts(userId: string): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const goals = await this.firebase.getGoals(userId);
    const monthlyIncome = await this.firebase.calculateMonthlyIncome(userId, 
      new Date().getFullYear(), 
      new Date().getMonth() + 1
    );

    if (goals && goals.length > 0 && monthlyIncome?.totalBudgeted) {
      const savingsTarget = monthlyIncome.totalBudgeted * 0.20; // 20% savings target

      for (const goal of goals as any[]) {
        if (goal.status !== 'active') continue;

        const monthlyContribution = goal.monthlyContribution || 0;
        
        if (monthlyContribution < savingsTarget) {
          alerts.push({
            id: `goal-behind-${goal.id}`,
            type: 'goal_behind_schedule',
            severity: (goal.priority === 'high') ? 'high' : 'medium',
            title: `Meta fuera de schedule: ${goal.name || 'Meta'}`,
            message: `Contribution mensual de S/ ${monthlyContribution} es menor al objetivo de S/ ${Math.round(savingsTarget)}`,
            category: goal.category,
            amount: monthlyContribution,
            threshold: savingsTarget,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    // Check for low savings rate
    const financialState = await this.firebase.getFinancialState(userId, 
      new Date().getFullYear(), 
      new Date().getMonth() + 1
    );

    if (financialState?.savingsRate !== undefined && financialState.savingsRate < 10) {
      alerts.push({
        id: 'low-savings-rate',
        type: 'low_savings_rate',
        severity: 'high',
        title: 'Tasa de ahorro baja',
        message: `Tu tasa de ahorro es solo ${financialState.savingsRate}%. Se recomienda al menos 20% para salud financiera saludable.`,
        createdAt: new Date().toISOString()
      });
    }

    return alerts;
  }

  private getAlertTitle(type: string): string {
    const titles: Record<string, string> = {
      'overdue': 'Gasto vencido',
      'budget_exceeded': 'Presupuesto excedido',
      'price_change': 'Cambio de precio detectado',
      'variable_spike': 'Gasto variable elevado'
    };
    return titles[type] || 'Alerta de gasto';
  }

  // Get alert counts by severity
  async getAlertSummary(year: number, month: number): Promise<{
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }> {
    const alerts = await this.getAllAlerts(year, month);

    return {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length
    };
  }
}