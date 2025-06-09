import api from './api';

// Buscar todos os tickets (ingressos)
export async function getTickets() {
    try {
        const response = await api.get('/ticket');
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar tickets:', error);
        throw error;
    }
}

// Buscar detalhes de um ticket específico
export async function getTicketById(id: string | number) {
    try {
        const response = await api.get(`/ticket/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar ticket por ID:', error);
        throw error;
    }
}

// Criar uma venda (compra de ingresso)
export async function createSale(data: { ticketId: string | number; quantity: number; userId?: string }) {
    try {
        const response = await api.post('/sale', data);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar venda:', error);
        throw error;
    }
}

// Todas as funções devem usar apenas o api (axios) para requisições HTTP.
// Não usar fetch nem manipulação manual de tokens.
