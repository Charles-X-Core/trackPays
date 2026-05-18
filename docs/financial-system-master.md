# Sistema Financiero Completo - Track Pays
## Documento Maestro v2.0 (Actualizado Mayo 2026)

---

## 1. Visión General

Track Pays es un **sistema operativo financiero personal** que proporciona:
- Vista completa de ingresos y gastos
- Flujo de caja mensual con proyecciones
- Alertas inteligentes de salud financiera
- Comparativas históricas con metas personalizadas
- Onboarding adaptativo según situación laboral

---

## 2. Estado de Implementación

| Sistema | Implementado | Estado |
|---------|--------------|--------|
| Months Structure | ✅ | COMPLETO |
| financialState pre-calculado | ✅ | COMPLETO |
| Ingresos múltiples con fechas | ✅ | COMPLETO |
| Gastos dual (primordial/no primordial) | ✅ | COMPLETO |
| Estados de pago | ✅ | COMPLETO |
| Flujo de caja | ✅ | COMPLETO |
| Onboarding adaptativo | ✅ | COMPLETO (backend) |
| Sistema extensible | ✅ | COMPLETO |
| Goals múltiples | ✅ | COMPLETO |
| Transaction CRUD (create/read/update/delete) | ✅ | COMPLETO |
| **Alertas centralizadas (AlertService)** | ✅ | **COMPLETO** |
| **Comparativas mensuales (ComparisonService)** | ✅ | **COMPLETO** |
| **Month Rollover automático** | ✅ | **COMPLETO** |
| **Reportes/Export (ReportService)** | ✅ | **COMPLETO** |
| **Offline sync (OfflineSyncService)** | ✅ | **COMPLETO** | |

---

## 3. Estructura Firestore Actual

```
users/{userId}/
├── profile/                          ✅ Onboarding data aquí
│   └── (age, employmentType, answers, initialBalance, etc.)
│
├── incomeSources/                    ✅ IMPLEMENTADO
│   └── {sourceId}/
│       ├── type, name, amount
│       ├── paymentDayOfMonth         ← Fechas de pago
│       ├── deductions                ← AFP, seguros
│       └── actualAmount, lastPaymentDate
│
├── expenses/                         ✅ IMPLEMENTADO (Sistema Dual)
│   └── {expenseId}/
│       ├── isPrimordial              ← Clasificación principal
│       ├── category                  ← Primordial/NonPrimordial
│       ├── subcategory               ←细分 (luz, agua, netflix)
│       ├── provider, debtDetails     ← Extensible
│       ├── serviceDetails            ← Extensible
│       ├── budgetedAmount            ← Presupuesto
│       ├── actualAmount              ← Real
│       ├── dueDayOfMonth             ← Fecha vencimiento
│       ├── status                    ← pending/partial/paid/overdue
│       ├── metadata                  ← Extensible
│       └── tags                      ← Organización
│
├── months/{year-month}/              ✅ IMPLEMENTADO
│   ├── transactions/                 ← Transacciones del mes
│   └── financialState/               ← Estado pre-calculado
│       ├── income, incomeBudgeted, incomeReceived, incomePending
│       ├── initialBalance, availableNow, expectedByEndOfMonth
│       ├── expenses, expensesBudgeted
│       ├── balance, budgetedBalance
│       ├── savings, savingsRate
│       ├── financialScore, healthStatus
│       └── rule50320 breakdown
│
├── categories/                       ✅ Básico
└── goals/                           ⚠️ Solo 1 meta
```

---

## 4. Sistemas Implementados

### 4.1 Ingresos (COMPLETO)

```
CARACTERÍSTICAS:
├── Múltiples fuentes de ingreso
├── Fecha de pago configurable (día del mes)
├── Deducciones automáticas (AFP, seguros)
├── Ingresos variables vs fijos
├── Initial balance (ahorros anteriores)
└── Comparación: presupuestado vs recibido

EJEMPLO:
{
  "salary": { amount: 2500, dayOfMonth: 15, deductions: { afp: 13% } },
  "freelance": { amount: 800, dayOfMonth: null },
  "initialBalance": 500
}

DISPONIBLE AHORA: S/ 3,000 (initial + received)
ESPERADO FIN DE MES: S/ 3,800 (initial + budgeted)
```

