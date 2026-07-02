import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  // Login (sin layout)
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then(m => m.LoginComponent)
  },
  
  // Onboarding (sin layout)
  {
    path: 'onboarding',
    loadComponent: () =>
      import('./pages/onboarding/onboarding').then(m => m.OnboardingComponent)
  },
  
  // Layout principal para páginas autenticadas
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'income',
        loadComponent: () =>
          import('./pages/income/income').then(m => m.IncomeComponent)
      },
      {
        path: 'expenses',
        loadComponent: () =>
          import('./pages/expenses/expenses').then(m => m.ExpensesComponent)
      },
      {
        path: 'savings',
        loadComponent: () =>
          import('./pages/savings/savings').then(m => m.SavingsComponent)
      },
      {
        path: 'budgets',
        loadComponent: () =>
          import('./pages/budgets/budgets').then(m => m.BudgetsComponent)
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./pages/transactions/transactions').then(m => m.TransactionsComponent)
      },
      {
        path: 'alerts',
        loadComponent: () =>
          import('./pages/alerts/alerts').then(m => m.AlertsComponent)
      },
      {
        path: 'insights',
        loadComponent: () =>
          import('./pages/insights/insights').then(m => m.InsightsComponent)
      },
      {
        path: 'goals',
        loadComponent: () =>
          import('./pages/goals/goals').then(m => m.GoalsComponent)
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings').then(m => m.SettingsComponent)
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./pages/about/about').then(m => m.AboutComponent)
      },
      {
        path: 'migration',
        loadComponent: () =>
          import('./pages/migration/migration').then(m => m.DataMigrationComponent)
      }
    ]
  },
  
  // Redirect raíz a dashboard
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];