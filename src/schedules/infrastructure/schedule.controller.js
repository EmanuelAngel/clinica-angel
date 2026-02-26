import z from "zod";
import { services } from "../../_shared/infrastructure/services-container.js";
import {
  validateCreateSchedule,
  validateRegisterBlock,
} from "./schedule.schemas.js";
import {
  validateComparisonFilters,
  hasActiveFilters,
} from "./schedule-comparison.schemas.js";
import {
  calculateDateRange,
  VISTA_STEPS,
  VALID_VISTAS,
} from "./date-range.utils.js";

export class ScheduleController {
  /**
   *
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async create(req, res) {
    res.locals.view = "configure-schedule";

    const [classifications, locations, professionals] = await Promise.all([
      services.classificationService.findAll(),
      services.locationService.findAll(),
      services.professionalService.findAll(),
    ]);

    res.locals.viewData = {
      classifications,
      locations,
      professionals,
    };

    const validationResult = await validateCreateSchedule(req.body);

    if (!validationResult.success) {
      res.status(422).render(res.locals.view, {
        ...res.locals.viewData,
        title: "Configurar Agenda",
        values: req.body,
        errors: z.treeifyError(validationResult.error),
        result: {
          type: "failure",
          message: "Revise el formulario e intente nuevamente.",
        },
      });

      return;
    }

    const newConfigurationResult = await services.scheduleService.configure(
      validationResult.data
    );

    if (newConfigurationResult.isErr()) {
      res
        .status(newConfigurationResult.error.statusCode)
        .render(res.locals.view, {
          ...res.locals.viewData,
          title: "Configurar Agenda",
          values: req.body,
          result: {
            type: "failure",
            message: newConfigurationResult.error.message,
          },
        });

      return;
    }

    if (newConfigurationResult.isOk()) {
      res.redirect("/schedules/list");
      return;
    }
  }

  /**
   * Renders the schedule creation form.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async showCreate(req, res) {
    const [classifications, locations, professionals] = await Promise.all([
      services.classificationService.findAll(),
      services.locationService.findAll(),
      services.professionalService.findAll(),
    ]);

    res.render("configure-schedule", {
      classifications,
      locations,
      professionals,
    });
  }

  /**
   * Renders the schedule list.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async renderList(req, res) {
    const schedules = await services.scheduleService.listSchedules();
    res.render("list-schedules", { schedules });
  }

  /**
   * Renders the schedule details page.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>}
   */
  async showDetails(req, res) {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res
        .status(400)
        .render("404", { message: "ID de agenda inválido" });
    }

    const result = await services.scheduleService.getScheduleDetails(id);

