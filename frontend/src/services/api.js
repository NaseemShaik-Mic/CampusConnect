import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Assignments API
export const assignmentAPI = {
  getAll: () => API.get('/assignments'),
  getById: (id) => API.get(`/assignments/${id}`),
  create: (data) => API.post('/assignments', data),
  submit: (id, formData) => API.post(`/assignments/${id}/submit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  grade: (assignmentId, submissionId, data) => 
    API.put(`/assignments/${assignmentId}/grade/${submissionId}`, data)
};

// Attendance API
export const attendanceAPI = {
  getAll: () => API.get('/attendance'),
  getStats: () => API.get('/attendance/stats'),
  mark: (data) => API.post('/attendance', data)
};

// Leave API
export const leaveAPI = {
  getAll: () => API.get('/leaves'),
  getById: (id) => API.get(`/leaves/${id}`),
  create: (formData) => API.post('/leaves', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateStatus: (id, data) => API.put(`/leaves/${id}`, data),
  delete: (id) => API.delete(`/leaves/${id}`)
};

// Mentoring API
export const mentoringAPI = {
  getAll: () => API.get('/mentoring'),
  getById: (id) => API.get(`/mentoring/${id}`),
  create: (data) => API.post('/mentoring', data),
  update: (id, data) => API.put(`/mentoring/${id}`, data),
  markAttendance: (id) => API.put(`/mentoring/${id}/attendance`),
  addFeedback: (id, feedback) => API.put(`/mentoring/${id}/feedback`, { feedback }),
  cancel: (id) => API.delete(`/mentoring/${id}`)
};

// Notification API
export const notificationAPI = {
  getAll: (params) => API.get('/notifications', { params }),
  getUnreadCount: () => API.get('/notifications/unread-count'),
  markAsRead: (id) => API.put(`/notifications/${id}/read`),
  markAllAsRead: () => API.put('/notifications/mark-all-read'),
  delete: (id) => API.delete(`/notifications/${id}`)
};

export default API;