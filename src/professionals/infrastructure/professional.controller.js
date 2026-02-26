import z from "zod";
import { services } from "../../_shared/infrastructure/services-container.js";
import {
  validateCreateProfessional,
  validateAddSpecialty,
} from "./professional.schemas.js";
import { sendNotFound } from "../../_shared/infrastructure/response-helpers.js";
import { Roles } from "../../auth/domain/roles.js";

export class ProfessionalController {
  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async listView(req, res) {
    const professionals = await services.professionalService.findAll();
    res.render("list-professionals", { professionals });
  }

  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async createView(req, res) {
    const specialties = await services.specialtyService.findAll();
    res.render("create-professional", { specialties });
  }

  /**
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async create(req, res) {
    res.locals.view = "create-professional";

    // Parse credentials from form data
    const body = parseCredentialsFromForm(req.body);

    const result = await validateCreateProfessional(body);

    if (!result.success) {
      const specialties = await services.specialtyService.findAll();
      res.status(422).render(res.locals.view, {
        errors: z.treeifyError(result.error),
        values: req.body,
        specialties,
      });
      return;
    }

    const createResult = await services.professionalService.create(result.data);

    createResult.match(
      () => {
        res.status(201).render(res.locals.view, {
          result: {
            message: "Profesional registrado correctamente.",
            type: "success",
          },
          specialties: [],
        });
      },
      async (error) => {
        const specialties = await services.specialtyService.findAll();
        res.status(error.statusCode).render(res.locals.view, {
          result: { type: "failure", message: error.message },
          values: req.body,
          specialties,
        });
      }
    );
  }

  /**
   * Renders the professional profile with specialties and slot agenda.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @param {import("express").NextFunction} next
   */
  async profileView(req, res, next) {
    const result = await services.professionalService.getProfileWithSlots(
      +req.params.id
    );

    result.match(
      async (data) => {
        const isAdmin = res.locals.user?.role === Roles.ADMIN;
        let allSpecialties = [];

        if (isAdmin) {
          allSpecialties = await services.specialtyService.findAll();
        }

        res.render("professional-profile", {
          professional: data.professional,
          specialties: data.specialties,
          slotsPast: data.slotsPast,
          slotsToday: data.slotsToday,
          slotsFuture: data.slotsFuture,
          schedules: data.schedules,
          isAdmin,
          allSpecialties,
        });
      },
      (error) => {
        if (error.statusCode === 404) {
          sendNotFound(req, res, error.message);
          return;
        }
        next(error);
      }
    );
  }

  /**
   * Adds a specialty to a professional (Admin only).
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @param {import("express").NextFunction} next
   */
  async addSpecialty(req, res, next) {
    const professionalId = +req.params.id;

    const validationResult = await validateAddSpecialty(req.body);

    if (!validationResult.success) {
      // Redirect back with error flash (re-render not ideal for POST)
      const profileResult =
        await services.professionalService.getProfileWithSlots(professionalId);

      if (profileResult.isErr()) {
        sendNotFound(req, res, profileResult.error.message);
        return;
      }

      const data = profileResult.value;
      const allSpecialties = await services.specialtyService.findAll();

      res.status(422).render("professional-profile", {
        professional: data.professional,
        specialties: data.specialties,
        slotsPast: data.slotsPast,
        slotsToday: data.slotsToday,
        slotsFuture: data.slotsFuture,
        isAdmin: true,
        allSpecialties,
        errors: z.treeifyError(validationResult.error),
        result: {
          type: "failure",
          message: "Revise los datos del formulario.",
        },
      });
      return;
    }

    const addResult = await services.professionalService.addSpecialty(
      professionalId,
      validationResult.data
    );

    addResult.match(
      () => {
        res.redirect(`/professionals/${professionalId}/profile`);
      },
      async (error) => {
        const profileResult =
          await services.professionalService.getProfileWithSlots(
            professionalId
          );

        if (profileResult.isErr()) {
          sendNotFound(req, res, profileResult.error.message);
          return;
        }

        const data = profileResult.value;
        const allSpecialties = await services.specialtyService.findAll();

        res.status(error.statusCode).render("professional-profile", {
          professional: data.professional,
          specialties: data.specialties,
          slotsPast: data.slotsPast,
          slotsToday: data.slotsToday,
          slotsFuture: data.slotsFuture,
          isAdmin: true,
          allSpecialties,
          result: { type: "failure", message: error.message },
        });
      }
    );
  }
}

/**
 * Parse credentials array from form data.
 * Form sends: credentials[0][specialtyId], credentials[0][licenseNumber], etc.
 * @param {Record<string, unknown>} body
 * @returns {Record<string, unknown>} Parsed body.
 */
function parseCredentialsFromForm(body) {
  const parsed = { ...body };

  // If credentials is already an array, return as-is (for JSON requests)
  if (Array.isArray(body.credentials)) {
    return parsed;
  }

  // Parse from form data format
  if (body.credentials && typeof body.credentials === "object") {
    parsed.credentials = Object.values(body.credentials).filter(
      (cred) =>
        cred &&
        typeof cred === "object" &&
        (cred.specialtyId || cred.licenseNumber)
    );
  } else {
    parsed.credentials = [];
  }

  return parsed;
}
