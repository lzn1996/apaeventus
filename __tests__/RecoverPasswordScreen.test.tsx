import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RecoverPasswordScreen from '../src/screens/ResetPassword';
import { Alert } from 'react-native';

global.fetch = jest.fn();

// Mock AwesomeAlert
jest.mock('react-native-awesome-alerts', () => {
  const React = require('react');
  const { View, Text, Pressable } = require('react-native');

  return (props: any) => {
    if (!props.show) return null;
    return (
      <View testID="awesome-alert">
        <Text>{props.title}</Text>
        <Text>{props.message}</Text>
        <Pressable onPress={props.onConfirmPressed} testID="alert-confirm">
          <Text>{props.confirmText}</Text>
        </Pressable>
      </View>
    );
  };
});

// Mock do navigation
const mockNavigate = jest.fn();
const mockNavigation = { navigate: mockNavigate };

describe('RecoverPasswordScreen - RF11: Reset Password', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // ✅ silencia console.error da tela (ex.: teste de rede)
    jest.spyOn(console, 'error').mockImplementation(() => {});

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "0" },
      json: async () => ({}),
    });

    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks(); // ✅ volta console/error + Alert ao normal
  });

  // ============ Renderização ============
  it('renderiza título e campos principais', () => {
    const { getByText, getByPlaceholderText } = render(
      <RecoverPasswordScreen navigation={mockNavigation} />
    );

    expect(getByText('Recuperar Senha')).toBeTruthy();
    expect(getByPlaceholderText('Digite seu e-mail')).toBeTruthy();
    expect(getByText('Recuperar')).toBeTruthy();
    expect(getByText('Voltar')).toBeTruthy();
  });

  // ============ Validação: email vazio ============
  it('exibe alerta ao tentar enviar sem email', async () => {
    const { getByText, findByTestId } = render(
      <RecoverPasswordScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Recuperar'));

    const alert = await findByTestId('awesome-alert');
    expect(alert).toBeTruthy();
    expect(alert.children[0].props.children).toBe('Erro');
    expect(alert.children[1].props.children).toBe('Digite um e-mail válido.');
  });

  // ============ Sucesso ============
  it('exibe alerta de sucesso quando API retorna ok', async () => {
    const { getByText, getByPlaceholderText, findByTestId } = render(
      <RecoverPasswordScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Digite seu e-mail'), 'user@test.com');
    fireEvent.press(getByText('Recuperar'));

    const alert = await findByTestId('awesome-alert');
    expect(alert).toBeTruthy();
    expect(alert.children[0].props.children).toBe('Sucesso');
  });

  // ============ Erro da API ============
  it('exibe alerta de erro quando API retorna falha', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: { get: () => "20" },
      json: async () => ({ message: 'E-mail não encontrado' }),
    });

    const { getByText, getByPlaceholderText, findByTestId } = render(
      <RecoverPasswordScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Digite seu e-mail'), 'fail@test.com');
    fireEvent.press(getByText('Recuperar'));

    const alert = await findByTestId('awesome-alert');
    expect(alert).toBeTruthy();
    expect(alert.children[0].props.children).toBe('Erro');
    expect(alert.children[1].props.children).toBe('E-mail não encontrado');
  });

  // ============ Erro de rede ============
  it('exibe alerta de rede quando fetch falha', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { getByText, getByPlaceholderText, findByTestId } = render(
      <RecoverPasswordScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Digite seu e-mail'), 'network@test.com');
    fireEvent.press(getByText('Recuperar'));

    const alert = await findByTestId('awesome-alert');
    expect(alert).toBeTruthy();
    expect(alert.children[0].props.children).toBe('Erro');
    expect(alert.children[1].props.children).toBe('Falha na requisição de rede.');
  });

  // ============ Botão voltar ============
  it('navega para Dashboard ao clicar em "Voltar"', () => {
    const { getByText } = render(
      <RecoverPasswordScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Voltar'));
    expect(mockNavigate).toHaveBeenCalledWith('Dashboard');
  });
});
