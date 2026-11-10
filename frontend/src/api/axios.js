import axios from 'axios';

const backendUrl = import.meta.env.VITE_API_URL
  ?.replace(/\/+$/, '')
  .replace(/\/api$/i, '');

const api = axios.create({
  baseURL: backendUrl ? `${backendUrl}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.[0] ||
      error.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default api;
