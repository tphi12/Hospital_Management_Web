import api from './api';

export const healthService = {
  // Check health status
  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default healthService;
