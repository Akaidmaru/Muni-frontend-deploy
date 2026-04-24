// src/services/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token JWT si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const url = String(config.url || '');
  const isTripStartEndpoint =
    config.method?.toLowerCase() === 'post' && url.includes('/trip-history/start');

  if (isTripStartEndpoint) {
    const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (clientTimeZone) {
      config.headers['X-Client-Timezone'] = clientTimeZone;
    }
  }

  return config;
});

export default api;
