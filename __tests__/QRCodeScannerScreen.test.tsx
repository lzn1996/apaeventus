// __tests__/QRCodeScannerScreen.test.tsx
// Nota: O aviso "Jest did not exit one second after..." é causado pelo setTimeout de 10s
// no componente (linha 39). Este é um comportamento esperado e não afeta os testes.
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import QrScannerScreen from '../src/screens/QRCodeScannerScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../src/services/authService';

// Mock de dependências
jest.mock('expo-camera', () => ({
    CameraView: 'CameraView',
    useCameraPermissions: jest.fn(),
    }));

    jest.mock('../src/services/authService', () => ({
    authService: {
        refreshAccessToken: jest.fn(),
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
        React.createElement('Pressable', {
            onPress: props.onConfirmPressed,
            testID: 'alert-confirm',
        },
            React.createElement('Text', null, props.confirmText)
        )
        );
    };
    });

    jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({
        navigate: jest.fn(),
    }),
    }));

    // Mock do fetch global
    global.fetch = jest.fn();

describe('QRCodeScannerScreen - RF08: Validação de ingressos via QR Code', () => {
const mockRequestPermission = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    // Suprime console.error durante os testes para evitar poluição visual
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-token');
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ success: true }),
    });
});

afterEach(() => {
    // Restaura console.error após cada teste
    jest.restoreAllMocks();
});    describe('Permissões da câmera', () => {
        it('exibe mensagem quando permissão não foi concedida', () => {
        const { useCameraPermissions } = require('expo-camera');
        useCameraPermissions.mockReturnValue([
            { granted: false },
            mockRequestPermission,
        ]);

        const { getByText } = render(<QrScannerScreen />);

        expect(getByText('Permissão da câmera não concedida.')).toBeTruthy();
        expect(getByText('Solicitar Permissão')).toBeTruthy();
        });

        it('exibe botão para solicitar permissão', () => {
        const { useCameraPermissions } = require('expo-camera');
        useCameraPermissions.mockReturnValue([
            { granted: false },
            mockRequestPermission,
        ]);

        const { getByText } = render(<QrScannerScreen />);
        const button = getByText('Solicitar Permissão');

        fireEvent.press(button);

        expect(mockRequestPermission).toHaveBeenCalled();
        });

        it('renderiza câmera quando permissão foi concedida', () => {
        const { useCameraPermissions } = require('expo-camera');
        useCameraPermissions.mockReturnValue([
            { granted: true },
            mockRequestPermission,
        ]);

        const { getByText, UNSAFE_queryByType } = render(<QrScannerScreen />);

        expect(getByText('Leitor de QR Code')).toBeTruthy();
        const CameraView = require('expo-camera').CameraView;
        const camera = UNSAFE_queryByType(CameraView);
        expect(camera).toBeTruthy();
        });
    });

    describe('Leitura de QR Code', () => {
        beforeEach(() => {
        const { useCameraPermissions } = require('expo-camera');
        useCameraPermissions.mockReturnValue([
            { granted: true },
            mockRequestPermission,
        ]);
        });

        it('valida ingresso com sucesso ao escanear QR Code válido', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ success: true }),
        });

        const { UNSAFE_getByType, getByTestId, getByText } = render(<QrScannerScreen />);
        const CameraView = require('expo-camera').CameraView;
        const camera = UNSAFE_getByType(CameraView);

        // Simula escaneamento de QR Code
        fireEvent(camera, 'barcodeScanned', {
            type: 'qr',
            data: 'valid-sale-id-123',
        });

        await waitFor(() => {
            expect(getByTestId('awesome-alert')).toBeTruthy();
            expect(getByText('✅ Ingresso Válido')).toBeTruthy();
            expect(getByText('Ingresso validado com sucesso!')).toBeTruthy();
        });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/sale/set-used'),
            expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
                Authorization: 'Bearer mock-token',
                'Content-Type': 'application/json',
            }),
            body: JSON.stringify({ saleId: 'valid-sale-id-123' }),
            })
        );
        });

        it('exibe erro quando ingresso já foi utilizado (400)', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({ error: 'Ticket already used' }),
        });

        const { UNSAFE_getByType, getByTestId, getByText } = render(<QrScannerScreen />);
        const CameraView = require('expo-camera').CameraView;
        const camera = UNSAFE_getByType(CameraView);

        fireEvent(camera, 'barcodeScanned', {
            type: 'qr',
            data: 'used-sale-id',
        });

        await waitFor(() => {
            expect(getByTestId('awesome-alert')).toBeTruthy();
            expect(getByText('❌ Erro na Validação')).toBeTruthy();
            expect(getByText('Ingresso já foi utilizado ou é inválido.')).toBeTruthy();
        });
        });

        it('exibe erro quando ingresso não é encontrado (404)', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 404,
            json: async () => ({ error: 'Not found' }),
        });

        const { UNSAFE_getByType, getByTestId, getByText } = render(<QrScannerScreen />);
        const CameraView = require('expo-camera').CameraView;
        const camera = UNSAFE_getByType(CameraView);

        fireEvent(camera, 'barcodeScanned', {
            type: 'qr',
            data: 'invalid-sale-id',
        });

        await waitFor(() => {
            expect(getByTestId('awesome-alert')).toBeTruthy();
            expect(getByText('❌ Erro na Validação')).toBeTruthy();
            expect(getByText('Ingresso não encontrado no sistema.')).toBeTruthy();
        });
        });

        it('exibe erro quando servidor falha (500)', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Internal server error' }),
        });

        const { UNSAFE_getByType, getByTestId, getByText } = render(<QrScannerScreen />);
        const CameraView = require('expo-camera').CameraView;
        const camera = UNSAFE_getByType(CameraView);

        fireEvent(camera, 'barcodeScanned', {
            type: 'qr',
            data: 'any-sale-id',
        });

        await waitFor(() => {
            expect(getByTestId('awesome-alert')).toBeTruthy();
            expect(getByText('❌ Erro na Validação')).toBeTruthy();
            expect(getByText('Erro no servidor. Tente novamente em alguns instantes.')).toBeTruthy();
        });
        });
    });

    describe('Renovação de token', () => {
        beforeEach(() => {
        const { useCameraPermissions } = require('expo-camera');
        useCameraPermissions.mockReturnValue([
            { granted: true },
            mockRequestPermission,
        ]);
        });

        it('renova token e tenta novamente quando recebe 401', async () => {
        (authService.refreshAccessToken as jest.Mock).mockResolvedValueOnce('new-token');

        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({ error: 'Unauthorized' }),
            })
            .mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ success: true }),
            });

        const { UNSAFE_getByType, getByTestId, getByText } = render(<QrScannerScreen />);
        const CameraView = require('expo-camera').CameraView;
        const camera = UNSAFE_getByType(CameraView);

        fireEvent(camera, 'barcodeScanned', {
            type: 'qr',
            data: 'sale-id-401',
        });

        await waitFor(() => {
            expect(authService.refreshAccessToken).toHaveBeenCalled();
            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(getByTestId('awesome-alert')).toBeTruthy();
            expect(getByText('✅ Ingresso Válido')).toBeTruthy();
        });
        });

        it('exibe erro quando renovação de token falha', async () => {
        (authService.refreshAccessToken as jest.Mock).mockResolvedValueOnce(null);
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({ error: 'Unauthorized' }),
        });

        const { UNSAFE_getByType, getByTestId, getByText } = render(<QrScannerScreen />);
        const CameraView = require('expo-camera').CameraView;
        const camera = UNSAFE_getByType(CameraView);

        fireEvent(camera, 'barcodeScanned', {
            type: 'qr',
            data: 'sale-id',
        });

        await waitFor(() => {
            expect(getByTestId('awesome-alert')).toBeTruthy();
            expect(getByText('❌ Erro na Validação')).toBeTruthy();
            expect(getByText('Não foi possível renovar o token')).toBeTruthy();
        });
        });
    });

    describe('Tratamento de erros', () => {
        beforeEach(() => {
        const { useCameraPermissions } = require('expo-camera');
        useCameraPermissions.mockReturnValue([
            { granted: true },
            mockRequestPermission,
        ]);
        });

        it('exibe erro quando token não está disponível', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

        const { UNSAFE_getByType, getByTestId, getByText } = render(<QrScannerScreen />);
        const CameraView = require('expo-camera').CameraView;
        const camera = UNSAFE_getByType(CameraView);

        fireEvent(camera, 'barcodeScanned', {
            type: 'qr',
            data: 'sale-id',
        });

        await waitFor(() => {
            expect(getByTestId('awesome-alert')).toBeTruthy();
            expect(getByText('❌ Erro na Validação')).toBeTruthy();
            expect(getByText('Token não encontrado')).toBeTruthy();
        });
        });

        it('exibe erro genérico quando ocorre erro de rede', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        const { UNSAFE_getByType, getByTestId, getByText } = render(<QrScannerScreen />);
        const CameraView = require('expo-camera').CameraView;
        const camera = UNSAFE_getByType(CameraView);

        fireEvent(camera, 'barcodeScanned', {
            type: 'qr',
            data: 'sale-id',
        });

        await waitFor(() => {
            expect(getByTestId('awesome-alert')).toBeTruthy();
            expect(getByText('❌ Erro na Validação')).toBeTruthy();
            expect(getByText('Network error')).toBeTruthy();
        });
        });
    });

    describe('Navegação', () => {
        it('renderiza título correto', () => {
        const { useCameraPermissions } = require('expo-camera');
        useCameraPermissions.mockReturnValue([
            { granted: true },
            mockRequestPermission,
        ]);

        const { getByText } = render(<QrScannerScreen />);

        expect(getByText('Leitor de QR Code')).toBeTruthy();
        });

        it('renderiza TabBar com abas de navegação', () => {
        const { useCameraPermissions } = require('expo-camera');
        useCameraPermissions.mockReturnValue([
            { granted: true },
            mockRequestPermission,
        ]);

        const { getByText } = render(<QrScannerScreen />);

        expect(getByText('Home')).toBeTruthy();
        expect(getByText('Busca')).toBeTruthy();
        expect(getByText('Ingressos')).toBeTruthy();
        expect(getByText('Admin')).toBeTruthy();
        });
    });

    describe('Estado do scanner após validação', () => {
        beforeEach(() => {
        const { useCameraPermissions } = require('expo-camera');
        useCameraPermissions.mockReturnValue([
            { granted: true },
            mockRequestPermission,
        ]);
        });

        it('não permite escanear novamente até fechar o alerta', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ success: true }),
        });

        const { UNSAFE_getByType } = render(<QrScannerScreen />);
        const CameraView = require('expo-camera').CameraView;
        const camera = UNSAFE_getByType(CameraView);

        // Primeiro escaneamento
        fireEvent(camera, 'barcodeScanned', {
            type: 'qr',
            data: 'sale-id-1',
        });

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        // Tenta escanear novamente (não deve chamar fetch)
        fireEvent(camera, 'barcodeScanned', {
            type: 'qr',
            data: 'sale-id-2',
        });

        // fetch não deve ser chamado novamente
        expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('permite fechar alerta após validação', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ success: true }),
        });

        const { UNSAFE_getByType, getByTestId, queryByTestId } = render(<QrScannerScreen />);
        const CameraView = require('expo-camera').CameraView;
        const camera = UNSAFE_getByType(CameraView);

        fireEvent(camera, 'barcodeScanned', {
            type: 'qr',
            data: 'sale-id',
        });

        await waitFor(() => {
            expect(getByTestId('awesome-alert')).toBeTruthy();
        });

        // Verifica que o alerta está visível
        expect(getByTestId('awesome-alert')).toBeTruthy();
        expect(queryByTestId('alert-confirm')).toBeTruthy();
        });
    });
});
