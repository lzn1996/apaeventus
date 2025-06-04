import axios from 'axios';
import { authService } from './authService';
import { refreshToken } from './saleService';
import { baseUrl } from '../config/api';
import { Alert } from 'react-native';
import { navigate } from '../navigation/navigationService';

const api = axios.create({
    baseURL: baseUrl,
});

// Adiciona o accessToken antes de cada requisição
api.interceptors.request.use(async (config) => {
    const token = await authService.getAccessToken();
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Intercepta erros 401 para tentar renovar token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (
            error.response?.status === 401 &&
            !originalRequest._retry
        ) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                .then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                })
                .catch((err) => {
                    return Promise.reject(err);
                });
            }
            originalRequest._retry = true;
            isRefreshing = true;
            try {
                const newAccessToken = await refreshToken();
                const currentRefreshToken = await authService.getRefreshToken();
                await authService.setTokens(newAccessToken, currentRefreshToken || '');
                processQueue(null, newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                await authService.clearTokens();
                Alert.alert('Sessão expirada', 'Faça login novamente para continuar.');
                navigate('Login');
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default api;
