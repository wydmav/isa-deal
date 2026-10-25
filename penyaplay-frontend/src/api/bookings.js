import api from './client';

export const createBooking = (data) => api.post('/bookings', data);
export const getBooking = (id) => api.get(`/bookings/${id}`);
export const updateStatus = (id, status) => api.patch(`/bookings/${id}/status`, { status });
export const markPaidOffline = (id) => api.post(`/bookings/${id}/mark-paid`);
export const sendQuote = (id, amount, currency) => api.post(`/bookings/${id}/quote`, { amount, currency });
export const submitReview = (bookingId, data) => api.post(`/reviews/${bookingId}`, data);
export const postMessage = (bookingId, content) => api.post(`/messages/${bookingId}`, { content });