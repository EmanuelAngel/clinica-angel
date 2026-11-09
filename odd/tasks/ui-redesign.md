# Feature: UI Redesign for Portfolio

Rediseño visual de Clínica Ángel para pieza de portfolio: sistema de diseño decidido, tokens, shell, patrones de formulario y lista, y pantallas firma. Sin cambiar comportamiento ni contratos.

## Specs

- S1: El rediseño NO debe romper nada. Contratos que los tests fijan y que se preservan: copy visible en español, `aria-label`, `name=` de formularios, query strings `vista=*`. Hooks de JS preservados: `#action_buttons`, `.slot-trigger`, `.day-btn`, `.demo-btn`, `data-slot-id`, `data-action`.
- S2: Fuente de UI es **Inter** con `tabular-nums` para datos numéricos; se elimina Source Serif 4 como fuente de interfaz. `text-5xl` prohibido en chrome de aplicación.
- S3: Tokens de tema en `src/_assets/css/main.css`: paleta petrol de marca, escalera de superficies `base-100/200/300` visible al ojo, radios `field 0.5rem / box 0.75rem / selector 1rem`, `--depth: 0` en ambos temas.
- S4: Superficies planas con borde de 1px. `shadow-xl` en cards prohibido; sombra reservada a lo que se superpone (modales, dropdowns).
- S5: `DESIGN.md` en la raíz documenta el sistema, la tabla de migración y las reglas duras. `design/` no se crea; el sistema vive en `DESIGN.md` + `main.css`.
- S6: Todo cambio visual se verifica con captura renderizada en escritorio y mobile, tema claro y oscuro.
- S7: La pantalla de agendas (`list-schedules.njk`) pasa de grilla de cards a lista/tabla: los registros son comparables entre sí.
- S8: La grilla de turnos se vuelve neutra: un slot libre no es un color de éxito; el acento queda para el marcador de "hoy"/"ahora". Una sola acción primaria por pantalla.

## Tasks

- [x] T1: (S1,S6) Pipeline de captura renderizada con Edge headless + CDP, fuera del repo. | route: inline | commit: n/a (herramienta local)
- [x] T2: (S1) Capturar el estado "antes": home, login, list-schedules y schedule-drilldown (este último desde la demo en Render, con datos reales). | route: inline | commit: n/a
- [x] T3: (S5) Escribir `DESIGN.md` con tipografía, color, superficie, radio, densidad, componentes, temas y tabla de migración. | route: inline | commit: 696bfb0
- [x] T4: (S2,S3,S4) Retokenizar `main.css` y cambiar la fuente de UI a Inter en `base.njk`. | route: inline | commit: 696bfb0
- [x] T5: (S1) Corregir regresión de tema oscuro: `text-neutral` sobre `base-100` oscuro da contraste ~1.2:1. Reemplazado por `text-base-content` en `page-info.njk`, `home.njk`, `errors/generic.njk`, `errors/not-found.njk`. | route: inline | commit: 696bfb0
- [x] T6: (S6) Verificar el "después" con capturas claro/oscuro y medir contraste WCAG de la paleta completa. | route: inline | commit: n/a
- [x] T6b: (S3) Ajustar `accent` 58%→56% y `warning` 66%→62% en claro: `accent-content` estaba en 4.34:1 y `warning-content` en 5.70:1 con `text-warning` en 3.19:1. Todos los pares de texto pasan AA salvo `text-warning` sobre superficie clara (3.73:1), documentado como deuda. | route: inline | commit: 7e31437
- [ ] T7: (S2,S3,S4) Fase 2 — shell compartido: `base.njk`, `nav-bar.njk`, `side-nav.njk`, `page-info.njk`, `result-alert.njk`, badges. | route: inline | commit: pendiente
- [ ] T8: (S1,S2) Fase 3 — patrón de formularios en las 8 vistas `create-*`/`register-*`/`edit-*`. | route: inline | commit: pendiente
- [ ] T9: (S7) Fase 4 — `list-schedules.njk` de cards a lista, y listas/tablas equivalentes. | route: inline | commit: pendiente
- [ ] T10: (S8) Fase 5 — pantallas firma: `schedule-drilldown.njk`, `compare-schedules.njk`, `professional-profile.njk`, `patient-profile.njk`. | route: inline | commit: pendiente
- [ ] T11: (S5) Fase 6 — copy de `home.njk` (hoy tiene typo "Bienvenido a la sistema" y una fecha hardcodeada), datos de demo, y capturas/GIF para el portfolio. | route: inline | commit: pendiente

