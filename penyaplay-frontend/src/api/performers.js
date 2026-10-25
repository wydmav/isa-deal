import api from './client';

export const searchPerformers = (params) => api.get('/performers', { params });
export const getPerformerProfile = (handle) => api.get(`/performers/${handle}`);