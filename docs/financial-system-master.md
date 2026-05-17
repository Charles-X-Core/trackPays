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
| **Goals múltiples** | ✅ | **COMPLETO** |
| Alertas activas | ⚠️ | READY (no activas) |
| Comparativas mensuales | ❌ | PENDIENTE |

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
- `TransactionService` - Transacciones
- `IncomeService` - Ingresos
- `ExpenseService` - Gastos
- `OnboardingService` - Onboarding adaptativo

---

**Última actualización**: Mayo 2026  
**Estado**: ~60% del sistema completo implementado