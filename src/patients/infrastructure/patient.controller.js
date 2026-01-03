import z from "zod";
import { services } from "../../_shared/infrastructure/services-container.js";
import { validatePatientRegistration } from "./patient.schemas.js";
import { unlink } from "node:fs/promises";

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
    try {
      res.locals.view = "register-patient";

      const allHealthInsurances =
        await services.healthInsuranceService.findAll();

      res.locals.commonData = {
        healthInsurances: allHealthInsurances,
      };

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

      const result = await validatePatientRegistration({
        ...restOfBody,
        healthInsurances,
        nationalIdImage: req.file,
      });

      if (!result.success) {
        if (req.file) {
          await unlink(req.file.path);
        }

        res.status(422).render(res.locals.view, {
          errors: z.treeifyError(result.error),
          values: req.body,
          healthInsurances: allHealthInsurances,
          result: {
            type: "failure",
            message: "Revise el formulario e intente nuevamente.",
          },
        });

        return;
      }

      await services.patientService.register(result.data);

      res.status(201).render(res.locals.view, {
        result: {
          type: "success",
          message: "Paciente creado correctamente.",
        },
        healthInsurances: allHealthInsurances,
      });
    } catch (error) {
      if (req.file) {
        await unlink(req.file.path).catch(() => {});
      }

      throw error;
    }

    return;
  }

  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async profileView(req, res) {
    const userId = req.params.id;

    const patient = await services.patientService.getProfile(userId);

    res.render("patient-profile.njk", { patient });
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
