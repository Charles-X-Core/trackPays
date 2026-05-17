# Sistema Financiero Completo - Track Pays
## Documento Maestro v1.0

---

## 1. Visión General

Track Pays no es solo un registrador de gastos - es un **sistema de gestión financiera personal** que proporciona:
- Vista completa de ingresos y gastos
- Flujo de caja mensual con proyecciones
- Alertas inteligentes de salud financiera
- Comparativas históricas con metas personalizadas
- Adaptación según edad y situación del usuario

---

## 2. Estructura Principal

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DASHBOARD FINANCIERO                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│   │   INGRESOS       │  │    GASTOS        │  │    FLUJO DE CAJA  │    │
│   │   (Inflow)       │  │    (Outflow)     │  │   (Surplus/Def)   │    │
│   └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘    │
│            │                      │                      │             │
│   ┌────────┴─────────┐  ┌────────┴─────────┐  ┌────────┴─────────┐    │
│   │ • Salary         │  │ • Primordiales   │  │ Budget vs Actual │    │
│   │ • Freelance      │  │ • No Primord.    │  │ Month Comparison │    │
│   │ • Business       │  │ • Ahorro         │  │ Projections      │    │
│   │ • AFP            │  │                  │  │                  │    │
│   │ • Others         │  │                  │  │                  │    │
│   └──────────────────┘  └──────────────────┘  └──────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Perfil del Usuario

### 3.1 Datos Básicos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `userId` | string | ID único del usuario |
| `age` | number | Edad (15+) - determina funcionalidades |
| `displayName` | string | Nombre personalizado |
| `currency` | string | Moneda (default: PEN) |
| `onboardingCompleted` | boolean | Si completó el onboarding |

### 3.2 Restricciones por Edad

```
┌─────────────────────────────────────────────────────────────────┐
│                     RESTRICCIONES POR EDAD                       │
├──────────┬──────────────────────────────────────────────────────┤
│  15-17   │ Sin AFP, sin deudas, sin inversiones, sin tarjetas │
│          │ Solo: mesada, gastos personales, ahorro simple      │
├──────────┼──────────────────────────────────────────────────────┤
│  18-23   │ AFP desde 18, inversiones parciales, préstamos     │
│          │ con restricciones                                     │
├──────────┼──────────────────────────────────────────────────────┤
│  24+     │ Acceso completo a todas las funcionalidades        │
└──────────┴──────────────────────────────────────────────────────┘
```

---

## 4. Sistema de Ingresos

### 4.1 Tipos de Ingreso

```
┌─────────────────────────────────────────────────────────────────┐
│                    TIPOS DE INGRESO                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ [💼] SUELDO / SALARIO                                            │
│     ├── Monto fijo mensual                                      │
│     ├── Fecha de pago                                           │
│     ├── Deducciones automáticas:                                │
│     │   ├── AFP (ej: 13%)                                       │
│     │   ├── Seguro (ej: 4%)                                     │
│     │   └── Otros descuentos                                    │
│     └── Historial por mes                                       │
│                                                                  │
│ [💻] FREELANCE / INDEPENDIENTE                                   │
│     ├── Ingreso variable                                        │
│     ├── Frecuencia: semanal/quincenal/mensual                  │
│     └── Promedio automático (basado en historial)              │
│                                                                  │
│ [🏪] NEGOCIO PROPIO                                             │
│     ├── Ingreso variable                                        │
│     ├── Categoría del negocio                                   │
│     └── Promedio mensual                                        │
│                                                                  │
│ [📊] AFP / PENSION                                              │
│     ├── Monto de jubilación                                     │
│     └── Fecha de cobro                                          │
│                                                                  │
│ [💰] OTROS INGRESOS                                             │
│     ├── Alquiler (si es arrendador)                            │
│     ├── Dividendos                                              │
│     ├── Venta de bienes                                         │
│     ├── Regalos / Herencia                                      │
│     └── Otros                                                   │
│                                                                  │
│ [💵] BALANCE INICIAL                                            │
│     └── Ahorros acumulados / capital inicial                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Modelo de Ingreso

```typescript
interface IncomeSource {
  id: string;
  userId: string;
  
