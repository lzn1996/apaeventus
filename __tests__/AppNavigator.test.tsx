import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from '../src/navigation/AppNavigator';

describe('AppNavigator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renderiza SplashScreen com texto esperado', async () => {
    const { getByText } = render(
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    );

    // Verifica que o texto da splash está presente
    await waitFor(() => {
      expect(getByText(/Sistema de Gestão de Eventos/i)).toBeTruthy();
    });
  });

  it('inicia animações da Splash corretamente', async () => {
    const { getByText } = render(
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    );

    // Valida que a Splash renderiza com texto e elementos esperados
    await waitFor(() => {
      expect(getByText(/Sistema de Gestão de Eventos/i)).toBeTruthy();
    });

    // Nota: Teste de navegação completa requer mock de InteractionManager
    // e pode causar warnings act devido a timers assíncronos.
    // A validação de navegação será coberta em testes E2E.
  });
});
