/**
 * @typedef {object} SlotForDayProps
 * @property {number} id
 * @property {Date} startsAt
 * @property {string} status
 * @property {string | null} patientName - Only visible to ADMIN/SECRETARY
 * @property {boolean} isOverbook
 */

/**
 * Slot information for a specific day.
 */
export class SlotForDay {
  /**
   * @param {SlotForDayProps} props
   */
  constructor({ id, startsAt, status, patientName, isOverbook }) {
    this.id = id;
    this.startsAt = startsAt;
    this.status = status;
    this.patientName = patientName;
    this.isOverbook = isOverbook;
  }
}

/**
 * @typedef {object} BlockInfoProps
 * @property {Date} startDate
 * @property {Date} endDate
 * @property {string} reason
 */

/**
 * Block information for a day.
 */
export class BlockInfo {
  /**
   * @param {BlockInfoProps} props
   */
  constructor({ startDate, endDate, reason }) {
    this.startDate = startDate;
    this.endDate = endDate;
    this.reason = reason;
  }
}

/**
 * @typedef {object} ScheduleComparisonDTOProps
 * @property {number} id
 * @property {string} professionalName
 * @property {string} professionalLicense
 * @property {string} specialtyName
 * @property {string} locationName
 * @property {string} classificationName
 * @property {number} slotDuration - minutes per slot
 * @property {boolean} isPaused
 * @property {SlotForDay[]} slots - slots for the requested day
 * @property {BlockInfo | null} dayBlock - block affecting this day, if any
 */

/**
 * DTO for schedule comparison view data.
 */
export class ScheduleComparisonDTO {
  /**
   * @param {ScheduleComparisonDTOProps} props
   */
  constructor({
    id,
    professionalName,
    professionalLicense,
    specialtyName,
    locationName,
    classificationName,
    slotDuration,
    isPaused,
    slots,
    dayBlock,
  }) {
    this.id = id;
    this.professionalName = professionalName;
    this.professionalLicense = professionalLicense;
    this.specialtyName = specialtyName;
    this.locationName = locationName;
    this.classificationName = classificationName;
    this.slotDuration = slotDuration;
    this.isPaused = isPaused;
    this.slots = slots;
    this.dayBlock = dayBlock;
  }
}
