# Future Roadmap — Track Pays

## Visión del Roadmap

El roadmap de Track Pays se organiza en **5 fases estratégicas** que priorizan la fundación de UX sólida, la arquitectura robusta, y la experiencia financiera premium por encima de features complejos o integraciones ambiciosas.

La premisa fundamental es: **sin una base de experiencia de usuario excepcional, cualquier feature avanzada carece de valor**.

---

## Resumen del Roadmap

```
FASE 1 (Q3 2025)      │ Foundation & Migration
                      │ - Migración a Firebase
                      │ - UX Foundation
                      │ - Core Architecture
                      ├─────────────────────────────┤
FASE 2 (Q4 2025)      │ Dashboard 2.0
                      │ - Quick Entry v2
                      │ - Theme System
                      │ - Navigation Refactor
                      ├─────────────────────────────┤
FASE 3 (Q1 2026)      │ Analytics & Insights
                      │ - Análisis de patrones
                      │ - Trends
                      │ - Feedback inteligente
                      ├─────────────────────────────┤
FASE 4 (Q2 2026)      │ Growth & Personalization
                      │ - Metas avanzadas
                      │ - Recomendaciones
                      │ - Scoring financiero
                      ├─────────────────────────────┤
FASE 5 (Q3-Q4 2026)   │ Scale & Enterprise
                      │ - Open Banking (futuro)
                      │ - APIs
                      │ - Multi-dispositivo
```

---

## Fase 1: Foundation & Migration

**Timeline**: Julio - Septiembre 2025 (3 meses)

**Objetivo**: Establecer la base técnica y de experiencia sobre la cual se construirá el producto premium.

### Entregables de Infraestructura

| Entregable | Descripción | Prioridad |
|------------|-------------|-----------|
| **Firebase Migration** | Migrar de Supabase a Firebase Auth + Firestore | Critical |
| **Firestore Schema** | Arquitectura Firestore completa (ver `firestore-architecture.md`) | Critical |
| **Firebase Security Rules** | Reglas de acceso y validación | Critical |
| **Monthly Financial State** | Implementar estado financiero mensual pre-calculado | Critical |
| **Analytics + Insights** | Sistema de insights automáticos por mes | High |
| **Error Handling System** | Sistema robusto de manejo de errores | High |

### Entregables de UX Foundation

| Entregable | Descripción | Prioridad |
|------------|-------------|-----------|
| **Design System Setup** | Componentes base, tokens, tipografía | Critical |
| **Theme Implementation** | Light/Dark mode con persistence | High |
| **Accessibility Audit** | WCAG AA compliance | High |
| **Loading States** | Skeletons en lugar de spinners | Medium |

### Entregables de Arquitectura

| Entregable | Descripción | Prioridad |
|------------|-------------|-----------|
| **Folder Restructure** | Reorganización feature-based | Critical |
| **Core Services Setup** | Auth, Repository, Engine layers | Critical |
| **Signals Implementation** | Estado con signals, no RxJS | High |
| **Testing Setup** | Unit tests con Vitest | High |

### Criterios de Éxito Fase 1

- [ ] La app corre en Firebase sin regressions funcionales
- [ ] Theme light/dark funciona correctamente
- [ ] Tests unitarios cubriendo servicios core (>70%)
- [ ] Navegación fluida con mejor performance
- [ ] Errores de Firebase handled gracefully

---

## Fase 2: Dashboard 2.0

**Timeline**: Octubre - Diciembre 2025 (3 meses)

**Objetivo**: Redefinir la experiencia del Dashboard para que sea más que un resumen — debe ser un **comando central de finanzas personales**.

### Entregables del Dashboard 2.0

| Entregable | Descripción | Prioridad |
|------------|-------------|-----------|
| **Dashboard V2** | Nuevo diseño basado en principios UX redefinidos | Critical |
| **Quick Entry v2** | Flujo optimizado, mejor UX, categorías smart | Critical |
| **Budget Limits** | Sistema de límites por categoría | High |
| **Monthly Reset** | Nueva lógica de inicio de mes | High |

### Quick Entry v2: Detalles

