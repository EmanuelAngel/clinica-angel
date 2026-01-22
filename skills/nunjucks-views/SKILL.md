---
name: nunjucks-views
description: >
  Guidelines for creating and managing Nunjucks templates in the clinica-angel project.
  Trigger: When creating or modifying .njk files, UI components, or layouts.
license: MIT
metadata:
  author: angel-emanuel
  version: "1.0"
---

## When to Use

Use this skill when:

- Creating new feature views in `src/<feature>/views/`.
- Modifying global layouts in `src/_shared/views/layout/`.
- Building reusable UI components using Nunjucks macros or partials.
- Implementing frontend logic that interacts with Server-Side Rendered (SSR) content.

## Critical Patterns

### 1. Directory Structure

Views must be placed in the `views` folder of their respective feature module:

- `src/_shared/views/`: Common layouts (`layout/`), partials (`partials/`), and errors.
- `src/<feature>/views/`: Feature-specific templates (e.g., `src/users/views/`).

### 2. Layout Inheritance

All pages should extend the base layout to maintain consistency and include necessary assets.

```nunjucks
{% extends "layout/base.njk" %}

{% set title = "Page Title" %}

{% block pageInfo %}
  {# Optional: Breadcrumbs, page headers, etc. #}
{% endblock %}

{% block content %}
  {# Main page content #}
{% endblock %}

{% block scripts %}
  {# Page-specific scripts #}
{% endblock %}
```

### 3. Design System (DaisyUI & Tailwind CSS)

- Use **DaisyUI** components for common UI elements (buttons, inputs, cards, modals).
- Use **Tailwind CSS** utility classes for layout and spacing.
- Always use semantic colors from DaisyUI (e.g., `btn-primary`, `text-error`, `bg-base-200`).

### 4. Icons

The project uses **Lucide** icons.

- Add an `<i>` tag with `data-lucide="{icon-name}"`.
- Ensure `lucide.createIcons()` is called (handled automatically in `base.njk` for static content).

```html
<i data-lucide="plus-circle"></i>
```

### 5. Forms and Validation

- For standard SEO-friendly pages, use traditional `<form method="POST">`.
- For interactive pages, use `fetch()` and JSON as described in specific feature tasks.
- Always include helpful error messages using the `result-alert.njk` partial when applicable.

### 6. Themes

The project supports light/dark/system themes.

- CSS variables are defined in the theme configuration.
- Avoid hardcoding colors like `bg-white` or `text-black`. Use `bg-base-100` and `text-base-content`.

## Code Examples

### Basic Form Template

```njk
{% extends "layout/base.njk" %}

{% set title = "Crear Nuevo" %}

{% block content %}
<div class="card bg-base-100 shadow-xl max-w-2xl mx-auto">
  <div class="card-body">
    <h2 class="card-title text-2xl mb-6">Nueva Entidad</h2>

    <form action="/target-route" method="POST" class="space-y-4">
      <div class="form-control w-full">
        <label class="label">
          <span class="label-text">Nombre</span>
        </label>
        <input type="text" name="name" placeholder="Ej: Juan" class="input input-bordered w-full" required />
      </div>

      <div class="card-actions justify-end mt-6">
        <button type="submit" class="btn btn-primary">
          <i data-lucide="save" class="w-4 h-4 mr-2"></i>
          Guardar
        </button>
      </div>
    </form>
  </div>
</div>
{% endblock %}
```

## Commands

```bash
# Watch for CSS changes during development
pnpm run css:watch

# Build production CSS
pnpm run css:build
```

## Resources

- **Templates**: `src/_shared/views/layout/base.njk`
- **Documentation**: [DaisyUI Docs](https://daisyui.com/components/)
