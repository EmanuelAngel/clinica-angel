import z from "zod";
import { services } from "../../_shared/infrastructure/services-container.js";
import { validatePatientRegistration } from "./patient.schemas.js";
import { unlink } from "node:fs/promises";

import { sendNotFound } from "../../_shared/infrastructure/response-helpers.js";

export class PatientController {
  /**
   * @param {import("express").Request} _req
   * @param {import("express").Response} res
   */
  async registerView(_req, res) {
    const healthInsurances = await services.healthInsuranceService.findAll();

    res.render("register-patient", {
      healthInsurances,
    });
  }

  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async register(req, res) {
    res.locals.view = "register-patient";

    res.locals.healthInsurances =
      await services.healthInsuranceService.findAll();

    const { healthInsuranceId, memberNumber, ...restOfBody } = req.body;

    const healthInsurances =
      healthInsuranceId || memberNumber
        ? [
            {
              insuranceId:
                healthInsuranceId === "" ? undefined : healthInsuranceId,
              memberNumber: memberNumber,
            },
          ]
        : [];

    const validationResult = await validatePatientRegistration({
      ...restOfBody,
      healthInsurances,
      nationalIdImage: req.file,
    });

    if (!validationResult.success) {
      if (req.file) {
        await unlink(req.file.path);
      }

      res.status(422).render(res.locals.view, {
        errors: z.treeifyError(validationResult.error),
        values: req.body,
        result: {
          type: "failure",
          message: "Revise el formulario e intente nuevamente.",
        },
      });

      return;
    }

    const registerResult = await services.patientService.register(
      validationResult.data
    );

    registerResult.match(
      () => {
        res.status(201).render(res.locals.view, {
          result: {
            type: "success",
            message: "Paciente creado correctamente.",
          },
        });
      },
      (error) => {
        if (req.file) {
          unlink(req.file.path).catch(() => {
            // TODO: Log error
          });
        }

        res.status(error.statusCode).render(res.locals.view, {
          result: { type: "failure", message: error.message },
          values: req.body,
        });
      }
    );
  }

  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @param {import("express").NextFunction} next
   */
  async profileView(req, res, next) {
    const userId = req.params.id;

    const result = await services.patientService.getProfile(userId);

    result.match(
      (patient) => {
        res.render("patient-profile.njk", { patient });
      },
      (error) => {
        // If it's a 404, let the not-found-handler handle it.
        if (error.statusCode == 404) {
          sendNotFound(req, res, error.message);
          return;
        }

        next(error);
      }
    );
  }

  /**
   * @param {import("express").Request} _req
   * @param {import("express").Response} res
   */
  async listAll(_req, res) {
    const patients = await services.patientService.listAll();

    res.render("list-all-patients", { patients });
  }
}
