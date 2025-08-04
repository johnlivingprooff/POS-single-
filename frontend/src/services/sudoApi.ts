import axios from 'axios';
import { useSudoAuthStore } from '../stores/sudoAuthStore';

// Use same approach as the main api.ts
const sudoApi = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

sudoApi.interceptors.request.use(
  (config) => {
    const token = useSudoAuthStore.getState().token;
    if (token && config.headers) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

sudoApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useSudoAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default sudoApi;
