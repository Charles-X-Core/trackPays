# Design Direction — Track Pays

## Visión General

La dirección visual de Track Pays no es un diseño final — es una **estrategia de dirección** que guía decisiones de diseño futuras. El objetivo es crear una identidad visual que sea premium, minimalista, calmada y exclusivamente clara.

Esta dirección se inspira en productos como Linear, Arc, Notion, y las mejores fintechs modernas, pero con una identidad propia que refleja el contexto peruano.

---

## Estilo Visual

### Identidad Visual: "Calm Premium"

**Descripción del estilo**:

Track Pays se caracteriza por ser **premium sin ser ostentoso, minimalista sin ser vacío, y moderno sin ser trendy**. La estética comunica competencia profesional sin la frialdad de las apps corporativas.

**Atributos visuales clave**:

| Atributo | Definición | Ejemplo |
|----------|------------|---------|
| **Limpio** | Sin ruido visual, cada elemento tiene propósito | Background blanco con contenido centered |
| **Espacioso** | Generoso uso de whitespace | Entre secciones: 32px minimum |
| **Sutil** | Los efectos visuales son suaves | Sombras light, bordes delicate |
| **Editorial** | Como una revista de finanzas bien diseñada | Tipografía jerárquica, alignment preciso |
| **Premium** | Se siente como un producto de $100/mo, no free | No usa defaults de frameworks |

### Lo que NO es

❌ **No es corporate**: No parece un banco tradicional
❌ **No es gamificado**: No usa elements de juego (badges, puntos, niveles)
❌ **No es cyberpunk**: No usa neón, glitch, o estética futurista
❌ **No es genérico**: No parece un template de Angular Material
❌ **No es cluttered**: No tiene muchos elementos competiendo por atención

### Inspiraciones de Referencia

```
┌─────────────────────────────────────────────────────────────────┐
│                      REFERENCIAS VISUALES                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LINEAR                                                         │
│  → Lisos, bordes sutiles, typography clara, verde como accent  │
│  → Sentimiento: eficiencia, velocidad, profesional              │
│                                                                  │
│  NOTION                                                         │
│  → Blanco total, hierarchy clara, icons sutiles                 │
│  → Sentimiento: claridad, organización, paz                     │
│                                                                  │
│  STRIPE DASHBOARD                                               │
│  → Datos bien presentados, gráficos limpios                    │
│  → Sentimiento: confianza, sofisticación                        │
│                                                                  │
│  WALLET (Fintech)                                               │
│  → Movimiento sutil, feedback inmediato                        │
│  → Sentimiento: modernidad, interacción fluida                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Principios Visuales

### PV-01: Blanco como Fundamento

**Regla**: El background principal es blanco (#FFFFFF en light mode, #0F172A en dark mode). El color se usa para contenido, no para filler.

**Aplicación**:

```scss
// Light mode
background-color: #FFFFFF;  // principal
background-color: #F8FAFC; // superficie secundaria

// Dark mode
background-color: #0F172A;  // principal
background-color: #1E293B; // superficie secundaria
```

**Por qué**: El blanco comunica claridad, limpieza, y profesionalismo. Es el canvas perfecto para datos financieros.

---

### PV-02: Un Color de Marca, Mínimos Colores de Datos

**Regla**: El brand color es el único color primary. Los datos usan una paleta limitada de colores semánticos.

**Brand Color**:

```scss
--brand-primary: #2563EB;      // Azul confianza
--brand-primary-hover: #1D4ED8;
--brand-primary-light: #DBEAFE;
```

**Colores de datos**:

```scss
// Positivo (ingresos, ahorro, progreso)
--color-positive: #10B981;     // Verde
--color-positive-light: #D1FAE5;

// Advertencia (gastos elevados, cerca de límite)
--color-warning: #F59E0B;      // Amarillo
--color-warning-light: #FEF3C7;

// Negativo (error del sistema, acción no disponible)
--color-negative: #EF4444;     // Rojo
--color-negative-light: #FEE2E2;

// Neutral (datos sin juicio)
--color-muted: #64748B;        // Gris
```

**Regla importante**: Los gastos normales NO secolorean en rojo por defecto. El rojo se reserva para errores o advertencias críticas.

---

### PV-03: Jerarquía por Tamaño, No por Color

**Regla**: La jerarquía visual se logra principalmente por tamaño y spacing, no por color.

**Escala tipográfica**:

```scss
// Headings
--font-size-h1: 32px;  // Dashboard balance
--font-size-h2: 24px;  // Section titles
--font-size-h3: 20px;  // Card titles

