/**
 * @typedef {object} GlobalBlockProps
 * @property {number} id
 * @property {Date} startDate
 * @property {Date} endDate
 * @property {string} reason
 */

export class GlobalBlock {
  /**
   * @param {GlobalBlockProps} props
   */
  constructor({ id, startDate, endDate, reason }) {
    this.id = id;
    this.startDate = startDate;
    this.endDate = endDate;
    this.reason = reason;
  }
}
