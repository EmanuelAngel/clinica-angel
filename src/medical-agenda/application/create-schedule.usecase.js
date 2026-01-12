/**
 * @typedef {import("../domain/schedule.repository.js").ScheduleRepository} ScheduleRepository
 * @typedef {import("../domain/schedule.repository.js").ScheduleWithRelations} ScheduleWithRelations
 * @typedef {import("../domain/schedule.repository.js").CreateConfigData} CreateConfigData
 * @typedef {import("../domain/schedule.repository.js").CreateBlockData} CreateBlockData
 * @typedef {import("../../professionals/domain/professional.repository.js").ProfessionalRepository} ProfessionalRepository
 * @typedef {import("../../locations/domain/location.repository.js").LocationRepository} LocationRepository
 * @typedef {import("../../classifications/domain/classification.repository.js").ClassificationRepository} ClassificationRepository
 * @typedef {import("../domain/slot-generator.service.js").SlotGeneratorService} SlotGeneratorService
 * @typedef {import("../../../generated/prisma/index.js").DayOfWeek} DayOfWeek
 */

import { ok, err } from "neverthrow";
import {
  ScheduleAlreadyExistsError,
  ScheduleOverlapError,
  LicenseNotFoundError,
  LocationNotFoundError,
  ClassificationNotFoundError,
} from "../domain/schedule.errors.js";

/**
 * @typedef {object} WeeklyDayInput
 * @property {DayOfWeek} day
 * @property {Array<{ start: string, end: string }>} ranges
 */

/**
 * @typedef {object} BlockInput
 * @property {string} start - Start date (YYYY-MM-DD)
 * @property {string} end - End date (YYYY-MM-DD)
 * @property {string} motive - Reason for the block
 */

/**
 * @typedef {object} CreateScheduleDTO
 * @property {object} schedule
 * @property {string} schedule.licenseNumber
 * @property {number} schedule.locationId
 * @property {number} schedule.classificationId
 * @property {number} schedule.slotDurationMinutes
 * @property {number} schedule.maxOverbooksPerDay
 * @property {number} schedule.maxOverbooksPerSlot
 * @property {object} config
 * @property {{ from: string, to: string }} config.validity
 * @property {WeeklyDayInput[]} config.weeklyDays
 * @property {BlockInput[]} blocks
 */

/**
 * Use case for creating a medical schedule.
 * Orchestrates validation and creation of Schedule, ScheduleConfigs, ScheduleBlocks, and Slots.
 */
export class CreateScheduleUseCase {
  /**
   * @param {ScheduleRepository} scheduleRepository
   * @param {ProfessionalRepository} professionalRepository
   * @param {LocationRepository} locationRepository
   * @param {ClassificationRepository} classificationRepository
   * @param {SlotGeneratorService} slotGenerator
   */
  constructor(
    scheduleRepository,
    professionalRepository,
    locationRepository,
    classificationRepository,
    slotGenerator
  ) {
    this.scheduleRepository = scheduleRepository;
    this.professionalRepository = professionalRepository;
    this.locationRepository = locationRepository;
    this.classificationRepository = classificationRepository;
    this.slotGenerator = slotGenerator;
  }

