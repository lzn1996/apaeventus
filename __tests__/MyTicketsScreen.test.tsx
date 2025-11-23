// __tests__/MyTicketsScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MyTicketsScreen from '../src/screens/MyTicketsScreen';
import { getUserProfile } from '../src/services/userService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock de dependências
jest.mock('../src/services/userService');
jest.mock('@react-native-async-storage/async-storage');

// Mock do useOfflineTickets
const mockSyncTickets = jest.fn();
const mockGetLocalTickets = jest.fn();
const mockClearLocalData = jest.fn();

jest.mock('../src/hooks/useOfflineTickets', () => ({
  useOfflineTickets: () => ({
    isConnected: true,
    hasLocalData: false,
    loading: false,
    error: null,
    lastSyncDate: null,
    syncTickets: mockSyncTickets,
    getLocalTickets: mockGetLocalTickets,
    clearLocalData: mockClearLocalData,
  }),
}));

// Mock do useFocusEffect - executa callback após microtask (permite montagem completa)
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useFocusEffect: (callback: () => void) => {
      // Executa callback na próxima microtask, após montagem do componente
      Promise.resolve().then(() => callback());
    },
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
  };
});

// Mock dos componentes
jest.mock('../src/components/Header', () => ({
  Header: ({ title }: any) => {
    const { Text } = require('react-native');
    return <Text>{title}</Text>;
  },
}));

