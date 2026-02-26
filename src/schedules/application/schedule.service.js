import { ok, err } from "neverthrow";
import {
  ScheduleAlreadyActiveError,
  ScheduleNotFoundError,
} from "../domain/schedule.errors.js";
import { SlotsGeneratorService } from "../domain/slots-generator.service.js";
import {
  Schedule,
  ScheduleBlock,
  ScheduleConfig,
  Slot,
} from "../domain/schedule.model.js";
import { OverlapValidator } from "../domain/overlap-validator.service.js";
import { ScheduleDetailsDTO } from "./schedule-details.dto.js";
import { ScheduleListDTO } from "./schedule-list.dto.js";

/**
 * @typedef {import("../domain/schedule.repository.js").ScheduleRepository} ScheduleRepository
 * @typedef {import("../domain/schedule.errors.js").ScheduleOverlapError} ScheduleOverlapError
 * @typedef {import("../domain/schedule.errors.js").SlotDurationCannotBeZeroError} SlotDurationCannotBeZeroError
 * @typedef {import("../domain/schedule.errors.js").SlotStartDateCannotBeAfterEndDateError} SlotStartDateCannotBeAfterEndDateError
 */

export class ScheduleService {
  /**
   * @param {ScheduleRepository} scheduleRepository
   */
  constructor(scheduleRepository) {
    this.scheduleRepository = scheduleRepository;
  }

  /**
   * Configures a new schedule for a professional given a license number.
   * @param {import("../infrastructure/schedule.schemas.js").CreateScheduleDTO} data
   * @returns {Promise<import("neverthrow").Result<
   *   void,
   *   ScheduleAlreadyActiveError |
   *   ScheduleOverlapError |
   *   SlotDurationCannotBeZeroError |
   *   SlotStartDateCannotBeAfterEndDateError
   * >>}
   * Returns:
   * - `void`: The schedule was successfully configured.
   * - `ScheduleAlreadyActiveError`: The professional already has an active schedule
   *   with the same specialty.
   * - `ScheduleOverlapError`: The schedule's time slots will overlap with existing schedules.
   * - `SlotDurationCannotBeZeroError`: The slot duration cannot be zero.
   * - `SlotStartDateCannotBeAfterEndDateError`: The slot start date cannot be after the end date.
   */
  async configure(data) {
    const scheduleActiveExists = await this.scheduleRepository.checkActive(
      data.schedule.licenseNumber
    );

    if (scheduleActiveExists) {
      return err(new ScheduleAlreadyActiveError());
    }

    // REFACTOR: Zod (Infra, I know) already coerces to Date.
    const validityFrom = new Date(data.config.validity.from);
    const validityTo = new Date(data.config.validity.to);

    const conflictingSchedules =
      await this.scheduleRepository.findActiveByLicenseAndDateRange(
        data.schedule.licenseNumber,
        validityFrom,
        validityTo
      );

    const overlapResult = OverlapValidator.validate(
      data.config,
      conflictingSchedules
    );

    if (overlapResult.isErr()) {
      return err(overlapResult.error);
    }

    const globalBlocks = await this.scheduleRepository.findGlobalBlocks(
      validityFrom,
      validityTo
    );

    // Map global blocks to the format expected by the generator (start/end)
    const allBlocks = [
      ...(data.blocks || []).map((b) => ({
        start: b.start,
        end: b.end,
      })),
      ...globalBlocks.map((b) => ({
        start: b.startDate,
        end: b.endDate,
      })),
    ];

    // REFACTOR: .generate() method could just recieve a schedule.
    const generationResult = SlotsGeneratorService.generate({
      startDate: data.config.validity.from,
      endDate: data.config.validity.to,
      daysAndTimes: data.config.weeklyDays,
      slotDurationMinutes: data.schedule.slotDurationMinutes,
      blocks: allBlocks,
    });

    if (generationResult.isErr()) {
      return err(generationResult.error);
    }

    // REFACTOR: Mapping out of service for better legibility and flow.
    // Maybe a Factory pattern?

    const domainConfigs = data.config.weeklyDays.flatMap((dayConfig) =>
      dayConfig.ranges.map(
        (range) =>
          new ScheduleConfig({
            dayOfWeek: dayConfig.day,
            startTime: range.start,
            endTime: range.end,
            validFrom: validityFrom,
            validUntil: validityTo,
          })
      )
    );

    const domainBlocks = (data.blocks || []).map(
      (block) =>
        new ScheduleBlock({
          startDate: new Date(block.start),
          endDate: new Date(block.end),
          reason: block.motive,
        })
    );

    const schedule = new Schedule({
      id: null,
      professionalLicense: data.schedule.licenseNumber,
      locationId: data.schedule.locationId,
      classificationId: data.schedule.classificationId,
      slotDurationMinutes: data.schedule.slotDurationMinutes,
      maxOverbooksPerDay: data.schedule.maxOverbooksPerDay,
      maxOverbooksPerSlot: data.schedule.maxOverbooksPerSlot,
      isPaused: false,
      deletedAt: null,
      configs: domainConfigs,
      blocks: domainBlocks,
    });

    const slots = generationResult.value.map((slot) => new Slot(slot));

    await this.scheduleRepository.createWithSlots(schedule, slots);

    return ok();
  }

