import api from './api';
import { authService } from './authService';

/**
 * Serviço responsável por lidar com operações relacionadas à autenticação e atualização de tokens de acesso.
 *
 * Este arquivo contém funções que interagem com o serviço de autenticação, incluindo a atualização do token de acesso
 * utilizando um refresh token armazenado. Ele garante que o usuário permaneça autenticado ao renovar o token de acesso
 * quando necessário.
 */

export async function createSaleProtected(data: { ticketId: string; quantity: number }) {
    const response = await api.post('/sale', data);
    return response.data;
}

export async function refreshToken() {
    const storedRefreshToken = await authService.getRefreshToken();
    if (!storedRefreshToken) {
        throw new Error('Sem refresh token');
    }
    const response = await api.post(
        '/auth/refresh-token',
        { refreshToken: storedRefreshToken }
    );
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
    await authService.setTokens(newAccessToken, newRefreshToken);
    return newAccessToken;
}