```
Quick Entry actual → Quick Entry 2.0:
┌─────────────────┐      ┌─────────────────┐
│ [Modal básico]  │ ───► │ [Experiencia   │
│ - Amount       │      │  optimizada]    │
│ - Category     │      │ - One-tap       │
│ - Description  │      │ - Recent cats  │
│ - Date         │      │ - Smart default │
└─────────────────┘      │ - Prediction   │
                         └─────────────────┘
```

**Features del Quick Entry v2**:

1. **One-tap open**: Un toque para abrir, el numpad ya está activo
2. **Recent categories**: Las últimas 3 categorías usadas primero
3. **Smart defaults**: Basado en hora del día (desayuno → comida, transporte → uber)
4. **Amount prediction**: "Usually S/ 25 for lunch" - one tap to accept

### Theme System

| Feature | Descripción |
|---------|-------------|
| **Persistencia** | El tema elegido se guarda en Firebase |
| **System preference** | Auto-detectar preferencia del OS |
| **Toggle animation** | Transición suave entre temas |
| **Per-component** | En el futuro: partes de la UI en modo diferente |

### Criterios de Éxito Fase 2

- [ ] Quick Entry toma < 5 segundos para registrar una transacción
- [ ] Dashboard carga en < 2 segundos
- [ ] Theme se persiste correctamente entre sesiones
- [ ] User feedback: "es más fácil usar la app que antes"

---

## Fase 3: Analytics & Insights

**Timeline**: Enero - Marzo 2026 (3 meses)

**Objetivo**: Agregar profundidad analítica sin abrumar. El usuario que quiere entender "por qué" tiene dónde hacerlo.

### Entregables de Analytics

| Entregable | Descripción | Prioridad |
|------------|-------------|-----------|
| **Analytics Dashboard** | Nueva sección de análisis profundo | Critical |
| **Category Trends** | Análisis de tendencias por categoría | High |
| **Monthly Comparison** | Este mes vs mes anterior vs promedio | High |
| **Anomaly Detection** | "Gastaste S/ 200 en algo que no es normal" | Medium |

### Features de Analytics Detallados

#### 1. Spending Insights

```typescript
interface SpendingInsight {
  type: 'trend' | 'comparison' | 'anomaly';
  title: string;
  description: string;
  magnitude: number;  // % change
  action?: string;    // "Considera reducir..."
  dismissed: boolean;
}
```

**Ejemplos de insights**:

- "Gastaste 23% más en entretenimiento que el mes pasado"
- "Tu promedio de transporte es S/ 150/mes, estable"
- "Gastaste S/ 350 en una sola compra - es alto para tu historial"

#### 2. Health Score (Simple)

```
Health Score: 75/100

┌─────────────────────────────────────┐
│ ████████████░░░░░░░░░░░░░░░░░░░░   │ 75%
└─────────────────────────────────────┘

- Ingresos estables: ✓
- Gastos controlados: ✓
- Ahorro en meta: ✗ (bajo)
- Sin gastos anómalos: ✓
```

**No es un scoring complejo** — es un indicador simple de "cómo está mi salud financiera".

### Feedback Inteligente

| Trigger | Feedback |
|----------|----------|
| Primer registro del mes | "Bien, tienes S/ X de presupuesto. ¡Empieza bien el mes!" |
| 50% del presupuesto de categoría | "Llevas la mitad de tu presupuesto de alimentación." |
| 80% del presupuesto | "Cuidado: vas a exceder tu límite de entretenimiento." |
| Meta de ahorro actualizada | "Con S/ 300/mes, alcanzarás tu meta en 8 meses." |
| Semana sin transacciones | "¿Todo bien? No hemos registrado nada esta semana." |

### Criterios de Éxito Fase 3

- [ ] Analytics se carga en < 1 segundo (cached)
- [ ] Al menos 3 tipos de insights disponibles
- [ ] Health score visible en Dashboard
- [ ] User feedback: "entiendo mejor mis patrones"

---

## Fase 4: Growth & Personalization

**Timeline**: Abril - Junio 2026 (3 meses)

**Objetivo**: Personalizar la experiencia para cada usuario. Track Pays se adapta al individuo, no al revés.

### Entregables de Personalization

