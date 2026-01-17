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
          values: req.body,
          result: {
            type: "failure",
            message: newConfigurationResult.error.message,
          },
        });

      return;
    }

    if (newConfigurationResult.isOk()) {
      // REFACTOR: Redirect to schedule list OR created schedule
      res.status(201).render(res.locals.view, {
        result: {
          type: "success",
          message: "Agenda configurada exitosamente.",
        },
      });

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
}
