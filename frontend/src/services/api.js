import axios from 'axios';

// Auto-detect backend URL: use same hostname as the browser (works on mobile + desktop)
const API_BASE =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:3001`;

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('disasternet_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('disasternet_token');
      localStorage.removeItem('disasternet_user');
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const logoutUser = () => api.post('/auth/logout');

// ─── Rooms ───────────────────────────────────────────────────────────────────

export const getRooms = () => api.get('/rooms');
export const getRoom = (id) => api.get(`/rooms/${id}`);
export const createRoom = (data) => api.post('/rooms', data);
export const joinRoom = (id) => api.post(`/rooms/${id}/join`);
export const leaveRoom = (id) => api.post(`/rooms/${id}/leave`);

// ─── Messages ────────────────────────────────────────────────────────────────

export const getMessages = (roomId) => api.get(`/messages/${roomId}`);
export const sendMessage = (roomId, message) =>
  api.post(`/messages/${roomId}`, { message });
export const uploadFile = (roomId, formData) =>
  api.post(`/messages/${roomId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export { API_BASE };
export default api;
