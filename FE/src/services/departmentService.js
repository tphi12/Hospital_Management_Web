import api from './api';

export const departmentService = {
  // Lấy tất cả departments
  getAllDepartments: async (params = {}) => {
    const response = await api.get('/departments', { params });
    return response.data;
  },

  // Lấy department theo ID
  getDepartmentById: async (id) => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  // Lấy danh sách members của department
  getDepartmentMembers: async (id) => {
    const response = await api.get(`/departments/${id}/members`);
    return response.data;
  },

  // Tạo department mới (Admin only)
  createDepartment: async (departmentData) => {
    const response = await api.post('/departments', departmentData);
    return response.data;
  },

  // Cập nhật department (Admin only)
  updateDepartment: async (id, departmentData) => {
    const response = await api.put(`/departments/${id}`, departmentData);
    return response.data;
  },

  // Xóa department (Admin only)
  deleteDepartment: async (id) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  },

  // Thêm thành viên vào department (Admin only)
  addMemberToDepartment: async (deptId, userId) => {
    const response = await api.post(`/departments/${deptId}/members`, { user_id: userId });
    return response.data;
  },

  // Xóa thành viên khỏi department (Admin only)
  removeMemberFromDepartment: async (deptId, userId) => {
    const response = await api.delete(`/departments/${deptId}/members/${userId}`);
    return response.data;
  },
};

export default departmentService;
