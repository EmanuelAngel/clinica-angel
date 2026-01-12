import { z } from "zod";
import { services } from "../../_shared/infrastructure/services-container.js";
import { validateCreateSchedule } from "./schedule.schema.js";

export class ScheduleController {
  /**
   * List all schedules.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async listView(req, res) {
    const schedules = await services.scheduleService.findAll();
    res.render("list-schedules", { schedules });
  }

  /**
   * Render create schedule form.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async createView(req, res) {
    // Fetch data needed for the form
    const [professionals, locations, classifications] = await Promise.all([
      services.professionalService.findAll(),
      services.locationService.findAll(),
      services.classificationService.findAll(),
    ]);

    res.render("create-schedule", {
      professionals,
      locations,
      classifications,
    });
  }

  /**
   * Handle schedule creation.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async create(req, res) {
    res.locals.view = "create-schedule";

    // Validate input
    const validationResult = await validateCreateSchedule(req.body);

    if (!validationResult.success) {
      // Fetch form data again for re-rendering
      const [professionals, locations, classifications] = await Promise.all([
        services.professionalService.findAll(),
        services.locationService.findAll(),
        services.classificationService.findAll(),
      ]);

      res.status(422).render(res.locals.view, {
        errors: z.treeifyError(validationResult.error),
        values: req.body,
        professionals,
        locations,
        classifications,
      });
      return;
    }

    // Execute use case
    const result = await services.createScheduleUseCase.execute(
      validationResult.data
    );

    result.match(
      () => {
        res.redirect("/schedules");
      },
      async (error) => {
        // Fetch form data again for re-rendering
        const [professionals, locations, classifications] = await Promise.all([
          services.professionalService.findAll(),
          services.locationService.findAll(),
          services.classificationService.findAll(),
        ]);

        /** @type {number} */
        const statusCode =
          "statusCode" in error && typeof error.statusCode === "number"
            ? error.statusCode
            : 500;

        res.status(statusCode).render(res.locals.view, {
          result: { type: "failure", message: error.message },
          values: req.body,
          professionals,
          locations,
          classifications,
        });
      }
    );
  }

  /**
   * Show schedule details with time grid.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async showView(req, res) {
    const id = parseInt(req.params.id, 10);
    const viewMode = req.query.view || "today"; // today, 3days, week

    // Calculate date range based on view mode
    const now = new Date();
    const today = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    );

    let startDate = today;
    let endDate;
    let viewLabel;

    switch (viewMode) {
      case "3days":
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 4); // Today + next 3 days
        viewLabel = "Hoy y próximos 3 días";
        break;
      case "week": {
        // Get start of current week (Monday)
        const dayOfWeek = today.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday
        startDate = new Date(today);
        startDate.setDate(today.getDate() + diff);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        viewLabel = "Semana actual";
        break;
      }
      default: // today
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1);
        viewLabel = "Hoy";
    }

    const schedule = await services.scheduleService.findByIdWithSlots(
      id,
      startDate,
      endDate
    );

    if (!schedule) {
      res.status(404).render("error", { message: "Agenda no encontrada" });
      return;
    }

    // Group slots by date for the time grid
    /** @type {Map<string, typeof schedule.slots>} */
    const slotsByDate = new Map();

    for (const slot of schedule.slots) {
      const dateKey = slot.startsAt.toISOString().split("T")[0];
      if (!slotsByDate.has(dateKey)) {
        slotsByDate.set(dateKey, []);
      }
      slotsByDate.get(dateKey).push(slot);
    }

    // Generate list of dates in range
    const dates = [];
    const currentDate = new Date(startDate);
    while (currentDate < endDate) {
      dates.push({
        key: currentDate.toISOString().split("T")[0],
        date: new Date(currentDate),
        slots: slotsByDate.get(currentDate.toISOString().split("T")[0]) || [],
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Determine time range from configs
    let minHour = 8;
    let maxHour = 22;

    if (schedule.configs.length > 0) {
      const startTimes = schedule.configs.map((c) => c.startTime.getUTCHours());
      const endTimes = schedule.configs.map((c) => c.endTime.getUTCHours());
      minHour = Math.min(...startTimes);
      maxHour = Math.max(...endTimes);
    }

    // Generate time slots for the grid (every hour)
    const hours = [];
    for (let h = minHour; h <= maxHour; h++) {
      hours.push(h);
    }

    res.render("show-schedule", {
      schedule,
      dates,
      hours,
      viewMode,
      viewLabel,
      slotDuration: schedule.slotDuration,
    });
  }
}
