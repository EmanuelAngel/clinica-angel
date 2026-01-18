export class ScheduleListDTO {
  /**
   * @param {object} props
   * @param {number | null} props.id
   * @param {string} props.professionalName
   * @param {string} props.specialtyName
   * @param {string} props.locationName
   * @param {string} props.classificationName
   * @param {number} props.slotDurationMinutes
   * @param {number} props.maxOverbooksPerDay
   * @param {boolean} props.isPaused
   * @param {boolean} props.isDeleted
   */
  constructor({
    id,
    professionalName,
    specialtyName,
    locationName,
    classificationName,
    slotDurationMinutes,
    maxOverbooksPerDay,
    isPaused,
    isDeleted,
  }) {
    this.id = id;
    this.professionalName = professionalName;
    this.specialtyName = specialtyName;
    this.locationName = locationName;
    this.classificationName = classificationName;
    this.slotDurationMinutes = slotDurationMinutes;
    this.maxOverbooksPerDay = maxOverbooksPerDay;
    this.isPaused = isPaused;
    this.isDeleted = isDeleted;
  }
}
