# ADR-006: Estrategia de Configuración de Agendas

## Status

Accepted

## Context and Problem Statement

La generación y gestión de turnos es el core del sistema y el punto más complejo. Hay dos enfoques fundamentalmente distintos: pre-generar los turnos como registros físicos en la base de datos, o calcularlos dinámicamente en tiempo de ejecución. La elección condiciona el esquema de datos, las consultas de disponibilidad y la lógica de modificación de agendas.

Un profesional puede tener múltiples configuraciones de horario (días distintos, rangos de vigencia diferentes), y el sistema debe manejar días no disponibles globales o específicos por agenda.

## Decision Drivers

- Las consultas de disponibilidad deben ser simples y performantes.
- El sistema debe soportar horarios complejos: un profesional puede atender distintos días con distintos horarios en distintos períodos del año.
- Los turnos ya reservados o confirmados no deben eliminarse al modificar una agenda.
- Se prioriza la simplicidad de las consultas SQL sobre la flexibilidad de la configuración.

## Considered Options

- Slots pre-generados (registros físicos en tabla `turnos`)
- Cálculo en tiempo de ejecución (Rule Pattern)

## Decision Outcome

Chosen option: **Slots pre-generados**, porque las consultas de disponibilidad se resuelven con SQL trivial y el comportamiento ante cambios de agenda (borrar slots futuros y regenerar) es predecible e implementable con lógica defensiva clara.

La estructura de tablas central es:

- `agendas`: configuración general del médico (duración de turno, estado activo).
- `agenda_config`: una fila por día de atención con horario y rango de vigencia — soporta horarios distintos por período.
- `turnos`: los slots físicos generados, con estado (`LIBRE`, `PROPUESTO`, `RESERVADO`, etc.).
- `dias_no_disponibles`: bloqueos globales (sin `id_agenda`) o específicos por agenda.

Al crear o modificar una agenda, se borran todos los turnos futuros que no estén en estado reservado/confirmado y se regeneran desde la nueva configuración.

### Positive Consequences

- Consultas de disponibilidad resueltas con `WHERE fecha = X AND estado = 'LIBRE'` — sin lógica compleja en el backend.
- Los slots son la fuente de verdad — el estado de cada turno es explícito en la base de datos.
- El sistema de bloqueos (globales y por agenda) es una tabla adicional simple.
- Soporte natural para horarios que varían por época del año gracias a `vigencia_desde` / `vigencia_hasta`.

### Negative Consequences

- Modificar una agenda requiere operaciones de DELETE/INSERT masivas — se debe implementar lógica defensiva para no eliminar turnos ya comprometidos.
- Mayor ocupación en base de datos que el Rule Pattern.
- Se debe validar la coherencia de fechas de vigencia (sin solapamientos para la misma agenda).
- Los pacientes con turnos afectados por un cambio de agenda son notificados manualmente por la secretaría (decisión de alcance: sin notificaciones automáticas).

## Pros and Cons of the Options

### Slots pre-generados

- A favor: las búsquedas de disponibilidad son simples — SQL estándar sin lógica de negocio.
- A favor: el estado de cada turno es visible directamente en la base de datos.
- A favor: soporta horarios complejos y variables sin lógica de cálculo en el backend.
- En contra: las modificaciones de agenda son operaciones de escritura masiva.
- En contra: mayor espacio en base de datos.
- En contra: requiere lógica defensiva cuidadosa para proteger turnos reservados durante ediciones.

### Cálculo en tiempo de ejecución (Rule Pattern)

- A favor: ocupa mucho menos espacio en base de datos — solo se persisten las reglas.
- A favor: modificar horarios no requiere DELETE/INSERT masivos.
- En contra: la lógica de generación en memoria es compleja y difícil de testear.
- En contra: las consultas SQL para "próximo turno libre" se vuelven muy complejas o requieren múltiples queries.

## References

- [Especificaciones del proyecto (Notion)](https://app.notion.com/p/Especificaciones-27a4f18b391c801e8b37fa7f9731800e)
- [Alcance y Límite (Notion)](https://app.notion.com/p/Alcance-y-L-mite-2864f18b391c80c598ffc6a1f732729f)
- [Requerimientos (Notion)](https://app.notion.com/p/Requerimientos-2b64f18b391c80278ad6d9567e288895)
