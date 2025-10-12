import api from './api';
import { authService } from './authService';

/**
 * Serviço responsável por lidar com operações relacionadas à autenticação e atualização de tokens de acesso.
 *
 * Este arquivo contém funções que interagem com o serviço de autenticação, incluindo a atualização do token de acesso
 * utilizando um refresh token armazenado. Ele garante que o usuário permaneça autenticado ao renovar o token de acesso
 * quando necessário.
 */

export async function createSaleProtected(data: { ticketId: string; quantity: number }): Promise<SaleResponse | undefined> {
    await authService.getAccessToken();
    try {
        const response = await api.post<SaleResponse>('/sale', data);
        return response.data;
    } catch (err) {
        console.error('[createSaleProtected] Erro ao criar venda:', err);
        return;
    }
}

// Todas as funções devem usar apenas o api (axios) para requisições HTTP.
// Não usar fetch nem manipulação manual de tokens.

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

export interface SaleResponse {
    sessionId: string;
    url: string
}

export async function getUserSales(): Promise<Sale[]> {
    const response = await api.get('/sale');
    return response.data;
}

export async function getSaleById(id: string): Promise<Sale> {
    const response = await api.get(`/sale/${id}`);
    return response.data;
}
