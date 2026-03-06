import api from './api';

export const userService = {
  // Lấy tất cả users
  getAllUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Lấy user theo ID
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Tạo user mới
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Cập nhật user
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Cập nhật trạng thái user
  updateUserStatus: async (id, status) => {
    const response = await api.patch(`/users/${id}/status`, { status });
    return response.data;
  },

  // Xóa user
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Gán role cho user
  assignRole: async (userId, roleId, scope_type = 'department', department_id = null) => {
    const response = await api.post(`/users/${userId}/roles`, { role_id: roleId, scope_type, department_id });
    return response.data;
  },
};

export default userService;
