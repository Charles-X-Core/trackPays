# 📊 Referencia Rápida - Estructura NoSQL (Firestore)

## Estructura de Colecciones (No Relacional)

```
track-pays (Firestore)
│
└── users/{userId}/
    │
    ├── profile/data
    │   └── (datos del usuario: email, edad, empleo, moneda)
    │
    ├── incomeSources/{sourceId}
    │   └── (fuentes de ingreso: salary, freelance, etc)
    │       └── 🔗 1 usuario → N fuentes
    │
    ├── expenses/{expenseId}
    │   └── (gastos: primordial/no primordial)
    │       └── 🔗 1 usuario → N gastos
    │
    ├── goals/{goalId}
    │   └── (metas de ahorro)
    │       └── 🔗 1 usuario → N metas
    │
    └── months/{monthId}/          ← Formato: "2026-05"
        │
        ├── transactions/{txId}     ← 🔗 1 mes → N transacciones
        │
        ├── budgets/{category}     ← 🔗 1 mes → 1 por categoría
        │
        └── financialState         ← 🔗 1 mes → 1 documento
```

---

## Campos por Colección

### profile/data
- email, fullName, age, employmentType
- monthlyIncome, currency (PEN), locale (es-PE)
- initialBalance
- onboardingCompleted, onboardingVersion

### incomeSources
- type: salary | freelance | business | afp | rental | dividends | allowance | other
- name, amount, actualAmount
- frequency: weekly | biweekly | monthly
- paymentDayOfMonth
- isActive, isRecurring
- deductions (afpPercent, insurancePercent)

### expenses
- isPrimordial: true | false
- category: housing | utilities | transport | health | debt | groceries | education | ...
- subcategory, name, provider
- budgetedAmount, actualAmount
- dueDayOfMonth
- status: pending | partial | paid | overdue | cancelled
- isRecurring, frequency
- isSubscription, isVariable

### goals
- name, description, category
- targetAmount, currentAmount
- monthlyContribution
- monthsToGoal, projectedCompletionDate
- priority: high | medium | low
- status: active | completed | paused | cancelled
- contributions[]

### months/{monthId}
- id (YYYY-MM), year, month, status

### transactions
- type: income | expense
- amount (+ ingreso, - gasto)
- description, date, category
- ruleType: need | want | saving | income

### budgets
- category, categoryName, isPrimordial
- budgetedAmount, actualAmount, remainingAmount
- percentageUsed, status: on_track | at_risk | exceeded | unused
- alertThreshold (default: 80)
- history[]

### financialState
- income, incomeBudgeted, expenses
- balance, savings, savingsRate
- financialScore (0-100)
- healthStatus: excellent | good | warning | critical
- rule50320: { need, want, saving }

---

## Jerarquía de Acceso (NoSQL)

```
users/{userId}/                    ← Colección raíz
  └── incomeSources/               ← Subcolección
  └── expenses/                   ← Subcolección
  └── goals/                      ← Subcolección
  └── months/{monthId}/           ← Subcolección
       └── transactions/           ← Sub-subcolección
       └── budgets/               ← Sub-subcolección
       └── financialState         ← Documento (no subcolección)
```

**Nota**: En NoSQL NO hay "relaciones" como en SQL. 
Las "relaciones" son solo jerarquía de acceso a subcolecciones.

---

## Ejemplo de Datos Reales

```
users/CFWogdbBvUTBLE5qSKLtB1l1wxT2/
├── profile/data
│   ├── email: "alonsopicho@gmail.com"
│   ├── currency: "PEN"
│   └── monthlyIncome: 1200
│
├── incomeSources/
│   ├── "sueldo"
│   │   ├── type: "salary"
│   │   ├── amount: 2500
│   │   └── paymentDayOfMonth: 5
│   └── "freelance"
│
├── expenses/
│   ├── "alquiler" (category: housing, isPrimordial: true, budgetedAmount: 1200)
│   ├── "netflix" (category: streaming, isPrimordial: false)
│   └── ...
│
├── goals/
│   └── "data" (name: "Fondo de Emergencia", targetAmount: 10000, currentAmount: 2500)
│
└── months/
    └── "2026-05"/
        ├── transactions/
        │   ├── "tx1": { amount: 2500, type: "income" }
        │   ├── "tx2": { amount: -1200, type: "expense" }
        │   └── ...
        ├── budgets/
        │   ├── "housing": { budgetedAmount: 1200, actualAmount: 1200, status: "on_track" }
        │   ├── "utilities": { budgetedAmount: 350, actualAmount: 245, status: "on_track" }
        │   └── ...
        └── financialState
            ├── income: 2900
            ├── expenses: 1885
            ├── balance: 1015
            ├── savingsRate: 35
            └── financialScore: 85
```

---

**Referencia rápida para desarrollo y debugging**