# ADR-005: Manejo de Errores y Validación

## Status

Accepted (amended)

> **Enmienda — sin fecha**: Durante la implementación se abandonó la opción de "Excepciones Personalizadas puras" y se adoptó `neverthrow` en la capa de servicios. La decisión no fue documentada en su momento; los motivos que se reconstruyen desde el código son: (1) los errores de negocio en los servicios son tipados y enumerables en la firma JSDoc (`Result<void, SlotNotFoundError | InvalidTransitionError | ...>`), algo imposible de garantizar con `throw`; (2) el `.match()` obliga al controlador a manejar explícitamente ambas ramas en lugar de dejar que un error no capturado llegue al Global Handler. La estrategia resultante es híbrida: `neverthrow` en servicios, excepciones nativas para errores fatales e infraestructura.

## Context and Problem Statement

El sistema maneja solicitudes mixtas: SSR con Nunjucks (formularios, vistas) y endpoints API JSON. Necesita una estrategia unificada para comunicar fallos de validación (Zod), errores de reglas de negocio (dominio) y errores de sistema (base de datos) — sin duplicar lógica `try/catch` en cada controlador.

El desafío central es que los contextos de respuesta son distintos:
- **SSR/Formularios**: re-renderizar la vista con errores de campo amigables.
- **API/JSON**: retornar códigos HTTP y mensajes estructurados.
- **Errores fatales**: página de error o respuesta 500.

## Decision Drivers

- Evitar `try/catch` disperso en cada controlador.
- Mantener el "happy path" legible en los controladores.
- La capa de servicios debe comunicar errores de negocio de forma tipada y sin excepciones invisibles.
- JavaScript Vanilla — sin TypeScript, el tipado de `Result<T,E>` es más verboso pero posible con JSDoc.

## Considered Options

- Patrón Result (`neverthrow`) en toda la aplicación
- Excepciones Personalizadas + Global Error Handler polimórfico
- Estrategia híbrida: Result en servicios + Excepciones para errores fatales

## Decision Outcome

Chosen option: **Estrategia Híbrida**, con las responsabilidades divididas por capa:

1. **Validación de input (Zod)**: en la capa de infraestructura (controllers), Zod valida el input del formulario de forma segura y retorna errores estructurados para re-renderizar la vista.
2. **Errores de negocio (servicios)**: la capa `application` retorna `Result<T, CustomError>` usando `neverthrow`. Los controladores hacen `.match()` para decidir cómo responder.
3. **Errores fatales/sistema**: se delegan al `globalErrorHandler` de Express mediante `next(err)` o errores no capturados. `express-async-errors` extiende Express 4 para capturar errores en funciones async.

### Positive Consequences

- Controladores con happy path explícito — el flujo de éxito es la ruta principal.
- Los errores de negocio son tipados y enumerables en JSDoc: `Result<void, SlotNotFoundError | InvalidTransitionError | ...>`.
- Centralización de la lógica de "cómo responder" (JSON vs HTML) en el `globalErrorHandler`.
- Facilidad para logging centralizado.

### Negative Consequences

- Dos mecanismos de error coexisten — requiere disciplina para saber cuándo usar cada uno.
- El tipado JSDoc de `Result<T, E>` es más verboso que TypeScript genérico.
- Se debe evitar "tragar" errores silenciosamente en el `.match()`.

## Pros and Cons of the Options

### Patrón Result puro (`neverthrow`)

- A favor: flujo de datos completamente explícito — ningún error pasa desapercibido.
- A favor: obliga al consumidor a manejar ambas ramas (Ok/Err) — sin errores silenciosos.
- A favor: composición de operaciones con `andThen`, `mapErr`, etc.
- En contra: alta fricción con el mecanismo de middlewares de Express (`next(err)`).
- En contra: verbosidad en JSDoc para tipar `Result` con múltiples tipos de error.

### Excepciones Personalizadas + Global Handler puro

- A favor: idiomático en Node.js/Express — la comunidad lo entiende de inmediato.
- A favor: menor boilerplate — `throw new SlotNotFoundError()` es directo.
- En contra: el flujo de control no es lineal — los `throw` son saltos invisibles.
- En contra: los errores de negocio no están tipados en la firma del método, solo en `@throws` JSDoc (que no es verificado por el runtime).

### Estrategia Híbrida (elegida)

- A favor: la capa de servicios tiene errores tipados y enumerables — el compilador-linter puede verificarlos.
- A favor: los errores fatales siguen el mecanismo nativo de Express — sin reinventar la rueda.
- A favor: la validación de formularios con Zod es independiente del flujo de errores de negocio.
- Neutral: requiere que el equipo entienda cuándo usar Result vs throw — una regla simple: servicios → Result, fatal/sistema → throw.

## References

- [neverthrow](https://github.com/supermacro/neverthrow)
- [Patrón Result — video](https://youtu.be/TXt9B9OOsKE?si=oJrM1-H1a41GFOuU)
- [Node.js Error Handling Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Zod](https://zod.dev/)
- [express-async-errors](https://www.npmjs.com/package/express-async-errors)
