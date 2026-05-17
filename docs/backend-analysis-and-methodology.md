# Análisis del Backend Firebase + Metodología de Desarrollo

---

## 1. Estado Actual del Backend

### 1.1 Estructura Firestore Implementada (Actual)

```
/users/{userId}/
│
├── profile/data              ✅ Implementado
│   └── (datos básicos)
│
├── transactions/             ✅ Implementado
│   └── {transactionId}/
│       ├── id
│       ├── userId
│       ├── amount
│       ├── description
│       ├── categoryId
│       ├── date
│       ├── type (income/expense)
│       ├── createdAt
│       └── updatedAt
│
├── goals/data                ✅ Implementado (1 meta)
│   └── (single goal, no múltiples)
│
└── categories/               ✅ Implementado
    └── {categoryId}/
        ├── name
        ├── icon
        ├── ruleType (need/want/saving)
        ├── budgetLimit
        └── isDefault
```

### 1.2 Lo que ESTÁ vs lo que dice la DOC

| En Docs (firestore-architecture.md) | Implementado Realmente |
|-------------------------------------|----------------------|
| **months/{monthId}/financialState** | ❌ No existe |
| **months/{monthId}/transactions** | ❌ Usa /transactions plano |
| **months/{monthId}/budgets** | ❌ No existe |
| **months/{monthId}/analytics** | ❌ No existe |
| **months/{monthId}/insights** | ❌ No existe |
| **userProfiles** (onboarding) | ❌ No existe |
| **incomeSources** | ❌ No existe |
| **savingsInvestments** | ❌ No existe |
| **recurring** | ❌ No existe |
| **snapshots** | ❌ No existe |
| **analytics/yearly** | ❌ No existe |

### 1.3 Gap Analysis

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        GAP ANALYSIS - FIRESTORE                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  PRIORIDAD CRÍTICA (Fase 2.1):                                               ║
║  ─────────────────────────────────────────────────────────────────────────    ║
║  [1] userProfiles (onboarding)         ████████████░░░░░░░░  0%             ║
║  [2] months/ con estructura completa   ████████████░░░░░░░  0%             ║
║  [3] incomeSources                     ████████████░░░░░░░░  0%             ║
║  [4] expenses dual system               ████████████░░░░░░░  0%             ║
║  [5] savingsInvestments               ████████████░░░░░░░░  0%             ║
║                                                                               ║
║  PRIORIDAD ALTA (Fase 2.2-2.4):                                                ║
║  ─────────────────────────────────────────────────────────────────────────    ║
║  [6] financialState pre-calculado     ████████████░░░░░░░░  0%             ║
║  [7] budgets con alerts                ████████████░░░░░░░░░  0%             ║
║  [8] payment scheduling/dates          ████████████░░░░░░░░  0%             ║
║  [9] cashFlow calculations             ████████████░░░░░░░░  0%             ║
║                                                                               ║
║  MEDIUM (Fase 3):                                                             ║
║  ─────────────────────────────────────────────────────────────────────────    ║
║  [10] analytics/monthly               ████████████░░░░░░░░░  0%             ║
║  [11] insights system                  ████████████░░░░░░░░░  0%             ║
║  [12] recurring detection              ████████████░░░░░░░░  0%             ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 2. Servicios Angular - Estado Actual

### 2.1 Servicios Existentes

| Servicio | Estado | Funcionalidad |
|----------|--------|---------------|
| **FirebaseService** | ✅ Operativo | Auth, CRUD básico Firestore |
| **AuthService** | ✅ Operativo | Manejo de sesión |
| **TransactionService** | ✅ Operativo | CRUD transacciones, cálculos simples |
| **CategoryService** | ✅ Operativo | CRUD categorías, seed default |
| **GoalService** | ✅ Operativo | CRUD meta única |
| **AppState** | ✅ Operativo | Estado global con signals |

### 2.2 Lo que Falta en Servicios

| Servicio | Falta |
|----------|-------|
| **FirebaseService** | Métodos para months/, userProfiles, income, expenses, etc. |
| **TransactionService** | Métodos para expenses complejos, estados de pago |
| **CategoryService** | Subcategorías, categorías por edad |
| **GoalService** | Múltiples goals, savings/investments |
| **Missing Services** | UserProfileService, IncomeService, CashFlowService, AlertService |

### 2.3 Cálculos que se hacen en Frontend (Problemático)

```typescript
// transaction.ts - calcTotals()
// Se calcula cada vez que carga el dashboard - NO DEBE SER ASÍ

calcTotals(transactions: Transaction[]) {
  const income = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const balance = income - expenses;
  return { income, expenses, balance };
}
```

