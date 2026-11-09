# Producto

<!-- impeccable:product-schema 1 -->

## Platform

web

## Usuarios

Dos usuarios pesan lo mismo en cualquier decisión de producto:

- **Pacientes**: reservan, reprograman y siguen sus turnos por sí mismos, desde el navegador, en español y sin capacitación previa.
- **Personal administrativo (ADMIN / SECRETARY)**: administra el día a día: usuarios, pacientes, profesionales, especialidades, coberturas, clasificaciones, sedes, agendas y turnos.

Rol adicional confirmado en el dominio: **PROFESSIONAL** (profesional con matrícula, especialidades y agendas propias).

## Product Purpose

Sistema de gestión de turnos médicos: el paciente autogestiona su reserva y la administración gestiona agendas, profesionales y coberturas médicas dentro del mismo sistema.

El éxito tiene dos formas y las dos cuentan:

1. El circuito completo funciona de punta a punta: un paciente se registra, reserva y reprograma; la secretaría configura agendas, bloquea días y reasigna turnos.
2. El artefacto demuestra oficio de ingeniería ante quien lo evalúa.

## Positioning

El diferencial es el **circuito completo en un solo monolito**: autoservicio del paciente y back office administrativo en el mismo proceso, sobre el mismo modelo de datos y las mismas reglas de dominio. Lo que lo sostiene, y que un scheduler de turnos genérico no copia sin trabajo:

- Turnos materializados en la base a partir de la configuración de agenda (ADR 006), no calculados en memoria por request.
- Sobreturnos con cupo explícito por día y por franja (`max_overbooks_per_day`, `max_overbooks_per_slot`).
- Máquina de estados del turno: `FREE`, `PROPOSED`, `BOOKED`, `CANCELLED`, `NO_SHOW`, `ARRIVED`, `IN_PROGRESS`, `FULFILLED`.
- Lista de espera como circuito propio, con preferencia por especialidad o por profesional.
- Bloqueos de agenda globales y por agenda, con motivo.

## Operating Context

- Proyecto de **Laboratorio 2, Universidad de La Punta (San Luis, Argentina)**, autor Emanuel Angel. Hoy se posiciona como **pieza de portfolio**.
- UI en **español (Argentina)**; el producto se usa en navegador con SSR, de escritorio hacia abajo.
- Referencias que el trabajo futuro debe leer antes de proponer: ADRs en `docs/adr/` (001–006) y las especificaciones, alcance y casos de uso en Notion (link en `README.md`).
- Entorno local: Node.js 22+, MariaDB/MySQL, pnpm, `pnpm dev`; datos de demo con `pnpm db:seed`.

## Capabilities and Constraints

Módulos confirmados en el código: `auth`, `users`, `patients`, `professionals`, `specialties`, `health-insurances`, `classifications`, `locations`, `schedules`, `slots`, `waiting-list`, `global-blocks`.

Hechos técnicos vigentes:

- SSR con Nunjucks + Tailwind CSS 4 + DaisyUI 5; JavaScript puro tipado con JSDoc; Express 4; Prisma 7 sobre MariaDB.
- Auth con JWT en cookie HttpOnly; errores de dominio como `Result<T, E>` (`neverthrow`), excepciones para fallos fatales.
- Tests de integración con Jest + Supertest contra base de test real; 84.5% de cobertura de statements.

**Estado de las restricciones académicas: ya no condicionan nada.** El stack actual es la implementación vigente, no un límite impuesto por la cátedra: cambiarlo —incluido adoptar TypeScript o partir el monolito— es una decisión de producto abierta, no una violación.

Decisiones todavía abiertas:

- Si el producto llega a operar en una clínica real.
- Estándar de accesibilidad: no se estableció ninguno.
- Identidad visual: no existe todavía (ver Evidence on Hand).

## Brand Commitments

- Nombre: **Clínica Angel**.
- Idioma del producto y de la documentación del proyecto: español (Argentina).
- No hay voz de marca, logo ni identidad visual definidos. Ninguno debe darse por supuesto.

## Evidence on Hand

- Datos de demo en `prisma/seeders/`: usuarios, pacientes, profesionales, especialidades, sedes, coberturas, clasificaciones y agendas.
- Decisiones de arquitectura en `docs/adr/0001`–`0006` y ERD completo en `README.md`.
- Suite de tests que ejercita el comportamiento real de los flujos (integración + unitarios de dominio).

Ausencias que el trabajo futuro **no debe fabricar**: no hay logo, imágenes ni identidad visual (`src/_assets/images/` está vacío); no hay pacientes reales, testimonios, prensa, métricas de uso ni deployment en producción; no hay precios.

## Product Principles

1. **El circuito no se parte.** Cada cambio tiene que dejar funcionando el autoservicio del paciente y el back office como un mismo camino; un flujo a medias es un demo, no el producto.
2. **El mecanismo se muestra.** Generación de turnos, cupos de sobreturno, bloqueos y lista de espera son parte del argumento: visibles, inspeccionables y cubiertos por tests.
3. **Las reglas viven en el dominio.** La máquina de estados y las validaciones no se reimplementan en el template ni en el controller.
4. **Nada se afirma sin rastro.** Toda cifra, dato o comportamiento que la interfaz muestre debe poder señalarse en un ADR, una spec o un test.
5. **Operación explícita.** Las acciones que tocan turnos ajenos —bloquear, cancelar, reasignar, sobreturnar— dicen qué hacen y por qué, nunca en silencio.
