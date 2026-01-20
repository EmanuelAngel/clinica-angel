/**
 * @typedef {object} link
 * @property {string} url - Destination URL
 * @property {string} displayName - Display name
 * @property {string} icon - Lucide icon name
 * @see https://lucide.dev/icons/
 * @example
 * ```javascript
 * export const links = [
 *   {
 *     displayName: "Mis Datos",
 *     url: "/profile",
 *     icon: "user-circle"
 *   }
 * ]
 * ```
 *
 * ```nunjucks
 * <i data-lucide="{{ link.icon }}"></i>
 * ```
 */

/**
 * @typedef {object} LinkGroup
 * @property {string} title - Display name
 * @property {Array<link>} links - Links in the group
 */

/** @type {Array<link | LinkGroup>} */
export const links = [
  {
    title: "Agendas",
    links: [
      {
        displayName: "Turnos",
        url: "/schedules",
        icon: "bell-dot",
      },
      {
        displayName: "Configurar Agenda",
        url: "/schedules/create",
        icon: "calendar-plus",
      },
      {
        displayName: "Lista de Agendas",
        url: "/schedules/list",
        icon: "calendars",
      },
    ],
  },
  {
    displayName: "Clasificaciones",
    url: "/classifications",
    icon: "tag",
  },
  {
    displayName: "Sucursales",
    url: "/locations",
    icon: "hospital",
  },
  {
    displayName: "Especialidades",
    url: "/specialties",
    icon: "star",
  },
  {
    title: "Usuarios",
    links: [
      {
        displayName: "Lista de todos",
        url: "/users",
        icon: "users",
      },
      {
        displayName: "Pacientes",
        url: "/patients",
        icon: "user-check",
      },
      {
        displayName: "Profesionales",
        url: "/professionals",
        icon: "user-circle",
      },
    ],
  },
  {
    displayName: "Obras Sociales",
    url: "/health-insurances",
    icon: "id-card",
  },
];
