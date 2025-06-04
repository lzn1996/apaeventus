import axios from 'axios';
import { baseUrl } from '../config/api';
import { authService } from './authService';

/**
 * Serviço responsável por operações relacionadas ao usuário, como obtenção do perfil do usuário autenticado.
 * Este arquivo contém funções que interagem com a API para buscar informações do usuário, utilizando autenticação via token JWT.
 */

export async function getUserProfile() {
    const accessToken = await authService.getAccessToken();
    if (!accessToken) {throw new Error('Usuário não autenticado');}
    const response = await axios.get(`${baseUrl}/user/profile`, {
        headers: {
        Authorization: `Bearer ${accessToken}`,
        },
    });
    return response.data;
}
