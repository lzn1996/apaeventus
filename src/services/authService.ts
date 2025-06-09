import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * Serviço responsável pelo gerenciamento dos tokens de autenticação da aplicação.
 *
 * Este arquivo fornece funções utilitárias para armazenar, recuperar e remover
 * os tokens de acesso e refresh no AsyncStorage, além de verificar se o usuário está logado.
 *
 * Utilizado para persistir o estado de autenticação do usuário entre sessões.
 */

export const authService = {
    /**
     * Armazena os tokens de acesso e refresh no AsyncStorage.
     * @param accessToken - Token de acesso do usuário.
     * @param refreshToken - Token de refresh do usuário.
     */
    async setTokens(accessToken: string, refreshToken: string) {
        try {
            let safeRefreshToken = refreshToken;
            if (typeof safeRefreshToken !== 'string' || safeRefreshToken === '') {
                // Se não veio um novo refreshToken, tenta manter o anterior
                const previous = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
                safeRefreshToken = previous || '';
                if (__DEV__) {
                    console.log('[authService] Mantendo refreshToken anterior:', safeRefreshToken);
                }
            } else {
                if (__DEV__) {
                    console.log('[authService] Novo refreshToken recebido:', safeRefreshToken);
                }
            }
            await AsyncStorage.multiSet([
                [ACCESS_TOKEN_KEY, accessToken],
                [REFRESH_TOKEN_KEY, safeRefreshToken],
            ]);
            if (__DEV__) {
                console.log('[authService] AccessToken salvo:', accessToken);
                console.log('[authService] RefreshToken salvo:', safeRefreshToken);
            }
        } catch (error) {
            console.error('[authService] Erro ao salvar tokens:', error);
        }
},

    /**
     * Recupera o token de acesso do AsyncStorage.
     * @returns O token de acesso armazenado ou null se não existir.
     */
    async getAccessToken() {
        const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
        if (__DEV__) {
            console.log('[authService] getAccessToken:', token);
        }
        return token;
    },

    /**
     * Recupera o token de refresh do AsyncStorage.
     * @returns O token de refresh armazenado ou null se não existir.
     */
    async getRefreshToken() {
        const token = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        if (__DEV__) {
            console.log('[authService] getRefreshToken:', token);
        }
        return token;
    },

    async clearTokens() {
        await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
    },

    /**
     * Verifica se o usuário está logado com base na presença do token de acesso.
     * @returns true se o usuário estiver logado, false caso contrário.
     */
    async isLoggedIn() {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {return false;}

        try {
            const decoded: any = jwtDecode(token);
            const now = Math.floor(Date.now() / 1000);
            return decoded.exp > now;
        } catch (error) {
            return false;
        }
    },
};
