import api from './api';

export const categoryService = {
  // Lấy tất cả categories
  getAllCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  // Lấy category theo ID
  getCategoryById: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  // Tạo category mới (Admin only)
  createCategory: async (categoryData) => {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },

  // Cập nhật category (Admin only)
  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  // Xóa category (Admin only)
  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

export default categoryService;