  // Tipo de ingreso
  type: 'salary' | 'freelance' | 'business' | 'afp' | 'rental' | 'dividends' | 'other';
  name: string; // "Sueldo empresa X", "Freelance diseño", "Alquiler de departamento"
  
  // Monto
  amount: number; // Monto estimado/presupuestado
  actualAmount?: number; // Monto real del mes
  
  // Frecuencia
  frequency: 'weekly' | 'biweekly' | 'monthly';
  
  // Fecha
  paymentDayOfMonth?: number; // Día de pago (ej: 15)
  paymentDate?: string; // Fecha específica
  
  // Deducciones (para salary)
  deductions?: {
    afpPercent?: number;      // ej: 13%
    insurancePercent?: number; // ej: 4%
    otherDeductions?: { name: string; percent: number; amount: number }[];
  };
  
  // Estado
  isActive: boolean;
  startDate: string;
  endDate?: string;
  
  // Historial
  history: MonthlyAmount[]; // últimos 12 meses
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface MonthlyAmount {
  month: string; // "2026-05"
  budgeted: number;
  actual: number;
}
```

### 4.3 Cálculo de Ingresos

```
┌─────────────────────────────────────────────────────────────────┐
│                  CÁLCULO DE INGRESOS TOTALES                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ INGRESO TOTAL (Presupuestado) =                                 │
│ ├── Sueldo (presupuestado)           S/ 2,500                  │
│ ├── Freelance (promedio)             S/ 800                   │
│ ├── AFP                              S/ 450                   │
│ ├── Otros                            S/ 200                   │
│ └── Balance Inicial                  S/ 500                   │
│                                             ─────────          │
│ TOTAL PRESUPUESTO                      S/ 4,450                │
│                                                                  │
│ INGRESO TOTAL (Actual) =                                         │
│ ├── Sueldo (real)                   S/ 2,350 (deducciones)    │
│ ├── Freelance (real)                 S/ 920                   │
│ ├── AFP (real)                       S/ 450                   │
│ ├── Otros (real)                     S/ 150                   │
│ └── Balance Inicial                  S/ 500                   │
│                                             ─────────          │
│ TOTAL ACTUAL                           S/ 4,370                │
│                                                                  │
│ DIFERENCIA:                            S/ 80 (menos)           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Sistema de Gastos - Estructura Dual

### 5.1 Gastos Primordiales (Esenciales)

```
┌─────────────────────────────────────────────────────────────────┐
│              GASTOS PRIMORDIALES (Esenciales)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ DEFINICIÓN: Gastos que NO puedes evitar, necesarios para        │
│ vivir y funcionar.                                              │
│                                                                  │
│ CATEGORÍAS:                                                     │
│ ├── 🏠 VIVIENDA                                                 │
│ │   ├── Alquiler / Hipoteca                                    │
│ │   ├── Mantenimiento                                          │
│ │   └── Impuesto predial                                       │
│ │                                                                  │
│ ├── 💡 SERVICIOS                                                │
│ │   ├── Electricidad                                           │
│ │   ├── Agua                                                   │
│ │   ├── Internet                                               │
│ │   ├── Gas                                                    │
│ │   ├── Teléfono / Cellular                                    │
│ │   └── Televisión por cable                                   │
│ │                                                                  │
│ ├── 🚌 TRANSPORTE                                              │
│ │   ├── Pasajes / Movilidad                                    │
│ │   ├── Gasolina                                               │
│ │   ├── Peajes                                                  │
│ │   ├── Mantenimiento vehicular                                │
│ │   └── Parking                                                │
│ │                                                                  │
│ ├── 🏥 SALUD                                                    │
│ │   ├── EPS / Seguro de salud                                 │
│ │   ├── Seguro vehicular                                       │
│ │   ├── Seguro de vida                                        │
│ │   ├── Medicamentos                                           │
│ │   └── Emergencias                                            │
│ │                                                                  │
│ ├── 🏦 DEUDAS / CRÉDITOS                                        │
│ │   ├── Préstamo personal                                      │
│ │   ├── Tarjeta de crédito (mínimo)                           │
│ │   ├── Crédito vehicular                                      │
│ │   └── Crédito hipotecario                                    │
│ │                                                                  │
│ ├── 🛒 SUPERMERCADO / COMIDA EN CASA                            │
│ │   └── Alimentación básica                                   │
│ │                                                                  │
│ ├── 📚 EDUCACIÓN                                               │
│ │   ├── Colegiatura                                           │
│ │   ├── Universidad                                           │
│ │   ├── Cursos / Capacitación                                  │
│ │   └── Materiales                                            │
│ │                                                                  │
│ └── [OTROS] Personalizables                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Gastos No Primordiales (No Esenciales)

```
┌─────────────────────────────────────────────────────────────────┐
│            GASTOS NO PRIMORDIALES (No Esenciales)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ DEFINICIÓN: Gastos que puedes reducir, eliminar o postergar     │
│ si es necesario. Son deseos y lifestyle.                        │
│                                                                  │
│ CATEGORÍAS:                                                     │
│ ├── 🍔 COMIDA FUERA / RESTAURANTES                              │
 │   ├── Fast food (KFC, Bembos, McDonald's)                     │
 │   ├── Delivery apps (PedidosYa, Rappi)                        │
 │   ├── Restaurantes                                             │
 │   └── Cafeterías                                               │
 │                                                                  │
│ ├── 🎬 ENTRETENIMIENTO                                          │
 │   ├── Cine                                                     │
 │   ├── Bars / Discotecas                                        │
 │   ├── Eventos / Conciertos                                     │
 │   └── Juegos                                                   │
 │                                                                  │
│ ├── 📺 STREAMING / SUSCRIPCIONES                                │
 │   ├── Netflix                                                  │
 │   ├── Spotify                                                  │
 │   ├── Disney+                                                  │
 │   ├── Amazon Prime                                             │
 │   ├── YouTube Premium                                          │
 │   ├── Apple TV                                                  │
 │   └── [Otros]                                                  │
 │                                                                  │
│ ├── 🐕 MASCOTAS                                                  │
 │   ├── Comida para mascotas                                     │
 │   ├── Veterinarios                                             │
 │   ├── Estética / Peluquería                                    │
 │   └── Juguetes / Accesorios                                    │
 │                                                                  │
│ ├── 👕 ROPA Y ACCESORIOS                                        │
 │   ├── Ropa                                                     │
 │   ├── Calzado                                                   │
 │   └── Accesorios                                               │
 │                                                                  │
│ ├── ✈️ VIAJES Y VACACIONES                                      │
 │   ├── Hospedaje                                                │
 │   ├── Pasajes aéreos                                           │
 │   └── Actividades                                              │
 │                                                                  │
│ └── [OTROS] Personalizables                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Modelo de Gasto

```typescript
interface Expense {
  id: string;
  userId: string;
  
  // Clasificación
  isPrimordial: boolean; // true = esencial, false = no esencial
  category: string; // "vivienda", "servicios", "comida fuera", etc.
  subcategory?: string; // "luz", "agua", "netflix", etc.
  
  // Información básica
  name: string; // "Netflix", "Alquiler", "Pasajes"
  provider?: string; // "Netflix", "EDEGEL", "BCP"
  
  // Fechas y plazos
  dueDayOfMonth: number; // Día de vencimiento (ej: 15)
  optimalPaymentDay?: number; // Día óptimo para pagar (calculado)
  startDate: string;
  endDate?: string;
  
  // Estados posibles: pending | partial | paid | overdue | cancelled
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  
  // Presupuesto vs Actual
  budgetedAmount: number; // Lo que planeaste pagar
  actualAmount: number; // Lo que realmente pagaste
  
  // Historial
  history: ExpenseHistory[];
  
  // Para suscripciones
  isSubscription?: boolean;
  subscriptionPrice?: number;
  subscriptionPeriod?: 'monthly' | 'yearly' | 'weekly';
  lastPrice?: number; // Para detectar cambios
  priceChangeAlert?: boolean;
  
  // Para gastos variables (ej: luz)
  isVariable?: boolean; // Si el monto varía cada mes
  averageAmount?: number; // Promedio histórico
  lastMonthAmount?: number; // Del mes anterior
  dangerThreshold?: number; // Alertar si supera X%
  
  // Notas
  notes?: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface ExpenseHistory {
  month: string; // "2026-05"
  budgeted: number;
  actual: number;
  paidOn?: string;
  wasOverdue?: boolean;
  notes?: string;
}
```

---

## 6. Sistema de Ahorro e Inversiones

```
┌─────────────────────────────────────────────────────────────────┐
│                 AHORRO E INVERSIONES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ [🐷] FONDO DE EMERGENCIA                                        │
│     ├── Propósito: reserva para imprevistos                     │
│     ├── Meta: 3-6 meses de gastos esenciales                    │
│     └── Recomendación: S/ 1,500 - S/ 5,000                      │
│                                                                  │
│ [📊] AFP / PENSIÓN                                              │
│     ├── Tipo: Fondo de pensiones                                │
│     ├── Aportación mensual                                      │
│     └── Rentabilidad acumulada                                  │
│                                                                  │
│ [📈] INVERSIONES                                                │
│     ├── Fondos mutuos                                           │
│     ├── Depósito a plazo                                        │
│     ├── Bolsa de valores                                        │
│     ├── Criptomonedas                                           │
│     └── Bienes raíces                                           │
│                                                                  │
│ [🎯] METAS DE AHORRO                                            │
│     ├── Viaje a Cusco (S/ 2,000 - Dic 2026)                    │
│     ├── Computadora (S/ 2,500 - Ene 2027)                       │
│     ├── Auto (S/ 15,000 - 2028)                                 │
│     └── Casa (S/ 50,000 - 2030)                                 │
│                                                                  │
│ [💎] OTROS                                                      │
│     ├── Préstamos a terceros                                     │
│     └── Otros                                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Sistema de Fechas y Plazos

### 7.1 Cálculo de Fecha Óptima

```
┌─────────────────────────────────────────────────────────────────┐
│              SISTEMA DE FECHA ÓPTIMA                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ALGORITMO:                                                      │
│                                                                  │
│ 1. Obtener fecha de ingreso (ej: 15 de cada mes)              │
│                                                                  │
│ 2. Obtener fecha de vencimiento del gasto (ej: 20)            │
│                                                                  │
│ 3. Calcular días de diferencia:                                 │
│    └── 20 - 15 = 5 días de margen                              │
│                                                                  │
│ 4. Si el margen es suficiente (>3 días):                      │
│    └── Optimal day = fecha de vencimiento                      │
│                                                                  │
│ 5. Si el margen es corto (<3 días):                             │
│    └── Optimal day = fecha de ingreso                           │
│                                                                  │
│ 6. Si fecha de ingreso > vencimiento:                           │
│    └── ALERTA: pagar antes del ingreso para evitar deuda       │
│                                                                  │
│ EJEMPLO:                                                        │
│ ════════════════════════════════════════════════════════════   │
│                                                                  │
│ Ingreso: 30 de cada mes                                         │
│ Gasto: luz - vence el 15                                        │
│                                                                  │
│ → 15 - 30 = -15 días (problema!)                               │
│ → ALERTA: "Tu luz vence el 15, pero cobras el 30"              │
│ → RECOMENDACIÓN: pagar el 28 del mes anterior                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Estados de Pago

```
┌─────────────────────────────────────────────────────────────────┐
│                    ESTADOS DE PAGO                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────┐   Ejemplo: Alquiler S/ 800                      │
│ │  PENDING    │   Budget: S/ 800, Paid: S/ 0                    │
│ │  (Pendiente)│   → Estado: pending                             │
│ └──────┬──────┘                                                │
│        │                                                       │
│        ↓ Si pagó solo parte                                    │
│ ┌─────────────┐   Ejemplo: Pagó S/ 400                          │
│ │  PARTIAL    │   Budget: S/ 800, Paid: S/ 400 (50%)           │
│ │  (Parcial)  │   → Estado: partial                              │
│ └──────┬──────┘   → Puede: "Pagar resto"                       │
│        │                                                       │
│        ↓ Si pagó completo                                      │
│ ┌─────────────┐   Ejemplo: Pagó S/ 800                          │
│ │   PAID      │   Budget: S/ 800, Paid: S/ 800 (100%)          │
│ │  (Pagado)   │   → Estado: paid                                 │
│ └──────┬──────┘   → Listo para el siguiente mes                │
│        │                                                       │
│        ↓ Si pasó la fecha sin pagar                            │
│ ┌─────────────┐   Ejemplo: Hoy es 25, vencimiento era 15        │
│ │  OVERDUE    │   → Estado: overdue                             │
│ │  (Vencido)  │   → ALERTA CRÍTICA                              │
│ └──────┬──────┘   → Puede: "Pagar ahora" + intereses           │
│        │                                                       │
│        ↓ Si el usuario cancela                                 │
│ ┌─────────────┐   Ejemplo: Canceló Netflix                      │
│ │ CANCELLED  │   → Estado: cancelled                            │
│ │(Cancelado) │   → Ya no se cobra, no aparece en presupuesto   │
│ └─────────────┘                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Sistema de Alertas

### 8.1 Tipos de Alertas

```
┌─────────────────────────────────────────────────────────────────┐
│                    TIPOS DE ALERTAS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ⚠️ ALERTA DE PRESUPUESTO EXCEDIDO                              │
│    ├── Qué: Gasto actual > presupuesto                         │
│    ├── Ejemplo: "Luz: Presupuestado S/ 120, pagaste S/ 180"    │
│    └── severity: warning                                        │
│                                                                  │
│ 🔴 ALERTA DE GASTO CRÍTICO                                     │
│    ├── Qué: Gasto variable subió más de X% vs promedio         │
│    ├── Ejemplo: "Luz subió 60% vs promedio (S/ 80 → S/ 128)"  │
│    └── severity: critical                                      │
│                                                                  │
│ 🚨 ALERTA DE PAGO VENCIDO                                      │
│    ├── Qué: Pasó la fecha de vencimiento sin pagar             │
│    ├── Ejemplo: "Alquiler vence el 15, hoy es 25"              │
│    └── severity: critical                                      │
│                                                                  │
│ 💰 ALERTA DE CAMBIO DE PRECIO                                  │
│    ├── Qué: Suscripción cambió de precio                       │
│    ├── Ejemplo: "Netflix ahora es S/ 35 (era S/ 29)"          │
│    └── severity: info                                          │
│                                                                  │
│ 📊 ALERTA DE SALUD FINANCIERA                                  │
│    ├── Qué: Ahorro bajo, gastos altos, tendencia negativa      │
│    ├── Ejemplo: "Tu ahorro cayó 40% vs mes anterior"          │
│    └── severity: warning                                       │
│                                                                  │
│ ✅ ALERTA DE META CUMPLIDA                                     │
│    ├── Qué: Alcanzaste una meta de ahorro                     │
│    ├── Ejemplo: "Fondo de emergencia: 100% completado"        │
│    └── severity: success                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Lógica de Comparación

```
┌─────────────────────────────────────────────────────────────────┐
│              COMPARACIONES Y METAS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 1. GASTOS PRIMORDIALES                                         │
│ ═══════════════════════════════════════════════════════════   │
│                                                                  │
│ Meta: REDUCIR vs mes anterior                                  │
│                                                                  │
│ Ejemplo:                                                       │
│ - Mes anterior: S/ 2,350                                       │
│ - Este mes: S/ 2,200                                           │
│ - Resultado: ✅ META CUMPLIDA (-S/ 150)                        │
│                                                                  │
│ - Mes anterior: S/ 2,350                                       │
│ - Este mes: S/ 2,500                                           │
│ - Resultado: ⚠️ META NO CUMPLIDA (+S/ 150)                    │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 2. GASTOS NO PRIMORDIALES                                      │
│ ═══════════════════════════════════════════════════════════   │
│                                                                  │
│ Meta: REDUCIR vs mes anterior (aún más flexible)             │
│                                                                  │
│ Ejemplo:                                                       │
│ - Mes anterior: S/ 920                                         │
│ - Este mes: S/ 800                                             │
│ - Resultado: ✅ META CUMPLIDA (-S/ 120)                       │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 3. AHORRO E INVERSIONES                                        │
│ ═══════════════════════════════════════════════════════════   │
│                                                                  │
│ Meta: AUMENTAR vs promedio histórico                           │
│                                                                  │
│ Ejemplo:                                                       │
│ - Promedio últimos 6 meses: S/ 350                             │
│ - Este mes: S/ 400                                             │
│ - Resultado: ✅ META CUMPLIDA (+S/ 50 sobre promedio)         │
│                                                                  │
│ - Promedio últimos 6 meses: S/ 350                             │
│ - Este mes: S/ 200                                             │
│ - Resultado: ⚠️ META NO CUMPLIDA (-S/ 150)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Flujo de Caja (Cash Flow)

### 9.1 Estructura Completa

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE CAJA MENSUAL                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ═══════════════════════════════════════════════════════════   │
│                         ENTRADAS                                │
│ ═══════════════════════════════════════════════════════════   │
│                                                                  │
│ ┌─────────────────────────┐  ┌────────────────────────────────┐│
│ │ INGRESOS PRESUPUESTADO  │  │ INGRESOS REALES               ││
│ ├─────────────────────────┤  ├────────────────────────────────┤│
│ │ Sueldo          S/2,500 │  │ Sueldo (neto)      S/2,350    ││
│ │ Freelance       S/  800 │  │ Freelance          S/  920    ││
│ │ AFP             S/  450 │  │ AFP                S/  450    ││
│ │ Otros           S/  200 │  │ Otros              S/  150    ││
│ │ Balance inicial S/  500 │  │ Balance inicial   S/  500    ││
│ ├─────────────────────────┤  ├────────────────────────────────┤│
│ │ TOTAL PRESUPUESTO       │  │ TOTAL REAL                   ││
│ │         S/ 4,450        │  │         S/ 4,370              ││
│ └─────────────────────────┘  └────────────────────────────────┘│
│                                                                  │
│ ═══════════════════════════════════════════════════════════   │
│                         SALIDAS                                 │
│ ═══════════════════════════════════════════════════════════   │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │                 GASTOS PRESUPUESTADOS                        ││
│ ├─────────────────────┬─────────────────┬─────────────────────┤│
│ │ Primordiales       │ No Primordiales │ Ahorro              ││
│ │ ─────────────────── │ ─────────────── │ ────────────────── ││
│ │ Alquiler    S/800  │ Comida S/300    │ Fondo S/500        ││
│ │ Servicios   S/400  │ Streaming S/120 │ AFP    S/150       ││
│ │ Transporte  S/350   │ Entret. S/150   │ Metas  S/200       ││
│ │ Salud       S/250   │ Otros   S/350   │                     ││
│ │ Deudas      S/500   │                 │                     ││
│ │ Supermerc. S/600    │                 │                     ││
│ │ Educación  S/450    │                 │                     ││
│ ├─────────────────────┼─────────────────┼─────────────────────┤│
│ │ S/ 3,350            │ S/ 920           │ S/ 850              ││
│ └─────────────────────┴─────────────────┴─────────────────────┘│
│                                                                  │
│ GASTO TOTAL PRESUPUESTADO = S/ 5,120 (S/ 3,350 + S/ 920 + S/ 850)│
│                                                                  │
│ ═══════════════════════════════════════════════════════════   │
│                         RESULTADO                               │
│ ═══════════════════════════════════════════════════════════   │
│                                                                  │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │                 RESUMEN DE CAJA                            │  │
│ │                                                           │  │
│ │ Ingreso Presupuestado:         S/ 4,450                   │  │
│ │ Gasto Presupuestado:          S/ 5,120                    │  │
│ │ ─────────────────────────────────────────────────────────  │  │
│ │ SOBRANTE PRESUPUESTADO:        S/ -670 (DEFICIT)          │  │
│ │                                                           │  │
│ │ Ingreso Real:                 S/ 4,370                    │  │
│ │ Gasto Real:                  S/ 4,950                    │  │
│ │ ─────────────────────────────────────────────────────────  │  │
│ │ SOBRANTE REAL:                S/ -580 (DEFICIT)          │  │
│ │                                                           │  │
│ │ Diferencia:                   S/ 90 (mejor de lo esperado)│
│ │                                                           │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Comparativa Mensual

```
┌─────────────────────────────────────────────────────────────────┐
│                 COMPARATIVA MENSUAL                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│         │  Abril   │  Mayo    │  Junio   │  Cambio    │ Meta  │
│ ────────┼──────────┼──────────┼──────────┼────────────┼───────│
│ INGRESOS│ S/ 4,200 │ S/ 4,450 │ S/ 4,370 │    +4%    │  ↑↑   │
│ ────────┼──────────┼──────────┼──────────┼────────────┼───────│
│ PRIMO.  │ S/ 3,100 │ S/ 3,350 │ S/ 3,280 │    +6%    │  ↓    │
│ ────────┼──────────┼──────────┼──────────┼────────────┼───────│
│ NO PRIMO│ S/  850  │ S/  920  │ S/  880  │    +4%    │  ↓    │
│ ────────┼──────────┼──────────┼──────────┼────────────┼───────│
│ AHORRO  │ S/  300  │ S/  350  │ S/  400  │   +33%    │  ↑↑   │
│ ────────┼──────────┼──────────┼──────────┼────────────┼───────│
│ SOBRANT │ S/  -50  │ S/ -170  │ S/ -190  │   -280%   │  ↓↓   │
│ ────────┼──────────┼──────────┼──────────┼────────────┼───────│
│                                                                  │
│ METAS:                                                          │
│ ✅ INGRESOS: Aumentó vs mes anterior                           │
│ ⚠️ PRIMORDIALES: Aumentó (meta era reducir)                    │
│ ⚠️ NO PRIMORD.: Aumentó (meta era reducir)                    │
│ ✅ AHORRO: Aumentó significativamente (meta cumplida)          │
│ 🔴 SOBRANTE: Negativo y decreasing (atención)                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Vista de Dashboard Visual

```
┌────────────────────────────────────────────────────────────────────────┐
│                     DASHBOARD TRACK PAYS                               │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   Mayo 2026                        💰 S/ -580 (Deficit)             │
│                                                                        │
│   ┌──────────────────────────────────────────────────────────────────┐│
│   │  RESUMEN DEL MES                                                ││
│   │  ─────────────────────────────────────────────────────────────  ││
│   │                                                                   ││
│   │  Ingresos:      S/ 4,370    ████████████████████ 100%          ││
│   │  Primordiales:  S/ 3,280    ██████████████████   75%           ││
│   │  No Primord.:   S/   880    ██████                 20%          ││
│   │  Ahorro:        S/   400    ████                   9%             ││
│   │                                                                  ││
│   │  ⚠️ Sobrante: S/ -580 (Necesitas reducir gastos en S/ 580)     ││
│   └──────────────────────────────────────────────────────────────────┘│
│                                                                        │
│   ┌─────────────────────┐  ┌─────────────────────┐                  │
│   │   GASTOS ACTUALES    │  │   ALERTAS            │                  │
│   │   ───────────────    │  │   ────────────       │                  │
│   │                      │  │   🔴 luz: +60%       │                  │
│   │   Primord: S/ 3,280  │  │   ⚠️ Netflix: precio │                  │
│   │   No Primo: S/   880 │  │      cambió           │                  │
│   │   Meta: -S/ 200      │  │   ⚠️ Sobre presupuesto│                  │
│   │                      │  │      S/ 670          │                  │
│   └─────────────────────┘  └─────────────────────┘                  │
│                                                                        │
│   ┌──────────────────────────────────────────────────────────────────┐│
│   │  PRÓXIMOS PAGOS                                                 ││
│   │  ─────────────────                                               ││
│   │  📅 Hoy: -                                                       ││
│   │  📅 Mañana: Netflix S/ 35                                       ││
│   │  📅 15: Alquiler S/ 800 (⚠️ antes del ingreso)                  ││
│   │  📅 20: Luz (variable - promedio S/ 80)                         ││
│   └──────────────────────────────────────────────────────────────────┘│
│                                                                        │
│   ┌──────────────────────────────────────────────────────────────────┐│
│   │  METAS                                                          ││
│   │  ─────                                                          ││
│   │  🐷 Fondo emergencia: S/ 500 / S/ 2,000 (25%)                  ││
│   │  🎯 Viaje Cusco: S/ 200 / S/ 2,000 (10%)                       ││
│   │  📊 AFP: S/ 150 / mes                                            ││
│   └──────────────────────────────────────────────────────────────────┘│
│                                                                        │
│   [+ Añadir Gasto]  [+ Añadir Ingreso]  [Ver Flujo Completo]         │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Prioridad de Implementación

### Fase 2.1 (Inmediata)
1. ✅ Perfil de usuario con edad
2. ✅ Sistema de ingresos múltiples
3. ✅ Gastos primordiales vs no primordiales
4. ✅ Estados: pending, partial, paid, overdue, cancelled
5. ✅ Fechas de vencimiento y calendario

### Fase 2.2 (Siguiente)
1. Sistema de alertas automáticas
2. Comparativas vs mes anterior
3. Metas de reducción/aumento
4. Flujo de caja completo

### Fase 3 (Futuro)
1. Detección de cambio de precios
2. Predicción de gastos variables
3. OCR de recibos (smart)
4. Open Banking

---

## 12. Resumen Ejecutivo

```
┌─────────────────────────────────────────────────────────────────┐
│                    QUÉ ES TRACK PAYS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Un sistema de gestión financiera personal completo que:       │
│                                                                  │
│  ✓ Registra TODO tipo de ingreso (salario, freelance, AFP)    │
│                                                                  │
│  ✓ Separa gastos en primordiales vs no primordiales           │
│                                                                  │
│  ✓ Gestiona fechas óptimas de pago                            │
│                                                                  │
│  ✓ Compara presupuesto vs real                                │
│                                                                  │
│  ✓ Alertan cuando algo está mal (sobreprecio, deuda)          │
│                                                                  │
│  ✓ Compara con meses anteriores y metas                       │
│                                                                  │
│  ✓ Muestra flujo de caja completo                             │
│                                                                  │
│  ✓ Se adapta según la edad del usuario                        │
│                                                                  │
│  ≠ No es solo un registrador de gastos                        │
│  = Es un asesor financiero inteligente                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**Documento Maestro v1.0 - Listo para implementación**  
Fecha: Mayo 2026