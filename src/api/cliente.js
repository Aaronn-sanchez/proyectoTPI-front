import axios from 'axios';
import { cerrarSesion } from './cerrasSesion';

const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: BASE_URL,
});

api.interceptors.response.use(
    (respuesta) => respuesta,
    (error) => {
        if (error.response?.status === 401 && localStorage.getItem('token')) {
            cerrarSesion();
        }
        return Promise.reject(error);
    }
);


api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;