  /**
   * List all schedules with their details.
   * @returns {Promise<ScheduleListDTO[]>} A list of schedules with nested
   * professional, location and classification objects.
   */
  async listSchedules() {
    const schedules = await this.scheduleRepository.findAll();

    return schedules.map(
      (schedule) =>
        new ScheduleListDTO({
          id: schedule.id,
          professionalName: `${schedule.professional.user.firstNames} ${schedule.professional.user.lastNames}`,
          specialtyName: schedule.professional.specialty.name,
          locationName: schedule.location.name,
          classificationName: schedule.classification.name,
          slotDurationMinutes: schedule.slotDuration,
          maxOverbooksPerDay: schedule.maxOverbooksPerDay,
          isPaused: schedule.isPaused,
          isDeleted: !!schedule.deletedAt,
        })
    );
  }

  /**
   * Get schedule details by ID.
   * @param {number} id
   * @returns {Promise<import("neverthrow").Result<
   * ScheduleDetailsDTO,
   * ScheduleNotFoundError
   * >>} The schedule details or an error.
   */
  async getScheduleDetails(id) {
    const schedule = await this.scheduleRepository.findByIdWithDetails(id);

    if (!schedule) {
      return err(new ScheduleNotFoundError(id));
    }

    return ok(
      new ScheduleDetailsDTO({
        id: schedule.id,
        professionalName: `${schedule.professional.user.firstNames} ${schedule.professional.user.lastNames}`,
        professionalLicense: schedule.professionalLicense,
        specialtyName: schedule.professional.specialty.name,
        locationName: schedule.location.name,
        classificationName: schedule.classification.name,
        slotDurationMinutes: schedule.slotDuration,
        maxOverbooksPerDay: schedule.maxOverbooksPerDay,
        maxOverbooksPerSlot: schedule.maxOverbooksPerSlot,
        isPaused: schedule.isPaused,
        isDeleted: !!schedule.deletedAt,
        configs: schedule.configs.map((c) => ({
          dayOfWeek: c.dayOfWeek,
          startTime: c.startTime,
          endTime: c.endTime,
        })),
        blocks: schedule.blocks.map((b) => ({
          startDate: b.startDate,
          endDate: b.endDate,
          reason: b.reason,
        })),
        slots: schedule.slots,
      })
    );
  }

  /**
   * Get schedules for comparison view with filters.
   * @param {import("../infrastructure/schedule-comparison.schemas.js").ComparisonFilters} filters
   * @returns {Promise<import("./schedule-comparison.dto.js").ScheduleComparisonDTO[]>}
   * Schedules with slots for the specified day.
   */
  async getSchedulesForComparison(filters) {
    const { ScheduleComparisonDTO, SlotForDay, BlockInfo } =
      await import("./schedule-comparison.dto.js");

    const schedules = await this.scheduleRepository.findForComparison(filters);

    return schedules.map((schedule) => {
      // Check if there's a block for this day
      const dayBlock =
        schedule.blocks.length > 0
          ? new BlockInfo({
              startDate: schedule.blocks[0].startDate,
              endDate: schedule.blocks[0].endDate,
              reason: schedule.blocks[0].reason,
            })
          : null;

      // Map slots
      const slots = schedule.slots.map(
        (slot) =>
          new SlotForDay({
            id: slot.id,
            startsAt: slot.startsAt,
            status: slot.status,
            patientName: slot.patient
              ? `${slot.patient.firstNames} ${slot.patient.lastNames}`
              : null,
            isOverbook: slot.isOverbook,
          })
      );

      return new ScheduleComparisonDTO({
        id: schedule.id,
        professionalName: `${schedule.professional.user.firstNames} ${schedule.professional.user.lastNames}`,
        professionalLicense: schedule.professionalLicense,
        specialtyName: schedule.professional.specialty.name,
        locationName: schedule.location.name,
        classificationName: schedule.classification.name,
        slotDuration: schedule.slotDuration,
        isPaused: schedule.isPaused,
        slots,
        dayBlock,
      });
    });
  }

