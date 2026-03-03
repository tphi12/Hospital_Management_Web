/**
 * Schedule Module Quick Reference
 * Import this file to access all Schedule module enums and constants
 */

// Import all enums
const {
  ScheduleType,
  ScheduleStatus,
  ShiftType,
  ShiftAssignmentStatus,
  DefaultShiftTimes,
  EnumValidators
} = require('./enums');

// Import all models
const Schedule = require('../models/Schedule');
const Shift = require('../models/Shift');
const ShiftAssignment = require('../models/ShiftAssignment');

/**
 * Quick reference constants
 */
module.exports = {
  // Enums
  ScheduleType,
  ScheduleStatus,
  ShiftType,
  ShiftAssignmentStatus,
  DefaultShiftTimes,
  EnumValidators,
  
  // Models
  Schedule,
  Shift,
  ShiftAssignment,
  
  // Helpers
  helpers: {
    /**
     * Get all schedule types
     */
    getScheduleTypes: () => Object.values(ScheduleType),
    
    /**
     * Get all schedule statuses
     */
    getScheduleStatuses: () => Object.values(ScheduleStatus),
    
    /**
     * Get all shift types
     */
    getShiftTypes: () => Object.values(ShiftType),
    
    /**
     * Get all shift assignment statuses
     */
    getAssignmentStatuses: () => Object.values(ShiftAssignmentStatus),
    
    /**
     * Get default time for shift type
     * @param {string} shiftType - morning | afternoon | night
     * @returns {Object} - {start, end}
     */
    getDefaultShiftTime: (shiftType) => DefaultShiftTimes[shiftType],
    
    /**
     * Validate schedule type
     * @param {string} type - Schedule type to validate
     * @returns {boolean}
     */
    isValidScheduleType: (type) => EnumValidators.isValidScheduleType(type),
    
    /**
     * Validate shift type
     * @param {string} type - Shift type to validate
     * @returns {boolean}
     */
    isValidShiftType: (type) => EnumValidators.isValidShiftType(type),
    
    /**
     * Get week number from date
     * @param {Date} date - Date object
     * @returns {number} - Week number (1-53)
     */
    getWeekNumber: (date) => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },
    
    /**
     * Get date range for a week
     * @param {number} week - Week number (1-53)
     * @param {number} year - Year
     * @returns {Object} - {startDate, endDate}
     */
    getWeekDateRange: (week, year) => {
      const simple = new Date(year, 0, 1 + (week - 1) * 7);
      const dow = simple.getDay();
      const ISOweekStart = simple;
      if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
      else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
      const endDate = new Date(ISOweekStart);
      endDate.setDate(endDate.getDate() + 6);
      
      return {
        startDate: ISOweekStart.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
    }
  }
};
