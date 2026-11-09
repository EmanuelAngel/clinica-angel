# Sistema de diseño — Clínica Ángel

> `PRODUCT.md` define qué es el producto. Este documento define **cómo se ve y cómo se comporta visualmente**.
> Fuente de verdad de tokens: `src/_assets/css/main.css`. Si el CSS y este documento se contradicen, gana el CSS y se corrige este archivo.

**Stack:** Tailwind CSS 4 + DaisyUI 5, SSR con Nunjucks, español (Argentina), producto de escritorio hacia abajo.

---

## Principio rector

Clínica Ángel es una **herramienta de trabajo**, no un folleto. La persona que la usa es una secretaria con 40 turnos por delante o un paciente con un celular en la mano. La UI gana si es **legible, predecible y densa**; pierde si es decorativa.

Tres consecuencias que ordenan todo lo demás:

1. **El color es información, no decoración.** Un color saturado en pantalla tiene que significar algo. Si todo está en ámbar, nada está en ámbar.
2. **La densidad es una feature.** Más datos por pantalla, con jerarquía clara, es mejor producto que una grilla de tarjetas aireadas.
3. **Un solo foco por pantalla.** Una acción primaria visible. El resto es secundario o terciario.

---

## 1. Tipografía

**Familia de UI: Inter** (reemplaza a Source Serif 4). Razón concreta, no de gusto: la app está llena de horas, duraciones y matrículas, y Inter tiene cifras tabulares reales. Una serif de libro como fuente de interfaz hace que una grilla de turnos se lea como un PDF académico.

| Rol | Token | Tamaño / peso | Notas |
| --- | --- | --- | --- |
| Título de página | `text-2xl font-semibold tracking-tight` | 24px / 600 | **Nunca `text-5xl`** en chrome de aplicación |
| Título de sección | `text-base font-semibold` | 16px / 600 | |
| Título de card / fila | `text-sm font-semibold` | 14px / 600 | |
| Cuerpo | `text-sm` | 14px / 400 | 14px es la base del producto, no 16px |
| Etiqueta de campo | `text-xs font-medium text-base-content/70` | 12px / 500 | **Sin `uppercase`, sin `tracking-wider`** |
| Metadata / timestamp | `text-xs text-base-content/60` | 12px / 400 | |
| Dato numérico, hora, ID | `font-mono tabular-nums text-[13px]` | 13px | `tabular-nums` obligatorio en columnas de horas |

Reglas duras:

- **Sin `uppercase tracking-wider`** en etiquetas. Es el patrón más repetido del código actual y la causa principal del ruido visual: 40 etiquetas gritando al mismo volumen.
- **`text-5xl` está prohibido** en plantillas de aplicación (`page-info.njk` es la excepción a corregir).
- Cifras en columnas o grillas siempre con `tabular-nums`, o las horas bailan entre filas.
- Mono (`--font-mono`, Source Code Pro) solo para código, IDs, y valores numéricos alineados. Nunca para texto corrido.

---

## 2. Color

Dos temas, un solo criterio: **neutro cálido de base, un acento frío de marca (petrol), y semánticos que solo aparecen cuando hay algo que decir.**

### Rol de cada familia

| Familia | Uso | Prohibido |
| --- | --- | --- |
| `primary` (petrol) | Acción primaria, foco activo, tab seleccionado | Decorar cards o iconos sueltos |
| `secondary` (grafito) | Acción secundaria de igual peso visual | Competir con `primary` |
| `accent` (arcilla) | Un solo gesto de marca: el marcador de "hoy", highlights puntuales | Estados de sistema |
| `base-*` | Superficies y bordes | — |
| `success` / `warning` / `error` | **Excepciones**: algo salió bien, algo requiere atención, algo falló | Estados normales y mayoritarios |

**La regla del ámbar:** si más del ~10% de las filas de una pantalla lleva color semántico, el color está mal usado. Un turno libre es `base-content`, no verde. "En servicio" en ámbar sobre 9 de 9 cards (`list-schedules.njk`) es un defecto, no un diseño.

### Tokens