**Problema**: Esto debería estar pre-calculado en Firestore (financialState).

---

## 3. Modelo de Datos - Actual vs Necesario

### 3.1 Transaction (Actual)
```typescript
interface Transaction {
  id: string;
  userId: string;
  categoryId: string | null;
  amount: number;
  description: string | null;
  date: string;
  type: 'income' | 'expense';
  // FALTA:
  // - subcategoryId
  // - isPrimordial
  // - status (pending/partial/paid/overdue)
  // - dueDate
  // - actualAmount (vs budgeted)
  // - isSubscription
  // - provider
  createdAt: string;
  updatedAt: string;
}
```

### 3.2 Lo que Necesitamos Agregar

```
Para TRANSACTIONS:
├── isPrimordial: boolean        // gasto esencial o no
├── dueDayOfMonth: number        // fecha de vencimiento
├── status: pending|partial|paid|overdue|cancelled
├── budgetedAmount: number       // presupuesto del mes
├── actualAmount: number         // lo que realmente pagó
├── isSubscription: boolean      // si es suscripción
├── provider: string             // Netflix, EDEGEL, etc.
└── subcategoryId: string       // KFC, McDonalds, etc.

Para USER PROFILE:
├── age: number
├── onboardingCompleted: boolean
├── employmentType: string
├── restrictionsByAge: AgeRestrictions

Para INCOME SOURCES:
├── type: salary|freelance|business|afp|other
├── deductions: { afp, insurance, others }
├── frequency: weekly|biweekly|monthly
└── paymentDayOfMonth: number

Para EXPENSES (nuevo):
├── isPrimordial: boolean
├── dueDayOfMonth: number
├── optimalPaymentDay: number
├── status: string
├── isVariable: boolean
├── averageAmount: number
└── dangerThreshold: number
```

---

## 4. Recomendación de Metodología

