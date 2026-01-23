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

The project uses a two-tier validation approach:

#### Frontend (Real-time Browser Validation)

- Use the DaisyUI `validator` class on inputs.
- Use native HTML attributes: `required`, `minlength`, `maxlength`, `pattern`, `min`, `max`.
- Use the `validator-hint` div right after the input to provide feedback to the user as they type.

#### Backend (Zod Schema Validation)

- The server returns `values` (to preserve user input) and `errors` (an object containing field-specific error messages).
- Apply the `input-error` class conditionally if there's a backend error for that field.
- Display backend error messages (usually from Zod) using `{{ errors.properties.<field>[0] }}`.

### 6. Themes

The project supports light/dark/system themes.

- CSS variables are defined in the theme configuration.
- Avoid hardcoding colors like `bg-white` or `text-black`. Use `bg-base-100` and `text-base-content`.

## Code Examples

### Form with Validation and Error Handling

```njk
{% extends "layout/base.njk" %}

{% set title = "Registro de Paciente" %}

{% block content %}
<div class="card bg-base-100 shadow-xl max-w-2xl mx-auto">
  <div class="card-body">
    <h2 class="card-title text-2xl mb-6">Nuevo Paciente</h2>

    <form action="/patients/register" method="POST" class="space-y-4">
      <div class="form-control w-full">
        <label class="label">Nombres (requerido)</label>
        <input type="text"
               name="firstNames"
               value="{{ values.firstNames }}"
               class="input validator {{ 'input-error' if errors.properties.firstNames }}"
               required
               minlength="2"
               maxlength="100"
               pattern="[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]+"
               title="Solo letras, espacios, guiones o apóstrofes."
               placeholder="Nombre completo" />

        {# Backend Error Message #}
        {% if errors.properties.firstNames %}
          <div class="text-error text-sm mt-1">
            {{ errors.properties.firstNames[0] }}<
          /div>
        {% endif %}

        {# Frontend Browser Validation Hint #}
        <div class="validator-hint">
          Ingrese nombres válidos.
          <br /> Solo letras, espacios, guiones o apóstrofes.
          <br /> Mínimo 2 caracteres.
        </div>
      </div>

      <div class="card-actions justify-end mt-6">
        <button type="submit" class="btn btn-primary">
          <i data-lucide="save" class="w-4 h-4 mr-2"></i>
          Registrar
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
