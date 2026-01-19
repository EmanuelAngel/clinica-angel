export class ScheduleDetailsDTO {
  /**
   * @param {object} props
   * @param {number} props.id
   * @param {string} props.professionalName
   * @param {string} props.professionalLicense
   * @param {string} props.specialtyName
   * @param {string} props.locationName
   * @param {string} props.classificationName
   * @param {number} props.slotDurationMinutes
   * @param {number} props.maxOverbooksPerDay
   * @param {number} props.maxOverbooksPerSlot
   * @param {boolean} props.isPaused
   * @param {boolean} props.isDeleted
   * @param {Array<{dayOfWeek: string, startTime: string, endTime: string}>} props.configs
   * @param {Array<{startDate: Date, endDate: Date, reason: string}>} props.blocks
   * @param {object[]} props.slots
   */
  constructor({
    id,
    professionalName,
    professionalLicense,
    specialtyName,
    locationName,
    classificationName,
    slotDurationMinutes,
    maxOverbooksPerDay,
    maxOverbooksPerSlot,
    isPaused,
    isDeleted,
    configs,
    blocks,
    slots,
  }) {
    this.id = id;
    this.professionalName = professionalName;
    this.professionalLicense = professionalLicense;
    this.specialtyName = specialtyName;
    this.locationName = locationName;
    this.classificationName = classificationName;
    this.slotDurationMinutes = slotDurationMinutes;
    this.maxOverbooksPerDay = maxOverbooksPerDay;
    this.maxOverbooksPerSlot = maxOverbooksPerSlot;
    this.isPaused = isPaused;
    this.isDeleted = isDeleted;
    this.configs = configs;
    this.blocks = blocks;
    this.slots = slots;
  }
}