| Entregable | Descripción | Prioridad |
|------------|-------------|-----------|
| **Advanced Goals** | Metas múltiples, no solo una | Critical |
| **Recommendations** | Sugerencias personalizadas | High |
| **Financial Scoring** | Score más sofisticado (próximo a FinScore) | Medium |
| **Smart Categories** | Categorías que aprenden del usuario | Medium |

### Metas Avanzadas

```
Goals actual → Goals 2.0:
┌─────────────────┐      ┌─────────────────┐
│ Una sola meta   │ ───► │ Múltiples metas │
│ S/ 10,000       │      │ - Viaje: S/ 3k  │
│                 │      │ - Auto: S/ 15k  │
│                 │      │ - Emergencia    │
└─────────────────┘      │ S/ 5k           │
                         └─────────────────┘
```

**Features de Goals 2.0**:

- Múltiples goals simultáneos
- Goals con deadline (viaje en diciembre, no en "8 meses")
- Goals prioritarios (ordenar por importancia)
- Partial allocation (asignar ingresos a múltiples goals)

### Recomendaciones

**Tipos de recomendaciones**:

1. **Budget recommendation**: "Basado en tus ingresos, te sugerimos S/ 800 para alimentación"
2. **Saving opportunity**: "Cancelando esta suscripción, ahorrarías S/ 50/mes"
3. **Goal adjustment**: "Para alcanzar tu meta 3 meses antes, aumenta S/ 100/mes"
4. **Category tip**: "Sueles gastar más los fines de semana. Considera planificar."

### Financial Scoring (Progressive)

```
Nivel 1 (Fase 3): Health Score simple
      │
      ▼
Nivel 2 (Fase 4): Financial Wellness Score
- Ahorro ratio (20% de ingresos → 100 puntos)
- Gasto/necesidades ratio (< 50% → 100 puntos)
- Gasto/deseos ratio (< 30% → 100 puntos)
- Goal progress (on track → 100 puntos)
- Consistencia (registra seguido → 100 puntos)

      │
      ▼
Nivel 3 (Futuro): FinScore con ML
- Predicción de cash flow
- Riesgo de sobregiro
- Recommendation de optimización
```

### Criterios de Éxito Fase 4

- [ ] Usuario puede crear múltiples goals
- [ ] Al menos 2 tipos de recomendaciones activos
- [ ] Financial Wellness Score visible
- [ ] User feedback: "la app me conoce"

---

## Fase 5: Scale & Enterprise (Visionario)

**Timeline**: Julio - Diciembre 2026 y más allá

**Objetivo**: Preparar el producto para escalar más allá del usuario individual.

### Visión de Fase 5

| Área | Visión |
|------|--------|
| **Open Banking** | Conexión con bancos locales (BCP, BBVA, Interbank) para ver saldo automático |
| **APIs** | API para que terceros construyan sobre Track Pays |
| **Family/Teams** | Comparte finanzas con pareja, familia (próximamente) |
| **Advisor Integration** | Conexión con advisors financieros (próximamente) |
| **Export** | Exportación a Excel, PDF para accountants |

### Open Banking (Visión)

```
┌─────────────────────────────────────────────┐
│               FUTURO: OPEN BANKING            │
├─────────────────────────────────────────────┤
│                                              │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐ │
│  │   BCP   │    │  BBVA   │    │Interbank│ │
│  └────┬────┘    └────┬────┘    └────┬────┘ │
│       │              │              │       │
│       └──────────────┼──────────────┘       │
│                      ▼                       │
│            ┌─────────────────┐               │
│            │   Track Pays    │               │
│            │  Agregado       │               │
│            │  Automático     │               │
│            └─────────────────┘               │
│                                              │
└─────────────────────────────────────────────┘
```

**Nota**: Esta fase requiere licencias y regulaciones en Perú. Es una visión a largo plazo, no un objetivo inmediato.

---

