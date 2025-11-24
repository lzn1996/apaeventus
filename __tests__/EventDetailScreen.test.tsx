import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EventDetailScreen from '../src/screens/Public/EventDetailScreen';
import { Alert } from 'react-native';

// ============ MOCKS ============

// navigation
const mockNavigate = jest.fn();
const mockUseRoute = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => mockUseRoute(),
}));

// services
jest.mock('../src/services/eventService', () => ({
  getTicketById: jest.fn(),
}));

jest.mock('../src/services/authService', () => ({
  authService: {
    isLoggedIn: jest.fn(),
    getAccessToken: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

jest.mock('../src/services/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

// assets + components
jest.mock('../src/assets/event-banner.png', () => 123);

jest.mock('../src/components/SafeLayout', () => {
  const React = require('react');
  return { SafeLayout: ({ children }: any) => <>{children}</> };
});

jest.mock('../src/components/Header', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { Header: ({ title }: any) => <Text>{title}</Text> };
});

jest.mock('../src/components/TabBar', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { TabBar: () => <Text testID="tabbar">TABBAR</Text> };
});

// AwesomeAlert mock
jest.mock('react-native-awesome-alerts', () => {
  const React = require('react');
  const { View, Text, Pressable } = require('react-native');
  return ({ show, title, message, onConfirmPressed }: any) =>
    show ? (
      <View testID="awesome-alert">
        <Text>{title}</Text>
        <Text>{message}</Text>
        <Pressable onPress={onConfirmPressed} testID="alert-confirm">
          <Text>OK</Text>
        </Pressable>
      </View>
    ) : null;
});

global.fetch = jest.fn();

const { getTicketById } = require('../src/services/eventService');
const { authService } = require('../src/services/authService');

describe('EventDetailScreen - RF12', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();

    // ✅ ESSENCIAL: sempre ter route válido por padrão
    mockUseRoute.mockReturnValue({ params: {} });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============ Caso SEM ticketId ============
  it('sem ticketId, mostra "Evento não encontrado."', async () => {
    mockUseRoute.mockReturnValueOnce({ params: {} });

    const { findByText } = render(<EventDetailScreen />);

    expect(await findByText('Evento não encontrado.')).toBeTruthy();
  });

  // ============ Carregamento correto ============
  it('carrega evento com ticketId e renderiza dados', async () => {
    mockUseRoute.mockReturnValueOnce({ params: { ticketId: '123' } });

    getTicketById.mockResolvedValueOnce({
      id: '123',
      title: 'Show React',
      description: 'Um super evento',
      price: 50,
      eventDate: new Date().toISOString(),
      imageUrl: null,
    });

    const { findByText } = render(<EventDetailScreen />);

    expect(await findByText('Show React')).toBeTruthy();
    expect(await findByText('Descrição')).toBeTruthy();
    expect(await findByText('Um super evento')).toBeTruthy();
    expect(await findByText('R$50.00')).toBeTruthy();
  });

// ============ Erro ao carregar ============
it('quando getTicketById falha, mostra "Evento não encontrado."', async () => {
  mockUseRoute.mockReturnValueOnce({ params: { ticketId: '123' } });

  getTicketById.mockRejectedValueOnce(new Error('erro'));

  const { findByText } = render(<EventDetailScreen />);

  expect(await findByText('Evento não encontrado.')).toBeTruthy();
});

  // ============ Contador ============
  it('incrementa e decrementa quantidade', async () => {
    mockUseRoute.mockReturnValueOnce({ params: { ticketId: '123' } });

    getTicketById.mockResolvedValueOnce({
      id: '123',
      title: 'Show',
      description: 'Desc',
      price: 10,
      eventDate: new Date().toISOString(),
    });

    const { findByText, getByText } = render(<EventDetailScreen />);
    await findByText('Show');

    const plus = getByText('+');
    const minus = getByText('–');

    fireEvent.press(plus);
    expect(getByText('2')).toBeTruthy();

    fireEvent.press(minus);
    expect(getByText('1')).toBeTruthy();
  });

  // ============ Comprar logado ============
  it('navega para Purchase quando logado', async () => {
    mockUseRoute.mockReturnValueOnce({ params: { ticketId: '123' } });

    getTicketById.mockResolvedValueOnce({
      id: '123',
      title: 'Show Test',
      description: 'desc',
      price: 50,
      eventDate: new Date().toISOString(),
    });

    authService.isLoggedIn.mockResolvedValueOnce(true);
    authService.getAccessToken.mockResolvedValueOnce('token');

    const { findByText, getByText } = render(<EventDetailScreen />);
    await findByText('Show Test');

    fireEvent.press(getByText('Comprar'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        'Purchase',
        expect.objectContaining({
          ticketId: '123',
          eventTitle: 'Show Test',
          price: 50,
          maxQuantity: 5,
          quantity: 1,
        })
      );
    });
  });

  // ============ Comprar NÃO logado ============
  it('alerta e redireciona ao Login se não logado', async () => {
    mockUseRoute.mockReturnValueOnce({ params: { ticketId: '123' } });

    getTicketById.mockResolvedValueOnce({
      id: '123',
      title: 'Show Test',
      description: 'desc',
      price: 50,
      eventDate: new Date().toISOString(),
    });

    authService.isLoggedIn.mockResolvedValueOnce(false);
    authService.getAccessToken.mockResolvedValueOnce(null);

    const { findByText, findByTestId, getByText } = render(<EventDetailScreen />);
    await findByText('Show Test');

    fireEvent.press(getByText('Comprar'));

    const alertBox = await findByTestId('awesome-alert');
    expect(alertBox).toBeTruthy();

    fireEvent.press(await findByTestId('alert-confirm'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });
  });
});
