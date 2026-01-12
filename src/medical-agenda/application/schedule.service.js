/**
 * @typedef {import("../domain/schedule.repository.js").ScheduleRepository} ScheduleRepository
 * @typedef {import("../domain/schedule.repository.js").ScheduleWithRelations} ScheduleWithRelations
 * @typedef {import("../domain/schedule.repository.js").ScheduleWithSlots} ScheduleWithSlots
 */

/**
 * Service for schedule-related operations.
 */
export class ScheduleService {
  /**
   * @param {ScheduleRepository} scheduleRepository
   */
  constructor(scheduleRepository) {
    this.scheduleRepository = scheduleRepository;
  }

  /**
   * Find all active schedules.
   * @returns {Promise<ScheduleWithRelations[]>}
   */
  async findAll() {
    return this.scheduleRepository.findAll();
  }

  /**
   * Find a schedule by ID with slots in the given date range.
   * @param {number} id
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<ScheduleWithSlots | null>}
   */
  async findByIdWithSlots(id, startDate, endDate) {
    return this.scheduleRepository.findByIdWithSlots(id, startDate, endDate);
  }
}