### 4.1 Metodología Propuesta: **Agile por Features (Slice by Slice)**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    METODOLOGÍA: FEATURE-SLICE DEVELOPMENT                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PRINCIPIO: "Un feature completo, no múltiples features a medias"          │
│                                                                              │
│  Cada sprint/session implementa UN feature de punta a punta:                │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  FEATURE SLICE                                                  │    │
│  │  ─────────────────────────────────────────────────────────────    │    │
│  │                                                                     │    │
│  │  1. FIRestore Schema ──► 2. Angular Model ──► 3. Service      │    │
│  │         │                         │                    │            │    │
│  │         ▼                         ▼                    ▼            │    │
│  │  4. Component UI ──► 5. Tests ──► 6. Integration              │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  EJEMPLO: Feature = "Onboarding"                                           │
│  ──────────────────────────────────────────────────────────────────────     │
│  Sprint 1: Onboarding completo                                              │
│  ├── Firestore: crear colección userProfiles                                │
│  ├── Model: crear UserProfile interface                                     │
│  ├── Service: crear UserProfileService                                      │
│  ├── UI: crear OnboardingFlowComponent                                      │
│  ├── Tests: crear spec para onboarding                                      │
│  └── Integration: conectar con Auth                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 workflow de Desarrollo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WORKFLOW RECOMENDADO                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. ANALIZAR (Análisis)                                                    │
│   │   ├── Revisar docs existentes                                           │
│   │   ├── Identificar gaps                                                   │
│   │   └── Definir scope del feature                                         │
│   │                                                                         │
│   │   ▼                                                                     │
│   │                                                                         │
│   2. DISEÑAR (Diseño)                                                       │
│   │   ├── Actualizar modelo de datos                                        │
│   │   ├── Definir estructura Firestore                                      │
│   │   ├── Diseñar UI/UX del feature                                         │
│   │   └── Definir tests necesarios                                          │
│   │                                                                         │
│   │   ▼                                                                     │
│   │                                                                         │
│   3. IMPLEMENTAR (Build)                                                    │
│   │   ├── Step A: Firestore (schema + métodos)                              │
│   │   ├── Step B: Model (interfaces)                                       │
│   │   ├── Step C: Service (lógica de negocio)                              │
│   │   ├── Step D: Component (UI)                                          │
│   │   └── Step E: Tests                                                     │
│   │                                                                         │
│   │   ▼                                                                     │
│   │                                                                         │
│   4. VERIFICAR (Test)                                                       │
│   │   ├── TypeScript compile                                                │
│   │   ├── Build producción                                                   │
│   │   ├── Tests unitarios                                                   │
│   │   └── Revisión manual                                                   │
│   │                                                                         │
│   │   ▼                                                                     │
│   │                                                                         │
│   5. DOCUMENTAR (Docs)                                                      │
│   │   ├── Actualizar docs si es necesario                                   │
│   │   └── Commit con cambios                                                │
│   │                                                                         │
│   │   ▼                                                                     │
│   │                                                                         │
│   6. ENTREGAR (Deploy)                                                      │
│   │   ├── Push a GitHub                                                     │
│   │   └── Feedback del usuario                                              │
│   │                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Prioridad de Implementación (Sugerida)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   PRIORIDADES PARA DESARROLLAR                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INMEDIATO (Esta sesión):                                                   │
│  ──────────────────────────────────────────────────────────────────────     │
│  1. [CRÍTICO] Migrar estructura de meses a Firestore                       │
│     - Crear colección months/{year-month}/                                  │
│     - Mover transactions ahí                                                │
│     - Crear financialState pre-calculado                                    │
│                                                                              │
│  PRÓXIMA SESIÓN:                                                            │
│  ──────────────────────────────────────────────────────────────────────     │
│  2. [ALTA] UserProfile + Onboarding                                        │
│     - Colección userProfiles                                                │
│     - Flujo de onboarding completo                                          │
│     - Restricciones por edad                                                │
│                                                                              │
│  SIGUIENTE:                                                                  │
│  ──────────────────────────────────────────────────────────────────────     │
│  3. [ALTA] Sistema de Ingresos                                             │
│     - Colección incomeSources                                               │
│     - Múltiples fuentes                                                     │
│     - Deducciones                                                            │
│                                                                              │
│  4. [ALTA] Sistema de Gastos Dual                                          │
│     - Colección expenses                                                    │
│     - Primordiales vs no primordiales                                       │
│     - Estados de pago                                                        │
│                                                                              │
│  5. [MEDIA] Flujo de Caja                                                   │
│     - Dashboard de cash flow                                                │
│     - Comparativas                                                            │
│                                                                              │
│  6. [MEDIA] Alertas                                                          │
│     - Sistema de alertas                                                    │
│     - Notificaciones                                                         │
│                                                                              │
│  7. [BAJA] Analytics + Insights                                             │
│     - Analytics persistidos                                                 │
│     - Insights automáticos                                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Reglas de Desarrollo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      REGLAS DE DESARROLLO                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ✅ HACER:                                                                  │
│  ──────────────────────────────────────────────────────────────────────     │
│  • Un feature completo antes de pasar al siguiente                         │
│  • Tests para cada servicio nuevo                                           │
│  • Documentar cambios en Firestore schema                                   │
│  • Verificar build antes de cada commit                                    │
│  • Feedback del usuario frecuentemente                                     │
│                                                                              │
│  ❌ NO HACER:                                                               │
│  ──────────────────────────────────────────────────────────────────────     │
│  • No empezar otro feature si el actual no está completo                  │
│  • No dejar código sin tested                                              │
│  • No hacer cambios grandes sin feedback                                   │
│  • No saltar pasos del workflow                                            │
│                                                                              │
│  🎯 DEFINICIÓN DE "COMPLETO":                                               │
│  ──────────────────────────────────────────────────────────────────────     │
│  • Schema Firestore actualizado                                             │
│  • Modelo TypeScript creado                                                 │
│  • Servicio implementado                                                    │
│  • UI visible en navegador                                                  │
│  • Compila sin errores                                                     │
│  • Feedback del usuario recibido                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Resumen: Lo que Necesitamos Hacer

### 5.1 Backend (Firestore)

| Acción | Prioridad |
|--------|-----------|
| Crear colección `months/{monthId}/` con estructura completa | CRÍTICA |
| Crear colección `userProfiles` | ALTA |
| Crear colección `incomeSources` | ALTA |
| Crear colección `expenses` (dual system) | ALTA |
| Crear colección `savingsInvestments` | ALTA |
| Implementar `financialState` pre-calculado | MEDIA |
| Implementar sistema de alertas | MEDIA |

### 5.2 Frontend (Angular)

| Acción | Prioridad |
|--------|-----------|
| Crear `UserProfileService` | ALTA |
| Crear `IncomeService` | ALTA |
| Crear `ExpenseService` | ALTA |
| Crear `CashFlowService` | MEDIA |
| Crear `OnboardingComponent` | ALTA |
| Actualizar `DashboardComponent` | MEDIA |
| Crear `PaymentCalendarComponent` | MEDIA |

### 5.3 Documentación

| Acción | Estado |
|--------|--------|
| Actualizar `firestore-architecture.md` | Necesario |
| Crear schema de colecciones nuevas | Necesario |
| Documentar metodología | ✅ Listo |

---

**Recomendación**: Empezar migrando la estructura de meses a Firestore (el cambio más crítico), luego seguir con onboarding. ¿Procedemos así?