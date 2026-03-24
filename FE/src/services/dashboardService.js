import api from './api';

const dashboardService = {
  getStats: () => api.get('/dashboard'),
};

export default dashboardService;
