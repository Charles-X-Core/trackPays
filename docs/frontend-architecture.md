# Frontend Architecture — Track Pays

## Visión General

La arquitectura frontend de Track Pays está diseñada para Angular 21 moderno, utilizando standalone components, signals, y una estructura feature-based que prioriza mantenibilidad, escalabilidad, y rendimiento.

El objetivo es crear una base que permita al equipo de desarrollo agregar features rápidamente sin comprometer la calidad del código o la experiencia del usuario.

---

## Estructura de Carpetas Propuesta

### Vista General

```
src/
├── app/
│   ├── core/                    # FUNDAMENTALS (no business logic)
│   │   ├── guards/             # Route guards
│   │   ├── interceptors/       # HTTP interceptors
│   │   ├── models/             # Interfaces y tipos
│   │   └── utils/              # Utilities puros
│   │
│   ├── shared/                  # REUSABLE (across features)
│   │   ├── components/         # UI components genéricos
│   │   ├── pipes/              # Pipes reutilizables
│   │   ├── directives/         # Directivas reutilizables
│   │   └── utils/              # Shared utilities
│   │
│   ├── features/                # BUSINESS LOGIC
│   │   ├── auth/
│   │   │   ├── components/    # Login, Register
│   │   │   ├── services/       # Auth feature services
│   │   │   └── guards/         # Auth-specific guards
│   │   │
│   │   ├── dashboard/
│   │   │   ├── components/     # Dashboard UI components
│   │   │   └── services/       # Dashboard-specific services
│   │   │
│   │   ├── transactions/
│   │   │   ├── components/     # Transactions list, filters, forms
│   │   │   └── services/       # Transactions feature services
│   │   │
│   │   ├── goals/
│   │   │   ├── components/     # Goals UI components
│   │   │   └── services/       # Goals feature services
│   │   │
│   │   └── analytics/
│   │       ├── components/     # Analytics UI components
│   │       └── services/       # Analytics feature services
│   │
│   ├── engines/                 # COMPUTATION LAYER
│   │   ├── financial/          # Financial calculations
│   │   ├── projection/        # Future projections
│   │   └── comparison/         # Temporal comparisons
│   │
│   ├── systems/                 # CROSS-CUTTING SYSTEMS
│   │   ├── auth/               # Authentication system
│   │   ├── analytics/          # Usage analytics
│   │   ├── notification/       # Notifications & toasts
│   │   └── theme/              # Theme management
│   │
│   ├── data/                    # DATA LAYER
│   │   ├── repositories/       # Data access abstraction
│   │   ├── adapters/           # Data transformers
│   │   └── mappers/            # Type mappers
│   │
│   ├── config/                  # CONFIGURATION
│   │   ├── routes.ts           # Route definitions
│   │   ├── app.config.ts       # App configuration
│   │   └── providers.ts        # Global providers
│   │
│   ├── app.component.ts        # Root component
│   ├── app.config.ts           # App config (already exists)
│   └── app.routes.ts           # Routes (already exists)
│
├── assets/                      # Static assets
│   ├── icons/
│   ├── images/
│   └── fonts/
│
├── environments/               # Environment configs
│   ├── environment.ts
│   ├── environment.prod.ts
│   └── environments.example.ts
│
├── styles/                     # Global styles
│   ├── _variables.scss
│   ├── _mixins.scss
│   ├── _typography.scss
│   ├── _animations.scss
│   └── styles.scss             # Main imports
│
└── index.html
```

### Estructura Detallada por Nivel

#### Nivel 1: Core (Fundamentos)

```
core/
├── guards/
│   ├── auth.guard.ts
│   └── role.guard.ts
│
├── interceptors/
│   ├── auth.interceptor.ts
│   ├── error.interceptor.ts
│   └── logging.interceptor.ts
│
├── models/
│   ├── user.model.ts
│   ├── transaction.model.ts
│   ├── category.model.ts
│   ├── goal.model.ts
│   └── common.models.ts
│
└── utils/
    ├── date.utils.ts
    ├── number.utils.ts
    ├── string.utils.ts
    └── validation.utils.ts
```

**Regla**: El directorio `core` NO contiene lógica de negocio. Solo tipos, guards, interceptors, y utilities puras.

