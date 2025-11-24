import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AdminEventsScreen from '../src/screens/AdminEventsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../src/services/authService';
import { Alert } from 'react-native';

// ===== Mocks básicos =====
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../src/services/authService');

jest.mock('../src/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => true,
}));

// Mock SafeLayout/Header/TabBar pra não poluir testes
jest.mock('../src/components/SafeLayout', () => {
  const React = require('react');
  return {
    SafeLayout: ({ children }: any) => <>{children}</>,
  };
});

jest.mock('../src/components/Header', () => {
  const React = require('react');
  const { View, Text, Pressable } = require('react-native');
  return {
    Header: ({ title, onLogout }: any) => (
      <View>
        <Text>{title}</Text>
        <Pressable onPress={onLogout}>
          <Text>Logout</Text>
        </Pressable>
      </View>
    ),
  };
});

jest.mock('../src/components/TabBar', () => {
  const React = require('react');
  const { View, Text, Pressable } = require('react-native');
  return {
    TabBar: ({ onTabPress }: any) => (
      <View>
        <Pressable onPress={() => onTabPress('Home')}>
          <Text>Home</Text>
        </Pressable>
        <Pressable onPress={() => onTabPress('Profile')}>
          <Text>Profile</Text>
        </Pressable>
      </View>
    ),
  };
});

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock do fetch global
global.fetch = jest.fn();

describe('AdminEventsScreen - RF09: Gestão de Eventos (Admin)', () => {
  const mockEvents = [
    {
      id: '1',
      title: 'Evento A',
      eventDate: new Date().toISOString(),
      imageUrl: null,
      isActive: true,
    },
    {
      id: '2',
      title: 'Evento B',
      eventDate: new Date().toISOString(),
      imageUrl: 'https://teste.com/img.png',
      isActive: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-token');
    (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

    (authService.refreshAccessToken as jest.Mock).mockResolvedValue('new-token');

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockEvents,
      text: async () => '',
    });

    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ---------- Loading / fetch ----------
  it('exibe loading inicialmente', () => {
    const { UNSAFE_queryByType } = render(<AdminEventsScreen />);
    const ActivityIndicator = require('react-native').ActivityIndicator;
    expect(UNSAFE_queryByType(ActivityIndicator)).toBeTruthy();
  });

  it('busca eventos ao montar', async () => {
    render(<AdminEventsScreen />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ticket?showInactive=true'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer mock-token' },
        })
      );
    });
  });

  it('renderiza lista de eventos após fetch', async () => {
    const { findByText } = render(<AdminEventsScreen />);

    expect(await findByText('Evento A')).toBeTruthy();
    expect(await findByText('Evento B')).toBeTruthy();
  });

  // ---------- 401 refresh token ----------
  it('tenta refresh token quando fetch retorna 401', async () => {
    // 1ª chamada 401, 2ª ok
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'unauthorized',
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockEvents,
        text: async () => '',
      });

    render(<AdminEventsScreen />);

    await waitFor(() => {
      expect(authService.refreshAccessToken).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenLastCalledWith(
        expect.stringContaining('/ticket?showInactive=true'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer new-token' },
        })
      );
    });
  });

  it('mostra Alert de sessão expirada se refresh falhar', async () => {
    (authService.refreshAccessToken as jest.Mock).mockResolvedValueOnce(null);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'unauthorized',
    });

    render(<AdminEventsScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Sessão expirada',
        'Faça login novamente.'
      );
    });
  });

  // ---------- Erros backend ----------
  it('mostra Alert quando backend retorna erro != 200', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'erro interno',
    });

    render(<AdminEventsScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erro ao buscar eventos',
        expect.stringMatching(/Status 500/)
      );
    });
  });

  // ---------- Toggle Active ----------
  it('chama enable-disable ao clicar em "Desativar"', async () => {
    const { findByText } = render(<AdminEventsScreen />);

    const btnDesativar = await findByText('Desativar');
    fireEvent.press(btnDesativar);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ticket/enable-disable'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ id: '1', isActive: false }),
        })
      );
    });
  });

  it('chama enable-disable ao clicar em "Ativar"', async () => {
    const { findByText } = render(<AdminEventsScreen />);

    const btnAtivar = await findByText('Ativar');
    fireEvent.press(btnAtivar);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ticket/enable-disable'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ id: '2', isActive: true }),
        })
      );
    });
  });

  // ---------- Delete ticket ----------
  it('abre confirmação ao clicar em "Excluir"', async () => {
    const { findAllByText } = render(<AdminEventsScreen />);

    const btnsExcluir = await findAllByText('Excluir');
    fireEvent.press(btnsExcluir[0]);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Excluir Evento',
      'Tem certeza que deseja excluir este evento permanentemente?',
      expect.any(Array)
    );
  });

  it('ao confirmar exclusão, chama DELETE e depois mostra sucesso', async () => {
    const alertMock = Alert.alert as jest.Mock;

    const { findAllByText } = render(<AdminEventsScreen />);
    const btnsExcluir = await findAllByText('Excluir');

    fireEvent.press(btnsExcluir[0]);

    // pega os botões passados pro Alert
    const buttons = alertMock.mock.calls[0][2];
    const btnExcluir = buttons.find((b: any) => b.text === 'Excluir');

    // mock do DELETE ok
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => '',
    });

    await act(async () => {
      await btnExcluir.onPress();
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ticket/1'),
        expect.objectContaining({
          method: 'DELETE',
          headers: { Authorization: 'Bearer mock-token' },
        })
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        'Sucesso',
        'Evento excluído.',
        expect.any(Array)
      );
    });
  });

  // ---------- Logout ----------
  it('faz logout removendo tokens e navegando para Login', async () => {
    const { findByText } = render(<AdminEventsScreen />);

    const btnLogout = await findByText('Logout');
    fireEvent.press(btnLogout);

    await waitFor(() => {
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'accessToken',
        'refreshToken',
        'userRole',
      ]);
      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });
  });
});
