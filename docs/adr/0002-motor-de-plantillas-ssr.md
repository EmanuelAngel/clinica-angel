# ADR-002: Motor de Plantillas para SSR

## Status

Accepted

## Context and Problem Statement

El sistema requiere un motor de plantillas para Express.js para implementar Server-Side Rendering. El criterio no es solo "funciona", sino cuál ofrece la mejor DX para un proyecto modular donde cada feature tiene su propia carpeta de vistas, y las plantillas necesitan herencia de layouts, bloques y soporte para Tailwind CSS.

## Decision Drivers

- El proyecto necesita múltiples rutas de vistas (una por módulo/feature).
- Se requiere herencia de layouts y bloques para evitar duplicación de estructura HTML.
- La sintaxis debe ser compatible con las utility-classes de Tailwind CSS.
- Experiencia previa con Jinja2 (Python) es transferible.

## Considered Options

- EJS
- Mustache / Handlebars
- Pug
- Nunjucks

## Decision Outcome

Chosen option: **Nunjucks**, porque es el único motor que combina soporte nativo de herencia de layouts, múltiples rutas de vistas y sintaxis HTML-compatible (sin romper Tailwind). La experiencia previa con Jinja2 elimina la curva de aprendizaje.

### Positive Consequences

- Arquitectura de vistas modular: cada slice tiene su propia carpeta de templates registrada en `app.js`.
- Herencia de layouts y bloques permiten inyectar metadatos, scripts y contenido por-vista sin archivos estáticos externos.
- Sintaxis familiar — casi idéntica a Jinja2/Django templates.
- Extensiones de VS Code mejoran el highlighting y la DX.

### Negative Consequences

- Es el motor con menos descargas mensuales (~1.5M/mes vs 18M de EJS), lo que limita el soporte comunitario.
- Herramientas de formateo y linting escasas (djLint no dio buena experiencia).
- Menos recursos disponibles para bugs poco comunes.

## Pros and Cons of the Options

### EJS

- A favor: es el motor más popular (18M descargas/mes) con buen ecosistema de herramientas.
- A favor: sintaxis HTML tradicional, curva de aprendizaje mínima.
- A favor: soporta partials.
- En contra: no soporta herencia de layouts ni bloques nativos.
- En contra: no soporta múltiples rutas de vistas.
- En contra: no soporta mixins ni componentización real.

### Mustache / Handlebars

- A favor: Handlebars es popular (~15M descargas/mes) y bien documentado.
- A favor: lógica mínima fuerza la separación entre presentación y datos.
- En contra: la lógica mínima es también su mayor limitación para casos no triviales.
- En contra: no soporta herencia de layouts de forma nativa.
- En contra: no soporta múltiples rutas de vistas con Express.

### Pug

- A favor: es el más potente — partials, macros, herencia, bloques.
- En contra: sintaxis basada en indentación, totalmente distinta a HTML — incompatible con Tailwind utility-classes.
- En contra: baja adopción (~2M descargas/mes).
- En contra: no soporta múltiples rutas de vistas.

### Nunjucks

- A favor: herencia de layouts y bloques nativos — crucial para la arquitectura del proyecto.
- A favor: soporta múltiples rutas de vistas — permite que cada módulo tenga su propia carpeta `views/`.
- A favor: sintaxis basada en HTML, 100% compatible con Tailwind.
- A favor: mantenido por Mozilla — continuidad garantizada.
- A favor: inspirado en Jinja2, lo que elimina la curva de aprendizaje.
- En contra: la menor popularidad implica menos recursos y herramientas de formateo.

## References

- [Nunjucks Docs](https://mozilla.github.io/nunjucks/)
- [EJS Docs](https://ejs.co/)
- [Handlebars Docs](https://handlebarsjs.com/)
- [Pug Docs](https://pugjs.org/api/getting-started.html)
