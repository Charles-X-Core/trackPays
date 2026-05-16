# Testing Strategy — Track Pays

## Visión General

La estrategia de testing de Track Pays garantiza que cada feature, componente y servicio funcione correctamente antes de llegar al usuario. El objetivo no es cobertura máxima, sino **calidad sostenible** que permita iterar rápido sin romper cosas.

---

## Stack de Testing

| Herramienta | Propósito |
|-------------|-----------|
| **Vitest** | Test runner moderno, rápido, compatible Jest |
| **jsdom** | Environment de DOM simulado para tests de componentes |
| **Angular TestBed** | Herramienta de Angular para crear componentes en contexto de test |
| **Playwright** | (Futuro) Tests E2E con navegador real |

---

## Arquitectura de Tests

### Estructura de Archivos

```
src/
├── app/
│   ├── core/
│   │   └── services/
│   │       ├── auth.service.spec.ts
│   │       └── auth.service.ts
│   │
│   ├── features/
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   └── balance-card/
│   │   │   │       ├── balance-card.component.spec.ts
│   │   │   │       └── balance-card.component.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── dashboard.facade.spec.ts
│   │   │   │   └── dashboard.facade.ts
│   │   │   │
│   │   │   └── dashboard.component.spec.ts
│   │   │
│   │   └── transactions/
│   │       └── ...
│   │
│   ├── engines/
│   │   └── financial/
│   │       └── financial.engine.spec.ts
│   │
│   └── shared/
│       └── components/
│           └── button/
│               └── button.component.spec.ts
│
└── test/
    ├── setup.ts              # Configuración global de tests
    ├── mocks/
    │   ├── firebase.mock.ts
    │   └── router.mock.ts
    └── utils/
        └── test-helpers.ts
```

### Convenciones de Nomenclatura

| Tipo | Nombre | Ejemplo |
|------|--------|---------|
| **Componente** | `{nombre}.component.spec.ts` | `dashboard.component.spec.ts` |
| **Servicio** | `{nombre}.service.spec.ts` | `transaction.service.spec.ts` |
| **Engine** | `{nombre}.engine.spec.ts` | `financial.engine.spec.ts` |
| **Facade** | `{nombre}.facade.spec.ts` | `dashboard.facade.spec.ts` |

---

## Tipos de Tests

### 1. Unit Tests (Servicios, Engines, Utils)

**Qué testear**: Lógica de negocio pura, cálculos, transformaciones.

```typescript
// engines/financial/financial.engine.spec.ts
import { describe, it, expect } from 'vitest';
import { FinancialEngine } from './financial.engine';

describe('FinancialEngine', () => {
  describe('calculateTotals', () => {
    it('should calculate income, expenses and balance', () => {
      // Arrange
      const transactions = [
        { amount: 1000 },  // ingreso
        { amount: -200 }, // gasto
        { amount: -50 },   // gasto
      ] as any;

      // Act
      const result = FinancialEngine.calculateTotals(transactions);

      // Assert
      expect(result.income).toBe(1000);
      expect(result.expenses).toBe(250);
      expect(result.balance).toBe(750);
    });
  });
});
```

**Regla**: Los unit tests no tienen dependencias externas (Firebase, router, etc.). Todo se mockea o usa datos en memoria.

---

### 2. Component Tests (Standalone Components)

**Qué testear**: Renderizado, interacciones del usuario, bindings, emisión de eventos.

```typescript
// features/dashboard/components/balance-card/balance-card.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { BalanceCardComponent } from './balance-card.component';
import { CurrencyFormatPipe } from '@shared/pipes/currency-format.pipe';

describe('BalanceCardComponent', () => {
  let component: BalanceCardComponent;
  let fixture: ComponentFixture<BalanceCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BalanceCardComponent,
        CurrencyFormatPipe
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BalanceCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display formatted balance', () => {
    component.balance = 2500;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('S/ 2,500.00');
  });

  it('should apply negative class when balance is negative', () => {
    component.balance = -500;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.balance')?.classList).toContain('negative');
  });
});
```

---

### 3. Integration Tests (Facades + Services)

**Qué testear**: Cómo los servicios trabajan juntos, flujos de datos.

```typescript
// features/dashboard/services/dashboard.facade.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardFacade } from './dashboard.facade';
import { TransactionService } from '@core/services/transaction.service';
import { GoalService } from '@core/services/goal.service';

describe('DashboardFacade', () => {
  let facade: DashboardFacade;
  let transactionService: any;
  let goalService: any;

  beforeEach(() => {
    transactionService = {
      getByMonth: vi.fn().mockResolvedValue([
        { amount: 1000 },
        { amount: -200 }
      ])
    };

    goalService = {
      get: vi.fn().mockResolvedValue({ currentAmount: 500, targetAmount: 10000 })
    };

    facade = new DashboardFacade(transactionService, goalService);
  });

  it('should load dashboard data', async () => {
    await facade.loadDashboard();

    expect(facade.monthSummary()).toBeDefined();
    expect(transactionService.getByMonth).toHaveBeenCalled();
  });
});
```

---

### 4. E2E Tests (Playwright - Futuro)

