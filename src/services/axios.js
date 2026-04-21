// src/services/axios.js
import axios from 'axios';

const normalizeBaseUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const t = url.trim().replace(/\/+$/, '');
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
};

const getEnvApiBaseUrl = () => normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

export const getApiBaseUrl = () => getEnvApiBaseUrl();

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token JWT si existe
api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error?.config || {};
    const baseURL = config.baseURL || getApiBaseUrl() || '';
    const endpoint = config.url || '';
    const method = (config.method || 'get').toUpperCase();
    const fullUrl = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`;

    console.error('[API] Request failed', {
      method,
      fullUrl,
      baseURL,
      endpoint,
      code: error?.code,
      status: error?.response?.status,
      responseData: error?.response?.data,
      message: error?.message,
    });

    return Promise.reject(error);
  }
);

export default api;
