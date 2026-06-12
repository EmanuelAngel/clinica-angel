# ADR-004: Arquitectura de la Aplicación

## Status

Accepted

## Context and Problem Statement

El proyecto tiene la magnitud suficiente como para necesitar una estructura clara. El profesor recomendó MVC, pero no lo impuso. Se evaluaron alternativas para encontrar la estructura que mejor combina mantenibilidad, testabilidad y una DX razonable para un monolito de esta escala.

## Decision Drivers

- El proyecto tiene múltiples módulos de dominio (usuarios, pacientes, profesionales, agendas, turnos, etc.).
- Se quiere facilitar el testing de la lógica de negocio sin levantar la base de datos ni el servidor HTTP.
- Se quiere una estructura de carpetas donde sea inmediatamente obvio dónde vive cada cosa (Screaming Architecture).
- El lenguaje es JavaScript Vanilla — no hay interfaces nativas, lo que condiciona la estrategia de tipado.

## Considered Options

- Sin estructura definida
- Patrón MVC clásico
- Arquitectura Modular con influencia de Clean Architecture (opción propia)

## Decision Outcome

Chosen option: **Arquitectura Modular con influencia de Clean Architecture**, porque resuelve los problemas de testabilidad, organización y escalabilidad que MVC no cubre completamente, sin el overhead de una Clean Architecture estricta.

La estructura combina:
- **Vertical Slicing por módulo**: cada dominio tiene su propia carpeta (`users/`, `schedules/`, etc.) con capas internas.
- **Capas internas**: `domain/` (entidades e interfaces JSDoc), `application/` (servicios/casos de uso), `infrastructure/` (Prisma repos, controllers, routes), `views/` (templates Nunjucks).
- **Composition Root centralizado**: `_shared/infrastructure/services-container.js` instancia y conecta todos los repositorios y servicios.
- **Tipado suave**: JSDoc + ESLint con reglas de JSDoc estrictas simulan interfaces y alertan en tiempo real.

### Positive Consequences

- **Testabilidad**: la capa `application` puede testearse con mocks de repositorios, sin levantar Express ni la DB.
- **Navegabilidad**: la estructura de carpetas "grita" el dominio — encontrar dónde está algo es inmediato.
- **Desacoplamiento**: la regla de dependencia (infra → application → domain) previene que la lógica de negocio conozca Prisma o Express.
- **Mantenibilidad**: el patrón Repositorio aísla el ORM; cambiar de Prisma sería localizado.

### Negative Consequences

- **Boilerplate**: un módulo simple requiere crear 3-4 archivos. Para un CRUD básico, el overhead es visible.
- **Configuración inicial**: el wiring de dependencias en el Composition Root es un esfuerzo extra al agregar cada módulo.

## Pros and Cons of the Options

### Sin estructura definida

- A favor: permite enfocarse inmediatamente en el desarrollo.
- En contra: sin separación de responsabilidades, todo termina mezclado.
- En contra: el acoplamiento hace que el código sea difícil de testear, escalar y mantener.

### Patrón MVC clásico

- A favor: separación clara entre Modelo, Vista y Controlador.
- A favor: ampliamente conocido y documentado.
- En contra: tiende a mezclar lógica de negocio dentro de los controladores.
- En contra: la estructura por tipo (`controllers/`, `models/`) resulta en carpetas con 15+ archivos sin relación temática obvia.
- En contra: no hay capa de servicio — dificulta el testing unitario de la lógica de negocio.

### Arquitectura Modular con influencia de Clean Architecture

- A favor: estructura por dominio — cada módulo es autocontenido.
- A favor: la capa `application` es testeable de forma aislada con mocks.
- A favor: la regla de dependencia previene el acoplamiento entre capas.
- A favor: el JSDoc + ESLint strict simula interfaces, alertando cuando una implementación no cumple el contrato.
- En contra: más boilerplate que MVC para módulos simples.
- En contra: la configuración del Composition Root es manual — hay que registrar cada dependencia.

## References

- [Clean Architecture — Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Arquitectura Hexagonal (Puertos y Adaptadores)](https://youtu.be/r8-3Iv7XExE)
- [Patrón Repositorio](https://youtu.be/47Y0wN7o6Sg)
- [Interfaces Virtuales con JSDoc](https://jsdoc.app/tags-interface)
- [Patrón MVC — MDN](https://developer.mozilla.org/en-US/docs/Glossary/MVC)