jest.mock('../src/components/TabBar', () => ({
  TabBar: ({ activeTab: _activeTab, onTabPress }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="tab-bar">
        <TouchableOpacity onPress={() => onTabPress('Home')}>
          <Text>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onTabPress('Tickets')}>
          <Text>Ingressos</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onTabPress('Profile')}>
          <Text>Perfil</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('../src/components/SafeLayout', () => ({
  SafeLayout: ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

jest.mock('../src/components/OfflineNotification', () => ({
  OfflineNotification: () => null,
}));

jest.mock('../src/screens/MyTicketsScreen/components/EventCard', () => {
  return ({ event, onPress }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} testID={`event-card-${event.id}`}>
        <Text>{event.title}</Text>
        <Text>{event.date}</Text>
      </TouchableOpacity>
    );
  };
});

describe('MyTicketsScreen - RF06: Visualização de ingressos', () => {
  const mockNavigation = { navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('USER');
    (getUserProfile as jest.Mock).mockResolvedValue({
      name: 'João Silva',
      email: 'joao@example.com',
      cellphone: '11999999999',
    });
  });

  describe('Renderização inicial', () => {
    it('renderiza o título "Meus Ingressos"', async () => {
      mockSyncTickets.mockResolvedValue(true);
      mockGetLocalTickets.mockResolvedValue([]);

      const { getByText } = render(<MyTicketsScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(getByText('Meus Ingressos')).toBeTruthy();
      });
    });

    it('exibe loading durante carregamento inicial', () => {
      const { getByText } = render(<MyTicketsScreen navigation={mockNavigation} />);

      expect(getByText('Carregando...')).toBeTruthy();
    });

    it('renderiza TabBar com aba "Tickets" ativa', async () => {
      mockSyncTickets.mockResolvedValue(true);
      mockGetLocalTickets.mockResolvedValue([]);

      const { getByTestId } = render(<MyTicketsScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(getByTestId('tab-bar')).toBeTruthy();
      });
    });
  });

  describe('Listagem de eventos com ingressos', () => {
    it('exibe lista de eventos quando usuário tem ingressos', async () => {
      const mockGroupedTickets = [
        {
          event: {
            id: 'event-1',
            title: 'Show de Rock',
            date: '2025-12-25',
            time: '20:00',
            location: 'Arena',
            imageUrl: 'https://example.com/image.jpg',
          },
          tickets: [{ id: 'ticket-1', code: 'ABC123' }],
        },
        {
          event: {
            id: 'event-2',
            title: 'Festival de Jazz',
            date: '2025-12-30',
            time: '19:00',
            location: 'Teatro',
          },
          tickets: [{ id: 'ticket-2', code: 'DEF456' }],
        },
      ];

      mockSyncTickets.mockResolvedValue(true);
      mockGetLocalTickets.mockResolvedValue(mockGroupedTickets);

      const { getByText } = render(<MyTicketsScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(getByText('Show de Rock')).toBeTruthy();
        expect(getByText('Festival de Jazz')).toBeTruthy();
      });
    });

    it('exibe mensagem quando não há ingressos', async () => {
      mockSyncTickets.mockResolvedValue(true);
      mockGetLocalTickets.mockResolvedValue([]);

      const { getByText } = render(<MyTicketsScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(getByText('Você ainda não possui ingressos.')).toBeTruthy();
      });
    });

    it('ordena eventos futuros antes de eventos passados', async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias no futuro
      const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 dias no passado

      const mockGroupedTickets = [
        {
          event: {
            id: 'event-past',
            title: 'Evento Passado',
            date: pastDate.toISOString().split('T')[0],
            time: '20:00',
            location: 'Local A',
          },
          tickets: [{ id: 'ticket-past' }],
        },
        {
          event: {
            id: 'event-future',
            title: 'Evento Futuro',
            date: futureDate.toISOString().split('T')[0],
            time: '20:00',
            location: 'Local B',
          },
          tickets: [{ id: 'ticket-future' }],
        },
      ];

      mockSyncTickets.mockResolvedValue(true);
      mockGetLocalTickets.mockResolvedValue(mockGroupedTickets);

      const { getAllByText } = render(<MyTicketsScreen navigation={mockNavigation} />);

      await waitFor(() => {
        const titles = getAllByText(/Evento/);
        // Eventos futuros devem aparecer primeiro
        expect(titles[0].children[0]).toContain('Futuro');
      });
    });
  });

  describe('Navegação para detalhes do evento', () => {
    it('navega para TicketsByEvent ao clicar em um evento', async () => {
      const mockGroupedTickets = [
        {
          event: {
            id: 'event-1',
            title: 'Show de Rock',
            date: '2025-12-25',
            time: '20:00',
            location: 'Arena',
            imageUrl: 'https://example.com/image.jpg',
          },
          tickets: [
            {
              id: 'ticket-1',
              type: 'VIP',
              code: 'ABC123',
              used: false,
              qrCodeUrl: 'https://example.com/qr.png',
              price: 100,
            },
          ],
        },
      ];

      mockSyncTickets.mockResolvedValue(true);
      mockGetLocalTickets.mockResolvedValue(mockGroupedTickets);

      const { getByTestId } = render(<MyTicketsScreen navigation={mockNavigation} />);

      await waitFor(() => {
        const eventCard = getByTestId('event-card-event-1');
        fireEvent.press(eventCard);
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('TicketsByEvent', expect.objectContaining({
        eventId: 'event-1',
        eventTitle: 'Show de Rock',
      }));
    });
  });

  describe('Estados de autenticação', () => {
    it('exibe mensagem para usuário não logado sem dados locais', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      mockGetLocalTickets.mockResolvedValue([]);

      const { getByText } = render(<MyTicketsScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(getByText(/Nenhum ingresso sincronizado encontrado/i)).toBeTruthy();
        expect(getByText('Fazer Login')).toBeTruthy();
      });
    });

    it('exibe botão de login quando usuário não está logado', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      mockGetLocalTickets.mockResolvedValue([]);

      const { getByText } = render(<MyTicketsScreen navigation={mockNavigation} />);

      await waitFor(() => {
        const loginButton = getByText('Fazer Login');
        expect(loginButton).toBeTruthy();
      });
    });

    it('navega para Login ao clicar no botão de login', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      mockGetLocalTickets.mockResolvedValue([]);

      const { getByText } = render(<MyTicketsScreen navigation={mockNavigation} />);

      await waitFor(() => {
        const loginButton = getByText('Fazer Login');
        fireEvent.press(loginButton);
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
    });
  });

  describe('Sincronização de dados', () => {
    it('chama syncTickets quando usuário está logado e conectado', async () => {
      mockSyncTickets.mockResolvedValue(true);
      mockGetLocalTickets.mockResolvedValue([]);

      render(<MyTicketsScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(mockSyncTickets).toHaveBeenCalled();
      });
    });

    it('chama getLocalTickets após sincronização bem-sucedida', async () => {
      mockSyncTickets.mockResolvedValue(true);
      mockGetLocalTickets.mockResolvedValue([]);

      render(<MyTicketsScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(mockGetLocalTickets).toHaveBeenCalled();
      });
    });
  });

  describe('Navegação por TabBar', () => {
    it('navega para Dashboard ao clicar na aba Home', async () => {
      mockSyncTickets.mockResolvedValue(true);
      mockGetLocalTickets.mockResolvedValue([]);

      const { getByText } = render(<MyTicketsScreen navigation={mockNavigation} />);

      await waitFor(() => {
        const homeTab = getByText('Home');
        fireEvent.press(homeTab);
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Dashboard');
    });

    it('navega para ProfileEdit ao clicar na aba Perfil quando logado', async () => {
      mockSyncTickets.mockResolvedValue(true);
      mockGetLocalTickets.mockResolvedValue([]);

      const { getByText, queryByText } = render(<MyTicketsScreen navigation={mockNavigation} />);

      // Aguarda carregamento completo (loading desaparece)
      await waitFor(() => {
        expect(queryByText('Carregando...')).toBeNull();
      });

      // Clica na aba Perfil após componente carregar completamente
      const profileTab = getByText('Perfil');
      fireEvent.press(profileTab);

      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith('ProfileEdit');
      });
    });

    it('navega para Login ao clicar na aba Perfil quando não logado', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      mockGetLocalTickets.mockResolvedValue([]);

      const { getByText } = render(<MyTicketsScreen navigation={mockNavigation} />);

      await waitFor(() => {
        const profileTab = getByText('Perfil');
        fireEvent.press(profileTab);
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
    });
  });

  describe('Carregamento de dados do usuário', () => {
    it('carrega perfil do usuário ao inicializar', async () => {
      mockSyncTickets.mockResolvedValue(true);
      mockGetLocalTickets.mockResolvedValue([]);

      render(<MyTicketsScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(getUserProfile).toHaveBeenCalled();
      });
    });

    it('carrega role do usuário do AsyncStorage', async () => {
      mockSyncTickets.mockResolvedValue(true);
      mockGetLocalTickets.mockResolvedValue([]);

      render(<MyTicketsScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalledWith('userRole');
      });
    });
  });

  describe('Tratamento de erros', () => {
    it('continua renderizando mesmo com erro no getUserProfile', async () => {
      (getUserProfile as jest.Mock).mockRejectedValue(new Error('Erro de rede'));
      mockSyncTickets.mockResolvedValue(false);
      mockGetLocalTickets.mockResolvedValue([]);

      const { getByText } = render(<MyTicketsScreen navigation={mockNavigation} />);

      await waitFor(() => {
        expect(getByText('Meus Ingressos')).toBeTruthy();
      });
    });

    it('exibe estado apropriado quando syncTickets falha', async () => {
      mockSyncTickets.mockResolvedValue(false);
      mockGetLocalTickets.mockResolvedValue([]);

      const { getByText } = render(<MyTicketsScreen navigation={mockNavigation} />);

      await waitFor(() => {
        // Deve exibir que não há ingressos
        expect(getByText(/não possui ingressos/i)).toBeTruthy();
      });
    });
  });

  describe('Injeção de dados do comprador', () => {
    it('injeta dados do perfil do usuário nos tickets ao navegar', async () => {
      const mockGroupedTickets = [
        {
          event: {
            id: 'event-1',
            title: 'Show',
            date: '2025-12-25',
            time: '20:00',
            location: 'Arena',
          },
          tickets: [{ id: 'ticket-1', type: 'VIP', code: 'ABC' }],
        },
      ];

      mockSyncTickets.mockResolvedValue(true);
      mockGetLocalTickets.mockResolvedValue(mockGroupedTickets);

      const { getByTestId } = render(<MyTicketsScreen navigation={mockNavigation} />);

      await waitFor(() => {
        const eventCard = getByTestId('event-card-event-1');
        fireEvent.press(eventCard);
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('TicketsByEvent', expect.objectContaining({
        tickets: expect.arrayContaining([
          expect.objectContaining({
            buyer: expect.objectContaining({
              name: 'João Silva',
              email: 'joao@example.com',
              phone: '11999999999',
            }),
          }),
        ]),
      }));
    });
  });
});