**Qué testear**: Flujos completos del usuario, integración real con Firebase.

```
test/
└── e2e/
    ├── login.spec.ts
    ├── create-transaction.spec.ts
    └── dashboard-flow.spec.ts
```

---

## Mocking Strategy

### 1. Servicios de Firebase

```typescript
// test/mocks/firebase.mock.ts
import { vi } from 'vitest';

export const MockFirebaseAuth = {
  signInWithEmailAndPassword: vi.fn().mockResolvedValue({
    user: { uid: 'test-user-123' }
  }),
  createUserWithEmailAndPassword: vi.fn().mockResolvedValue({
    user: { uid: 'test-user-123' }
  }),
  signOut: vi.fn().mockResolvedValue(undefined),
  currentUser: { uid: 'test-user-123' }
};

export const MockFirestore = {
  collection: vi.fn().mockReturnValue({
    doc: vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue({ data: () => ({}) }),
      set: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined)
    })
  })
};
```

### 2. Router

```typescript
// test/mocks/router.mock.ts
import { vi } from 'vitest';

export const MockRouter = {
  navigate: vi.fn().mockResolvedValue(true),
  createUrlTree: vi.fn(),
  serializeUrl: vi.fn()
};
```

### 3. Signals

```typescript
// test/utils/signal-mock.ts
import { signal, WritableSignal } from '@angular/core';

export function createMockSignal<T>(initialValue: T): WritableSignal<T> {
  return signal(initialValue) as WritableSignal<T>;
}
```

---

## Configuración de Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/app/core/**/*.ts',
        'src/app/features/**/*.ts',
        'src/app/engines/**/*.ts'
      ],
      exclude: [
        '**/*.spec.ts',
        '**/*.stories.ts',
        '**/index.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/app/core'),
      '@features': resolve(__dirname, 'src/app/features'),
      '@shared': resolve(__dirname, 'src/app/shared'),
      '@engines': resolve(__dirname, 'src/app/engines'),
      '@test': resolve(__dirname, 'test')
    }
  }
});
```

---

## Setup Global

```typescript
// test/setup.ts
import { vi } from 'vitest';

// Mock global functions
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
});

// Mock IntersectionObserver para componentes que lo usen
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));
```

---

## Comandos de Testing

```bash
# Ejecutar todos los tests una vez
pnpm test

# Modo watch (re-runs al cambiar archivos)
pnpm test --watch

# Coverage report
pnpm test --coverage

# Ejecutar tests de un archivo específico
pnpm test src/app/core/services/auth.spec.ts

# Tests de un feature específico
pnpm test src/app/features/dashboard

# Mode CI (sin watch, para CI/CD)
pnpm test --run
```

---

## Objetivos de Cobertura

| Área | Target | Explicación |
|------|--------|--------------|
| **Core Services** | > 80% | Lógica crítica de negocio |
| **Engines** | > 90% | Cálculos financieros deben estar 100% testeados |
| **Features** | > 70% | Components y facades |
| **Shared** | > 60% | Componentes UI básicos |

**Nota**: La cobertura no lo es todo. Un test que verifica el comportamiento correcto vale más que 10 tests que solo cubren líneas.

---

## Code Coverage Report

Al ejecutar `pnpm test --coverage`, se genera un reporte en `coverage/index.html`:

```
┌─────────────────────────────────────────────────────────────────┐
│                      COVERAGE REPORT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TOTAL                      72%                                 │
│  ───────────────────────────────                               │
│  Core Services              85%  ████████████░░░               │
│  Engines                    93%  ██████████████░               │
│  Features                   68%  ██████████░░░░░░               │
│  Shared                     55%  ████████░░░░░░░░               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Mejores Prácticas

### ✅ Hacer

1. **Nombrar claramente**: `should return empty array when no transactions`
2. **Arrange-Act-Assert**: Estructura clara en cada test
3. **Un concepto por test**: Un expect por comportamiento
4. **Tests independientes**: No depender de orden de ejecución
5. **Mocks explícitos**: Documentar qué se mockea y por qué
6. **Tests parametrizados**: Para casos similares con diferentes inputs

### ❌ Evitar

1. **Tests sin assertions**: Solo Arrange y Act
2. **Copiar código de producción**: El test es código diferente
3. **Testear implementación**: Testear el qué, no el cómo
4. **Mocks excesivos**: Si mockeas todo, no testeas nada
5. **Tests frágiles**: Que fallen por cambios menores

---

## Integración con CI/CD

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install

      - run: pnpm test --run
        env:
          FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}

      - run: pnpm test --coverage
        continue-on-error: true
```

---

## Resumen

| Aspecto | Estrategia |
|---------|------------|
| **Unit tests** | Vitest + mocks puros |
| **Component tests** | Angular TestBed + jsdom |
| **Integration tests** | Facades con servicios mockeados |
| **E2E tests** | Playwright (futuro) |
| **Cobertura target** | 70-80% general, 90% en engines |
| **Modo desarrollo** | Watch activo |
| **Modo CI** | --run, coverage opcional |

El objetivo es un codebase donde **confiamos en los tests para hacer cambios rápidos** sin miedo a romper funcionalidad existente.