    result.match(
      (schedule) => res.render("show-schedule", { schedule }),
      (error) =>
        res.status(error.statusCode).render("404", { message: error.message })
    );
  }

  /**
   * Renders the schedule comparison view.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>}
   */
  async showComparison(req, res) {
    // Load dropdown options
    const [classifications, locations, professionals, specialties, patients] =
      await Promise.all([
        services.classificationService.findAll(),
        services.locationService.findAll(),
        services.professionalService.findAll(),
        services.specialtyService.findAll(),
        services.patientService.listAll(),
      ]);

    // Validate filter params
    const validationResult = await validateComparisonFilters(req.query);

    if (!validationResult.success) {
      // If validation fails, show empty state with error
      return res.status(422).render("compare-schedules", {
        classifications,
        locations,
        professionals,
        specialties,
        patients,
        filters: req.query,
        hasFilters: false,
        schedules: [],
        date: new Date(),
        userRole: req.user?.role,
      });
    }

    const filters = validationResult.data;
    const hasFilters = hasActiveFilters(filters);

    // Only fetch schedules if filters are applied
    let schedules = [];
    if (hasFilters) {
      schedules =
        await services.scheduleService.getSchedulesForComparison(filters);
    }

    res.render("compare-schedules", {
      classifications,
      locations,
      professionals,
      specialties,
      patients,
      filters,
      hasFilters,
      schedules,
      date: filters.date,
      userRole: req.user?.role,
    });
  }

  /**
   * Renders the drill-down agenda view for a single schedule.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>}
   */
  async showDrilldown(req, res) {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).render("errors/generic", {
        error: {
          message: "ID de agenda inválido",
          statusCode: 400,
        },
      });
    }

    // Parse vista and fecha from query params
    const vista = VALID_VISTAS.includes(req.query.vista)
      ? req.query.vista
      : "hoy";

    let fecha;
    if (req.query.fecha && /^\d{4}-\d{2}-\d{2}$/.test(req.query.fecha)) {
      const [year, month, day] = req.query.fecha.split("-").map(Number);
      fecha = new Date(year, month - 1, day, 0, 0, 0, 0);
    } else {
      const now = new Date();
      fecha = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
      );
    }

    const { startDate, endDate, dates } = calculateDateRange(vista, fecha);

    const [result, patients] = await Promise.all([
      services.scheduleService.getScheduleForDrilldown(
        id,
        startDate,
        endDate,
        dates
      ),
      services.patientService.listAll(),
    ]);

    if (result.isErr()) {
      return res.status(result.error.statusCode).render("errors/generic", {
        error: {
          message: result.error.message,
          statusCode: result.error.statusCode,
        },
      });
    }

    const { schedule, days } = result.value;

    res.render("schedule-drilldown", {
      schedule,
      days,
      vista,
      fecha,
      vistaSteps: VISTA_STEPS,
      patients,
      userRole: req.user?.role,
    });
  }

  /**
   * Returns slot details as JSON.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async getSlotDetails(req, res) {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ message: "ID de turno inválido" });

      return;
    }

    const result = await services.scheduleService.getSlotDetails(id);

    result.match(
      (slot) => {
        // Redact personal info if not ADMIN/SECRETARY
        const userRole = req.user?.role;
        if (userRole !== "ADMIN" && userRole !== "SECRETARY") {
          if (slot.patient) {
            slot.patient.email = "REDACTED";
            slot.patient.phone = "REDACTED";
            slot.patient.address = "REDACTED";
            slot.patient.nationalId = "REDACTED";
            slot.patient.nationalIdImageUrl = null;
          }
        }
        res.json(slot);
      },
      (error) => res.status(error.statusCode).json({ message: error.message })
    );
  }

  /**
   * Updates a slot's status.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async updateSlotStatus(req, res) {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (isNaN(id)) {
      res.status(400).json({ message: "ID de turno inválido" });

      return;
    }

    const result = await services.scheduleService.updateSlotStatus(id, status);

    result.match(
      () => res.json({ message: "Estado actualizado (simulado)" }),
      (error) => res.status(error.statusCode).json({ message: error.message })
    );
  }

  /**
   * Registers a schedule block (unforeseen event) via JSON API.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async registerBlock(req, res) {
    const scheduleId = parseInt(req.params.id);

    if (isNaN(scheduleId)) {
      return res.status(400).json({ message: "ID de agenda inválido" });
    }

    const validationResult = await validateRegisterBlock(req.body);

    if (!validationResult.success) {
      return res.status(422).json({
        message: "Datos inválidos",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const result = await services.scheduleService.registerScheduleBlock(
      scheduleId,
      validationResult.data
    );

    result.match(
      (data) =>
        res.json({
          message: `Bloqueo registrado. ${data.deletedFree} turnos libres eliminados, ${data.markedReschedule} turnos marcados para reasignar.`,
          ...data,
        }),
      (error) => res.status(error.statusCode).json({ message: error.message })
    );
  }

  /**
   * Renders the reschedule inbox view.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async showRescheduleInbox(req, res) {
    const slots = await services.scheduleService.getSlotsNeedingReschedule();
    res.render("reschedule-inbox", { slots });
  }
}
