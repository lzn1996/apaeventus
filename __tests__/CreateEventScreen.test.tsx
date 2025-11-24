import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import CreateEventScreen from '../src/screens/CreateEventScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/services/api';
import { Alert } from 'react-native';

// =================== MOCKS ===================
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../src/services/api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

// Mock ImagePicker (expo)
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  getMediaLibraryPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return ({ mode }: any) => (
    <View testID={`datetimepicker-${mode}`}>
      <Text>Picker {mode}</Text>
    </View>
  );
});

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

// Mock SafeLayout/Header/TabBar
jest.mock('../src/components/SafeLayout', () => {
  const React = require('react');
  return { SafeLayout: ({ children }: any) => <>{children}</> };
});
jest.mock('../src/components/Header', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return { Header: ({ title }: any) => <View><Text>{title}</Text></View> };
});
jest.mock('../src/components/TabBar', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { TabBar: () => <View testID="tabbar" /> };
});

// ---- mocks navigation/route em variáveis controláveis
const mockNavigate = jest.fn();
const mockUseRoute = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => mockUseRoute(),
}));

// Mock fetch global
global.fetch = jest.fn();

// ==================================================
describe('CreateEventScreen - RF10: Criação de Eventos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();

    mockUseRoute.mockReturnValue({ params: undefined });

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-token');
    (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

    (api.post as jest.Mock).mockResolvedValue({ data: { id: '1' } });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
    });

    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ---------------- Renderização ----------------
  it('renderiza campos principais e botão de submit', () => {
    const { getByText, getByPlaceholderText, getAllByText } = render(<CreateEventScreen />);

    expect(getByText('Criar Novo Evento')).toBeTruthy();

    expect(getByPlaceholderText('Nome do evento')).toBeTruthy();
    expect(getByPlaceholderText('Detalhes do evento')).toBeTruthy();

    // Existem dois "Criar Evento" (Header + Botão)
    const criarEventoTexts = getAllByText('Criar Evento');
    expect(criarEventoTexts.length).toBeGreaterThan(1);

    expect(getByText('Escolher Imagem')).toBeTruthy();
  });

  // ---------------- Prefill chatbot ----------------
  it('preenche título e descrição quando vem params do chatbot', () => {
    mockUseRoute.mockReturnValue({
      params: { title: 'Evento IA', description: 'Desc IA' },
    });

    const { getByDisplayValue } = render(<CreateEventScreen />);

    expect(getByDisplayValue('Evento IA')).toBeTruthy();
    expect(getByDisplayValue('Desc IA')).toBeTruthy();
  });

  // ---------------- Validações ----------------
  it('mostra alerta se não tiver token', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const { getAllByText, findByTestId } = render(<CreateEventScreen />);

    // pega o botão (último "Criar Evento")
    fireEvent.press(getAllByText('Criar Evento').pop()!);

    const alertBox = await findByTestId('awesome-alert');
    expect(alertBox).toBeTruthy();
  });

  it('mostra alerta se título ou descrição estiverem vazios', async () => {
    const { getAllByText, findByText } = render(<CreateEventScreen />);

    fireEvent.press(getAllByText('Criar Evento').pop()!);

    expect(await findByText('Atenção')).toBeTruthy();
    expect(await findByText('Título e descrição são obrigatórios.')).toBeTruthy();
  });

  // ---------------- Submit sem imagem ----------------
  it('envia evento via api.post quando não há imagem', async () => {
    const { getByPlaceholderText, getAllByPlaceholderText, getAllByText } =
      render(<CreateEventScreen />);

    fireEvent.changeText(getByPlaceholderText('Nome do evento'), 'Show Rock');
    fireEvent.changeText(getByPlaceholderText('Detalhes do evento'), 'Top demais');

    // placeholder "0" aparece duas vezes: [0]=quantidade, [1]=preço
    const zeros = getAllByPlaceholderText('0');
    fireEvent.changeText(zeros[0], '100'); // quantidade
    fireEvent.changeText(zeros[1], '50');  // preço

    fireEvent.press(getAllByText('Criar Evento').pop()!);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/ticket',
        expect.objectContaining({
          title: 'Show Rock',
          description: 'Top demais',
          quantity: 100,
          price: 50,
        })
      );
    });
  });

  it('após sucesso, ao confirmar alerta navega para Dashboard', async () => {
    const { getByPlaceholderText, getAllByText, findByTestId } =
      render(<CreateEventScreen />);

    fireEvent.changeText(getByPlaceholderText('Nome do evento'), 'Show');
    fireEvent.changeText(getByPlaceholderText('Detalhes do evento'), 'Desc');

    fireEvent.press(getAllByText('Criar Evento').pop()!);

    const alertBox = await findByTestId('awesome-alert');
    expect(alertBox).toBeTruthy();

    fireEvent.press(await findByTestId('alert-confirm'));
    expect(mockNavigate).toHaveBeenCalledWith('Dashboard');
  });

  // ---------------- Abrir chatbot ----------------
  it('pressionar botão IA reseta conversa e navega para Chatbot', async () => {
    const { getByText } = render(<CreateEventScreen />);

    const btnIA = getByText(/Clique aqui para usar IA/i);
    fireEvent.press(btnIA);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/chatbot/reset-conversation',
        {},
        expect.any(Object)
      );
      expect(mockNavigate).toHaveBeenCalledWith('Chatbot');
    });
  });

  // ---------------- Submit com imagem ----------------
  it('envia evento via fetch FormData quando há imagem', async () => {
    const ImagePicker = require('expo-image-picker');

    ImagePicker.getMediaLibraryPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{
        uri: 'file://imagem.jpg',
        mimeType: 'image/jpeg',
        fileName: 'imagem.jpg'
      }]
    });

    const { getByText, getByPlaceholderText, getAllByText } =
      render(<CreateEventScreen />);

    fireEvent.changeText(getByPlaceholderText('Nome do evento'), 'Evento Img');
    fireEvent.changeText(getByPlaceholderText('Detalhes do evento'), 'Com foto');

    // showImageOptions abre Alert
    const alertMock = Alert.alert as jest.Mock;
    fireEvent.press(getByText('Escolher Imagem'));

    const buttons = alertMock.mock.calls[0][2];
    const btnGaleria = buttons.find((b: any) => b.text === 'Galeria');

    await act(async () => {
      await btnGaleria.onPress();
    });

    fireEvent.press(getAllByText('Criar Evento').pop()!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/ticket'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
          body: expect.any(FormData),
        })
      );
    });
  });
});