#### Nivel 2: Shared (Componentes Reutilizables)

```
shared/
├── components/
│   ├── ui/                     # Componentes base del design system
│   │   ├── button/
│   │   ├── input/
│   │   ├── select/
│   │   ├── card/
│   │   ├── modal/
│   │   ├── toast/
│   │   ├── skeleton/
│   │   └── loading/
│   │
│   ├── common/                 # Componentes comunes no-genéricos
│   │   ├── empty-state/
│   │   ├── error-message/
│   │   ├── confirm-dialog/
│   │   └── page-header/
│   │
│   └── charts/                 # Componentes de charts
│       ├── pie-chart/
│       ├── bar-chart/
│       ├── line-chart/
│       └── donut-chart/
│
├── pipes/
│   ├── currency-format.pipe.ts
│   ├── date-format.pipe.ts
│   ├── relative-date.pipe.ts
│   ├── percentage.pipe.ts
│   └── truncate.pipe.ts
│
├── directives/
│   ├── auto-focus.directive.ts
│   ├── click-outside.directive.ts
│   └── currency-input.directive.ts
│
└── utils/
    ├── array.utils.ts
    └── object.utils.ts
```

**Regla**: Los componentes en `shared` NO saben nada de Firebase, Auth, ni lógica de negocio específica. Son completamente reutilizables.

#### Nivel 3: Features (Lógica de Negocio)

```
features/
├── auth/
│   ├── components/
│   │   ├── login/
│   │   │   ├── login.component.ts
│   │   │   ├── login.component.html
│   │   │   ├── login.component.scss
│   │   │   └── login.component.spec.ts
│   │   │
│   │   └── register/
│   │       ├── register.component.ts
│   │       ├── register.component.html
│   │       ├── register.component.scss
│   │       └── register.component.spec.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts      # Feature-specific auth logic
│   │   ├── validators.ts       # Form validators
│   │   └── auth.facade.ts      # Facade pattern
│   │
│   └── guards/
│       └── guest.guard.ts      # Solo para no-auth users
│
├── dashboard/
│   ├── components/
│   │   ├── balance-card/
│   │   ├── rule-50320/
│   │   ├── goal-summary/
│   │   ├── category-list/
│   │   ├── recent-transactions/
│   │   └── quick-entry-modal/
│   │
│   ├── services/
│   │   ├── dashboard.service.ts
│   │   └── dashboard.facade.ts
│   │
│   └── dashboard.component.ts  # Page component
│
├── transactions/
│   ├── components/
│   │   ├── transaction-list/
│   │   ├── transaction-filters/
│   │   ├── transaction-form/
│   │   └── transaction-group/
│   │
│   ├── services/
│   │   ├── transactions.service.ts
│   │   ├── filters.service.ts
│   │   └── transactions.facade.ts
│   │
│   └── transactions.component.ts
│
├── goals/
│   ├── components/
│   │   ├── goal-progress/
│   │   ├── goal-stats/
│   │   ├── milestones/
│   │   ├── scenarios/
│   │   └── goal-form/
│   │
│   ├── services/
│   │   ├── goals.service.ts
│   │   ├── projection.service.ts
│   │   └── goals.facade.ts
│   │
│   └── goals.component.ts
│
└── analytics/
    ├── components/
    │   ├── trends-chart/
    │   ├── category-breakdown/
    │   ├── anomaly-list/
    │   └── comparison-panel/
    │
    ├── services/
    │   ├── analytics.service.ts
    │   ├── trend-analyzer.service.ts
    │   └── analytics.facade.ts
    │
    └── analytics.component.ts
```

**Regla**: Cada feature es autocontenido. Los servicios dentro de un feature solo acceden a datos de ese feature, a menos que necesiten datos de otros features (en cuyo caso usan el Engine o sistema apropiado).

#### Nivel 4: Engines (Capa de Cómputo)

```
engines/
├── financial/
│   ├── financial.engine.ts
│   ├── calculators/
│   │   ├── month-calculator.ts
│   │   ├── rule-50320-calculator.ts
│   │   ├── category-calculator.ts
│   │   └── trend-calculator.ts
│   └── interfaces/
│       └── financial-engine.interface.ts
│
├── projection/
│   ├── projection.engine.ts
│   ├── goal-projector.ts
│   └── scenario-simulator.ts
│
└── comparison/
    ├── comparison.engine.ts
    ├── period-comparator.ts
    └── anomaly-detector.ts
```

