// src/services/axios.js
import axios from 'axios';

const RUNTIME_API_URL_KEY = 'runtime_api_base_url';

const normalizeBaseUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/\/+$/, '');
};

const getRuntimeApiBaseUrl = () => {
  try {
    return normalizeBaseUrl(localStorage.getItem(RUNTIME_API_URL_KEY));
  } catch {
    return '';
  }
};

const getEnvApiBaseUrl = () => normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

export const getApiBaseUrl = () => getRuntimeApiBaseUrl() || getEnvApiBaseUrl();

export const setRuntimeApiBaseUrl = (url) => {
  const normalized = normalizeBaseUrl(url);
  if (!normalized) {
    localStorage.removeItem(RUNTIME_API_URL_KEY);
    return;
  }
  localStorage.setItem(RUNTIME_API_URL_KEY, normalized);
};

export const clearRuntimeApiBaseUrl = () => {
  localStorage.removeItem(RUNTIME_API_URL_KEY);
};

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
  return config;
});

export default api;
