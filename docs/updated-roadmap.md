# Roadmap Actualizado - Track Pays
## v2.0 - Mayo 2026

---

## Estado de Avance

| Fase | Estado | Completado |
|------|--------|------------|
| Fase 1: Foundation | ✅ COMPLETO | 100% |
| Fase 2.1: Onboarding | ✅ COMPLETO | 100% (backend) |
| Fase 2.2: Ingresos | ✅ COMPLETO | 100% |
| Fase 2.3: Gastos Dual | ✅ COMPLETO | 100% |
| Fase 2.4: Flujo Caja | ✅ COMPLETO | 100% |
| Fase 2.5: Alertas | ⚠️ READY | 70% (backend listo, no activas) |
| Fase 2.6: Goals | ⚠️ BÁSICO | 40% |
| Fase 3: Analytics | ❌ PENDIENTE | 0% |

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

#### 2.5 Alertas (PARCIAL - READY)
- [x] Alerta: Presupuesto excedido (backend listo)
- [x] Alerta: Pago vencido (backend listo)
- [x] Alerta: Cambio de precio (backend listo)
- [ ] Alertas activas en UI (pendiente)

#### 2.6 Goals (BÁSICO)
- [x] Goals básicos (1 meta)
- [ ] Goals múltiples (pendiente)
- [ ] Prioridades de goals (pendiente)
- [ ] Proyección de fecha (partial)

---

## Pendiente de Implementar

### Alta Prioridad
1. **Goals múltiples** - permitir varias metas simultáneas
2. **Budgets por categoría** - presupuesto específico por categoría
3. **Alertas activas en UI** - mostrar alertas al usuario

### Media Prioridad
4. **Comparativas mensuales** - este mes vs mes anterior
5. **Calendario de pagos** - ver próximos pagos
6. **Recordatorios** - notificaciones de vencimiento

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
**Progreso**: ~60% del sistema completo