## Roadmap Visual

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                              TRACK PAYS ROADMAP 2025-2026                         ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  Q3 2025     │  Q4 2025     │  Q1 2026     │  Q2 2026     │  Q3-Q4 2026         ║
║  ──────────  │  ──────────  │  ──────────  │  ──────────  │  ──────────         ║
║              │              │              │              │                     ║
║  FASE 1      │  FASE 2      │  FASE 3      │  FASE 4      │  FASE 5             ║
║  Foundation  │  Dashboard   │  Analytics   │  Growth      │  Scale             ║
║              │  2.0         │  & Insights   │  & Personal  │  & Enterprise      ║
║  ┌────────┐  │  ┌────────┐  │  ┌────────┐  │  ┌────────┐  │  ┌────────┐         ║
║  │Firebase│  │  │Dashboard│  │  │Analytics│  │  │Goals   │  │  │Open    │         ║
║  │Migrat. │  │  │  v2     │  │  │  v1    │  │  │  v2    │  │  │ Banking │         ║
║  └────────┘  │  └────────┘  │  └────────┘  │  └────────┘  │  │(vision)│         ║
║              │              │              │              │  └────────┘         ║
║  ┌────────┐  │  ┌────────┐  │  ┌────────┐  │  ┌────────┐  │                     ║
║  │Design  │  │  │Quick   │  │  │Category│  │  │Recomm. │  │                     ║
║  │System  │  │  │Entry   │  │  │Trends  │  │  │ System │  │                     ║
║  └────────┘  │  │  v2    │  │  └────────┘  │  └────────┘  │                     ║
║              │  └────────┘  │              │              │                     ║
║  ┌────────┐  │              │  ┌────────┐  │  ┌────────┐  │                     ║
║  │Core    │  │  ┌────────┐  │  │Health  │  │  │Financial│ │                     ║
║  │Archit. │  │  │Theme   │  │  │Score   │  │  │Scoring │  │                     ║
║  └────────┘  │  │System  │  │  └────────┘  │  └────────┘  │                     ║
║              │  └────────┘  │              │              │                     ║
║  ┌────────┐  │              │  ┌────────┐  │              │                     ║
║  │Signals │  │  ┌────────┐  │  │Insights│  │              │                     ║
║  │& State │  │  │Loading │  │  │System  │  │              │                     ║
║  └────────┘  │  │States  │  │  └────────┘  │              │                     ║
║              │  └────────┘  │              │              │                     ║
║              │              │              │              │                     ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

## Prioridades de Desarrollo

### Priority Matrix General

| Prioridad | Área | Razón |
|-----------|------|-------|
| **1** | Foundation (Firebase, Architecture) | Sin esto, nada funciona bien |
| **2** | Quick Entry | La acción más frecuente |
| **3** | Dashboard | La experiencia más importante |
| **4** | Analytics | Depth para usuarios que quieren más |
| **5** | Goals v2 | Próximo nivel de personalización |
| **6** | Advanced Features (Open Banking, etc.) | Visión a largo plazo |

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| **Firebase costs escalan** | Diseñar con queries eficientes, implementar caching |
| **Analytics es muy complejo** | Empezar simple, iterar basado en usage |
| **Feature creep** | Mantener disciplina de roadmap, decir "no" |
| **Performance issues** | Medir desde el inicio, optimizar continuamente |
| **Team capacity** | Priorizar ruthless, features pequeños y bien definidos |

---

## Métricas de Éxito del Roadmap

### North Star Metric

```
NSM: Porcentaje de usuarios que pueden responder
     "sí, entiendo mi situación financiera"
```

### Secondary Metrics

| Métrica | Target Q2 2026 |
|---------|----------------|
| DAU / MAU ratio | > 40% |
| Average sessions per user / week | > 3.5 |
| Quick Entry usage | > 60% de transacciones |
| Dashboard bounce rate | < 20% |
| Analytics entry rate | > 25% de usuarios |
| NPS | > 50 |
| 90-day retention | > 60% |

---

## Resumen Ejecutivo

El roadmap de Track Pays prioriza:

1. **Foundation primero** — Firebase migration, arquitectura, design system
2. **UX sobre features** — Dashboard 2.0, Quick Entry v2
3. **Analytics progresivo** — De simple health score a insights profundos
4. **Personalización gradual** — Adaptación al usuario individual
5. **Escala futura** — Open Banking como visión, no ahora

Cada fase construye sobre la anterior. No hay atajos. La base sólida es lo que diferencia un producto premium de una app genérica.

> "El éxito de Track Pays no se mide por cuántas features tiene, sino por cuántos usuarios entienden sus finanzas."