// Body
--font-size-body-lg: 16px;  // Important info
--font-size-body: 14px;     // Standard text
--font-size-body-sm: 12px;  // Captions, metadata

// Labels
--font-size-label: 12px;    // Labels, tags
--font-size-caption: 11px;  // Fine print
```

**Jerarquía correcta**:

```
┌─────────────────────────────────────────────────────┐
│ S/ 2,500.00                        ← 32px, bold     │
│ Balance del mes                   ← 14px, muted    │
│                                     ↓              │
│ Ingresos: S/ 5,000.00             ← 16px, primary  │
│ Gastos: S/ 2,500.00               ← 16px, primary  │
└─────────────────────────────────────────────────────┘
```

---

### PV-04: Un Icono por Concepto

**Regla**: Cada elemento conceptual tiene un único icono o emoji. No hay variación para el mismo concepto.

**Iconos del sistema**:

| Concepto | Icono |
|----------|-------|
| Balance | 💰 |
| Ingresos | 💚 (usado como color) |
| Gastos | 🔴 (usado como color) |
| Meta/Ahorro | 🐷 / 🎯 |
| Necesidades (50/30/20) | 🏠 |
| Deseos (50/30/20) | 🎬 |
| Ahorro (50/30/20) | 🐷 |
| Transacción | 💸 |
| Editar | ✏️ |
| Eliminar | 🗑️ |
| Volver | ← |
| Agregar | + |

---

## Uso del Dark Mode

### Estrategia: Opt-in, No Default

**Decisión**: El tema claro es el default. El dark mode es una opción que el usuario puede activar.

**Rationale**:

- La mayoría de usuarios en Perú usan dispositivos en modo claro
- El tema claro comunica "limpieza" y "claridad" mejor
- Dark mode puede activar ansiedad en algunos usuarios financieros

### Implementación

```scss
// Theme variables
:root {
  // Light (default)
  --bg-primary: #FFFFFF;
  --bg-secondary: #F8FAFC;
  --text-primary: #1E293B;
  --text-secondary: #64748B;
}

[data-theme="dark"] {
  --bg-primary: #0F172A;
  --bg-secondary: #1E293B;
  --text-primary: #F1F5F9;
  --text-secondary: #94A3B8;
}
```

### Dark Mode: Reglas Visuales

| Aspecto | Light | Dark |
|---------|-------|------|
| Background | Blanco #FFFFFF | Oscuro #0F172A |
| Surface | Gris claro #F8FAFC | Gris oscuro #1E293B |
| Texto principal | Gris oscuro #1E293B | Blanco #F1F5F9 |
| Texto secundario | Gris #64748B | Gris claro #94A3B8 |
| Bordes | Gris muy claro #E2E8F0 | Gris oscuro #334155 |
| Sombras | Suaves | Más suaves (menos visibles en dark) |

### Dark Mode: Colores de Datos

En dark mode, los colores de datos se ajustan para mantener contraste:

```scss
[data-theme="dark"] {
  --color-positive: #34D399;    // Más claro para visibility
  --color-warning: #FBBF24;
  --color-negative: #F87171;
  --color-brand-primary: #60A5FA;  // Más claro
}
```

---

## Sistema de Color

### Paleta Completa

```
COLORES DE MARCA
├── Primary: #2563EB (azul confianza)
├── Primary Hover: #1D4ED8
├── Primary Light: #DBEAFE
└── Primary Subtle: #EFF6FF

COLORES NEUTROS
├── Background: #FFFFFF / #0F172A
├── Surface: #F8FAFC / #1E293B
├── Border: #E2E8F0 / #334155
├── Text Primary: #1E293B / #F1F5F9
├── Text Secondary: #64748B / #94A3B8
├── Text Muted: #94A3B8 / #64748B

COLORES DE DATOS
├── Success: #10B981 / #34D399 (dark)
├── Warning: #F59E0B / #FBBF24 (dark)
├── Error: #EF4444 / #F87171 (dark)

COLORES DE INGRESO/GASTO
├── Income: #10B981 (verde)
├── Expense: #64748B (gris neutral)
└── Expense Warning: #EF4444 (solo cuando es excesivo)
```

### Regla de Contexto de Color

**Los gastos NO son rojos por defecto**. Solo secolorean cuando hay una razón específica:

```typescript
// Correcto: gasto normal
<span>S/ -150.00</span>  // Gris neutral

// Correcto: gasto excesivo
<span class="expense-warning">S/ -850.00 (85% del presupuesto)</span>  // Rojo

