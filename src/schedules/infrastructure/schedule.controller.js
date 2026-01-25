import z from "zod";
import { services } from "../../_shared/infrastructure/services-container.js";
import { validateCreateSchedule } from "./schedule.schemas.js";

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
}
