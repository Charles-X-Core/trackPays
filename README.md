<div align="center">

# 💰 Track Pays

### Tu sistema de gestión financiera personal

**Toma el control. Construye tu libertad.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Charles-X-Core/trackPays)

![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=flat&logo=angular)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel)

</div>

---

## ✨ Características

### 💵 Gestión de Ingresos
- **8 categorías** de ingresos: Activos, Pasivos, Eventuales, Digitales, Transferencias, Estado, Negocio, Otros
- **25 tipos** de ingreso: Sueldo, Comisiones, Alquileres, Dividendos, CTS, Gratificación, y más
- **Motor de recurrencia** completo: semanal, quincenal, mensual, bimestral, trimestral, semestral, anual
- **Detección de patrones** automática en historial de pagos
- **Predicción de ingresos** futuros basada en tendencias
- **Confirmación por email** cuando se marca un pago como recibido

### 🛒 Gestión de Gastos
- **Sistema dual**: Gastos Primordiales (esenciales) vs No Esenciales
- **7 categorías esenciales**: Vivienda, Servicios, Transporte, Salud, Deudas, Alimentación, Educación
- **9 categorías no esenciales**: Restaurante, Entretenimiento, Streaming, Mascotas, Ropa, Viajes, Compras, Suscripciones, Otros
- **52 subcategorías** con metadatos inteligentes
- **Tracking de suscripciones** con detección de cambios de precio
- **Montos variables**: registrar monto real al momento de pagar

### 📊 Dashboard Inteligente
- **Balance acumulado** absoluto de todo tu dinero
- **Gráfica de balance** diario con evolución temporal
- **Comparativa** Ingresos vs Gastos con gráfico de barras
- **Regla 50/30/20** visual con barras de progreso
- **Sparklines** de tendencias de los últimos 6 meses
- **Alertas automáticas**: pagos próximos, pagos atrasados, tips financieros

### 📋 Movimientos
- **Historial completo** de transacciones agrupadas por día
- **Filtros** por tipo (ingreso/gasto) y por categoría
- **Búsqueda** por descripción o monto
- **Edición y eliminación** de transacciones
- **Resumen mensual** con ingresos, gastos y balance

### ⚙️ Configuración
- **Panel de Desarrollador**: activar/desactivar emails, modo debug
- **Perfil de usuario** con datos de Firebase Auth
- **Moneda**: Sol Peruano (S/) — extensible a otras monedas

---

## 🏗️ Arquitectura

```
src/app/
├── core/
│   ├── components/        # Componentes reutilizables (Icon, PasswordStrength)
│   ├── guards/            # Auth guard para rutas protegidas
│   ├── models/            # Interfaces y tipos TypeScript
│   │   ├── income.model.ts      # Motor de recurrencia de ingresos
│   │   ├── expense.model.ts     # Sistema dual de gastos
│   │   ├── budget.model.ts      # Presupuestos por categoría
│   │   ├── goal.model.ts        # Metas de ahorro
│   │   └── transaction.model.ts # Transacciones
│   ├── services/          # Servicios de negocio
│   │   ├── firebase.ts    # Capa de acceso a Firestore (God Object)
│   │   ├── auth.ts        # Autenticación Firebase
│   │   ├── income.ts      # Lógica de ingresos
│   │   ├── expense.ts     # Lógica de gastos
│   │   ├── transaction.ts # Transacciones
│   │   ├── email.ts       # Envío de emails (EmailJS)
│   │   └── dev-settings.ts # Configuración de desarrollador
│   └── utils/             # Utilidades (iconos Lucide)
├── pages/
│   ├── dashboard/         # Panel principal con gráficas
│   ├── income/            # Gestión de ingresos
│   ├── expenses/          # Gestión de gastos
│   ├── transactions/      # Historial de movimientos
│   ├── budgets/           # Presupuestos
│   ├── goals/             # Metas de ahorro
│   ├── settings/          # Configuración
│   └── login/             # Autenticación con Tracky
└── layout/                # Sidebar + Topbar + BottomNav
```

---

## 🛠️ Tecnologías

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Angular | 21.2 | Framework principal (standalone components, signals) |
| Firebase | — | Auth + Firestore (base de datos) |
| EmailJS | 4.4 | Envío de emails desde el cliente |
| Chart.js | 4.5 | Gráficas del dashboard (vía ng2-charts) |
| Lucide Icons | 0.469 | Iconos SVG personalizados |
| TypeScript | 5.9 | Tipado estricto |
| SCSS | — | Estilos con design system personalizado |
| Vercel | — | Deploy y hosting |

---

## 🚀 Instalación

### Prerequisitos
- Node.js 18+
- pnpm (recomendado) o npm
- Firebase CLI (opcional, para deploy)

### Pasos

```bash
# Clonar el repositorio
git clone https://github.com/Charles-X-Core/trackPays.git
cd trackPays

# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm start
```

La app estará disponible en `http://localhost:4200`

---

## 📦 Build y Deploy

### Build de producción
```bash
pnpm build
```

### Deploy a Vercel
El proyecto ya está configurado para Vercel. Solo necesitas:

1. Fork o clonar el repo
2. Conectar el repositorio en [vercel.com/new](https://vercel.com/new)
3. Vercel detectará automáticamente la configuración de Angular

### Deploy a Firebase Hosting
```bash
firebase deploy --only hosting
```

---

## 🔐 Variables de Entorno

El proyecto usa Firebase con configuración en `src/environments/environment.ts`. Para tu propia instancia:

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilita Authentication (Email/Password + Google)
3. Crea una base de datos Firestore
4. Actualiza las credenciales en `environment.ts`

---

## 📧 Email (Opcional)

El sistema de emails usa [EmailJS](https://www.emailjs.com). Para configurarlo:

1. Crea una cuenta en EmailJS
2. Crea un servicio de email
3. Crea 2 templates (confirmación y catch-up)
4. Actualiza las credenciales en `src/app/core/services/email.ts`

---

## 🎨 Design System

El proyecto usa un design system personalizado con CSS custom properties:

```css
/* Colores principales */
--color-primary: #166B46;
--color-accent: #2FA46A;
--color-bg: #0E1212;
--color-surface: #0D1B16;

/* Tipografía */
--font-body: 'Inter', sans-serif;
--font-heading: 'Poppins', sans-serif;

/* Animaciones (Emil Kowalski principles) */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--duration-fast: 100ms;
--duration-normal: 160ms;
```

---

## 📄 Licencia

Este es un proyecto personal de desarrollo. Todos los derechos reservados.

---

<div align="center">

**Desarrollado con 💚 por [Charles-X-Core](https://github.com/Charles-X-Core)**

</div>
