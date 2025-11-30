/* eslint-disable jest/no-disabled-tests */
// __tests__/EditProfileScreen.test.tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import EditProfileScreen from '../src/screens/EditProfileScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/services/api';
import { authService } from '../src/services/authService';

// Mock de dependências
jest.mock('../src/services/api', () => {
  const mockApi = {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };
  return {
    __esModule: true,
    default: mockApi,
  };
});
jest.mock('../src/services/authService', () => ({
  authService: {
    refreshAccessToken: jest.fn(),
    getAccessToken: jest.fn(),
  },
}));
jest.mock('../src/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => true,
}));
jest.mock('react-native-awesome-alerts', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const React = require('react');
  return (props: any) => {
    if (!props.show) {return null;}
    return React.createElement('View', { testID: 'awesome-alert' },
      React.createElement('Text', null, props.title),
      React.createElement('Text', null, props.message),
      React.createElement('Pressable', { onPress: props.onConfirmPressed, testID: 'alert-confirm' },
        React.createElement('Text', null, props.confirmText)
      )
    );
  };
});

// Mock global do useNavigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
  }),
}));

describe('EditProfileScreen - RF03: Atualização de dados do usuário', () => {
  // Configuração inicial dos mocks - será herdada por todos os testes
  beforeAll(() => {
    // AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

    // api.get - resposta padrão
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        name: 'Usuário Teste',
        email: 'usuario@test.com',
        rg: '123456789',
        cellphone: '19987654321',
      },
    });

    // api.patch - resposta padrão
    (api.patch as jest.Mock).mockResolvedValue({
      data: { success: true },
    });

    // authService
    (authService.refreshAccessToken as jest.Mock).mockResolvedValue('new-token');
  });

  beforeEach(() => {
    // Limpa apenas as contagens de chamadas, não as implementações
    jest.clearAllMocks();

    // Re-aplica os mocks antes de cada teste para garantir que funcionem
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        name: 'Usuário Teste',
        email: 'usuario@test.com',
        rg: '123456789',
        cellphone: '19987654321',
      },
    });

    (api.patch as jest.Mock).mockResolvedValue({
      data: { success: true },
    });

    (authService.refreshAccessToken as jest.Mock).mockResolvedValue('new-token');
    (authService.getAccessToken as jest.Mock).mockResolvedValue('mock-token');

    // Mock do AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Renderização inicial', () => {
    it('exibe loading enquanto carrega dados', async () => {
      // Mock temporário que nunca resolve, para testar estado de loading
      const neverResolvingPromise = new Promise(() => {});
      (api.get as jest.Mock).mockImplementationOnce(() => neverResolvingPromise);

      const { UNSAFE_queryByType } = render(<EditProfileScreen />);

      const ActivityIndicator = require('react-native').ActivityIndicator;
      const loadingIndicator = UNSAFE_queryByType(ActivityIndicator);

      expect(loadingIndicator).toBeTruthy();
    });

    it('renderiza todos os campos do formulário', async () => {
      const { getByPlaceholderText } = render(<EditProfileScreen />);

      await waitFor(() => {
        expect(getByPlaceholderText('Nome completo')).toBeTruthy();
        expect(getByPlaceholderText('seu@email.com')).toBeTruthy();
        expect(getByPlaceholderText('********')).toBeTruthy();
        expect(getByPlaceholderText('44444444-4')).toBeTruthy();
        expect(getByPlaceholderText('19987654321')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('renderiza botão Salvar Alterações', async () => {
      const { getByText } = render(<EditProfileScreen />);

      await waitFor(() => {
        expect(getByText('Salvar Alterações')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('carrega dados do usuário do backend', async () => {
      const { getByDisplayValue } = render(<EditProfileScreen />);

      await waitFor(() => {
        expect(getByDisplayValue('Usuário Teste')).toBeTruthy();
        expect(getByDisplayValue('usuario@test.com')).toBeTruthy();
        expect(getByDisplayValue('123456789')).toBeTruthy();
        expect(getByDisplayValue('19987654321')).toBeTruthy();
      }, { timeout: 3000 });

      expect(api.get).toHaveBeenCalledWith('/user/profile');
    });
  });
});