**Regla**: Los Engines contienen lógica pura de cálculo. No hacen llamadas a Firebase. Reciben datos, procesan, y devuelven resultados.

#### Nivel 5: Systems (Capa Transversal)

```
systems/
├── auth/
│   ├── firebase-auth.system.ts
│   ├── session-manager.ts
│   ├── user-profile.sync.ts
│   └── auth-state.signal.ts
│
├── analytics/
│   ├── analytics-tracker.ts
│   ├── engagement-metrics.ts
│   └── user-journey.ts
│
├── notification/
│   ├── notification.service.ts
│   ├── toast-manager.ts
│   └── alert-manager.ts
│
└── theme/
    ├── theme.service.ts
    ├── theme.config.ts
    └── theme-state.signal.ts
```

#### Nivel 6: Data (Capa de Acceso)

```
data/
├── repositories/
│   ├── transaction.repository.ts
│   ├── category.repository.ts
│   ├── goal.repository.ts
│   └── user.repository.ts
│
├── adapters/
│   ├── firebase-transaction.adapter.ts
│   ├── firebase-category.adapter.ts
│   └── firebase-goal.adapter.ts
│
└── mappers/
    ├── transaction.mapper.ts
    ├── category.mapper.ts
    └── goal.mapper.ts
```

**Nota**: Esta capa es necesaria cuando se migre a Firebase. Proporciona abstracción entre el código de negocio y la implementación de base de datos.

**Arquitectura de Datos**: La estructura completa de Firestore está documentada en `firestore-architecture.md`, que incluye:
- Months como estructura organizativa (no solo transactions)
- MonthlyFinancialState pre-calculado para rendimiento
- Sistema de analytics e insights persistidos
- Budgeting completo con alertas

---

## Estrategia de Standalone Components

### Configuración por Defecto

Todos los componentes en Track Pays son **standalone components**:

```typescript
@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedComponents],
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {}
```

### Imports Típicos por Tipo de Componente

**Page Components (routes)**:
```typescript
imports: [
  CommonModule,
  RouterModule,
  ReactiveFormsModule,
  // Feature-specific components
  // Shared components
]
```

**UI Components (design system)**:
```typescript
imports: [
  CommonModule,
  // Solo dependencias de UI, ninguna de feature
]
```

**Smart Components (containers)**:
```typescript
imports: [
  CommonModule,
  // Child dumb components
  // ReactiveFormsModule (si necesita forms)
]
```

---

## State Management: Signals + Facade Pattern

### Estado Global vs Estado Local

**Estado local** (dentro del componente):
- Estados de UI (modals abiertos, filtros activos)
- Form states
- Loading states locales

**Estado global** (signals en servicios):
- Usuario autenticado
- Tema actual
- Datos del usuario (perfil)
- Caché de transacciones (para evitar refetch frecuente)

### Estructura de Signals

```typescript
// systems/auth/auth-state.signal.ts
@Injectable({ providedIn: 'root' })
export class AuthState {
  private _user = signal<User | null>(null);
  private _isLoading = signal<boolean>(true);
  private _session = signal<Session | null>(null);

  // Public readonly signals
  readonly user = this._user.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  // Actions
  setUser(user: User | null): void { ... }
  setLoading(loading: boolean): void { ... }
}

// Usage in component
@Component({...})
export class DashboardComponent {
  private authState = inject(AuthState);
  user = this.authState.user;
  isAuthenticated = this.authState.isAuthenticated;
}
```

### Facade Pattern

Los facades proporcionan una interfaz unificada para un feature completo:

