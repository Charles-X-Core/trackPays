# 🗂️ Estructura de Datos NoSQL - Track Pays
## Base de datos Firestore (NoSQL - Document Store)

---

## 📊 DIAGRAMA GENERAL

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FIRESTORE: track-pays                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  users/{userId} ─────────────────────────────────────────────────────────────  │
│       │                                                                           │
│       ├── profile                                                                  │
│       │    └── data { age, employmentType, monthlyIncome, currency, locale,      │
│       │               onboardingCompleted, initialBalance, ... }                │
│       │                                                                           │
│       ├── incomeSources/{sourceId} ──────────────────────────────────────────   │
│       │    { type, name, amount, frequency, paymentDayOfMonth, isActive,        │
│       │      actualAmount, lastPaymentDate, isRecurring, deductions, ... }      │
│       │                                                                           │
│       ├── expenses/{expenseId} ──────────────────────────────────────────────   │
│       │    { isPrimordial, category, subcategory, name, provider,                │
│       │      budgetedAmount, actualAmount, dueDayOfMonth, status,               │
│       │      isRecurring, frequency, isSubscription, isVariable, ... }          │
│       │                                                                           │
│       ├── goals/{goalId} ────────────────────────────────────────────────────   │
│       │    { name, category, targetAmount, currentAmount, monthlyContribution,  │
│       │      priority, status, monthsToGoal, projectedCompletionDate,           │
│       │      contributions[], ... }                                            │
│       │                                                                           │
│       ├── categories/{categoryId} ──────────────────────────────────────────   │
│       │    ⚠️ OBSOLETO (no se usa)                                              │
│       │                                                                           │
│       └── months/{monthId} ──────────────────────────────────────────────────   │
│            │                                                                       │
│            ├── transactions/{transactionId}                                      │
│            │    { amount, description, date, type, category, ruleType,          │
│            │      deletedAt, ... }                                              │
│            │                                                                       │
│            ├── budgets/{category}                                                │
│            │    { categoryName, isPrimordial, budgetedAmount, actualAmount,     │
│            │      remainingAmount, percentageUsed, status, alertThreshold,       │
│            │      history[], ... }                                               │
│            │                                                                       │
│            └── financialState                                                    │
│                 { income, incomeBudgeted, expenses, balance, savings,           │
│                   savingsRate, financialScore, healthStatus, rule50320,         │
│                   lastUpdated }                                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ NoSQL vs Relacional

| Característica | SQL (Relacional) | NoSQL (Firestore) |
|----------------|------------------|-------------------|
| Estructura | Tablas | Colecciones |
| Registros | Filas | Documentos |
| Primary Key | ID auto-incremental | ID automático |
| Relaciones | Foreign Keys | Referencias o embebido |
| Joins | SELECT con JOIN | No existen |
| Queries | SQL flexible | Limitadas por colección |

**En Firestore:**
- No hay "relaciones" como tal
- Se accede a subcolecciones directamente
- Las "relaciones" son conceptuales (jerarquía)
- No hay joins - cada query es a una colección específica

---

## 📋 COLECCIONES Y SUS CAMPOS

### 1. users/{userId}/profile/data
| Campo | Tipo | Descripción |
|-------|------|-------------|
| email | string | Email del usuario |
| fullName | string | Nombre completo |
| age | number | Edad |
| employmentType | string | Tipo de empleo |
| monthlyIncome | number | Ingreso mensual objetivo |
| currency | string | Moneda (PEN) |
| locale | string | Locale (es-PE) |
| initialBalance | number | Balance inicial |
| onboardingCompleted | boolean | Si completó onboarding |
| onboardingVersion | number | Versión del onboarding |
| createdAt | string | Fecha de creación |
| updatedAt | string | Fecha de actualización |

---

### 2. users/{userId}/incomeSources/{sourceId}
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | ID de la fuente |
| userId | string | UID del usuario |
| type | string | salary/freelance/business/afp/rental/dividends/allowance/other |
| name | string | Nombre (ej: "Sueldo Empresa") |
| amount | number | Monto presupuestado |
| actualAmount | number | Monto recibido realmente |
| frequency | string | weekly/biweekly/monthly |
| paymentDayOfMonth | number | Día de pago del mes |
| firstPaymentDate | string | Primera fecha de pago |
| lastPaymentDate | string | Última fecha de pago |
| isActive | boolean | Si está activa |
| isRecurring | boolean | Si es recurrente |
| deductions | object | AFP, seguros, etc |
| notes | string | Notas adicionales |
| createdAt | string | Fecha de creación |
| updatedAt | string | Fecha de actualización |

