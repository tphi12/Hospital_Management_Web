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

  // Weekly Work Items - CRUD Operations
  
  // Get all weekly work items for a schedule
  getWeeklyWorkItems: async (scheduleId) => {
    const response = await api.get(`/schedules/${scheduleId}/weekly-items`);
    return response.data;
  },

  // Get single weekly work item
  getWeeklyWorkItemById: async (scheduleId, itemId) => {
    const response = await api.get(`/schedules/${scheduleId}/weekly-items/${itemId}`);
    return response.data;
  },

  // Create new weekly work item
  addWeeklyWorkItem: async (scheduleId, itemData) => {
    // itemData: {work_date, content, location, participants}
    const response = await api.post(`/schedules/${scheduleId}/weekly-items`, itemData);
    return response.data;
  },

  // Update existing weekly work item
  updateWeeklyWorkItem: async (scheduleId, itemId, itemData) => {
    const response = await api.put(`/schedules/${scheduleId}/weekly-items/${itemId}`, itemData);
    return response.data;
  },

  // Delete weekly work item
  deleteWeeklyWorkItem: async (scheduleId, itemId) => {
    const response = await api.delete(`/schedules/${scheduleId}/weekly-items/${itemId}`);
    return response.data;
  },

  // Import weekly work items from xlsx/csv file
  importWeeklyWorkItems: async (scheduleId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/schedules/${scheduleId}/weekly-items/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
};

export default scheduleService;
