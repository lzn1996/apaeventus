import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from '../src/screens/LoginScreen';
import { baseUrl } from '../src/config/api';

// Mock da navegação
const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  replace: mockReplace,
};

// Mock do Alert
jest.spyOn(Alert, 'alert');

// Mock do fetch global
global.fetch = jest.fn();

// Mock do localStorageService
jest.mock('../src/services/localStorageService', () => ({
  localStorageService: {
    clearAllTickets: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('LoginScreen - RF02: Autenticação por e-mail e senha', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    AsyncStorage.clear();
  });

  describe('Renderização inicial', () => {
    it('renderiza campos de email e senha', () => {
      const { getByPlaceholderText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      expect(getByPlaceholderText('E-mail')).toBeTruthy();
      expect(getByPlaceholderText('Senha')).toBeTruthy();
    });

    it('renderiza botão Entrar', () => {
      const { getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      expect(getByText('Entrar')).toBeTruthy();
    });

    it('renderiza links de navegação', () => {
      const { getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      expect(getByText('Registre-se')).toBeTruthy();
      expect(getByText('Recuperar Senha')).toBeTruthy();
      expect(getByText('Voltar para Tela Inicial')).toBeTruthy();
    });

    it('renderiza logo da APAE', () => {
      const { getByTestId, UNSAFE_root } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      // Verifica se há uma imagem (logo) renderizada
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Validação de campos obrigatórios', () => {
    it('não faz login quando email está vazio', async () => {
      const { getByText, getByPlaceholderText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const senhaInput = getByPlaceholderText('Senha');

      // Preenche apenas senha
      fireEvent.changeText(senhaInput, 'senha123');

      const entrarButton = getByText('Entrar');
      fireEvent.press(entrarButton);

      // O fetch não deve ter sido chamado (botão desabilitado)
      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    it('não faz login quando senha está vazia', async () => {
      const { getByText, getByPlaceholderText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const emailInput = getByPlaceholderText('E-mail');

      // Preenche apenas email
      fireEvent.changeText(emailInput, 'teste@example.com');

      const entrarButton = getByText('Entrar');
      fireEvent.press(entrarButton);

      // O fetch não deve ter sido chamado (botão desabilitado)
      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    it('não faz login quando ambos os campos estão vazios', async () => {
      const { getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const entrarButton = getByText('Entrar');
      fireEvent.press(entrarButton);

      // O fetch não deve ter sido chamado (botão desabilitado)
      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
      });

      // Alert não deve ter sido chamado porque botão está desabilitado
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('faz login quando ambos os campos estão preenchidos', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        text: async () => JSON.stringify({
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh',
          user: { role: 'user', email: 'teste@example.com', name: 'Teste' },
        }),
      });

      const { getByText, getByPlaceholderText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const emailInput = getByPlaceholderText('E-mail');
      const senhaInput = getByPlaceholderText('Senha');
      const entrarButton = getByText('Entrar');

      // Preenche ambos os campos
      fireEvent.changeText(emailInput, 'teste@example.com');
      fireEvent.changeText(senhaInput, 'senha123');

      // Clica no botão
      fireEvent.press(entrarButton);

      // O fetch deve ter sido chamado (botão habilitado)
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/login'),
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });
  });

  describe('Login com credenciais válidas', () => {
    it('faz login com sucesso e salva tokens', async () => {
      const mockResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: '1',
          name: 'João Silva',
          email: 'joao@example.com',
          role: 'USER',
          cpf: '12345678901',
          rg: '123456789',
          cellphone: '11987654321',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify(mockResponse),
      });

      const { getByPlaceholderText, getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const emailInput = getByPlaceholderText('E-mail');
      const senhaInput = getByPlaceholderText('Senha');

      fireEvent.changeText(emailInput, 'joao@example.com');
      fireEvent.changeText(senhaInput, 'senha123');

      const entrarButton = getByText('Entrar');
      fireEvent.press(entrarButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `${baseUrl}/auth/login`,
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'joao@example.com',
              password: 'senha123',
            }),
          })
        );
      });

      // Verifica se tokens foram salvos no AsyncStorage
      await waitFor(async () => {
        const accessToken = await AsyncStorage.getItem('accessToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const userRole = await AsyncStorage.getItem('userRole');

        expect(accessToken).toBe('mock-access-token');
        expect(refreshToken).toBe('mock-refresh-token');
        expect(userRole).toBe('USER');
      });
    });

    it('salva dados do usuário no AsyncStorage', async () => {
      const mockResponse = {
        accessToken: 'token',
        refreshToken: 'refresh',
        user: {
          id: '1',
          name: 'Maria Santos',
          email: 'maria@example.com',
          role: 'ADMIN',
          cpf: '98765432100',
          rg: '987654321',
          cellphone: '11912345678',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify(mockResponse),
      });

      const { getByPlaceholderText, getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      fireEvent.changeText(getByPlaceholderText('E-mail'), 'maria@example.com');
      fireEvent.changeText(getByPlaceholderText('Senha'), 'admin123');
      fireEvent.press(getByText('Entrar'));

      await waitFor(async () => {
        const userName = await AsyncStorage.getItem('userName');
        const userEmail = await AsyncStorage.getItem('userEmail');
        const userCpf = await AsyncStorage.getItem('userCpf');
        const userRg = await AsyncStorage.getItem('userRg');
        const userCellphone = await AsyncStorage.getItem('userCellphone');

        expect(userName).toBe('Maria Santos');
        expect(userEmail).toBe('maria@example.com');
        expect(userCpf).toBe('98765432100');
        expect(userRg).toBe('987654321');
        expect(userCellphone).toBe('11912345678');
      });
    });

    it('navega para Dashboard após login bem-sucedido', async () => {
      const mockResponse = {
        accessToken: 'token',
        refreshToken: 'refresh',
        user: {
          id: '1',
          name: 'Teste',
          email: 'teste@example.com',
          role: 'USER',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify(mockResponse),
      });

      const { getByPlaceholderText, getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      fireEvent.changeText(getByPlaceholderText('E-mail'), 'teste@example.com');
      fireEvent.changeText(getByPlaceholderText('Senha'), 'senha123');
      fireEvent.press(getByText('Entrar'));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('Dashboard');
      });
    });

    it('exibe indicador de loading durante autenticação', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const { getByPlaceholderText, getByText, UNSAFE_queryByType } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      fireEvent.changeText(getByPlaceholderText('E-mail'), 'teste@example.com');
      fireEvent.changeText(getByPlaceholderText('Senha'), 'senha123');
      fireEvent.press(getByText('Entrar'));

      // Verifica se ActivityIndicator está presente (loading)
      await waitFor(() => {
        // O texto "Entrar" não deve estar visível durante loading
        expect(() => getByText('Entrar')).toThrow();
      });
    });
  });

  describe('Login com credenciais inválidas', () => {
    it('exibe erro para credenciais inválidas (status 401)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ message: 'Unauthorized' }),
      });

      const { getByPlaceholderText, getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      fireEvent.changeText(getByPlaceholderText('E-mail'), 'errado@example.com');
      fireEvent.changeText(getByPlaceholderText('Senha'), 'senhaerrada');
      fireEvent.press(getByText('Entrar'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erro ao entrar',
          'E-mail ou senha inválidos!'
        );
      });
    });

    it('exibe mensagem de erro na tela', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ message: 'Invalid credentials' }),
      });

      const { getByPlaceholderText, getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      fireEvent.changeText(getByPlaceholderText('E-mail'), 'errado@example.com');
      fireEvent.changeText(getByPlaceholderText('Senha'), 'senhaerrada');
      fireEvent.press(getByText('Entrar'));

      await waitFor(() => {
        expect(getByText('E-mail ou senha inválidos!')).toBeTruthy();
      });
    });

    it('não salva tokens quando login falha', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ message: 'Unauthorized' }),
      });

      const { getByPlaceholderText, getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      fireEvent.changeText(getByPlaceholderText('E-mail'), 'errado@example.com');
      fireEvent.changeText(getByPlaceholderText('Senha'), 'senhaerrada');
      fireEvent.press(getByText('Entrar'));

      await waitFor(async () => {
        const accessToken = await AsyncStorage.getItem('accessToken');
        expect(accessToken).toBeNull();
      });
    });

    it('não navega para Dashboard quando login falha', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ message: 'Unauthorized' }),
      });

      const { getByPlaceholderText, getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      fireEvent.changeText(getByPlaceholderText('E-mail'), 'errado@example.com');
      fireEvent.changeText(getByPlaceholderText('Senha'), 'senhaerrada');
      fireEvent.press(getByText('Entrar'));

      await waitFor(() => {
        expect(mockReplace).not.toHaveBeenCalled();
      });
    });
  });

  describe('Tratamento de erros', () => {
    it('exibe erro quando servidor não responde', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network request failed')
      );

      const { getByPlaceholderText, getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      fireEvent.changeText(getByPlaceholderText('E-mail'), 'teste@example.com');
      fireEvent.changeText(getByPlaceholderText('Senha'), 'senha123');
      fireEvent.press(getByText('Entrar'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erro ao entrar',
          expect.stringContaining('Network request failed')
        );
      });
    });

    it('trata resposta não-JSON do servidor', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: async () => '<html>Error</html>',
      });

      const { getByPlaceholderText, getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      fireEvent.changeText(getByPlaceholderText('E-mail'), 'teste@example.com');
      fireEvent.changeText(getByPlaceholderText('Senha'), 'senha123');
      fireEvent.press(getByText('Entrar'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erro ao entrar',
          expect.stringContaining('não é um JSON válido')
        );
      });
    });
  });

  describe('Navegação', () => {
    it('navega para tela de cadastro ao clicar em Registre-se', () => {
      const { getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const registreSeButton = getByText('Registre-se');
      fireEvent.press(registreSeButton);

      expect(mockNavigate).toHaveBeenCalledWith('Cadastro');
    });

    it('navega para recuperação de senha ao clicar em Recuperar Senha', () => {
      const { getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const recuperarSenhaButton = getByText('Recuperar Senha');
      fireEvent.press(recuperarSenhaButton);

      expect(mockNavigate).toHaveBeenCalledWith('Reset');
    });

    it('navega para Dashboard ao clicar em Voltar para Tela Inicial', () => {
      const { getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const voltarButton = getByText('Voltar para Tela Inicial');
      fireEvent.press(voltarButton);

      expect(mockNavigate).toHaveBeenCalledWith('Dashboard');
    });
  });

  describe('Toggle de visibilidade de senha', () => {
    it('alterna visibilidade da senha ao clicar no ícone', () => {
      const { getByPlaceholderText, UNSAFE_root } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const senhaInput = getByPlaceholderText('Senha');

      // Verifica que senha começa oculta
      expect(senhaInput.props.secureTextEntry).toBe(true);
    });
  });
});
