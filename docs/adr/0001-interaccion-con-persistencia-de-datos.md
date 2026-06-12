# ADR-001: Interacción con Persistencia de Datos

## Status

Accepted

## Context and Problem Statement

El sistema maneja múltiples entidades interconectadas (usuarios, pacientes, profesionales, agendas, turnos, etc.), lo que implica una base de datos relacional. La decisión es qué capa de abstracción usar para interactuar con ella: un driver SQL puro o un ORM.

## Decision Drivers

- El proyecto es de alcance universitario con tiempos acotados.
- Se usan múltiples entidades con relaciones complejas (muchos ABMs).
- El lenguaje es JavaScript Vanilla, sin TypeScript, por lo que el tipado automático tiene valor adicional.
- El patrón Repositorio ya está definido en la arquitectura, por lo que el ORM queda aislado detrás de una interfaz.

## Considered Options

- Driver base (`mysql2`) — SQL puro
- ORM (`Prisma`)

## Decision Outcome

Chosen option: **Prisma ORM**, porque prioriza la Developer Experience y la confiabilidad sobre el control total. Al estar aislado detrás del patrón Repositorio, cambiar de ORM en el futuro sería localizado.

### Positive Consequences

- Aceleración significativa en la implementación de la lógica de acceso a datos.
- Reducción de bugs por tipos incorrectos gracias al cliente tipado y al schema centralizado.
- Gestión de migraciones integrada (`prisma migrate`).
- Sanitización automática de inputs — protección contra SQL injection.

### Negative Consequences

- Se añade una dependencia pesada (motores binarios de Prisma).
- Se pierde visibilidad directa del SQL ejecutado, lo que requiere monitoreo extra ante problemas de performance.

## Pros and Cons of the Options

### Driver base (`mysql2`)

- A favor: máximo rendimiento y control total del SQL.
- En contra: alto riesgo de errores humanos sin TypeScript.
- En contra: gestión de migraciones completamente manual.
- En contra: requiere sanitización manual para prevenir SQL injection.
- En contra: cualquier cambio de esquema implica reescribir consultas dispersas.

### ORM (`Prisma`)

- A favor: los ABMs son rápidos de implementar gracias a los métodos del cliente.
- A favor: esquema de datos centralizado y versionado en `schema.prisma`.
- A favor: migraciones gestionadas automáticamente.
- A favor: familiaridad del equipo — curva de aprendizaje nula.
- En contra: menor rendimiento respecto a SQL puro.
- En contra: riesgo de generar consultas ineficientes sin revisión activa.

## References

- [Prisma ORM](https://www.prisma.io/orm)
- [npm: mysql2](https://www.npmjs.com/package/mysql2)