  /**
   * Get a schedule for the drilldown agenda view with per-day slot grouping.
   * @param {number} scheduleId - Schedule ID.
   * @param {Date} startDate - Start of range.
   * @param {Date} endDate - End of range.
   * @param {Date[]} dates - Array of individual day dates for column generation.
   * @returns {Promise<import("neverthrow").Result<{
   *   schedule: any,
   *   days: Array<{ date: Date, dayLabel: string, slots: import("./schedule-comparison.dto.js").SlotForDay[], dayBlock: import("./schedule-comparison.dto.js").BlockInfo | null }>
   * }, ScheduleNotFoundError>>}
   */
  async getScheduleForDrilldown(scheduleId, startDate, endDate, dates) {
    const { SlotForDay, BlockInfo } =
      await import("./schedule-comparison.dto.js");

    const schedule = await this.scheduleRepository.findForDrilldown(
      scheduleId,
      startDate,
      endDate
    );

    if (!schedule) {
      return err(new ScheduleNotFoundError(scheduleId));
    }

    // Build per-day grouping
    const days = dates.map((date) => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      // Build day label
      const dayLabel = date.toLocaleDateString("es-AR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });

      // Filter slots for this specific day
      const daySlots = schedule.slots
        .filter((slot) => {
          const t = new Date(slot.startsAt).getTime();
          return t >= dayStart.getTime() && t <= dayEnd.getTime();
        })
        .map(
          (slot) =>
            new SlotForDay({
              id: slot.id,
              startsAt: slot.startsAt,
              status: slot.status,
              patientName: slot.patient
                ? `${slot.patient.firstNames} ${slot.patient.lastNames}`
                : null,
              isOverbook: slot.isOverbook,
            })
        );

      // Check if any block overlaps with this day
      const dayBlock = schedule.blocks.find((block) => {
        const blockStart = new Date(block.startDate).getTime();
        const blockEnd = new Date(block.endDate).getTime();
        return blockStart <= dayEnd.getTime() && blockEnd >= dayStart.getTime();
      });

      return {
        date,
        dayLabel,
        slots: daySlots,
        dayBlock: dayBlock
          ? new BlockInfo({
              startDate: dayBlock.startDate,
              endDate: dayBlock.endDate,
              reason: dayBlock.reason,
            })
          : null,
      };
    });

    // Build schedule metadata
    const scheduleInfo = {
      id: schedule.id,
      professionalName: `${schedule.professional.user.firstNames} ${schedule.professional.user.lastNames}`,
      professionalLicense: schedule.professionalLicense,
      specialtyName: schedule.professional.specialty.name,
      locationName: schedule.location.name,
      classificationName: schedule.classification.name,
      slotDuration: schedule.slotDuration,
      maxOverbooksPerDay: schedule.maxOverbooksPerDay,
      maxOverbooksPerSlot: schedule.maxOverbooksPerSlot,
      isPaused: schedule.isPaused,
      weeklySchedule: this._formatWeeklySchedule(schedule.configs),
      blocks: schedule.blocks.map((b) => ({
        startDate: b.startDate,
        endDate: b.endDate,
        reason: b.reason,
      })),
    };

    return ok({ schedule: scheduleInfo, days });
  }