### 4.2 Gastos (COMPLETO - Sistema Dual)

```
CLASIFICACIÓN:
├── GASTOS PRIMORDIALES (esenciales)
│   ├── 🏠 Vivienda (alquiler/hipoteca)
│   ├── 💡 Servicios (luz, agua, internet, gas)
│   ├── 🚌 Transporte
│   ├── 🏥 Salud (EPS, seguros)
│   ├── 🏦 Deudas
│   ├── 🛒 Supermercado
│   └── 📚 Educación
│
└── GASTOS NO PRIMORDIALES (opcionales)
    ├── 🍔 Comida fuera
    ├── 🎬 Entretenimiento
    ├── 📺 Streaming
    ├── 🐕 Mascotas
    ├── 👕 Ropa
    └── ✈️ Viajes

ESTADOS DE PAGO:
├── pending    ← Por pagar
├── partial   ← Pagado parcialmente
├── paid      ← Pagado completo
├── overdue   ← Vencido
└── cancelled ← Cancelado

CAMPOS EXTENSIBLES:
├── providerDetails    ← Proveedor, contrato, plan
├── debtDetails       ← Tipo deuda, acreedor, tasa interés
├── serviceDetails    ← Tipo servicio, lecturas, consumo
├── metadata          ← Cualquier campo adicional
└── tags              ← Organización
```

### 4.3 Flujo de Caja (COMPLETO)

```
CÁLCULOS INCLUIDOS:
├── Ingreso presupuestado (total esperado)
├── Ingreso recibido hasta ahora
├── Ingreso pendiente
├── Balance inicial
├── Disponible ahora (inicial + recibido - gastos)
├── Balance presupuestado (esperado al final)
├── Balance real (disponible ahora - gastos)
└── Savings rate (% ahorrado)
```

### 4.4 Onboarding Adaptativo (COMPLETO - BACKEND)

```
SEGÚN TIPO DE EMPLEO:
├── employee        → Salary, deducciones, beneficios
├── freelancer      → Ingreso promedio, clientes, frecuencia
├── business_owner  → Ingresos del negocio, ganancias
├── retired         → Pensión, AFP
├── student         → Mesada, beca, trabajo parcial
├── unemployed      → Ahorros, apoyo familiar
└── other           → Otro tipo de ingreso

PREGUNTAS COMUNES:
├── Edad
├── Metas financieras
├── Inversiones actuales
└── Prioridad financiera
```

---

## 5. Próximos Pasos (Roadmap)

### Alta Prioridad:
1. Goals múltiples
2. Budgets por categoría (presupuesto vs real)
3. Alertas activas automáticas

### Media Prioridad:
4. Comparativas mensuales (este vs anterior)
5. Calendario de pagos próximos
6. Recordatorios de vencimiento

### Baja Prioridad:
7. Analytics persistidos
8. Insights automáticos
9. Detección de transacciones recurrentes
10. OCR de recibos
11. Open Banking

---

## 6. Cómo Expandir el Sistema

**El sistema es extensible** - ver `docs/expansion-guide.md` para:
- Agregar nuevas categorías sin romper
- Agregar detalles a proveedores/deudas/servicios
- Agregar metadatos personalizados

---

## 7. Modelos de Datos

### Modelos principales:
- `Transaction` - Transacciones financieras
- `IncomeSource` - Fuentes de ingreso con fechas
- `Expense` - Gastos con clasificación dual
- `SavingGoal` - Metas de ahorro
- `OnboardingResponse` - Respuestas de onboarding

### Servicios principales:
- `FirebaseService` - Conexión Firestore
- `TransactionService` - Transacciones (CRUD completo)
- `IncomeService` - Ingresos múltiples con fechas
- `ExpenseService` - Sistema dual de gastos
- `BudgetService` - Presupuestos por categoría
- `GoalService` - Metas de ahorro múltiples
- `ComparisonService` - Comparativas mensuales
- `AlertsService` - Alertas centralizadas
- `MonthRolloverService` - Gestión automática de meses
- `ReportService` - Exportación de datos
- `OfflineSyncService` - Sincronización offline
- `OnboardingService` - Onboarding adaptativo
- `AuthService` - Autenticación

---

