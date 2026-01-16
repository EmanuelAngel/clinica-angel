import { ScheduleAlreadyActiveError } from "../domain/schedule.errors.js";
import { ok, err } from "neverthrow";
import { SlotsGeneratorService } from "../domain/slots-generator.service.js";
import {
  Schedule,
  ScheduleBlock,
  ScheduleConfig,
  Slot,
} from "../domain/schedule.model.js";
import { OverlapValidator } from "../domain/overlap-validator.service.js";

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

    // REFACTOR: .generate() method could just recieve a schedule.
    const generationResult = SlotsGeneratorService.generate({
      startDate: data.config.validity.from,
      endDate: data.config.validity.to,
      daysAndTimes: data.config.weeklyDays,
      slotDurationMinutes: data.schedule.slotDurationMinutes,
      blocks: data.blocks,
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
}