Los valores viven en `src/_assets/css/main.css` (`@plugin "daisyui/theme"`). Los pares claro/oscuro deben mantener contraste AA en texto y en `-content` sobre su color.

Criterio de construcción:

- `base-100 → base-200 → base-300` es una escalera de **superficies y bordes**: cada salto tiene que ser visible a ojo. Un `base-300` a 2 puntos de luminancia del `base-200` no es un borde, es una ilusión.
- Los semánticos se eligen por **contraste sobre la superficie**, no por saturación. Verde neón sobre blanco es ilegible; verde profundo no.

---

## 3. Superficie, borde y elevación

**Decisión: superficies planas con borde de 1px. La sombra no es decoración.**

| Nivel | Uso | Implementación |
| --- | --- | --- |
| 0 — plano | Contenido, cards, tablas, strips de métricas | `bg-base-100` + `border border-base-300`, **sin sombra** |
| 1 — superficie | Paneles que agrupan (sidebar, header de sección) | `bg-base-200`, sin borde salvo separación |
| 2 — flotante | Solo lo que se superpone al contenido | `shadow-lg` + `border border-base-300`: modales, dropdowns, popovers |

Reglas duras:

- **`shadow-xl` en cards está prohibido.** Una card de contención no flota. La sombra comunica "esto está por encima"; si nada está por encima, no hay sombra.
- Una card sobre `base-100` con `bg-base-100` es invisible. Si el contenedor no aporta, se saca el contenedor.
- Nada de card dentro de card del mismo tono. Si dos niveles comparten `bg-base-200`, uno de los dos sobra.

---

## 4. Radio

| Token | Valor | Aplica a |
| --- | --- | --- |
| `--radius-field` | `0.5rem` | Inputs, selects, botones |
| `--radius-box` | `0.75rem` | Cards, modales, paneles |
| `--radius-selector` | `1rem` | Badges, checkboxes, toggles (default de DaisyUI) |

El `0.25rem` global actual es lo que hace que todo se vea de 2014: esquinas casi rectas en botones y cards al mismo tiempo. La regla es **radio mayor en contenedores que en controles**, nunca al revés ni iguales.

---

## 5. Densidad y ritmo vertical

Base de espaciado **4px**. La escala permitida: `1, 2, 3, 4, 6, 8, 12, 16` (×4px). Cualquier otro valor es un error de tipeo, no una decisión.

Ritmo dentro de un bloque de datos:

| Relación | Separación |
| --- | --- |
| Etiqueta → su valor | `2px` (`space-y-0.5`) |
| Campo → campo | `12px` (`space-y-3`) |
| Grupo → grupo | `24px` (`space-y-6`) |
| Sección → sección | `32px` (`mt-8`) |

Regla dura: **el ritmo vertical no se decide por pantalla.** Si dos pantallas agrupan la misma información con separaciones distintas, una está mal. Hoy `list-schedules.njk` usa `mb-2 / mt-4 / space-y-3 / mb-1` en el mismo bloque.

---

## 6. Componentes

### Botones

- Una sola acción `btn-primary` por pantalla.
- Acciones destructivas (cancelar turno, borrar bloqueo) en `btn-error` o `btn-ghost text-error`. "Registrar imprevisto" **no** es destructivo: no va en rojo.
- Tres botones de igual peso en una toolbar (`drilldown`: azul + rojo + ámbar) es una pantalla sin jerarquía. Se resuelve con un primario y el resto `btn-ghost`/`btn-outline`, o un menú de acciones.
- Tamaño: `btn-sm` en toolbars y filas de tabla; `btn` en formularios; `btn-lg` solo en la acción principal de una pantalla vacía.

### Badges y estados

Un badge dice **una** cosa. El patrón actual de `list-schedules.njk` apila 3 badges por entidad (especialidad + pausa + borrado) empujando el título a dos líneas y desalineando todos los headers.

- Estado único por badge; estado ausente = badge neutro, no badge de color.
- `badge-sm` en cards y tablas, `badge-ghost` para datos descriptivos (especialidad, tipo).
- Nada de `badge-soft badge-warning` para un estado normal.

### Cards vs tablas

**Regla de decisión:** si los registros comparten los mismos campos y se comparan entre sí, es **tabla o lista**. Si cada registro tiene contenido heterogéneo, es **card**.

