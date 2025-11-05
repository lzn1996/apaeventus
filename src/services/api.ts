import axios from 'axios';
import { authService } from './authService';
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
    return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];
let hasLoggedOut = false; // Flag para evitar múltiplos logouts

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

// Intercepta erros 401 e 403 para tentar renovar token ou fazer logout
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error?.response?.status;

        // Se for 403 ou 401, tenta renovar o token
        if (status === 403 || status === 401) {
            console.log(`API response Interceptor: ${status} - tentando renovar token`, error?.config?.url);

            // Se já está em processo de logout, rejeita imediatamente
            if (hasLoggedOut) {
                return Promise.reject(error);
            }

            // Se já tentou renovar, faz logout
            if (originalRequest._retry) {
                console.log('Tentativa de refresh falhou - fazendo logout');
                if (!hasLoggedOut) {
                    hasLoggedOut = true;
                    await authService.clearTokens();
                    const currentRoute = navigationRef.current?.getCurrentRoute?.();
                    if (!currentRoute || currentRoute.name !== 'Login') {
                        const message = status === 403
                            ? 'Sua sessão expirou ou você não tem permissão. Faça login novamente.'
                            : 'Faça login novamente para continuar.';
                        Alert.alert(
                            'Sessão Expirada',
                            message,
                            [
                                {
                                    text: 'OK',
                                    onPress: () => {
                                        if (navigationRef.isReady()) {
                                            navigationRef.reset({
                                                index: 0,
                                                routes: [{ name: 'Login' as never }],
                                            });
                                        } else {
                                            navigate('Login');
                                        }
                                    },
                                },
                            ],
                            { cancelable: false }
                        );
                    }
                    // Reset flag após navegação
                    setTimeout(() => { hasLoggedOut = false; }, 1000);
                }
                return Promise.reject(error);
            }

            // Tenta renovar o token
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
                // Tenta renovar os tokens
                console.log('Tentando renovar token...');
                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await authService.refreshToken();
                if (!newAccessToken) {
                    throw new Error('Refresh token inválido');
                }
                console.log('Token renovado com sucesso');
                await authService.setTokens(newAccessToken, newRefreshToken);
                processQueue(null, newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Falhou ao renovar - faz logout
                console.log('Erro ao renovar token - fazendo logout', refreshError);
                processQueue(refreshError, null);

                if (!hasLoggedOut) {
                    hasLoggedOut = true;
                    await authService.clearTokens();
                    const currentRoute = navigationRef.current?.getCurrentRoute?.();
                    console.log('Current route:', currentRoute?.name);
                    console.log('navigationRef.isReady():', navigationRef.isReady());

                    if (!currentRoute || currentRoute.name !== 'Login') {
                        console.log('Mostrando Alert de sessão expirada...');
                        Alert.alert(
                            'Sessão Expirada',
                            'Faça login novamente para continuar.',
                            [
                                {
                                    text: 'OK',
                                    onPress: () => {
                                        console.log('Usuário clicou em OK, navegando para Login...');
                                        try {
                                            // Usa navigate simples ao invés de reset para evitar erro do HwBackHandler
                                            console.log('Navegando para Login...');
                                            navigate('Login');
                                        } catch (navError) {
                                            console.log('Erro na navegação:', navError);
                                        }
                                    },
                                },
                            ],
                            { cancelable: false }
                        );
                    } else {
                        console.log('Já está na tela de Login, não mostra Alert');
                    }
                    // Reset flag após navegação
                    setTimeout(() => { hasLoggedOut = false; }, 1000);
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
