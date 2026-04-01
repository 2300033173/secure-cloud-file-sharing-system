import api from './authService';

export const uploadFile = async (file, description, tags, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  if (description) formData.append('description', description);
  if (tags) formData.append('tags', tags);

  const res = await api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress ? e => onProgress(Math.round((e.loaded * 100) / e.total)) : undefined
  });
  return res.data;
};

export const getFiles = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await api.get(`/files${query ? '?' + query : ''}`);
  return res.data;
};

export const downloadFile = async (fileId, filename) => {
  try {
    const res = await api.get(`/files/download/${fileId}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    if (error.response?.status === 403) {
      try {
        const text = await error.response.data.text();
        const json = JSON.parse(text);
        if (json.mfaRequired) {
          const mfaError = new Error('MFA required');
          mfaError.mfaRequired = true;
          mfaError.sessionId = json.sessionId;
          throw mfaError;
        }
      } catch (parseErr) {
        if (parseErr.mfaRequired) throw parseErr;
      }
    }
    throw error;
  }
};

export const deleteFile = async (fileId) => {
  try {
    const res = await api.delete(`/files/${fileId}`);
    return res.data;
  } catch (error) {
    if (error.response?.status === 403 && error.response?.data?.mfaRequired) {
      const mfaError = new Error('MFA required');
      mfaError.mfaRequired = true;
      mfaError.sessionId = error.response.data.sessionId;
      throw mfaError;
    }
    throw error;
  }
};

export const shareFile = async (fileId, sharedWithEmail, accessLevel, expiresInHours) => {
  try {
    const res = await api.post('/files/share', { fileId, sharedWithEmail, accessLevel, expiresInHours });
    return res.data;
  } catch (error) {
    if (error.response?.status === 403 && error.response?.data?.mfaRequired) {
      const mfaError = new Error('MFA required');
      mfaError.mfaRequired = true;
      mfaError.sessionId = error.response.data.sessionId;
      throw mfaError;
    }
    throw error;
  }
};

export const generateShareLink = async (fileId, options = {}) => {
  const res = await api.post('/files/share/generate', { fileId, ...options });
  return res.data;
};
