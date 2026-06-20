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
    // 1. O sistema verifica se a requisição está a ir para a área do TSB
    const isTsb = config.url?.includes('/tsb');
    
    // 2. Se for TSB, ele usa a chave 'tsb_token'. Se não for, usa a chave normal do laboratório.
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
      // 3. Se o acesso for bloqueado (401), ele descobre de onde veio o erro
      const isTsb = error.config.url?.includes('/tsb');
      
      // 4. E expulsa o usuário apenas da tela correspondente, sem afetar a outra
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
