import axios from 'axios';
import type {
  AuthUser,
  EmailJob,
  PaginatedResponse,
  ScheduleFormData,
  StatsResponse,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: handle 401 ─────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  getMe: (): Promise<AuthUser> =>
    api.get<AuthUser>('/auth/me').then((r) => r.data),

  googleLoginUrl: (): string => `${BASE_URL}/api/auth/google`,
};

// ─── Emails ───────────────────────────────────────────────────────────────────

export const emailsApi = {
  schedule: (data: ScheduleFormData) =>
    api.post('/emails/schedule', data).then((r) => r.data),

  scheduleCsv: (formData: FormData) =>
    api
      .post('/emails/schedule/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  parseCsv: (file: File): Promise<{ emails: string[]; count: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post('/emails/parse-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  getScheduled: (
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResponse<EmailJob>> =>
    api
      .get('/emails/scheduled', { params: { page, pageSize } })
      .then((r) => r.data),

  getSent: (page = 1, pageSize = 20): Promise<PaginatedResponse<EmailJob>> =>
    api.get('/emails/sent', { params: { page, pageSize } }).then((r) => r.data),

  getStats: (): Promise<StatsResponse> =>
    api.get('/emails/stats').then((r) => r.data),

  cancel: (id: string) =>
    api.delete(`/emails/${id}`).then((r) => r.data),

  toggleStar: (id: string): Promise<{ isStarred: boolean }> =>
    api.patch(`/emails/${id}/star`).then((r) => r.data),
};

export default api;
