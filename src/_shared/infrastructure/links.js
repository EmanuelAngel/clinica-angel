/**
 * @typedef {object} link
 * @property {string} url - Destination URL
 * @property {string} displayName - Display name
 * @property {string} icon - Lucide icon name
 * @property {string[]} [roles] - Roles allowed to see this link. Omit for everyone.
 * @see https://lucide.dev/icons/
 * @typedef {object} LinkGroup
 * @property {string} title - Display name of the menu
 * @property {string} icon - Lucide icon name
 * @property {string[]} [roles] - Roles allowed to see the whole menu
 * @property {Array<link>} links - Links in the group
 */

/**
 * Navigation for every role. Each entry declares the roles that may see it,
 * so nobody gets a menu item that answers 403. Templates filter on
 * `link.roles` / `group.roles` using the session user.
 * @type {Array<link | LinkGroup>}
 */
export const links = [
  {
    title: "Agenda",
    icon: "calendar-days",
    roles: ["ADMIN", "SECRETARY"],
    links: [
      {
        displayName: "Lista de agendas",
        url: "/schedules/list",
        icon: "calendars",
        roles: ["ADMIN"],
      },
      {
        displayName: "Configurar agenda",
        url: "/schedules/create",
        icon: "calendar-plus",
        roles: ["ADMIN"],
      },
      {
        displayName: "Buscar turnos",
        url: "/schedules/compare",
        icon: "search",
      },
      {
        displayName: "Reprogramaciones",
        url: "/schedules/reschedule",
        icon: "refresh-cw",
      },
    ],
  },
  {
    title: "Personas",
    icon: "users",
    roles: ["ADMIN", "SECRETARY"],
    links: [
      {
        displayName: "Pacientes",
        url: "/patients",
        icon: "user-check",
      },
      {
        displayName: "Profesionales",
        url: "/professionals",
        icon: "stethoscope",
        roles: ["ADMIN"],
      },
      {
        displayName: "Usuarios",
        url: "/users",
        icon: "user-round",
      },
    ],
  },
  {
    title: "Catálogos",
    icon: "tags",
    roles: ["ADMIN"],
    links: [
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
        displayName: "Obras sociales",
        url: "/health-insurances",
        icon: "id-card",
      },
    ],
  },
  {
    displayName: "Profesionales",
    url: "/professionals",
    icon: "stethoscope",
    roles: ["PROFESSIONAL"],
  },
  {
    displayName: "Buscar turnos",
    url: "/schedules/compare",
    icon: "search",
    roles: ["PATIENT", "PROFESSIONAL"],
  },
];