```typescript
// features/dashboard/services/dashboard.facade.ts
@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private transactionService = inject(TransactionService);
  private goalService = inject(GoalService);
  private financialEngine = inject(FinancialEngine);
  private authState = inject(AuthState);

  // Computed signals para el dashboard
  readonly isLoading = signal<boolean>(true);
  readonly userName = computed(() => this.authState.user()?.fullName);
  readonly monthSummary = signal<MonthSummary | null>(null);
  readonly ruleStatus = signal<Rule503020Status | null>(null);
  readonly goalProgress = signal<GoalProgress | null>(null);
  readonly recentTransactions = signal<Transaction[]>([]);

  async loadDashboard(): Promise<void> {
    this.isLoading.set(true);
    try {
      const [transactions, goal] = await Promise.all([
        this.transactionService.getCurrentMonth(),
        this.goalService.getCurrentGoal()
      ]);

      this.monthSummary.set(this.financialEngine.calculateSummary(transactions));
      this.ruleStatus.set(this.financialEngine.calculateRule503020(
        this.authState.user()?.monthlyIncome ?? 0,
        transactions
      ));
      this.goalProgress.set(goal ? this.goalService.calculateProgress(goal) : null);
      this.recentTransactions.set(transactions.slice(0, 5));
    } finally {
      this.isLoading.set(false);
    }
  }
}
```

### Cuándo Usar Signals vs Observables

| Caso | Recomendación |
|------|---------------|
| Estado UI local | `signal()` |
| Estado global (auth, theme) | `signal()` con `asReadonly()` |
| Datos que vienen de Firebase | `Promise` + `signal()` (no RxJS) |
| Eventos de timer/interval | `Observable` (menos común) |
| Streams de datos en tiempo real | `Observable` (futuro, si se implementa) |

**Nota**: Track Pays usa primariamente `Promise` + `signal` para datos. RxJS se reserva para casos específicos (timers, streams complejos).

---

## Servicios y Repositorios

### Estrategia de Servicios

**Servicios de Feature**:
- Contienen lógica de negocio específica de su feature
- Usan el Repository para acceso a datos
- Usan el Engine para cálculos

```typescript
// features/transactions/services/transactions.service.ts
@Injectable({ providedIn: 'root' })
export class TransactionService {
  private repo = inject(TransactionRepository);
  private engine = inject(FinancialEngine);

  async getByMonth(year: number, month: number): Promise<Transaction[]> {
    return this.repo.getByMonth(year, month);
  }

  async create(data: TransactionInput): Promise<Transaction> {
    const result = await this.repo.create(data);
    return result;
  }

  calculateTotals(transactions: Transaction[]): Totals {
    return this.engine.calculateTotals(transactions);
  }
}
```

### Repositories (Data Layer)

```typescript
// data/repositories/transaction.repository.ts
@Injectable({ providedIn: 'root' })
export class TransactionRepository {
  private firebase = inject(FirebaseService);
  private mapper = inject(TransactionMapper);

  async getByMonth(year: number, month: number): Promise<Transaction[]> {
    const snapshot = await this.firebase.getTransactionsByMonth(year, month);
    return snapshot.map(doc => this.mapper.fromFirestore(doc));
  }

  async create(data: TransactionInput): Promise<Transaction> {
    const doc = await this.firebase.createTransaction(data);
    return this.mapper.fromFirestore(doc);
  }
}
```

---

## Lazy Loading y Performance

### Lazy Loading de Features

```typescript
// config/routes.ts
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/components/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'transactions',
    loadComponent: () => import('./features/transactions/transactions.component')
      .then(m => m.TransactionsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'goals',
    loadComponent: () => import('./features/goals/goals.component')
      .then(m => m.GoalsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'analytics',
    loadComponent: () => import('./features/analytics/analytics.component')
      .then(m => m.AnalyticsComponent),
    canActivate: [authGuard]
  }
];
```

### Optimizaciones de Carga

| Técnica | Implementación |
|---------|-----------------|
| **Route-level lazy loading** | `loadComponent` en rutas |
| **OnPush change detection** | `changeDetection: ChangeDetectionStrategy.OnPush` en todos los componentes |
| **Signal-based reactivity** | Evitar `Default` change detection |
| **Virtual scrolling** | Para listas largas de transacciones |
| **Image optimization** | WebP, lazy loading |
| **Bundle analysis** | Regular con Angular CLI |

### Change Detection Strategy

```typescript
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...resto de config
})
export class DashboardComponent {
  // Todos los datos son signals, OnPush funciona óptimamente
}
```

---

## Theming y Design System

### Estructura de Theme