**Relación**: Un usuario puede tener MÚLTIPLES incomeSources

---

### 3. users/{userId}/expenses/{expenseId}
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | ID del gasto |
| userId | string | UID del usuario |
| isPrimordial | boolean | true=esencial, false=no esencial |
| category | string | Categoría (housing/utilities/streaming/etc) |
| subcategory | string | Subcategoría (alquiler/luz/netflix) |
| name | string | Nombre del gasto |
| provider | string | Proveedor |
| budgetedAmount | number | Monto presupuestado |
| actualAmount | number | Monto real pagado |
| dueDayOfMonth | number | Día de vencimiento |
| status | string | pending/partial/paid/overdue/cancelled |
| isRecurring | boolean | Si es recurrente |
| frequency | string | weekly/biweekly/monthly/quarterly/yearly |
| isSubscription | boolean | Si es suscripción |
| subscriptionPrice | number | Precio de suscripción |
| isVariable | boolean | Si el monto varía (luz/agua) |
| dangerThreshold | number | % que activa alerta |
| tags | string[] | Tags personalizados |
| metadata | object | Metadatos adicionales |
| createdAt | string | Fecha de creación |
| updatedAt | string | Fecha de actualización |

**Relación**: Un usuario puede tener MÚLTIPLES expenses

---

### 4. users/{userId}/goals/{goalId}
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | ID de la meta |
| userId | string | UID del usuario |
| name | string | Nombre de la meta |
| description | string | Descripción |
| category | string | emergency/travel/vehicle/house/education/etc |
| targetAmount | number | Monto objetivo |
| currentAmount | number | Monto actual ahorrado |
| monthlyContribution | number | Aporte mensual |
| targetDate | string | Fecha objetivo |
| monthsToGoal | number | Meses hasta la meta |
| projectedCompletionDate | string | Fecha proyectada |
| priority | string | high/medium/low |
| status | string | active/completed/paused/cancelled |
| isCompleted | boolean | Si está completada |
| contributions | object[] | Historial de contribuciones |
| tags | string[] | Tags |
| createdAt | string | Fecha de creación |
| updatedAt | string | Fecha de actualización |

**Relación**: Un usuario puede tener MÚLTIPLES goals

---

### 5. users/{userId}/months/{monthId}
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | YYYY-MM (ej: 2026-05) |
| year | number | Año |
| month | number | Mes (1-12) |
| status | string | active/archived |
| createdAt | string | Fecha de creación |
| updatedAt | string | Fecha de actualización |

**Relación**: Un usuario tiene UN documento por CADA mes

---

### 6. users/{userId}/months/{monthId}/transactions/{transactionId}
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | ID de la transacción |
| userId | string | UID del usuario |
| type | string | income/expense |
| amount | number | Monto (positivo=ingreso, negativo=gasto) |
| description | string | Descripción |
| date | string | Fecha de la transacción |
| category | string | Categoría |
| ruleType | string | need/want/saving/income (50/30/20) |
| deletedAt | string | Si fue eliminada (soft delete) |
| createdAt | string | Fecha de creación |
| updatedAt | string | Fecha de actualización |

**Relación**: Un mes puede tener MÚLTIPLES transactions

---

### 7. users/{userId}/months/{monthId}/budgets/{category}
| Campo | Tipo | Descripción |
|-------|------|-------------|
| category | string | Categoría del presupuesto |
| userId | string | UID del usuario |
| categoryName | string | Nombre para mostrar |
| isPrimordial | boolean | Si es primordial |
| budgetedAmount | number | Monto presupuestado |
| actualAmount | number | Monto gastado |
| remainingAmount | number | Monto restante |
| percentageUsed | number | Porcentaje usado |
| status | string | on_track/at_risk/exceeded/unused |
| alertThreshold | number | Umbral de alerta (default: 80) |
| isActive | boolean | Si está activo |
| year | number | Año |
| month | number | Mes |
| history | object[] | Historial de cambios |
| createdAt | string | Fecha de creación |
| updatedAt | string | Fecha de actualización |

**Relación**: Un mes tiene UN presupuesto por CADA categoría