// Correcto: ingreso
<span class="income">S/ +2,500.00</span>  // Verde
```

---

## Espaciado

### Sistema de Espaciado (4px Grid)

```scss
// Base
--space-1: 4px;    // Elementos inline muy juntos
--space-2: 8px;    // Elementos relacionados
--space-3: 12px;   // Componentes pequeños
--space-4: 16px;   // Componentes estándar
--space-5: 20px;   // Section padding interno
--space-6: 24px;   // Entre componentes similares
--space-8: 32px;   // Entre secciones
--space-10: 40px;  // Espaciado generoso
--space-12: 48px;  // Grandes separaciones
--space-16: 64px;  // Layout sections
```

### Reglas de Espaciado

**Entre secciones del Dashboard**:

```
┌───────────────────────┐
│ Balance (32px margin-bottom)
│    │
└────┬──────────────────┘
     │
     ▼ 32px
┌────┴──────────────────┐
│ Regla 50/30/20        │
│    │
└────┬──────────────────┘
     │
     ▼ 24px
┌────┴──────────────────┐
│ Meta de ahorro        │
└───────────────────────┘
```

**Densidad por sección**:

- Dashboard: Spacious (32px entre secciones)
- Transactions: Comfortable (16px entre items)
- Goals: Comfortable (24px entre cards)

---

## Tipografía

### Familia Tipográfica

**Primary**: Inter
- Proposito: UI principal, cuerpos de texto
- Why: Excelente legibilidad, many weights, open source

**Display**: (No hay actualmente)
- Proposito: Headers muy prominentes
- Recomendación futura: Considerar Geist o similar

### Escala Tipográfica

```scss
// Font weights
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

// Font sizes
--font-size-xs: 11px;    // Caption, timestamps
--font-size-sm: 12px;    // Labels, small info
--font-size-base: 14px;  // Body text
--font-size-lg: 16px;    // Important body
--font-size-xl: 20px;    // Section headers
--font-size-2xl: 24px;  // Page headers
--font-size-3xl: 32px;  // Dashboard main number

// Line heights
--line-height-tight: 1.2;   // Headings
--line-height-normal: 1.4;   // Body
--line-height-relaxed: 1.6; // Long text
```

### Aplicación

```scss
// Balance del dashboard (el número más prominente)
.balance-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
}

// Títulos de sección
.section-title {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
}

// Texto de contenido
.content-text {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
}

