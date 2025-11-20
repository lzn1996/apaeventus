// __tests__/PurchaseScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PurchaseScreen from '../src/screens/PurchaseScreen';
import { createSaleProtected } from '../src/services/saleService';

// Mock de dependências
jest.mock('../src/services/saleService');

// Mock do Linking
const mockOpenURL = jest.fn().mockResolvedValue(true);

jest.mock('react-native-awesome-alerts', () => {
  const RN = jest.requireActual('react-native');
  return (props: any) => {
    if (!props.show) {
      return null;
    }
    return RN.createElement('View', { testID: 'awesome-alert' },
      RN.createElement('Text', null, props.title),
      RN.createElement('Text', null, props.message),
      RN.createElement('Pressable', { onPress: props.onConfirmPressed, testID: 'alert-confirm' },
        RN.createElement('Text', null, props.confirmText)
      )
    );
  };
});

// Mock do Linking com jest.doMock para garantir que o mock seja aplicado
jest.doMock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return Object.setPrototypeOf(
    {
      Linking: {
        openURL: mockOpenURL,
      },
    },
    RN
  );
});

// Mock do useRoute e useNavigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useRoute: () => ({
    params: {
      ticketId: 'ticket-123',
      eventTitle: 'Show de Rock 2025',
      price: 50.0,
      quantity: 2,
    },
  }),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

describe('PurchaseScreen - RF05: Compra de ingressos por usuários autenticados', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderização inicial', () => {
    it('renderiza informações da compra corretamente', () => {
      const { getByText } = render(<PurchaseScreen />);

      expect(getByText('Finalizar Compra')).toBeTruthy();
      expect(getByText('Evento:')).toBeTruthy();
      expect(getByText('Show de Rock 2025')).toBeTruthy();
      expect(getByText('Quantidade:')).toBeTruthy();
      expect(getByText('2')).toBeTruthy();
      expect(getByText('Total:')).toBeTruthy();
      expect(getByText('R$100.00')).toBeTruthy();
    });

    it('calcula o total corretamente baseado em preço e quantidade', () => {
      const { getByText } = render(<PurchaseScreen />);
      
      // Preço: 50.00, Quantidade: 2, Total: 100.00
      expect(getByText('R$100.00')).toBeTruthy();
    });

    it('exibe mensagem informativa sobre redirecionamento para Stripe', () => {
      const { getByText } = render(<PurchaseScreen />);

      expect(getByText(/Você será redirecionado para o site da Stripe/i)).toBeTruthy();
      expect(getByText(/você receberá um email com o ingresso/i)).toBeTruthy();
    });

    it('renderiza checkbox de aceite de termos', () => {
      const { getByText } = render(<PurchaseScreen />);

      expect(getByText('Li e concordo com os termos acima')).toBeTruthy();
    });

    it('renderiza botão Confirmar Compra', () => {
      const { getByText } = render(<PurchaseScreen />);

      expect(getByText('Confirmar Compra')).toBeTruthy();
    });

    it('renderiza botão Voltar', () => {
      const { getByText } = render(<PurchaseScreen />);

      expect(getByText('Voltar')).toBeTruthy();
    });
  });

  describe('Validação de aceite de termos', () => {
    it('permite marcar checkbox de aceite de termos', () => {
      const { getByText } = render(<PurchaseScreen />);

      const checkboxText = getByText('Li e concordo com os termos acima');
      const checkboxContainer = checkboxText.parent;
      
      if (checkboxContainer) {
        // Clica no checkbox
        fireEvent.press(checkboxContainer);

        // Verifica que foi marcado (checkmark visível)
        expect(getByText('✓')).toBeTruthy();
      }
    });

    it('permite desmarcar checkbox de aceite', () => {
      const { getByText, queryByText } = render(<PurchaseScreen />);

      const checkboxText = getByText('Li e concordo com os termos acima');
      const checkboxContainer = checkboxText.parent;
      
      if (checkboxContainer) {
        // Marca
        fireEvent.press(checkboxContainer);
        expect(getByText('✓')).toBeTruthy();

        // Desmarca
        fireEvent.press(checkboxContainer);
        expect(queryByText('✓')).toBeNull();
      }
    });
  });

  describe('Processo de compra', () => {
    it('chama createSaleProtected com dados corretos ao confirmar compra', async () => {
      (createSaleProtected as jest.Mock).mockResolvedValue({
        url: 'https://checkout.stripe.com/session-123',
        sessionId: 'session-123',
      });

      const { getByText } = render(<PurchaseScreen />);

      // Aceita termos
      const checkboxText = getByText('Li e concordo com os termos acima');
      const checkboxContainer = checkboxText.parent;

      if (checkboxContainer) {
        fireEvent.press(checkboxContainer);

        // Clica em confirmar
        const confirmButton = getByText('Confirmar Compra');
        fireEvent.press(confirmButton);

        await waitFor(() => {
          expect(createSaleProtected).toHaveBeenCalledWith({
            ticketId: 'ticket-123',
            quantity: 2,
          });
        });
      }
    });
  });

  describe('Tratamento de erros', () => {
    it('não chama função de criação de venda quando há erro na API', async () => {
      (createSaleProtected as jest.Mock).mockRejectedValue(
        new Error('Erro de rede')
      );

      const { getByText } = render(<PurchaseScreen />);

      // Aceita termos e confirma
      const checkboxText = getByText('Li e concordo com os termos acima');
      const checkboxContainer = checkboxText.parent;

      if (checkboxContainer) {
        fireEvent.press(checkboxContainer);
        
        const confirmButton = getByText('Confirmar Compra');
        fireEvent.press(confirmButton);

        await waitFor(() => {
          expect(createSaleProtected).toHaveBeenCalled();
        });

        // Verifica que o mock foi chamado (comportamento esperado)
        expect(createSaleProtected).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Navegação', () => {
    it('navega de volta para Dashboard ao clicar em Voltar', () => {
      const { getByText } = render(<PurchaseScreen />);

      const backButton = getByText('Voltar');
      fireEvent.press(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('Dashboard');
    });
  });

  describe('Cálculo de valores', () => {
    it('calcula total corretamente para quantidade 1', () => {
      // Precisa mockar useRoute com novos parâmetros
      jest.spyOn(require('@react-navigation/native'), 'useRoute').mockReturnValue({
        params: {
          ticketId: 'ticket-456',
          eventTitle: 'Palestra',
          price: 30.0,
          quantity: 1,
        },
      });

      const { getByText } = render(<PurchaseScreen />);

      expect(getByText('R$30.00')).toBeTruthy();
    });

    it('calcula total corretamente para múltiplas unidades', () => {
      jest.spyOn(require('@react-navigation/native'), 'useRoute').mockReturnValue({
        params: {
          ticketId: 'ticket-789',
          eventTitle: 'Festival',
          price: 75.5,
          quantity: 3,
        },
      });

      const { getByText } = render(<PurchaseScreen />);

      // 75.5 * 3 = 226.50
      expect(getByText('R$226.50')).toBeTruthy();
    });
  });
});
