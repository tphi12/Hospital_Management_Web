import api from './api';

export const userScheduleService = {
  // Get all duty schedules (shifts) assigned to the current user
  getUserDutySchedules: async (params = {}) => {
    const response = await api.get('/schedules/me/duty-schedules', { params });
    return response.data;
  },

  // Get all weekly work items where the current user is a participant
  getUserWeeklyWorkItems: async (params = {}) => {
    const response = await api.get('/schedules/me/weekly-work-items', { params });
    return response.data;
  }
};

export default userScheduleService;
