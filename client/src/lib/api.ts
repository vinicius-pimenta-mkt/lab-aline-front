import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api-aline.unvgroup.tech/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // Verifica se a requisição é para a área do TSB
    const isTsb = config.url?.includes('/tsb');
    
    // Se for TSB, pega a chave do TSB. Se for Lab, pega a chave normal.
    const token = localStorage.getItem(isTsb ? 'tsb_token' : 'token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Verifica de qual sistema veio o erro para redirecionar para o Login certo
      const isTsb = error.config.url?.includes('/tsb');
      
      if (isTsb) {
        localStorage.removeItem('tsb_token');
        localStorage.removeItem('tsb_user');
        window.location.href = '/tsb/login';
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
