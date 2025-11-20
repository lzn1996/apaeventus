// __tests__/EditProfileScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EditProfileScreen from '../src/screens/EditProfileScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/services/api';
import { authService } from '../src/services/authService';

// Mock de dependências
jest.mock('../src/services/api');
jest.mock('../src/services/authService');
jest.mock('../src/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => true,
}));
jest.mock('react-native-awesome-alerts', () => {
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

  describe('Validação de campos obrigatórios', () => {
    it('exibe alerta quando nome está vazio', async () => {
      const { getByText, getByPlaceholderText, getByTestId } = render(<EditProfileScreen />);

      await waitFor(() => {
        expect(getByText('Salvar Alterações')).toBeTruthy();
      }, { timeout: 3000 });

      // Limpa o campo nome
      const nameInput = getByPlaceholderText('Nome completo');
      fireEvent.changeText(nameInput, '');

      // Clica em salvar
      const saveButton = getByText('Salvar Alterações');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(getByTestId('awesome-alert')).toBeTruthy();
        expect(getByText('Atenção')).toBeTruthy();
        expect(getByText('Nome e e-mail são obrigatórios.')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('exibe alerta quando email está vazio', async () => {
      const { getByText, getByPlaceholderText, getByTestId } = render(<EditProfileScreen />);

      await waitFor(() => {
        expect(getByText('Salvar Alterações')).toBeTruthy();
      }, { timeout: 3000 });

      // Limpa o campo email
      const emailInput = getByPlaceholderText('seu@email.com');
      fireEvent.changeText(emailInput, '');

      // Clica em salvar
      const saveButton = getByText('Salvar Alterações');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(getByTestId('awesome-alert')).toBeTruthy();
        expect(getByText('Atenção')).toBeTruthy();
        expect(getByText('Nome e e-mail são obrigatórios.')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('permite salvar quando campos obrigatórios estão preenchidos', async () => {
      const { getByText } = render(<EditProfileScreen />);

      await waitFor(() => {
        expect(getByText('Salvar Alterações')).toBeTruthy();
      }, { timeout: 3000 });

      // Clica em salvar
      const saveButton = getByText('Salvar Alterações');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(api.patch).toHaveBeenCalledWith('/user', expect.any(Object));
      }, { timeout: 3000 });
    });
  });

  describe('Atualização com sucesso', () => {
    it('atualiza dados e faz logout após sucesso', async () => {
      const { getByText, getByPlaceholderText, getByTestId } = render(<EditProfileScreen />);

      await waitFor(() => {
        expect(getByText('Salvar Alterações')).toBeTruthy();
      }, { timeout: 3000 });

      // Altera nome
      const nameInput = getByPlaceholderText('Nome completo');
      fireEvent.changeText(nameInput, 'João Silva Atualizado');

      // Clica em salvar
      const saveButton = getByText('Salvar Alterações');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(getByTestId('awesome-alert')).toBeTruthy();
        expect(getByText('Sucesso')).toBeTruthy();
        expect(getByText(/Dados atualizados!/)).toBeTruthy();
      }, { timeout: 3000 });

      expect(api.patch).toHaveBeenCalled();
    });

    it('envia dados corretos para API via PATCH /user', async () => {
      const { getByText, getByPlaceholderText } = render(<EditProfileScreen />);

      await waitFor(() => {
        expect(getByText('Salvar Alterações')).toBeTruthy();
      }, { timeout: 3000 });

      // Atualiza campos
      const nameInput = getByPlaceholderText('Nome completo');
      const rgInput = getByPlaceholderText('44444444-4');
      const cellphoneInput = getByPlaceholderText('19987654321');

      fireEvent.changeText(nameInput, 'Novo Nome');
      fireEvent.changeText(rgInput, '111222333');
      fireEvent.changeText(cellphoneInput, '19999999999');

      // Clica em salvar
      const saveButton = getByText('Salvar Alterações');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(api.patch).toHaveBeenCalledWith('/user', {
          name: 'Novo Nome',
          email: 'usuario@test.com',
          rg: '111222333',
          cellphone: '19999999999',
        });
      }, { timeout: 3000 });
    });

    it('atualiza senha quando campo senha está preenchido', async () => {
      const { getByText, getByPlaceholderText } = render(<EditProfileScreen />);

      await waitFor(() => {
        expect(getByText('Salvar Alterações')).toBeTruthy();
      }, { timeout: 3000 });

      // Preenche senha
      const passwordInput = getByPlaceholderText('********');
      fireEvent.changeText(passwordInput, 'NovaSenha123!');

      // Clica em salvar
      const saveButton = getByText('Salvar Alterações');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(api.patch).toHaveBeenCalledWith('/user', expect.objectContaining({
          password: 'NovaSenha123!',
        }));
      }, { timeout: 3000 });
    });

    it('não envia senha quando campo está vazio', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: {
          name: 'João Silva',
          email: 'joao@test.com',
        },
      });

      (api.patch as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

      const { getByText } = render(<EditProfileScreen />);

      await waitFor(() => {
        expect(getByText('Salvar Alterações')).toBeTruthy();
      }, { timeout: 3000 });

      // Clica em salvar sem preencher senha
      const saveButton = getByText('Salvar Alterações');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(api.patch).toHaveBeenCalledWith('/user', expect.not.objectContaining({
          password: expect.anything(),
        }));
      }, { timeout: 3000 });
    });
  });

  describe('Tratamento de erros', () => {
    it('exibe erro quando servidor falha ao atualizar', async () => {
      (api.patch as jest.Mock).mockRejectedValueOnce({
        response: {
          status: 500,
          data: 'Internal Server Error',
        },
      });

      const { getByText, getByTestId } = render(<EditProfileScreen />);

      await waitFor(() => {
        expect(getByText('Salvar Alterações')).toBeTruthy();
      }, { timeout: 3000 });

      // Clica em salvar
      const saveButton = getByText('Salvar Alterações');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(getByTestId('awesome-alert')).toBeTruthy();
        expect(getByText('Erro de rede')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('trata erro 401 e tenta refresh token', async () => {
      // Limpa mock padrão e configura sequência de respostas
      (api.get as jest.Mock).mockReset();
      (api.get as jest.Mock)
        .mockRejectedValueOnce({
          response: { status: 401 },
        })
        .mockResolvedValueOnce({
          data: {
            name: 'Usuário Teste',
            email: 'usuario@test.com',
          },
        });

      (authService.refreshAccessToken as jest.Mock).mockResolvedValueOnce('new-token');

      const { getByText } = render(<EditProfileScreen />);

      await waitFor(() => {
        expect(getByText('Salvar Alterações')).toBeTruthy();
      }, { timeout: 3000 });

      expect(authService.refreshAccessToken).toHaveBeenCalled();
      expect(api.get).toHaveBeenCalledTimes(2);
    });

  });

  describe('Carregamento de dados', () => {
    it('carrega dados do backend ao iniciar', async () => {
      render(<EditProfileScreen />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/user/profile');
      }, { timeout: 3000 });
    });

    it('usa fallback do AsyncStorage quando backend não responde', async () => {
      (api.get as jest.Mock).mockRejectedValueOnce(new Error('Timeout'));

      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce('Usuário Offline') // userName
        .mockResolvedValueOnce('offline@test.com') // userEmail
        .mockResolvedValueOnce('111222333') // userRg
        .mockResolvedValueOnce('19911111111'); // userCellphone

      const { getByDisplayValue, getByTestId } = render(<EditProfileScreen />);

      // Aguarda carregar dados do AsyncStorage
      await waitFor(() => {
        expect(getByDisplayValue('Usuário Offline')).toBeTruthy();
      }, { timeout: 3000 });

      expect(getByDisplayValue('offline@test.com')).toBeTruthy();

      // Deve exibir alerta informativo
      expect(getByTestId('awesome-alert')).toBeTruthy();
    });
  });

  describe('Campos do formulário', () => {
    it('permite editar campo Nome', async () => {
      const { getByPlaceholderText, getByDisplayValue } = render(<EditProfileScreen />);

      await waitFor(() => {
        expect(getByDisplayValue('Usuário Teste')).toBeTruthy();
      }, { timeout: 3000 });

      const nameInput = getByPlaceholderText('Nome completo');
      fireEvent.changeText(nameInput, 'Nome Editado');

      expect(getByDisplayValue('Nome Editado')).toBeTruthy();
    });

    it('permite editar campo E-mail', async () => {
      const { getByPlaceholderText, getByDisplayValue } = render(<EditProfileScreen />);

      await waitFor(() => {
        expect(getByDisplayValue('usuario@test.com')).toBeTruthy();
      }, { timeout: 3000 });

      const emailInput = getByPlaceholderText('seu@email.com');
      fireEvent.changeText(emailInput, 'novo@test.com');

      expect(getByDisplayValue('novo@test.com')).toBeTruthy();
    });

    it('permite editar campo RG', async () => {
      const { getByPlaceholderText, getByDisplayValue } = render(<EditProfileScreen />);

      await waitFor(() => {
        expect(getByDisplayValue('123456789')).toBeTruthy();
      }, { timeout: 3000 });

      const rgInput = getByPlaceholderText('44444444-4');
      fireEvent.changeText(rgInput, '987654321');

      expect(getByDisplayValue('987654321')).toBeTruthy();
    });

    it('permite editar campo Celular', async () => {
      const { getByPlaceholderText, getByDisplayValue } = render(<EditProfileScreen />);

      await waitFor(() => {
        expect(getByDisplayValue('19987654321')).toBeTruthy();
      }, { timeout: 3000 });

      const cellphoneInput = getByPlaceholderText('19987654321');
      fireEvent.changeText(cellphoneInput, '19911111111');

      expect(getByDisplayValue('19911111111')).toBeTruthy();
    });
  });
});
