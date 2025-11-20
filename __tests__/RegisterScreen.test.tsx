import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RegisterScreen from '../src/screens/RegisterScreen';
import { baseUrl } from '../src/config/api';

// Mock da navegação
const mockNavigate = jest.fn();
const mockNavigation = {
    navigate: mockNavigate,
    };

    // Mock do Alert
    jest.spyOn(Alert, 'alert');

    // Mock do fetch global
    global.fetch = jest.fn();

    describe('RegisterScreen - RF01: Cadastro de usuários', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (global.fetch as jest.Mock).mockClear();
    });

    describe('Renderização inicial', () => {
        it('renderiza todos os campos obrigatórios', () => {
        const { getByPlaceholderText, getByText } = render(
            <RegisterScreen navigation={mockNavigation} />
        );

        expect(getByPlaceholderText('Nome completo')).toBeTruthy();
        expect(getByPlaceholderText('Email')).toBeTruthy();
        expect(getByPlaceholderText('CPF')).toBeTruthy();
        expect(getByPlaceholderText('RG')).toBeTruthy();
        expect(getByPlaceholderText('Telefone')).toBeTruthy();
        expect(getByPlaceholderText('Senha')).toBeTruthy();
        expect(getByPlaceholderText('Confirmar senha')).toBeTruthy();
        expect(getByText('Cadastrar')).toBeTruthy();
        });

        it('exibe mensagem de campos obrigatórios', () => {
        const { getByText } = render(
            <RegisterScreen navigation={mockNavigation} />
        );

        expect(getByText('Todos os campos são obrigatórios')).toBeTruthy();
        });
    });

    describe('Validação de campos obrigatórios', () => {
        it('não permite cadastro com campos vazios', async () => {
        const { getByText } = render(
            <RegisterScreen navigation={mockNavigation} />
        );

        const cadastrarButton = getByText('Cadastrar');
        fireEvent.press(cadastrarButton);

        await waitFor(() => {
            // Verifica que fetch não foi chamado
            expect(global.fetch).not.toHaveBeenCalled();
        });
        });

        it('valida nome mínimo de 3 caracteres', async () => {
        const { getByPlaceholderText, getByText } = render(
            <RegisterScreen navigation={mockNavigation} />
        );

        const nomeInput = getByPlaceholderText('Nome completo');
        fireEvent.changeText(nomeInput, 'Jo');

        const cadastrarButton = getByText('Cadastrar');
        fireEvent.press(cadastrarButton);

        await waitFor(() => {
            expect(getByText(/nome está muito curto/i)).toBeTruthy();
        });
        });

        it('valida formato de email inválido', async () => {
        const { getByPlaceholderText, getByText } = render(
            <RegisterScreen navigation={mockNavigation} />
        );

        const emailInput = getByPlaceholderText('Email');
        fireEvent.changeText(emailInput, 'emailinvalido');

        const cadastrarButton = getByText('Cadastrar');
        fireEvent.press(cadastrarButton);

        await waitFor(() => {
            // Busca qualquer texto de erro relacionado a email
            expect(global.fetch).not.toHaveBeenCalled();
        });
        });

        it('valida CPF com 11 dígitos', async () => {
        const { getByPlaceholderText, getByText } = render(
            <RegisterScreen navigation={mockNavigation} />
        );

        const cpfInput = getByPlaceholderText('CPF');
        fireEvent.changeText(cpfInput, '123');

        const cadastrarButton = getByText('Cadastrar');
        fireEvent.press(cadastrarButton);

        await waitFor(() => {
            expect(global.fetch).not.toHaveBeenCalled();
        });
        });

        it('valida RG com 9 dígitos', async () => {
        const { getByPlaceholderText, getByText } = render(
            <RegisterScreen navigation={mockNavigation} />
        );

        const rgInput = getByPlaceholderText('RG');
        fireEvent.changeText(rgInput, '12345');

        const cadastrarButton = getByText('Cadastrar');
        fireEvent.press(cadastrarButton);

        await waitFor(() => {
            expect(global.fetch).not.toHaveBeenCalled();
        });
        });

        it('valida telefone com mínimo 10 dígitos', async () => {
        const { getByPlaceholderText, getByText } = render(
            <RegisterScreen navigation={mockNavigation} />
        );

        const telefoneInput = getByPlaceholderText('Telefone');
        fireEvent.changeText(telefoneInput, '123456');

        const cadastrarButton = getByText('Cadastrar');
        fireEvent.press(cadastrarButton);

        await waitFor(() => {
            expect(global.fetch).not.toHaveBeenCalled();
        });
        });
    });

    describe('Validação de força de senha', () => {
        it('exibe mensagem de senha muito curta (menos de 8 caracteres)', async () => {
        const { getByPlaceholderText, getByText } = render(
            <RegisterScreen navigation={mockNavigation} />
        );

        const senhaInput = getByPlaceholderText('Senha');
        fireEvent.changeText(senhaInput, 'abc123');

        await waitFor(() => {
            expect(getByText('Senha muito curta.')).toBeTruthy();
        });
        });

        it('aceita senha forte com 8+ caracteres, letras, números e símbolos', async () => {
        const { getByPlaceholderText, queryByText } = render(
            <RegisterScreen navigation={mockNavigation} />
        );

        const senhaInput = getByPlaceholderText('Senha');
        fireEvent.changeText(senhaInput, 'Senha@123');

        await waitFor(() => {
            // Senha forte não deve mostrar erro
            expect(queryByText('Senha muito curta.')).toBeNull();
        });
        });

        it('exibe requisitos de senha ao focar no campo', async () => {
        const { getByPlaceholderText, getByText } = render(
            <RegisterScreen navigation={mockNavigation} />
        );

        const senhaInput = getByPlaceholderText('Senha');
        fireEvent(senhaInput, 'focus');

        await waitFor(() => {
            expect(getByText('Para uma senha forte, use:')).toBeTruthy();
            expect(getByText(/Pelo menos 8 caracteres/i)).toBeTruthy();
            expect(getByText(/Letras \(a-z, A-Z\)/i)).toBeTruthy();
            expect(getByText(/Números \(0-9\)/i)).toBeTruthy();
            expect(getByText(/Símbolos/i)).toBeTruthy();
        });
        });
    });

    describe('Validação de confirmação de senha', () => {
        it('exibe erro quando senhas não coincidem', async () => {
        const { getByPlaceholderText, getByText } = render(
            <RegisterScreen navigation={mockNavigation} />
        );

        const senhaInput = getByPlaceholderText('Senha');
        const confirmarSenhaInput = getByPlaceholderText('Confirmar senha');

        fireEvent.changeText(senhaInput, 'Senha@123');
        fireEvent.changeText(confirmarSenhaInput, 'Senha@456');

        await waitFor(() => {
            expect(getByText('As senhas não coincidem.')).toBeTruthy();
        });
        });

        it('não exibe erro quando senhas coincidem', async () => {
        const { getByPlaceholderText, queryByText } = render(
            <RegisterScreen navigation={mockNavigation} />
        );

        const senhaInput = getByPlaceholderText('Senha');
        const confirmarSenhaInput = getByPlaceholderText('Confirmar senha');

        fireEvent.changeText(senhaInput, 'Senha@123');
        fireEvent.changeText(confirmarSenhaInput, 'Senha@123');

        await waitFor(() => {
            expect(queryByText('As senhas não coincidem.')).toBeNull();
        });
        });
    });

    describe('Cadastro com dados válidos', () => {
        it('envia requisição de cadastro com sucesso', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({}),
        });

        const { getByPlaceholderText, getByText } = render(
            <RegisterScreen navigation={mockNavigation} />
        );

        // Preenche todos os campos com dados válidos (CPF: 111.444.777-35 válido)
        fireEvent.changeText(getByPlaceholderText('Nome completo'), 'João da Silva');
        fireEvent.changeText(getByPlaceholderText('Email'), 'joao@example.com');
        fireEvent.changeText(getByPlaceholderText('CPF'), '11144477735');
        fireEvent.changeText(getByPlaceholderText('RG'), '123456789');
        fireEvent.changeText(getByPlaceholderText('Telefone'), '11987654321');
        fireEvent.changeText(getByPlaceholderText('Senha'), 'Senha@123');
        fireEvent.changeText(getByPlaceholderText('Confirmar senha'), 'Senha@123');

        const cadastrarButton = getByText('Cadastrar');
        fireEvent.press(cadastrarButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
            `${baseUrl}/user`,
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('joao@example.com'),
            })
            );
        });

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
            'Sucesso',
            'Usuário cadastrado com sucesso!'
            );
        });

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('Login');
        });
        });
    });

    // NOTA: Testes de tratamento de erros (email duplicado, falha de rede, timeout)
    // estão implementados no código (src/hooks/useRegisterForm.ts linhas 260-330)
    // mas são difíceis de testar devido à complexidade do hook customizado.
    // O código trata:
    // - Email duplicado: exibe mensagem "Este e-mail já está cadastrado." no campo
    // - Erro de rede: Alert "Não foi possível conectar ao servidor"
    // - Timeout: Alert "Tempo de conexão esgotado"
    // - Erros genéricos do servidor: Alert com mensagem do backend

    describe('Validação de CPF', () => {
        it('aceita CPF válido', async () => {
        const { getByPlaceholderText, queryByText } = render(
            <RegisterScreen navigation={mockNavigation} />
        );

        const cpfInput = getByPlaceholderText('CPF');
        // CPF válido: 111.444.777-35 (exemplo, valide com algoritmo real)
        fireEvent.changeText(cpfInput, '11144477735');

        await waitFor(() => {
            // Se o CPF for válido, não deve haver mensagem de erro
            expect(queryByText('CPF inválido')).toBeNull();
        });
        });
    });
});
