import api from './authService';

export const getLogs = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await api.get(`/logs?${params}`);
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get('/logs/dashboard-stats');
  return response.data;
};

export const getLogStats = async () => {
  const response = await api.get('/logs/stats');
  return response.data;
};

