# Architecture Decision Records

Este directorio contiene los registros de decisiones de arquitectura (ADR) del proyecto **Clínica Angel**, en formato [MADR v3](https://adr.github.io/madr/).

Los ADRs documentan las decisiones técnicas significativas: qué se eligió, qué alternativas se consideraron y por qué se descartaron. El objetivo es que cualquier persona que lea el código entienda no solo el *qué*, sino el *por qué*.

## Índice

| ID | Título | Estado |
|----|--------|--------|
| [ADR-001](./0001-interaccion-con-persistencia-de-datos.md) | Interacción con Persistencia de Datos | Accepted |
| [ADR-002](./0002-motor-de-plantillas-ssr.md) | Motor de Plantillas para SSR | Accepted |
| [ADR-003](./0003-autenticacion-y-sesiones.md) | Estrategia de Autenticación y Sesiones | Accepted |
| [ADR-004](./0004-arquitectura-de-la-aplicacion.md) | Arquitectura de la Aplicación | Accepted |
| [ADR-005](./0005-manejo-de-errores-y-validacion.md) | Manejo de Errores y Validación | Accepted (amended) |
| [ADR-006](./0006-configuracion-de-agendas.md) | Estrategia de Configuración de Agendas | Accepted |

## Convenciones

- Los estados posibles son: `Proposed`, `Accepted`, `Deprecated`, `Superseded by ADR-NNN`.
- Un ADR nunca se elimina ni se modifica retroactivamente. Si una decisión cambia, se crea un nuevo ADR que supersede al anterior, o se agrega una nota de enmienda (`amended`) cuando el cambio es incremental.
- Documentación de contexto detallada (requerimientos, especificaciones, casos de uso): [Notion](https://app.notion.com/p/Cl-nica-Angel-27a4f18b391c804f82f6c881ffeb87d2).
