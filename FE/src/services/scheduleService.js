import api from './api';

export const scheduleService = {
  // Lấy tất cả schedules
  getAllSchedules: async (params = {}) => {
    const response = await api.get('/schedules', { params });
    return response.data;
  },

  // Lấy schedule theo ID
  getScheduleById: async (id) => {
    const response = await api.get(`/schedules/${id}`);
    return response.data;
  },

  // Tạo schedule mới
  createSchedule: async (scheduleData) => {
    const response = await api.post('/schedules', scheduleData);
    return response.data;
  },

  // Cập nhật schedule
  updateSchedule: async (id, scheduleData) => {
    const response = await api.put(`/schedules/${id}`, scheduleData);
    return response.data;
  },

  // Submit schedule to KHTH
  submitSchedule: async (id) => {
    const response = await api.patch(`/schedules/${id}/submit`);
    return response.data;
  },

  // Approve schedule (KHTH only)
  approveSchedule: async (id) => {
    const response = await api.patch(`/schedules/${id}/approve`);
    return response.data;
  },

  // Xóa schedule
  deleteSchedule: async (id) => {
    const response = await api.delete(`/schedules/${id}`);
    return response.data;
  },
};

export default scheduleService;
