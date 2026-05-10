import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true
});

api.interceptors.request.use((config) => {
  // Fix Axios dropping paths from baseURL when url starts with /
  if (config.url && config.url.startsWith('/')) {
    config.url = config.url.substring(1);
  }
  if (config.baseURL && !config.baseURL.endsWith('/')) {
    config.baseURL += '/';
  }

  const token = localStorage.getItem('token');
  console.log('=== Axios Interceptor ===');
  console.log('Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('✅ Authorization header set');
  } else {
    console.log('❌ No token found in localStorage');
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log('✅ Response status:', response.status);
    return response;
  },
  (error) => {
    console.error('❌ Axios Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default api;