```
styles/
├── _variables.scss            # Variables globales
├── _mixins.scss                # Mixins reutilizables
├── _typography.scss           # Tipografía
├── _animations.scss           # Animaciones
├── _themes.scss               # Definiciones de temas
└── styles.scss                # Main imports
```

### Variables CSS (Custom Properties)

```scss
// _variables.scss
:root {
  // Colors
  --color-primary: #2563EB;
  --color-primary-hover: #1D4ED8;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;

  // Text
  --text-primary: #1E293B;
  --text-secondary: #64748B;
  --text-muted: #94A3B8;

  // Spacing
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  // Border radius
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  // Shadows
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}
```

### Angular Material Custom Theme

```scss
// _themes.scss
@use '@angular/material' as mat;

$light-theme: mat.define-theme((
  color: (
    theme-type: light,
    primary: mat.$azure-palette,
    tertiary: mat.$green-palette
  ),
  typography: (
    brand-family: 'Inter',
    plain-family: 'Inter'
  ),
  density: (
    scale: 0
  )
));

:root {
  @include mat.all-component-themes($light-theme);
}
```

---

## Estrategia de Testing

### Estructura de Tests

```
src/
├── app/
│   ├── features/
│   │   ├── dashboard/
│   │   │   ├── dashboard.component.spec.ts
│   │   │   └── services/
│   │   │       └── dashboard.facade.spec.ts
│   │   │
│   │   └── transactions/
│   │       └── transactions.component.spec.ts
│   │
│   ├── shared/
│   │   └── components/
│   │       └── button/
│   │           └── button.component.spec.ts
│   │
│   └── engines/
│       └── financial/
│           └── financial.engine.spec.ts
│
└── test/
    ├── setup.ts
    ├── mocks/
    └── utils/
```

### Tipos de Tests

| Tipo | Cubertura | Herramienta |
|------|-----------|-------------|
| **Unit tests** | Lógica de servicios, engines, utils | Vitest |
| **Component tests** | Componentes UI | Vitest + jsdom |
| **Integration** | Flujos de usuario | Vitest (manual) |
| **E2E** | Flujos completos | Playwright (futuro) |

### Ejemplo de Test de Componente

```typescript
// dashboard.component.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { provideMockStore } from '@ngrx/testing';

describe('DashboardComponent', () => {
  it('should display user name', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.user-name')).toContainText('Juan');
  });
});
```

---

## Checklist de Arquitectura

### Antes de crear un nuevo feature:

- [ ] ¿El feature tiene su propio directorio en `features/`?
- [ ] ¿Los servicios específicos van dentro del feature, no en `core/`?
- [ ] ¿Los componentes genéricos van a `shared/components/`?
- [ ] ¿Se usa `standalone: true`?
- [ ] ¿Se usa `ChangeDetectionStrategy.OnPush`?
- [ ] ¿Los datos se manejan con signals?
- [ ] ¿Se usa Facade para exponer datos al componente?
- [ ] ¿Los cálculos van al Engine apropiado?
- [ ] ¿El componente tiene tests unitarios?
- [ ] ¿La ruta usa lazy loading?

### Antes de modificar un componente existente:

- [ ] ¿El cambio rompe algún test existente?
- [ ] ¿El cambio afecta otros features? (revisar dependencias)
- [ ] ¿Se mantiene la consistencia con otros componentes similares?
- [ ] ¿Se actualiza la documentación si es necesario?

---

## Resumen Ejecutivo

La arquitectura frontend de Track Pays se basa en:

1. **Feature-based structure**: Cada feature es un dominio de negocio autocontenido
2. **Separation of concerns**: Engines (cómputo), Systems (transversal), Data (persistencia), Features (lógica)
3. **Signals everywhere**: State management basado en signals para reactividad eficiente
4. **Facade pattern**: Interfaces unificadas para cada feature
5. **Standalone components**: Todos los componentes son independientes y lazy-loadables
6. **Design system**: Componentes reutilizables en `shared/`, completamente desacoplados de lógica
7. **Testing strategy**: Unit tests con Vitest, componentes testeables

La arquitectura permite escalar a múltiples desarrolladores sin conflictos, mantener código limpio y testeable, y agregar nuevos features rápidamente.