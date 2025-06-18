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
    const accessToken = await authService.getAccessToken();
    console.log('[createSaleProtected] accessToken atual:', accessToken);
    if (!accessToken) {
        console.warn('[createSaleProtected] Nenhum accessToken encontrado. Usuário provavelmente deslogado.');
    }
    try {
        console.log('[createSaleProtected] Enviando requisição para /sale com dados:', data);
        const response = await api.post('/sale', data);
        console.log('[createSaleProtected] Resposta recebida:', response.data);
        return response.data;
    } catch (err) {
        console.error('[createSaleProtected] Erro ao criar venda:', err);
        throw err;
    }
}

// Todas as funções devem usar apenas o api (axios) para requisições HTTP.
// Não usar fetch nem manipulação manual de tokens.

export async function refreshToken() {
    try {
        if (__DEV__) {
            console.log('[refreshToken] Iniciando refresh do token...');
        }
        const storedRefreshToken = await authService.getRefreshToken();
        if (!storedRefreshToken) {
            if (__DEV__) {
                console.log('[refreshToken] Nenhum refreshToken encontrado.');
            }
            throw new Error('Sem refresh token');
        }
        const response = await api.post(
            '/auth/refresh-token',
            { refreshToken: storedRefreshToken }
        );
        if (__DEV__) {
            console.log('--- Resposta COMPLETA do refresh-token ---');
            console.log(response.data); // Verifique o que vem aqui
            console.log('--- Fim da Resposta COMPLETA ---');
        }

        // Ajuste para aceitar diferentes formatos de resposta
        const newAccessToken = response.data.accessToken || response.data.access_token;
        const newRefreshToken = response.data.refreshToken || response.data.refresh_token;

        if (__DEV__) {
            console.log('[refreshToken] Novo accessToken recebido:', newAccessToken ? 'SIM' : 'NÃO');
            console.log('[refreshToken] Novo refreshToken recebido:', newRefreshToken ? 'SIM' : 'NÃO');
        }

        await authService.setTokens(newAccessToken, newRefreshToken);
        // Retorne ambos!
        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
        if (__DEV__) {
            console.error('[refreshToken] Erro ao tentar renovar o token:', error);
        }
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