## Log

- L1: "Este sistema lo quiero poner en mi portfolio, lo hice cuando la IA no era tan buena y por ende el diseño de la UI es horrendo porque lo hice con mis pocos conocimientos en frontend jajaja, ahora lo ví y me parece horrible. ¿Crees que con pasar impeccable acá podemos hacer un rediseño decente sin romper nada, haciendo que se vea decente para mostrar imagenes/gif/video de la app funcionando?"
- L2: Decisión: arrancar por el **sistema de diseño** (DESIGN.md + tokens), no por capas ni por artboards. Loop visual con capturas renderizadas locales.
- L3: Evidencia del entorno — `node_modules` estaba corrupto: todos los devDependencies presentes sin su `bin/` (jest, nodemon, eslint, prettier). Reparado con `pnpm install --force --frozen-lockfile` (lockfile sin cambios).
- L4: Evidencia del entorno — la DB local no conecta (`pool timeout ... limit=4`, `POST /auth/login → 500`). Las capturas "antes" con datos reales se tomaron de la demo en Render (`https://clinica-angel.onrender.com`). Pendiente: resolver credenciales locales para poder capturar pantallas autenticadas después de cada fase.
- L5: Hallazgo fuera de alcance — en la demo desplegada, `GET /patients/list` devuelve **500** y `GET /professionals/list` devuelve **404**. Un evaluador de portfolio que haga clic en "Pacientes" ve un error. Se reporta, no se arregla en esta feature.
- L6: Verificación de T6 — **capturas OK, suite NO ejecutable**. La suite de integración queda bloqueada por la DB inalcanzable desde local (todo test hace `prisma` contra un pool que no conecta: cuelga sin llegar a correr un solo caso). No es una falla del cambio: no hay una sola línea de JS ni de lógica en el diff. Queda pendiente que el humano apunte `.env`/`.env.test` a un MySQL local con la base migrada y sembrada, o restituya el TiDB remoto. Probanza disponible hoy: render real en Edge headless (claro/oscuro, escritorio/mobile) de home y login, más la suite de tokens compilando sin errores.
- L7: Regresión detectada y corregida en T5. Es exactamente el riesgo que el rediseño tiene que evitar: `text-neutral` se usaba como color de texto en 5 lugares, y `neutral` en DaisyUI es un color de **superficie**. En el tema oscuro antiguo funcionaba por accidente (neutral era claro); al corregir el token semántico quedó texto casi negro sobre fondo casi negro. Ningún test lo habría detectado porque ningún test asserta sobre clases ni sobre CSS.
- L8: Contraste medido, no estimado. `accent-content` sobre `accent` daba 4.34:1 con el primer valor (fallaba AA): `accent` bajó a `L 56%` → 4.72:1. `warning` bajó de 66% a 62% para subir `text-warning` de 3.19:1 a 3.73:1 sin romper el badge (4.87:1). Todos los pares de texto pasan AA salvo `text-warning` sobre superficie clara, que queda como deuda con mitigación documentada en `DESIGN.md`.
- L9: Revisión de uso de tokens en plantillas: `text-error` aparece 63 veces, `text-primary` 11, `bg-primary` 4. Los únicos `bg-primary` sin `primary-content` explícito son `bg-primary/10` (tinte claro, contraste alto) — sin riesgo. Cero colores hardcodeados, cero hex inline.
- L10: Commits de esta tanda: `696bfb0` (sistema de diseño + retoken + fix de `text-neutral`) y `7e31437` (ajuste de contraste AA). Rama `feat/ui-redesign`.
