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
    try {
        console.log('[refreshToken] Iniciando refresh do token...');
        const storedRefreshToken = await authService.getRefreshToken();
        if (!storedRefreshToken) {
            console.log('[refreshToken] Nenhum refreshToken encontrado.');
            throw new Error('Sem refresh token');
        }
        const response = await api.post(
            '/auth/refresh-token',
            { refreshToken: storedRefreshToken }
        );
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
        console.log('[refreshToken] Novo accessToken:', newAccessToken);
        console.log('[refreshToken] Novo refreshToken:', newRefreshToken);
        await authService.setTokens(newAccessToken, newRefreshToken);
        return newAccessToken;
    } catch (error) {
        console.error('[refreshToken] Erro ao tentar renovar o token:', error);
        throw error;
    }
}

export interface Sale {
    id: string;
    used: boolean;
    pdfUrl: string;
    qrCodeUrl: string;
    qrCodeDataUrl: string;
    createdAt: string;
    updatedAt: string;
    ticket: {
        id: string;
        title: string;
        description: string;
        eventDate: string;
        imageUrl: string;
        quantity: number;
        price: number;
        isActive: boolean;
        isDeleted: boolean;
        createdAt: string;
        updatedAt: string;
    };
}

export async function getUserSales(): Promise<Sale[]> {
    const response = await api.get('/sale');
    return response.data;
}

export async function getSaleById(id: string): Promise<Sale> {
    const response = await api.get(`/sale/${id}`);
    return response.data;
}
