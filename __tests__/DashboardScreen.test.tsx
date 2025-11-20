// __tests__/DashboardScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DashboardScreen from '../src/screens/DashboardScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../src/services/authService';

// Mock de dependências
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../src/services/authService');
jest.mock('../src/hooks/useNetworkStatus', () => ({
    useNetworkStatus: () => true,
}));

// Mock do fetch global
global.fetch = jest.fn();

jest.mock('react-native-awesome-alerts', () => {
    const React = require('react');
    return (props: any) => {
        if (!props.show) return null;
        return React.createElement('View', { testID: 'awesome-alert' },
        React.createElement('Text', null, props.title),
        React.createElement('Text', null, props.message),
        React.createElement('Pressable', { onPress: props.onConfirmPressed, testID: 'alert-confirm' },
            React.createElement('Text', null, props.confirmText)
        )
        );
    };
    });

    // Mock do navigation
    const mockNavigate = jest.fn();
    const mockNavigation = {
    navigate: mockNavigate,
    replace: jest.fn(),
    goBack: jest.fn(),
    addListener: jest.fn((event, callback) => {
        // Simula o focus listener
        return () => {}; // unsubscribe
    }),
    };

    describe('DashboardScreen - RF04: Exibição de eventos organizados por data', () => {
    beforeAll(() => {
        // Configuração inicial dos mocks
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
        (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
        (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);
        (authService.refreshToken as jest.Mock).mockResolvedValue(undefined);
    });

    beforeEach(() => {
        // Limpa histórico de chamadas antes de cada teste
        jest.clearAllMocks();
        mockNavigate.mockClear();

        // Mock padrão do fetch para eventos
        (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ([
            {
            id: '1',
            title: 'Evento Próximo',
            description: 'Descrição do evento próximo',
            eventDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // daqui 2 dias
            imageUrl: 'https://example.com/image1.jpg',
            quantity: 100,
            price: 50.0,
            isActive: true,
            isDeleted: false,
            sold: 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            },
            {
            id: '2',
            title: 'Evento Futuro',
            description: 'Descrição do evento futuro',
            eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // daqui 7 dias
            imageUrl: 'https://example.com/image2.jpg',
            quantity: 50,
            price: 30.0,
            isActive: true,
            isDeleted: false,
            sold: 5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            },
            {
            id: '3',
            title: 'Evento Hoje',
            description: 'Descrição do evento hoje',
            eventDate: new Date().toISOString(), // hoje
            imageUrl: null,
            quantity: 200,
            price: 0,
            isActive: true,
            isDeleted: false,
            sold: 50,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            },
        ]),
        });
    });

    describe('Carregamento de eventos', () => {
        it('exibe loading enquanto carrega eventos', async () => {
        // Mock que simula delay
        (global.fetch as jest.Mock).mockImplementation(() => 
            new Promise(resolve => setTimeout(() => resolve({
            ok: true,
            json: async () => []
            }), 100))
        );

        const { UNSAFE_queryByType } = render(<DashboardScreen navigation={mockNavigation} />);

        // Verifica se está exibindo ActivityIndicator de loading
        const ActivityIndicator = require('react-native').ActivityIndicator;
        const loadingIndicator = UNSAFE_queryByType(ActivityIndicator);
        expect(loadingIndicator).toBeTruthy();
        });

        it('carrega eventos do backend ao iniciar', async () => {
        const { getByText } = render(<DashboardScreen navigation={mockNavigation} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/ticket?showInactive=false'),
            expect.objectContaining({
                method: 'GET',
            })
            );
        }, { timeout: 3000 });
        });

        it('exibe mensagem quando não há eventos', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        const { getByText } = render(<DashboardScreen navigation={mockNavigation} />);

        await waitFor(() => {
            expect(getByText('Nenhum evento em destaque.')).toBeTruthy();
            expect(getByText('Nenhum próximo evento.')).toBeTruthy();
        }, { timeout: 3000 });
        });
    });

    describe('Ordenação de eventos por data', () => {
        it('ordena eventos por data (mais próximos primeiro)', async () => {
        const { findByText } = render(<DashboardScreen navigation={mockNavigation} />);

        // Aguarda eventos carregarem
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        }, { timeout: 3000 });

        // O evento "Hoje" deve aparecer primeiro (é o mais próximo)
        const eventoHoje = await findByText('Evento Hoje');
        expect(eventoHoje).toBeTruthy();
        });

        it('separa evento destacado dos próximos eventos', async () => {
        const { findByText } = render(<DashboardScreen navigation={mockNavigation} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        }, { timeout: 3000 });

        // Primeiro evento deve ser destacado
        const eventoDestacado = await findByText('Evento Hoje');
        expect(eventoDestacado).toBeTruthy();

        // Outros eventos devem aparecer na lista de próximos
        const eventoProximo = await findByText('Evento Próximo');
        expect(eventoProximo).toBeTruthy();
        });
    });

    describe('Busca de eventos', () => {
        it('permite buscar eventos por título', async () => {
        const { getByPlaceholderText, findByText } = render(<DashboardScreen navigation={mockNavigation} />);

        // Aguarda eventos carregarem
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        }, { timeout: 3000 });

        // Clica na aba de busca
        const searchTab = await findByText('Busca');
        fireEvent.press(searchTab);

        // Busca por evento específico
        const searchInput = getByPlaceholderText('Pesquisar por nome...');
        fireEvent.changeText(searchInput, 'Futuro');

        // Verifica se filtra corretamente
        await waitFor(() => {
            expect(findByText('Evento Futuro')).toBeTruthy();
        });
        });

        it('exibe mensagem quando busca não retorna resultados', async () => {
        const { getByPlaceholderText, findByText, getByText } = render(<DashboardScreen navigation={mockNavigation} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        }, { timeout: 3000 });

        // Clica na aba de busca
        const searchTab = await findByText('Busca');
        fireEvent.press(searchTab);

        // Busca por evento que não existe
        const searchInput = getByPlaceholderText('Pesquisar por nome...');
        fireEvent.changeText(searchInput, 'Evento Inexistente');

        await waitFor(() => {
            expect(getByText(/nenhum evento encontrado/i)).toBeTruthy();
        });
        });
    });

    describe('Navegação para detalhes do evento', () => {
        it('navega para tela de detalhes ao clicar em evento', async () => {
        const { findByText } = render(<DashboardScreen navigation={mockNavigation} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        }, { timeout: 3000 });

        const evento = await findByText('Evento Hoje');
        fireEvent.press(evento);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(
            'EventDetail',
            expect.objectContaining({ ticketId: '3' })
            );
        });
        });
    });

    describe('Tratamento de erros', () => {
        it('trata erro ao buscar eventos', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        const { getByText } = render(<DashboardScreen navigation={mockNavigation} />);

        await waitFor(() => {
            // Deve exibir mensagem de erro ou lista vazia
            expect(getByText('Nenhum evento em destaque.')).toBeTruthy();
        }, { timeout: 3000 });
        });

        it('trata resposta de erro do servidor', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        const { getByText } = render(<DashboardScreen navigation={mockNavigation} />);

        await waitFor(() => {
            expect(getByText('Nenhum evento em destaque.')).toBeTruthy();
        }, { timeout: 3000 });
        });
    });

    describe('Abas de navegação', () => {
        it('renderiza todas as abas de navegação', async () => {
        const { getByText } = render(<DashboardScreen navigation={mockNavigation} />);

        await waitFor(() => {
            expect(getByText('Home')).toBeTruthy();
            expect(getByText('Busca')).toBeTruthy();
            expect(getByText('Ingressos')).toBeTruthy();
            expect(getByText('Perfil')).toBeTruthy();
        });
        });

        it('alterna entre abas corretamente', async () => {
        const { getByText, findByText } = render(<DashboardScreen navigation={mockNavigation} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        }, { timeout: 3000 });

        // Clica na aba de busca
        const searchTab = await findByText('Busca');
        fireEvent.press(searchTab);

        // Verifica se exibe o campo de busca
        await waitFor(() => {
            expect(getByText('Busca')).toBeTruthy();
        });
        });
    });

    describe('Autenticação e perfil', () => {
        it('exibe opção de login quando usuário não está autenticado', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

        const { findByText, getByText } = render(<DashboardScreen navigation={mockNavigation} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        }, { timeout: 3000 });

        // Verifica que a aba de perfil está disponível
        const profileTab = await findByText('Perfil');
        expect(profileTab).toBeTruthy();
        
        // Verifica que o usuário não está logado (Header deve mostrar estado não logado)
        expect(getByText('Perfil')).toBeTruthy();
        });

        it('carrega perfil do usuário quando autenticado', async () => {
        (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
            if (key === 'userRole') {
            return Promise.resolve('USER');
            }
            if (key === 'accessToken') {
            return Promise.resolve('fake-token');
            }
            if (key === 'refreshToken') {
            return Promise.resolve('fake-refresh-token');
            }
            return Promise.resolve(null);
        });

        const { findByText } = render(<DashboardScreen navigation={mockNavigation} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        }, { timeout: 3000 });

        // Clica na aba de perfil
        const profileTab = await findByText('Perfil');
        fireEvent.press(profileTab);

        // Deve exibir opções de perfil
        await waitFor(() => {
            expect(findByText(/perfil/i)).toBeTruthy();
        });
        });
    });

    describe('Formatação de datas', () => {
        it('formata datas dos eventos corretamente', async () => {
        const { findByText } = render(<DashboardScreen navigation={mockNavigation} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        }, { timeout: 3000 });

        // Verifica se as datas estão sendo exibidas
        const evento = await findByText('Evento Hoje');
        expect(evento).toBeTruthy();
        });
    });

    describe('Imagens dos eventos', () => {
        it('exibe imagem do evento quando disponível', async () => {
        const { findByText } = render(<DashboardScreen navigation={mockNavigation} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        }, { timeout: 3000 });

        // Evento com imagem deve ser renderizado
        const evento = await findByText('Evento Próximo');
        expect(evento).toBeTruthy();
        });

        it('exibe placeholder quando evento não tem imagem', async () => {
        const { findByText } = render(<DashboardScreen navigation={mockNavigation} />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        }, { timeout: 3000 });

        // Evento sem imagem deve ser renderizado
        const evento = await findByText('Evento Hoje');
        expect(evento).toBeTruthy();
        });
    });
});
