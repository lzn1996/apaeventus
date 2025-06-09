import api from './api';

/**
 * Serviço responsável por operações relacionadas ao usuário, como obtenção do perfil do usuário autenticado.
 * Este arquivo contém funções que interagem com a API para buscar informações do usuário, utilizando autenticação via token JWT.
 */

// Todas as funções devem usar apenas o api (axios) para requisições HTTP.
// Não usar fetch nem manipulação manual de tokens.

export async function getUserProfile() {
    // Não precisa pegar o accessToken manualmente, o api já faz isso
    const response = await api.get('/user/profile');
    return response.data;
}
