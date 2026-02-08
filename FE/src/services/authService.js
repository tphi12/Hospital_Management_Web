import api from './api';

export const authService = {
  // Đăng nhập
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  // Đăng xuất
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Lấy profile user hiện tại
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Đổi mật khẩu
  changePassword: async (oldPassword, newPassword) => {
    const response = await api.put('/auth/change-password', {
      oldPassword,
      newPassword,
    });
    return response.data;
  },

  // Kiểm tra token còn hợp lệ
  validateToken: async () => {
    try {
      await api.get('/auth/profile');
      return true;
    } catch {
      return false;
    }
  },
};

export default authService;