  /**
   * Execute the use case.
   * @param {CreateScheduleDTO} dto
   * @returns {Promise<import("neverthrow").Result<ScheduleWithRelations, Error>>}
   */
  async execute(dto) {
    const { schedule, config, blocks } = dto;

    // 1. Validate license exists
    const credential = await this.professionalRepository.findByLicenseNumber(
      schedule.licenseNumber
    );
    if (!credential) {
      return err(new LicenseNotFoundError(schedule.licenseNumber));
    }

    // 2. Validate location exists
    const location = await this.locationRepository.findById(
      schedule.locationId
    );
    if (!location) {
      return err(new LocationNotFoundError(schedule.locationId));
    }

    // 3. Validate classification exists
    const classification = await this.classificationRepository.findById(
      schedule.classificationId
    );
    if (!classification) {
      return err(new ClassificationNotFoundError(schedule.classificationId));
    }

    // 4. Check no active schedule exists for that license (AC2)
    const existingSchedule =
      await this.scheduleRepository.findActiveByLicenseNumber(
        schedule.licenseNumber
      );
    if (existingSchedule) {
      return err(new ScheduleAlreadyExistsError(schedule.licenseNumber));
    }

    // 5. Parse and validate validity period
    const validFrom = new Date(config.validity.from);
    const validUntil = new Date(config.validity.to);

    const validityResult = this.slotGenerator.validateValidityPeriod(
      validFrom,
      validUntil
    );
    if (validityResult.isErr()) {
      return err(validityResult.error);
    }

    // 6. Validate time ranges and check for overlaps
    /** @type {Array<{ dayOfWeek: DayOfWeek, startTime: string, endTime: string }>} */
    const flattenedConfigs = [];

    for (const weeklyDay of config.weeklyDays) {
      for (const range of weeklyDay.ranges) {
        // Validate time range (AC3)
        const timeRangeResult = this.slotGenerator.validateTimeRange(
          range.start,
          range.end
        );
        if (timeRangeResult.isErr()) {
          return err(timeRangeResult.error);
        }

        // Check for overlaps with existing configs (AC1)
        const existingConfigs =
          await this.scheduleRepository.findConfigsByLicenseAndDay(
            schedule.licenseNumber,
            weeklyDay.day,
            validFrom,
            validUntil
          );

        for (const existing of existingConfigs) {
          // Check if date ranges overlap
          const datesOverlap = this.slotGenerator.doDateRangesOverlap(
            validFrom,
            validUntil,
            existing.validFrom,
            existing.validUntil
          );

          if (datesOverlap) {
            // Check if time ranges overlap
            const timesOverlap = this.slotGenerator.doTimeRangesOverlap(
              range.start,
              range.end,
              existing.startTime,
              existing.endTime
            );

            if (timesOverlap) {
              return err(
                new ScheduleOverlapError(weeklyDay.day, range.start, range.end)
              );
            }
          }
        }

        flattenedConfigs.push({
          dayOfWeek: weeklyDay.day,
          startTime: range.start,
          endTime: range.end,
        });
      }
    }

    // 7. Prepare blocks data
    /** @type {CreateBlockData[]} */
    const blocksData = blocks.map((block) => ({
      startDate: new Date(block.start),
      endDate: new Date(block.end),
      reason: block.motive,
    }));

    // 8. Generate slots (AC7)
    const slotsData = this.slotGenerator.generateSlots(
      flattenedConfigs,
      validFrom,
      validUntil,
      schedule.slotDurationMinutes,
      blocksData
    );

    // 9. Prepare config data for repository
    /** @type {CreateConfigData[]} */
    const configsData = flattenedConfigs.map((cfg) => {
      const [startHour, startMin] = cfg.startTime.split(":").map(Number);
      const [endHour, endMin] = cfg.endTime.split(":").map(Number);

      return {
        dayOfWeek: cfg.dayOfWeek,
        startTime: new Date(Date.UTC(1970, 0, 1, startHour, startMin, 0)),
        endTime: new Date(Date.UTC(1970, 0, 1, endHour, endMin, 0)),
        validFrom,
        validUntil,
      };
    });

    // 10. Create schedule atomically
    const createdSchedule = await this.scheduleRepository.create(
      {
        professionalLicense: schedule.licenseNumber,
        locationId: schedule.locationId,
        classificationId: schedule.classificationId,
        slotDuration: schedule.slotDurationMinutes,
        maxOverbooksPerDay: schedule.maxOverbooksPerDay,
        maxOverbooksPerSlot: schedule.maxOverbooksPerSlot,
      },
      configsData,
      blocksData,
      slotsData
    );

    return ok(createdSchedule);
  }
}
