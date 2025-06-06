import api from './api';

/**
 * Serviço responsável por operações relacionadas ao usuário, como obtenção do perfil do usuário autenticado.
 * Este arquivo contém funções que interagem com a API para buscar informações do usuário, utilizando autenticação via token JWT.
 */

export async function getUserProfile() {
    // Não precisa pegar o accessToken manualmente, o api já faz isso
    const response = await api.get('/user/profile');
    return response.data;
}