---

### 8. users/{userId}/months/{monthId}/financialState
| Campo | Tipo | Descripción |
|-------|------|-------------|
| income | number | Ingresos reales del mes |
| incomeBudgeted | number | Ingresos presupuestados |
| incomeReceived | number | Ingresos recibidos |
| incomePending | number | Ingresos pendientes |
| initialBalance | number | Balance inicial |
| availableNow | number | Disponible ahora |
| expectedByEndOfMonth | number | Esperado a fin de mes |
| expenses | number | Gastos reales |
| expensesBudgeted | number | Gastos presupuestados |
| balance | number | Balance real |
| budgetedBalance | number | Balance presupuestado |
| savings | number | Ahorro real |
| savingsRate | number | Tasa de ahorro % |
| financialScore | number | Puntuación financiera (0-100) |
| healthStatus | string | excellent/good/warning/critical |
| rule50320 | object | Breakdown 50/30/20 |
| lastUpdated | string | Fecha de última actualización |

**Relación**: UN documento por mes (pre-calculado)

---

## 🔗 JERARQUÍA (NoSQL - No hay relaciones reales)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         ESTRUCTURA JERÁRQUICA                               │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   userId (root)                                                            │
│       │                                                                     │
│       ├──► profile (documento)                                             │
│       │                                                                     │
│       ├──► incomeSources (subcolección)                                    │
│       │      └── documentos individuales                                   │
│       │                                                                     │
│       ├──► expenses (subcolección)                                         │
│       │      └── documentos individuales                                   │
│       │                                                                     │
│       ├──► goals (subcolección)                                           │
│       │      └── documentos individuales                                   │
│       │                                                                     │
│       └──► months (subcolección)                                           │
│              └── {monthId} (documento mes)                                 │
│                   │                                                        │
│                   ├──► transactions (sub-subcolección)                    │
│                   ├──► budgets (sub-subcolección)                          │
│                   └──► financialState (documento)                         │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 MODELO DE DATOS (FORMATO DOCUMENTO)

| Entidad | Relaciones | Cardinalidad |
|---------|------------|--------------|
| User | → Profile | 1:1 |
| User | → IncomeSources | 1:N |
| User | → Expenses | 1:N |
| User | → Goals | 1:N |
| User | → Months | 1:N |
| Month | → Transactions | 1:N |
| Month | → Budgets | 1:N (por categoría) |
| Month | → FinancialState | 1:1 |

---

## 🔄 FLUJO DE DATOS

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Onboard    │ ───► │   Income     │ ───► │  Financial   │
│   Service    │      │   Sources    │      │   State      │
└──────────────┘      └──────────────┘      └──────┬───────┘
                                                   │
                                                   ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Goals      │ ◄─── │  Expenses &  │ ◄─── │   Budgets    │
│   Service    │      │ Transactions │      │   Service    │
└──────────────┘      └──────┬───────┘      └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   Reports    │
                    │   Service    │
                    └──────────────┘
```

---

## 📁 SERVICIOS Y SUS COLECCIONES

| Servicio | Colección Principal | Operaciones |
|----------|---------------------|-------------|
| AuthService | - | Autenticación |
| FirebaseService | TODAS | CRUD completo |
| TransactionService | months/{id}/transactions | CRUD + cálculos |
| IncomeService | incomeSources | CRUD + mensual |
| ExpenseService | expenses | CRUD + monthly |
| BudgetService | months/{id}/budgets | CRUD + summary |
| GoalService | goals | CRUD + contribuciones |
| ComparisonService | financialState | Lectura |
| AlertsService | expenses/budgets/goals/income | Lectura |
| ReportService | Todas | Lectura + export |
| OfflineSyncService | IndexedDB | Cache + sync |

---

## 🎯 ÍNDICES Y CONSULTAS COMUNES

```javascript
// Consultas frecuentes
users/{uid}/incomeSources        where isActive == true
users/{uid}/expenses            where status in [pending, partial]
users/{uid}/goals               where status == active orderBy priority
users/{uid}/months/{id}/transactions  orderBy date desc
users/{uid}/months/{id}/budgets       orderBy isPrimordial desc
```

---

**Última actualización**: Mayo 2026  
**Total colecciones**: 8 principales + subcolecciones
**Total documentos por usuario**: Hasta ~100+ (transacciones, expenses, goals, budgets, incomeSources)