  /**
   * Helper to format weekly configurations into a readable summary in Spanish.
   * @param {any[]} configs
   * @private
   * @returns {any}
   */
  _formatWeeklySchedule(configs) {
    if (!configs || configs.length === 0) return [];

    const dayTranslations = {
      MONDAY: "Lunes",
      TUESDAY: "Martes",
      WEDNESDAY: "Miércoles",
      THURSDAY: "Jueves",
      FRIDAY: "Viernes",
      SATURDAY: "Sábado",
      SUNDAY: "Domingo",
    };

    // Group by day to handles multiple ranges per day if they exist
    const grouped = configs.reduce((acc, config) => {
      const day = dayTranslations[config.dayOfWeek] || config.dayOfWeek;
      if (!acc[day]) acc[day] = [];
      acc[day].push(`${config.startTime} - ${config.endTime}`);

      return acc;
    }, {});

    return Object.entries(grouped).map(([day, ranges]) => ({
      day,
      ranges: ranges.join(", "),
    }));
  }

  /**
   * Get slot details by ID for the modal.
   * @param {number} id - Slot ID.
   * @returns {Promise<import("neverthrow").Result<any, ScheduleNotFoundError>>}
   * Slot with patient and schedule details.
   */
  async getSlotDetails(id) {
    const slot = await this.scheduleRepository.findSlotById(id);

    if (!slot) {
      return err(new ScheduleNotFoundError(id));
    }

    // Mapping relevant info for the modal
    const patientInfo = slot.patient
      ? {
          fullNames: `${slot.patient.firstNames} ${slot.patient.lastNames}`,
          nationalId: slot.patient.nationalId,
          email: slot.patient.email,
          phone: slot.patient.phone,
          address: slot.patient.address,
          nationalIdImageUrl: slot.patient.nationalIdImageUrl,
          insurances: (slot.patient.patientInsurances || []).map((pi) => ({
            name: pi.insurance.name,
            memberNumber: pi.memberNumber,
          })),
        }
      : null;

    const scheduleInfo = {
      classification: slot.schedule.classification.name,
      professional: `${slot.schedule.professional.user.firstNames} ${slot.schedule.professional.user.lastNames}`,
      specialty: slot.schedule.professional.specialty.name,
      location: slot.schedule.location.name,
    };

    return ok({
      id: slot.id,
      startsAt: slot.startsAt,
      status: slot.status,
      patient: patientInfo,
      schedule: scheduleInfo,
    });
  }

  /**
   * Updates a slot's status.
   * @param {number} id - Slot ID.
   * @param {string} status - New status.
   * @returns {Promise<import("neverthrow").Result<void, ScheduleNotFoundError>>}
   * Returns void if the slot is found, otherwise an error.
   */
  async updateSlotStatus(id, status) {
    // Method signature only for now as requested by user.
    // In the future: return this.scheduleRepository.updateSlotStatus(id, status);
    return ok();
  }

  /**
   * Registers a schedule block (unforeseen event) and handles affected slots.
   * @param {number} scheduleId
   * @param {{ startDate: Date, endDate: Date, reason: string }} data
   * @returns {Promise<import("neverthrow").Result<
   *   { deletedFree: number, markedReschedule: number },
   *   ScheduleNotFoundError
   * >>}
   */
  async registerScheduleBlock(scheduleId, data) {
    const exists = await this.scheduleRepository.checkExist(scheduleId);

    if (!exists) {
      return err(new ScheduleNotFoundError(scheduleId));
    }

    const result = await this.scheduleRepository.registerScheduleBlock(
      scheduleId,
      data
    );

    return ok(result);
  }

  /**
   * Gets all slots needing rescheduling with patient and schedule details.
   * @returns {Promise<any[]>} Mapped slot data for the reschedule inbox view.
   */
  async getSlotsNeedingReschedule() {
    const slots = await this.scheduleRepository.findSlotsNeedingReschedule();

    return slots.map((slot) => ({
      id: slot.id,
      startsAt: slot.startsAt,
      status: slot.status,
      consultationReason: slot.consultationReason,
      isOverbook: slot.isOverbook,
      patient: slot.patient
        ? {
            fullName: `${slot.patient.firstNames} ${slot.patient.lastNames}`,
            phone: slot.patient.phone,
            email: slot.patient.email,
          }
        : null,
      schedule: {
        professionalName: `${slot.schedule.professional.user.firstNames} ${slot.schedule.professional.user.lastNames}`,
        specialtyName: slot.schedule.professional.specialty.name,
        locationName: slot.schedule.location.name,
      },
    }));
  }
}