## 8. Servicios Backend Agregados (v2.1)

### 8.1 ComparisonService
**Ubicación**: `src/app/core/services/comparison.ts`

Servicio para comparar datos financieros entre meses.

```typescript
// Obtener comparación mes actual vs anterior
const comparison = await comparisonService.getMonthComparison(2026, 5);
// Returns: { currentMonth, previousMonth, income, expenses, balance, savings, byCategory, healthComparison }

// Obtener tendencia de últimos 3 meses
const trend = await comparisonService.getTrendSummary(2026, 5, 3);
// Returns: { months[], averageIncome, averageExpenses, averageSavings, incomeTrend, expenseTrend }
```

### 8.2 AlertsService
**Ubicación**: `src/app/core/services/alerts.ts`

Servicio centralizado de alertas financieras.

```typescript
// Obtener todas las alertas del mes
const alerts = await alertsService.getAllAlerts(2026, 5);
// Returns: Alert[] con type, severity, title, message

// Resumen de alertas por severidad
const summary = await alertsService.getAlertSummary(2026, 5);
// Returns: { total, critical, high, medium, low }
```

**Tipos de alertas**:
- `overdue_expense` - Gasto vencido
- `budget_exceeded` - Presupuesto excedido
- `budget_at_risk` - Presupuesto en riesgo
- `income_pending` - Ingreso pendiente
- `income_overdue` - Ingreso vencido
- `goal_behind_schedule` - Meta atrasada
- `high_spending_category` - Categoría de alto gasto
- `low_savings_rate` - Tasa de ahorro baja

### 8.3 MonthRolloverService
**Ubicación**: `src/app/core/services/month-rollover.service.ts`

Servicio para gestión automática de meses.

```typescript
// Verificar/crear mes actual
const result = await rolloverService.checkAndRollover();

// Hacer rollover a un mes específico
const rollover = await rolloverService.rolloverToNewMonth(2026, 6);
// Returns: { success, previousMonth, newMonth, budgetsCopied, expensesCopied, recurringGenerated }

// Obtener todos los meses del usuario
const months = await rolloverService.getUserMonths();
```

### 8.4 TransactionService (Actualizado)
**Ubicación**: `src/app/core/services/transaction.ts`

CRUD completo de transacciones.

```typescript
// Create
const tx = await transactionService.create(payload);

// Read
const txs = await transactionService.getByMonth(2026, 5);

// Update
const updated = await transactionService.update(id, payload);

// Delete
await transactionService.delete(id);
```

### 8.5 ReportService
**Ubicación**: `src/app/core/services/report.service.ts`

Servicio de reportes y exportación de datos.

```typescript
// Generar reporte de transacciones
const report = await reportService.generateReport({
  type: 'transactions',
  format: 'csv',
  year: 2026,
  month: 5
});

// Exportar a CSV
await reportService.exportTransactionsCSV(2026, 5);

// Exportar reporte completo JSON
await reportService.exportFullReportJSON(2026, 5);

// Descargar archivo
reportService.downloadReport(report);
```

**Tipos de reporte**: `transactions`, `income`, `expenses`, `budgets`, `goals`, `full`
**Formatos**: `csv`, `json`, `pdf`

### 8.6 OfflineSyncService
**Ubicación**: `src/app/core/services/offline-sync.service.ts`

Servicio de sincronización offline con IndexedDB.

```typescript
// Sincronizar desde Firebase al cache local
await offlineService.syncFromFirebase(2026, 5);

// Obtener datos (usa cache si está disponible, fallback a Firebase)
const transactions = await offlineService.getDataWithFallback('transactions', 2026, 5);

// Estado de sincronización
const status = offlineService.getStatus();
// Returns: { lastSynced, pendingChanges, isOnline, isSyncing }

// Sincronizar cambios pendientes
const result = await offlineService.syncPendingChanges();
// Returns: { synced: number, failed: number }

// Limpiar cache
await offlineService.clearCache();
```

**Características**:
- Cache local con IndexedDB
- Sincronización automática cuando vuelve a estar online
- Cola de cambios pendientes para offline
- Fallback a Firebase cuando hay conexión

---

**Última actualización**: Mayo 2026  
**Estado**: 100% del sistema completo implementado ✅