`list-schedules.njk` hoy muestra 9 agendas como 9 cards repitiendo Tipo / Ubicación / Duración / Sobreturnos: eso es una tabla disfrazada, y muestra 3× menos datos por pantalla. Va a lista.

### Formularios

- Etiqueta arriba, `text-xs font-medium`, separada del input por 4-6px. Nunca una etiqueta a 20px de su campo.
- Un formulario = una card (`bg-base-100 border border-base-300`). El bloque de demo-login **no** es otra card adentro: es contenido del mismo formulario.
- Agrupación lógica con separadores, no con cards anidadas.
- `input-error` + `validator-hint` para error; ver `.agents/skills/nunjucks-views/SKILL.md`.

### Tablas y grillas

La grilla de turnos (`schedules/views/partials/time-grid.njk`) es la pantalla firma del producto:

- Columna de horas: `font-mono tabular-nums`, `text-xs`, alineada a la derecha, **sin color**.
- Intervalos vacíos en neutro (`base-200` / texto `base-content/40`), no en verde. Una grilla neutra hace que un turno reservado salte a la vista; una grilla verde no dice nada.
- Un solo `accent` reservado para el marcador de "ahora" y el día actual.
- Filas de sub-intervalo (los guiones de `slot-cell.njk`) no se dibujan: si no hay turno, el espacio está vacío.
- Alto de fila consistente; el estado se comunica con `badge` o fondo suave, nunca con una barra que ocupa el ancho completo.

---

## 7. Temas claro y oscuro

- Ambos temas son de primera clase. Nada de `bg-white` / `text-black`: siempre `base-*` y `*-content` (ya lo exige `.agents/skills/nunjucks-views/SKILL.md`).
- El guard anti-FOUC de `src/_shared/views/layout/base.njk` (script síncrono en el `<head>`) no se toca.
- Un color de marca no se reutiliza con el mismo valor en oscuro: `primary` en oscuro sube de luminancia y baja de croma para no vibrar sobre negro.

---

## 8. Migración: de lo que hay a lo que va

Tabla de reemplazo mecánico para las fases de rediseño.

| Hoy | Va |
| --- | --- |
| `<body class="font-serif">` | `<body class="font-sans">` |
| `.font-serif { Source Serif 4 }` | eliminado |
| `text-5xl font-bold text-neutral` (títulos) | `text-2xl font-semibold tracking-tight text-base-content` |
| `text-xs uppercase tracking-wider text-base-content/60 font-semibold` (etiquetas) | `text-xs font-medium text-base-content/70` |
| `card bg-base-100 shadow-xl border border-base-200` | `card bg-base-100 border border-base-300` |
| `badge badge-soft badge-warning` (estado normal) | `badge badge-sm badge-ghost` / sin badge |
| 3 badges apilados en el header de una card | 1 badge de estado + datos en el cuerpo |
| Grilla de cards para registros comparables | tabla o lista |
| `text-green` / barra verde de ancho completo por slot libre | `bg-base-200 text-base-content/40` |
| Toolbar con 3 botones de color distinto | 1 `btn-primary` + resto `btn-ghost` |
| `dd` mono global para valores | se mantiene solo en datos numéricos alineados |

---

## 9. Reglas no negociables

1. No se rompen los contratos que los tests fijan: copy visible en español, `aria-label`, `name=` de formularios, y query strings `vista=*` (`*.int.test.js`).
2. Los hooks de JS se preservan: `#action_buttons`, `.slot-trigger`, `.day-btn`, `.demo-btn`, `data-slot-id`, `data-action`.
3. `{% extends "layout/base.njk" %}` y sus bloques (`head`, `pageInfo`, `content`, `scripts`) son la estructura obligatoria.
4. Solo colores semánticos de DaisyUI; nunca hex sueltos ni `bg-white`.
5. Iconos vía Lucide `<i data-lucide="...">`. Un icono por control, y solo si aclara la acción.
6. Todo cambio visual se verifica con captura renderizada, en escritorio y mobile, en claro y oscuro. Un cambio de UI sin captura no está verificado.
