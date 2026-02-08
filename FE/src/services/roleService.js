import api from './api';

export const roleService = {
  // Lấy tất cả roles
  getAllRoles: async () => {
    const response = await api.get('/roles');
    return response.data;
  },

  // Lấy role theo ID
  getRoleById: async (id) => {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  },
};

export default roleService;
