# Roadmap Actualizado - Track Pays
## v2.0 - Mayo 2026

---

## Estado de Avance (Mayo 2026)

| Fase | Estado | Completado |
|------|--------|------------|
| Fase 1: Foundation | ✅ COMPLETO | 100% |
| Fase 2.1: Onboarding | ✅ COMPLETO | 100% |
| Fase 2.2: Ingresos | ✅ COMPLETO | 100% |
| Fase 2.3: Gastos Dual | ✅ COMPLETO | 100% |
| Fase 2.4: Flujo Caja | ✅ COMPLETO | 100% |
| Fase 2.5: Alertas | ✅ COMPLETO | 100% (backend) |
| Fase 2.6: Goals | ✅ COMPLETO | 100% |
| Fase 3: Analytics | ✅ COMPLETO | 100% |
| Fase 4: Reportes/Export | ✅ COMPLETO | 100% |
| Fase 5: Offline Sync | ✅ COMPLETO | 100% |
| **BACKEND** | **✅ COMPLETO** | **100%** |
| UI/Front-end | 🔄 PENDIENTE | 0% |

---

## Detalle de Avance

### ✅ FASE 1: Foundation (COMPLETO)
- [x] Firebase migration
- [x] Core architecture
- [x] Basic dashboard
- [x] Basic auth

### ✅ FASE 2: Sistema Financiero

#### 2.1 Onboarding + Perfil (COMPLETO)
- [x] Onboarding de 4-6 pasos
- [x] Edad (15+)
- [x] Ingresos (múltiples fuentes)
- [x] Restricciones por edad (15-17, 18-23, 24+)
- [x] Perfil de usuario en Firestore

#### 2.2 Ingresos (COMPLETO)
- [x] Múltiples fuentes (salary, freelance, business, AFP, otros)
- [x] Fechas de pago (paymentDayOfMonth)
- [x] Deducciones (AFP, seguros)
- [x] Balance inicial
- [x] Comparación: presupuestado vs recibido

#### 2.3 Gastos Dual (COMPLETO)
- [x] Sistema dual (primordial vs no primordial)
- [x] Estados: pending, partial, paid, overdue, cancelled
- [x] Fechas de vencimiento
- [x] Presupuesto vs real
- [x] Sistema extensible (providerDetails, debtDetails, serviceDetails, metadata)

#### 2.4 Flujo de Caja (COMPLETO)
- [x] Dashboard de flujo de caja
- [x] Ingresos presupuestados vs reales
- [x] Gastos presupuestados vs reales
- [x] Disponible ahora vs esperado
- [x] Comparativa: presupuesto vs actual

#### 2.5 Alertas (COMPLETO) ✅
- [x] Alerta: Presupuesto excedido
- [x] Alerta: Pago vencido
- [x] Alerta: Cambio de precio
- [x] Alertas centralizadas (8 tipos)
- [ ] Alertas activas en UI (pendiente)

#### 2.6 Goals (COMPLETO) ✅
- [x] Goals múltiples (prioridad, categorías, contribuciones)
- [x] Proyección de fecha (calculada automáticamente)
- [x] Historial de contribuciones por goal

#### 2.7 Comparativas (COMPLETO) ✅
- [x] Comparativa mes vs mes anterior
- [x] Tendencias de últimos N meses
- [x] Comparativa por categoría

#### 2.8 Month Rollover (COMPLETO) ✅
- [x] Auto-crear mes nuevo
- [x] Copiar budgets al mes siguiente
- [x] Gestión de gastos recurrentes

#### 2.9 Reportes/Export (COMPLETO) ✅
- [x] Exportar a CSV
- [x] Exportar a JSON
- [x] Reporte completo

#### 2.10 Offline Sync (COMPLETO) ✅
- [x] Cache local con IndexedDB
- [x] Sincronización automática
- [x] Cola de cambios pendientes

---

## Pendiente de Implementar

### Alta Prioridad (FRONT-END)
1. **Alertas activas en UI** - mostrar alertas al usuario
2. **Integrar datos reales en Dashboard**
3. **Mostrar comparativas mensuales en UI**

### Media Prioridad
4. **Calendario de pagos** - ver próximos pagos
5. **Recordatorios** - notificaciones de vencimiento
6. **Testing unitario**

### Baja Prioridad
7. **Analytics persistidos** - guardar analytics por mes
8. **Insights automáticos** - sugerencias personalizadas
9. **Detección de transacciones recurrentes**
10. **OCR de recibos** (Fase 3)
11. **Open Banking** (Fase 4)

---

## Próximos Pasos Inmediatos

```
PRÓXIMO SPRINT:
├── Goals múltiples (priority)
├── Budget por categoría (priority)
└── Alertas activas (priority)

SIGUIENTE:
├── Comparativas mensuales
├── Calendario de pagos
└── Recordatorios
```

---

## Documentación de Referencia

| Documento | Descripción |
|-----------|-------------|
| `financial-system-master.md` | Sistema completo (v2.0) |
| `expansion-guide.md` | Cómo expandir sin romper |
| `backend-analysis-and-methodology.md` | Análisis + metodología |
| `firestore-architecture.md` | Schema Firestore (visión) |

---

**Última actualización**: Mayo 2026  
**Progreso**: ~65% del sistema completo

---

## Registro de Milestones

| # | Milestone | Estado | Fecha |
|---|-----------|--------|-------|
| 001 | Firebase Migration | ✅ COMPLETO | - |
| 002 | Arquitectura Escalable | ✅ COMPLETO | - |
| 003 | Theme Light | ✅ COMPLETO | - |
| 004 | Sistema Financiero Completo | ✅ COMPLETO | Mayo 2026 |
| 005 | Goals Múltiples | ✅ COMPLETO | Mayo 2026 |

> Ver documentación en: `docs/milestones/`