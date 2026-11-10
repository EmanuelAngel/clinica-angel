import nunjucks from "nunjucks";
import "../../app.js"; // configures the shared Nunjucks environment

import { Roles } from "../../auth/domain/roles.js";

const renderGrid = (columns, rows, userRole) =>
  nunjucks.renderString(
    `{% import "partials/time-grid.njk" as grid %}{{ grid.render(columns, rows, userRole, "Sin turnos") }}`,
    { columns, rows, userRole }
  );

describe("time-grid macro", () => {
  const blocked = {
    label: "Dr. Block",
    slots: [],
    dayBlock: { reason: "Congreso" },
  };

  test("renders the block marker for staff when a blocked day has no rows", () => {
    const html = renderGrid([blocked], [], Roles.ADMIN);

    expect(html).toContain("Bloqueado");
    expect(html).toContain("Congreso");
    expect(html).not.toContain("Sin turnos");
  });

  test("renders the unavailable state for a patient when a blocked day has no rows", () => {
    const html = renderGrid([blocked], [], Roles.PATIENT);

    expect(html).toContain("No disponible");
    expect(html).not.toContain("Sin turnos");
  });

  test("keeps the empty message when no column is blocked and there are no rows", () => {
    const html = renderGrid(
      [{ label: "Dr. Free", slots: [] }],
      [],
      Roles.ADMIN
    );

    expect(html).toContain("Sin turnos");
    expect(html).not.toContain("<table");
  });

  test("pins the time column so labels survive horizontal scroll", () => {
    const html = renderGrid([blocked], [], Roles.ADMIN);

    expect(html).toContain("sticky left-0");
  });
});
