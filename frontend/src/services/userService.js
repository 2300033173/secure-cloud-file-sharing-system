import api from './authService';

export const getAllUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const updateUserRole = async (userId, role) => {
  const response = await api.put(`/users/${userId}/role`, { role });
  return response.data;
};

export const deactivateUser = async (userId) => {
  const response = await api.put(`/users/${userId}/deactivate`);
  return response.data;
};
