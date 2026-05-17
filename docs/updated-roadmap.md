# Roadmap Actualizado - Track Pays
## v2.0 - Con Sistema Financiero Maestro

---

## Análisis de Documentos Existentes

### Documentos Principales:
1. **future-roadmap.md** - Roadmap original de 5 fases
2. **onboarding-financial-profile.md** - Onboarding con preguntas detalladas
3. **financial-system-master.md** - Sistema financiero completo (nuevo)
4. **firestore-architecture.md** - Schema de base de datos
5. **milestones/** - Progreso realizado

### Conflictos/ Gaps Identificados:
| Problema | Origen | Solución |
|----------|--------|----------|
| Onboarding muy básico | Roadmap original | Expandir en Fase 2.1 |
| Sin restricciones por edad | Roadmap original | Agregar en Fase 2.1 |
| Gastos solo "categorías" | Modelo actual | Sistema dual (primordial/no primordial) |
| Sin sistema de fechas | Roadmap original | Agregar payment scheduling |
| Comparativas simples | Fase 3 actual | Integrar flujo de caja completo |
| Metas simples | Fase 4 actual | Sistema de ahorro/inversiones completo |

---

## Roadmap Actualizado

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                          TRACK PAYS ROADMAP v2.0                                      ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                       ║
║  FASE 1 (2025)          │ FASE 2 (2025-2026)     │ FASE 3 (2026)      │ FASE 4+     ║
║  Foundation             │ Sistema Financiero     │ Analytics + IA     │ Expansión   ║
║  ───────────            │ ────────────────────    │ ──────────────     │ ─────────   ║
║                          │                          │                    │             ║
║  ✓ Firebase migration   │ ✓ Onboarding completo  │ Smart alerts      │ OCR recibos ║
║  ✓ Core architecture    │ ✓ Perfil usuario (edad) │ Predicciones      │ Open banking║
║  ✓ Basic dashboard      │ ✓ Ingresos múltiples    │ Comparativas AI    │ Multi-device║
║  ✓ Basic auth          │ ✓ Gastos dual system   │ Cash flow analysis│             ║
║                          │ ✓ Fechas y scheduling  │ Trends avanzados  │             ║
║                          │ ✓ Ahorro/inversiones   │ Health score v2    │             ║
║                          │ ✓ Quick Entry v2       │                    │             ║
║                          │ ✓ Dashboard financiero │                    │             ║
║                          │ ✓ Alertas básicas      │                    │             ║
║                          │                          │                    │             ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

---

## Detalle de Fases

### FASE 1: Foundation & Migration ✅ COMPLETADO

| Entregable | Estado |
|------------|--------|
| Firebase Migration | ✅ Completado |
| Firestore Schema | ✅ Completado |
| Core Architecture | ✅ Completado |
| Basic Auth | ✅ Completado |
| Basic Dashboard | ✅ Completado |
| Theme Light | ✅ Completado |
| Dashboard V2 (UI) | ✅ Completado |

---

### FASE 2: Sistema Financiero Completo

**Timeline**: Mayo - Agosto 2026 (4 meses)

**Objetivo**: Implementar el sistema financiero maestro con onboarding adaptativo, gestión de ingresos/gastos dual, y flujo de caja completo.

#### FASE 2.1: Onboarding + Perfil (Prioridad Alta)
```
Entregables:
├── Onboarding de 4-6 pasos
│   ├── Edad (15+)
│   ├── Ingresos (múltiples fuentes)
│   ├── Gastos primordiales
│   ├── Gastos no primordiales
│   ├── Ahorro e inversiones
│   └── Resumen y presupuesto
├── Restricciones por edad (15-17, 18-23, 24+)
├── Perfil de usuario en Firestore
└── Presupuesto automático basado en perfil
```

#### FASE 2.2: Sistema de Gastos (Prioridad Alta)
```
Entregables:
├── Sistema dual de gastos
│   ├── Primordiales (esenciales)
│   └── No primordiales (opcionales)
├── Estados de pago
│   ├── pending (pendiente)
│   ├── partial (parcial)
│   ├── paid (pagado)
│   ├── overdue (vencido)
│   └── cancelled (cancelado)
├── Fechas de vencimiento
├── Cálculo de fecha óptima de pago
└── Historial por mes
```

#### FASE 2.3: Sistema de Ingresos (Prioridad Alta)
```
Entregables:
├── Múltiples fuentes de ingreso
│   ├── Salary (con deducciones AFP/seguro)
│   ├── Freelance
│   ├── Business
│   ├── AFP/Pensión
│   └── Otros (alquiler, dividendos, etc.)
├── Balance inicial
├── Presupuesto vs Actual por fuente
└── Total de ingresos por mes
```

#### FASE 2.4: Flujo de Caja (Prioridad Media)
```
Entregables:
├── Dashboard de flujo de caja
│   ├── Ingresos presupuestados vs reales
│   ├── Gastos presupuestados vs reales
│   ├── Comparativa: presupuesto vs actual
│   └── Sobrante/Déficit
├── Comparativa mensual
│   ├── Este mes vs mes anterior
│   ├── Tendencias por categoría
│   └── Metas: reducir gastos / aumentar ahorro
└── Vista de calendario de pagos
```

#### FASE 2.5: Alertas (Prioridad Media)
```
Entregables:
├── Alerta: Presupuesto excedido
├── Alerta: Gasto crítico (variable subió >X%)
├── Alerta: Pago vencido
├── Alerta: Cambio de precio (suscripciones)
├── Alerta: Salud financiera
└── Alerta: Meta cumplida
```

#### FASE 2.6: Quick Entry v2 + Mejoras UX
```
Entregables:
├── Quick Entry optimizado
├── Recent categories
├── Smart defaults por hora
└── Quick stats en dashboard
```

---

### FASE 3: Analytics + IA

**Timeline**: Septiembre - Diciembre 2026

**Objetivo**: Agregar inteligencia al sistema financiero con análisis predictivo y recomendaciones personalizadas.

```
Entregables:
├── Insights inteligentes
│   ├── "Gastaste 23% más que el mes pasado en..."
│   ├── "Tu promedio de luz es S/ 80, este mes es S/ 128"
│   └── "Considera reducir X para alcanzar meta"
├── Predicciones
│   ├── Predicción de gastos variables
│   ├── Predicción de flujo de caja próximo mes
│   └── Alertas predictivas ("en 3 días vence X")
├── Health Score v2
│   ├── Score compuesto de salud financiera
│   ├── Recomendaciones personalizadas
│   └── Comparativa con usuarios similares
├── Trends avanzados
│   ├── Análisis por día de la semana
│   ├── Análisis por época del mes
│   └── Patrones de ahorro
└── Comparativas con benchmarks
```

---

### FASE 4: Expansión + Personalización

**Timeline**: 2027+

```
Entregables:
├── Smart features
│   ├── OCR de recibos (foto → dato)
│   ├── Detección automática de categorías
│   └── Sugerencias basadas en historial
├── Open Banking (futuro)
│   ├── Conexión con BCP, BBVA, Interbank
│   ├── Importación automática de transacciones
│   └── Saldo agregado
├── Multi-dispositivo
│   ├── Web + Mobile sync
│   └── Wearables (Apple Watch)
├── Features avanzados
│   ├── Planificación de gastos anuales
│   ├── Simulador de escenarios ("qué pasa si...")
│   └── Objetivos con múltiples participantes
└── Enterprise (futuro)
    ├── Family/Team finance
    ├── Advisors integration
    └── Export para contadores
```

---

## Criterios de Éxito por Fase

### Fase 2 - Criterios de Éxito

| Criterio | Target |
|----------|--------|
| Onboarding completado por >80% de usuarios | >80% |
| Usuario puede registrar ingreso en <30 segundos | <30s |
| Usuario puede registrar gasto en <10 segundos | <10s |
| Alertas de presupuesto accionables | >90% accurate |
| Comparativa mensual visible | 100% de usuarios |
| Flujo de caja con datos completos | >95% coverage |

### Fase 3 - Criterios de Éxito

| Criterio | Target |
|----------|--------|
| Insights generados automáticamente | >3 por usuario/mes |
| Predicciones de gastos variables | >70% accuracy |
| Health score visible | >60% usuarios |
| Recomendaciones seguidas | >30% adopción |

---

## Notas de Implementación

### 1. Modelo de Datos Actualizado

El nuevo sistema financiero requiere actualizar `firestore-architecture.md`:

```typescript
// Nuevas colecciones necesarias:
- userProfiles (onboarding data)
- incomeSources (múltiples ingresos)
- expenses (dual system)
- savingsInvestments
- cashFlowHistory
- alerts
```

### 2. UI/UX a Actualizar

- Pantalla de onboarding (nueva)
- Dashboard de flujo de caja (nueva)
- Sección de ingresos (actualizar)
- Sección de gastos (actualizar)
- Calendario de pagos (nueva)
- Panel de alertas (nueva)

### 3. Componentes a Crear

1. `OnboardingFlowComponent` - Flujo de preguntas
2. `IncomeManagerComponent` - Gestión de ingresos
3. `ExpenseManagerComponent` - Gestión dual de gastos
4. `CashFlowDashboardComponent` - Vista de flujo
5. `PaymentCalendarComponent` - Calendario de pagos
6. `AlertsPanelComponent` - Panel de alertas

---

## Resumen de Cambios vs Roadmap Original

| Aspecto | Original | Actualizado |
|----------|----------|-------------|
| Onboarding | Basic (3 preguntas) | Completo (6 pasos + restricciones edad) |
| Gastos | Solo categorías | Sistema dual (primordial/no primordial) |
| Ingresos | Solo "sueldo" | Múltiples fuentes + deducciones |
| Fechas | No había | Sistema de plazos + optimal day |
| Comparativas | Fase 3 básico | En fase 2.4 (cash flow) |
| Alertas | No había | Fases 2.5 y 3 |
| Metas | Fase 4 simple | Fase 2.3 (ahorro/inversiones) |
| Analytics | Fase 3 | Fase 3 (expandido + IA) |

---

**El roadmap original sirve como base, pero el nuevo sistema financiero lo expande significativamente. La Fase 2 ahora es la más importante - es donde se construye la base del sistema financiero completo.**