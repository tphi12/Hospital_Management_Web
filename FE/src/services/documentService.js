import api from './api';

export const documentService = {
  // Lấy tất cả documents
  getAllDocuments: async (params = {}) => {
    const response = await api.get('/documents', { params });
    return response.data;
  },

  // Lấy document statistics
  getDocumentStats: async () => {
    const response = await api.get('/documents/stats');
    return response.data;
  },

  // Lấy documents của user hiện tại
  getMyDocuments: async () => {
    const response = await api.get('/documents/my');
    return response.data;
  },

  // Lấy document theo ID
  getDocumentById: async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  // Upload document mới
  uploadDocument: async (formData) => {
    const response = await api.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Cập nhật document
  updateDocument: async (id, formData) => {
    const response = await api.put(`/documents/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Approve document (Manager only)
  approveDocument: async (id) => {
    console.log('id:', id);
    const response = await api.patch(`/documents/${id}/approve`);
    return response.data;
  },

  // Reject document (Manager only)
  rejectDocument: async (id, reason) => {
    const response = await api.patch(`/documents/${id}/reject`, { reason });
    return response.data;
  },

  // Xóa document
  deleteDocument: async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  // Download document
  downloadDocument: async (id) => {
    const response = await api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default documentService;