// Labels
.label-text {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

---

## Sensación Emocional

### El Objetivo Emocional

**La meta**: El usuario debe sentirse así después de usar Track Pays:

> "Entiendo mi situación financiera. Sé qué hacer. Me siento en control."

### Cómo Lograrlo Visualmente

| Sensación | Técnica Visual |
|-----------|-----------------|
| **Calma** | Colores suaves, poco contraste, whitespace generoso |
| **Control** | Números prominentes, jerarquía clara, información ordenada |
| **Dirección** | CTAs claros, Progress indicators, labels accionables |
| **Confianza** | Datos correctos, feedback inmediato, errores claros |
| **Profesionalismo** | Diseño consistente, tipografía limpia, no hay "trucos" |

### Lo que Genera lo Opuesto (Evitar)

| Sensación Negativa | Causa Visual | Solución |
|--------------------|--------------|----------|
| **Ansiedad** | Mucho rojo, demasiados números, gráficos complejos | Simplificar, reducir opciones |
| **Confusión** | Falta de jerarquía, información sin contexto | Ordenar, añadir contexto |
| **Abandono** | Empty states sin guía | Mostrar qué hacer |
| **Frustración** | Formularios largos, validación confusa | Simplificar, mensajes claros |

---

## Densidad Visual

### Niveles de Densidad

Track Pays tiene tres niveles de densidad que se aplican según el contexto:

#### 1. Spacious (Dashboard, Landing)

```scss
.dashboard {
  padding: 32px;
  gap: 32px;
  font-size: 16px;
}
```

**Cuándo usar**: Donde el usuario necesita una vista rápida, sin détails.

#### 2. Comfortable (Goals, Forms)

```scss
.goals {
  padding: 24px;
  gap: 16px;
  font-size: 14px;
}
```

**Cuándo usar**: Donde el usuario quiere información con cierto detalle, pero no está investigandomuy a fondo.

#### 3. Compact (Transactions List)

```scss
.transactions-list {
  padding: 12px;
  gap: 8px;
  font-size: 14px;
}
```

**Cuándo usar**: Donde hay muchos items (listas), y el usuario puede elegir expandir para detalles.

### Regla de Densidad

La densidad debe ser inversamente proporcional a la cantidad de items:

- **Mucha información** → Compact
- **Poca información** → Spacious
- **Por defecto** → Comfortable

---

## Motion Philosophy

### Principios de Animación

**La regla**: La animación tiene un propósito, no es decorativa.

**Propósitos válidos**:

1. **Orientación**: El usuario sabe que algo cambió (navegación entre páginas)
2. **Feedback**: El usuario sabe que su acción fue reconocida (botón clickeado, dato guardado)
3. **Atención**: El usuario nota algo importante (toast de éxito, error)
4. **Contexto**: El usuario entiende la relación entre elementos (modal abre)

**Propósito NO válido**:

- Solo "se ve nice"
- Decorar una interfaz que no tiene suficiente contenido

### Duraciones

```scss
// Timing
--duration-instant: 0ms;
--duration-fast: 150ms;      // Micro-interacciones (hover, click)
--duration-normal: 250ms;     // Transiciones de UI (modal open)
--duration-slow: 400ms;       // Transiciones de página
```

### Tipos de Animación

#### 1. Page Transitions

```css
/* Fade + slide from right */
page-enter {
  opacity: 0;
  transform: translateX(20px);
  animation: fadeIn 250ms ease-out forwards;
}
```

#### 2. Modal/Overlay

```css
/* Fade in + scale from 95% */
modal-enter {
  opacity: 0;
  transform: scale(0.95);
  animation: modalIn 200ms ease-out forwards;
}
```

#### 3. Data Update

```css
/* Instant update - no animation */
data-update {
  /* No transition, just changes */
}
```

#### 4. Loading State

```css
/* Skeleton pulse */
@keyframes skeletonPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}
```

### Easing

```scss
// Css de transition-timing-function
--ease-default: ease-out;      // Para entrada
--ease-in: ease-in;             // Para salida
--ease-in-out: ease-in-out;     // Para cambios bidireccionales
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);  // Material-like
```

---

## Charts Philosophy

### Principio: Mínimo Viable Chart

**Regla**: Un chart solo se muestra si comunica algo que no se puede comunicar con texto.

**Charts que SÍ tienen sentido**:

- **Pie/Donut**: Distribución de gastos por categoría (top 5)
- **Bar**: Comparación de meses (últimos 6)
- **Line**: Evolución del balance (últimos 12 meses)

**Charts que NO tienen sentido**:

- Chart de una sola categoría (text es mejor)
- Chart con más de 6 categorías (agrupar en "otros")
- Chart de datos de solo un mes (el balance es suficiente)

### Estilo de Charts

**Colores**:

```scss
// Chart palette (para pie/bar)
chart-1: #2563EB;  // brand
chart-2: #10B981;  // success
chart-3: #F59E0B;  // warning
chart-4: #8B5CF6;  // purple
chart-5: #EC4899;  // pink
chart-6: #6B7280;  // gray (para "otros")
```

**Estilo general**:

- Sin grid lines (más limpio)
- Labels outside (más legible)
- Legend below (no sobre el chart)
- Tooltip con detalle (cuando hover)
- Animación subtle (entrada, no interacción)

### Chart por Tipo de Datos

| Datos | Chart Recomendado | Alternativa |
|-------|-------------------|-------------|
| Distribución por categoría | Donut | No chart si < 3 categorías |
| Comparación mensual | Bar (horizontal) | Table si < 3 meses |
| Evolución temporal | Line | No chart si < 3 puntos |
| Progreso de meta | Progress bar | No chart necesario |
| Regla 50/30/20 | Donut o Bar | Solo texto es suficiente |

---

## Resumen de Dirección Visual

| Aspecto | Decisión |
|---------|----------|
| **Estilo general** | Calm Premium - limpio, espacioso, profesional |
| **Color primario** | Azul #2563EB (brand) |
| **Background** | Blanco por defecto, dark mode opt-in |
| **Gastos** | Gris neutral (solo rojo si hay warning) |
| **Ingresos** | Verde #10B981 |
| **Tipografía** | Inter, escala jerárquica |
| **Spacing** | Grid de 4px, uso generoso |
| **Densidad** | Varía por contexto (spacious → compact) |
| **Animación** | Solo con propósito, durations cortas |
| **Charts** | Mínimo viable, solo si agregan valor |

Esta dirección visual se alinea con los principios UX: claridad, calma, control. Cada decisión visual comunica que Track Pays es un compañero financiero competente, no una herramienta intimidante.