import axios from 'axios';
import { authService } from './authService';
import { refreshToken } from './saleService';
import { baseUrl } from '../config/api';
import { Alert } from 'react-native';
import { navigate, navigationRef } from '../navigation/navigationService';

const api = axios.create({
    baseURL: baseUrl,
});

// Adiciona o accessToken antes de cada requisição
api.interceptors.request.use(async (config) => {
    // Não adiciona Authorization no login
    if (config.url?.includes('/auth/login')) {
        return config;
    }
    const token = await authService.getAccessToken();
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Log padrão para debug
    if (__DEV__) {
        console.log(
            `URL: ${config.baseURL || ''}${config.url}\n` +
            `Headers: ${JSON.stringify(config.headers)}\n` +
            `Body parts: ${config.data ? JSON.stringify(config.data) : '[]'}`
        );
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
        if (error?.response?.status === 401) {
            console.log('API response Interceptor Received error staus: 401', error?.config?.url);
        }
        const originalRequest = error.config;
        if (
            error.response?.status === 401 &&
            !originalRequest._retry
        ) {
            console.log('[api.interceptor] Tentando refreshToken para:', originalRequest.url);
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
                // Agora refreshToken retorna ambos os tokens
                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await refreshToken();
                if (!newAccessToken) {
                    throw new Error('Refresh token inválido');
                }
                await authService.setTokens(newAccessToken, newRefreshToken);
                processQueue(null, newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                await authService.clearTokens();
                if (!error.config._fromRefresh) {
                    // Só mostra alerta se não estiver na tela de Login
                    const currentRoute = navigationRef.current?.getCurrentRoute?.();
                    if (!currentRoute || currentRoute.name !== 'Login') {
                        console.log('[api.interceptor] Falha ao renovar token, redirecionando para login. Exibindo alerta.');
                        Alert.alert('Sessão expirada', 'Faça login novamente para continuar.');
                    } else {
                        console.log('[api.interceptor] Falha ao renovar token, mas já está na tela de Login. Não exibe alerta.');
                    }
                    navigate('Login');
                    error.config._fromRefresh = true;
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default api;
