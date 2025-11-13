// src/hooks/useRegisterForm.ts

import { useState, useRef, useEffect } from 'react';
import { Alert, Keyboard, ScrollView } from 'react-native';
import { baseUrl } from '../config/api';
import {
    validateEmail,
    validateCPF,
    avaliarForcaSenha,
    validateRG,
    validateTelefone,
    validateNome,
} from '../utils/validation';
import errorMessages from '../utils/errorMessages';
import { formatCPF, formatRG, formatTelefone } from '../utils/format';
import type { TextInput } from 'react-native';

// Definição de tipo para os erros
interface FormErrors {
    nome: string;
    email: string;
    senha: string;
    confirmarSenha: string;
    cpf: string;
    rg: string;
    telefone: string;
}

// Tipo para os requisitos da senha
interface SenhaRequisitos {
    tamanho: boolean;
    letra: boolean;
    numero: boolean;
    simbolo: boolean;
}

const useRegisterForm = () => {
    // Estados do formulário
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [cpf, setCpf] = useState('');
    const [rg, setRg] = useState('');
    const [telefone, setTelefone] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');

    // Estados de UI e validação
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
    const [senhaMensagem, setSenhaMensagem] = useState('');
    const [senhaForca, setSenhaForca] = useState<'fraca' | 'média' | 'forte' | ''>('');
    const [errors, setErrors] = useState<FormErrors>({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        cpf: '',
        rg: '',
        telefone: '',
    });
    const [loading, setLoading] = useState(false);
    const [campoFocado, setCampoFocado] = useState<string | null>(null);
    const [logoVisivel, setLogoVisivel] = useState(true);

    // Novos estados para requisitos da senha
    const [senhaRequisitos, setSenhaRequisitos] = useState<SenhaRequisitos>({
        tamanho: false,
        letra: false,
        numero: false,
        simbolo: false,
    });
    const [nomeInvalido, setNomeInvalido] = useState(false);
    // Refs para inputs (serão passadas para o componente)
    const nomeRef = useRef<TextInput>(null);
    const emailRef = useRef<TextInput>(null);
    const senhaRef = useRef<TextInput>(null);
    const confirmarSenhaRef = useRef<TextInput>(null);
    const cpfRef = useRef<TextInput>(null);
    const rgRef = useRef<TextInput>(null);
    const telefoneRef = useRef<TextInput>(null);
    const scrollViewRef = useRef<ScrollView>(null); // Ref para o ScrollView

    // --- Handlers de Mudança de Texto e Validação em Tempo Real ---
    const handleChangeNome = (text: string) => {
        const apenasLetras = text.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
        setNome(apenasLetras);
        setErrors(e => ({ ...e, nome: '' })); // Limpa o erro ao digitar
    };

    const handleChangeEmail = (text: string) => {
        setEmail(text);
        setErrors(e => ({ ...e, email: '' }));
    };

    const handleChangeCPF = (text: string) => {
        const onlyNumbers = text.replace(/\D/g, '');
        setCpf(onlyNumbers);
        setErrors(e => ({ ...e, cpf: '' }));
    };

    const handleChangeRG = (text: string) => {
        const numeros = text.replace(/\D/g, '');
        setRg(numeros);
        setErrors(e => ({ ...e, rg: '' }));
    };

    const handleChangeTelefone = (text: string) => {
        const numeros = text.replace(/\D/g, '').slice(0, 11);
        setTelefone(numeros);
        setErrors(e => ({ ...e, telefone: '' })); // Limpa o erro ao digitar
    };

    const handleChangeSenha = (text: string) => {
        setSenha(text);
        setSenhaForca(avaliarForcaSenha(text));
        setSenhaRequisitos({
            tamanho: text.length >= 8,
            letra: /[a-zA-Z]/.test(text),
            numero: /\d/.test(text),
            simbolo: /[^a-zA-Z0-9]/.test(text),
        });
        setErrors(e => ({ ...e, senha: '' })); // Limpa o erro ao digitar
        if (confirmarSenha && text !== confirmarSenha) {
            setErrors(e => ({ ...e, confirmarSenha: errorMessages.confirmarSenha.mismatch }));
        } else if (confirmarSenha && text === confirmarSenha) {
            setErrors(e => ({ ...e, confirmarSenha: '' }));
        }
    };

    const handleChangeConfirmarSenha = (text: string) => {
        setConfirmarSenha(text);
        setErrors(e => ({ ...e, confirmarSenha: '' })); // Limpa o erro ao digitar
        if (text !== senha) {
            setErrors(e => ({ ...e, confirmarSenha: errorMessages.confirmarSenha.mismatch }));
        }
    };

    // --- Função de Validação Completa ---
    const validateForm = () => {
        const newErrors: FormErrors = {
            nome: '', email: '', senha: '', confirmarSenha: '', cpf: '', rg: '', telefone: '',
        };
        let isValid = true;

        const trimmedNome = nome.trim();
        const trimmedEmail = email.trim();
        const trimmedSenha = senha.trim();
        const trimmedConfirmarSenha = confirmarSenha.trim();
        const trimmedCpf = cpf.replace(/\D/g, '').trim();
        const trimmedRg = rg.replace(/\D/g, '').trim();
        const trimmedTelefone = telefone.trim();

        // Validação de Nome
        if (!trimmedNome) {
            newErrors.nome = errorMessages.nome.required;
            isValid = false;
        } else if (trimmedNome.length < 3) {
            newErrors.nome = errorMessages.nome.minLength;
            isValid = false;
        } else if (!validateNome(trimmedNome)) { // Validação de apenas letras
            newErrors.nome = errorMessages.nome.invalid;
            isValid = false;
        }

        // Validação de Email
        if (!trimmedEmail) {
            newErrors.email = errorMessages.email.required;
            isValid = false;
        } else if (!validateEmail(trimmedEmail)) {
            newErrors.email = errorMessages.email.invalid;
            isValid = false;
        }

        // Validação de CPF
        if (!trimmedCpf) {
            newErrors.cpf = errorMessages.cpf.required;
            isValid = false;
        } else if (trimmedCpf.length !== 11) {
            newErrors.cpf = errorMessages.cpf.length;
            isValid = false;
        } else if (!/^[0-9]{11}$/.test(trimmedCpf)) {
            newErrors.cpf = errorMessages.cpf.onlyNumbers;
            isValid = false;
        } else if (!validateCPF(trimmedCpf)) {
            newErrors.cpf = errorMessages.cpf.invalid;
            isValid = false;
        }

        // Validação de RG
        if (!trimmedRg) {
            newErrors.rg = errorMessages.rg.required;
            isValid = false;
        } else if (trimmedRg.length !== 9) {
            newErrors.rg = errorMessages.rg.length;
            isValid = false;
        } else if (!validateRG(trimmedRg)) {
            newErrors.rg = errorMessages.rg.invalid; // Adicionado para consistência
            isValid = false;
        }

        // Validação de Telefone
        if (!trimmedTelefone) {
            newErrors.telefone = errorMessages.telefone.required;
            isValid = false;
        } else if (trimmedTelefone.length < 10) {
            newErrors.telefone = errorMessages.telefone.length;
            isValid = false;
        } else if (!validateTelefone(trimmedTelefone)) {
            newErrors.telefone = errorMessages.telefone.invalid;
            isValid = false;
        }

        // Validação de Senha
        if (!trimmedSenha) {
            newErrors.senha = errorMessages.senha.required;
            isValid = false;
        } else if (trimmedSenha.length < 8) {
            newErrors.senha = errorMessages.senha.minLength;
            isValid = false;
        }

        // Validação de Confirmação de Senha
        if (!trimmedConfirmarSenha) {
            newErrors.confirmarSenha = errorMessages.confirmarSenha.required;
            isValid = false;
        } else if (trimmedConfirmarSenha !== trimmedSenha) {
            newErrors.confirmarSenha = errorMessages.confirmarSenha.mismatch;
            isValid = false;
        } else if (trimmedSenha.length < 8) { // Garante que a senha confirmada também tenha 8 caracteres
            newErrors.confirmarSenha = errorMessages.confirmarSenha.minLength;
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };


    // --- Handler de Cadastro ---
    const handleCadastro = async (navigation?: any) => {
        if (!validateForm()) {
            // Foca no primeiro campo com erro
            if (errors.nome) { nomeRef.current?.focus(); }
            else if (errors.email) { emailRef.current?.focus(); }
            else if (errors.cpf) { cpfRef.current?.focus(); }
            else if (errors.rg) { rgRef.current?.focus(); }
            else if (errors.telefone) { telefoneRef.current?.focus(); }
            else if (errors.senha) { senhaRef.current?.focus(); }
            else if (errors.confirmarSenha) { confirmarSenhaRef.current?.focus(); }
            return;
        }

        setLoading(true);
        let timeoutId: number | null = null;
        try {
            const controller = new AbortController();
            timeoutId = setTimeout(() => {
                controller.abort();
            }, 10000); // Timeout de 10 segundos

            const response = await fetch(`${baseUrl}/user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: nome,
                    email: email,
                    password: senha,
                    rg: rg.length === 9 ? `${rg.slice(0, 8)}-${rg.slice(8)}` : rg, // Formata RG para o backend
                    cpf: cpf,
                    cellphone: telefone,
                }),
                signal: controller.signal,
            });

            if (timeoutId) { clearTimeout(timeoutId); }

            if (response.ok) {
                Alert.alert('Sucesso', 'Usuário cadastrado com sucesso!');
                // Limpa todos os campos
                setNome('');
                setEmail('');
                setSenha('');
                setConfirmarSenha('');
                setCpf('');
                setRg('');
                setTelefone('');
                setSenhaForca('');
                setSenhaMensagem('');
                setErrors({ nome: '', email: '', senha: '', confirmarSenha: '', cpf: '', rg: '', telefone: '' });
                setSenhaRequisitos({ tamanho: false, letra: false, numero: false, simbolo: false });

                navigation?.navigate('Login' as never);
            } else {
                let data = {};
                try { data = await response.json(); } catch (e) { }
                let mensagem = 'Erro ao cadastrar usuário.';
                let emailDuplicado = false;
                if (data) {
                    if ('message' in data && typeof (data as any).message === 'string') {
                        mensagem = (data as any).message;
                        if (mensagem.toLowerCase().includes('email') && mensagem.toLowerCase().includes('já cadastrado')) {
                            setErrors(e => ({ ...e, email: errorMessages.email.exists }));
                            emailDuplicado = true;
                        }
                    } else if ('message' in data && Array.isArray((data as any).message)) {
                        const msgArr = (data as any).message;
                        if (msgArr.some((m: string) => m.toLowerCase().includes('email') && m.toLowerCase().includes('já cadastrado'))) {
                            setErrors(e => ({ ...e, email: errorMessages.email.exists }));
                            emailDuplicado = true;
                        }
                        mensagem = msgArr.join('\n');
                    } else if (Array.isArray(data)) {
                        if (data.some((item: any) => (item.message || '').toLowerCase().includes('email') && (item.message || '').toLowerCase().includes('já cadastrado'))) {
                            setErrors(e => ({ ...e, email: errorMessages.email.exists }));
                            emailDuplicado = true;
                        }
                        mensagem = data.map((item: any) => item.message || JSON.stringify(item)).join('\n');
                    }
                }
                if (!emailDuplicado) {
                    Alert.alert('Erro', mensagem);
                }
            }
        } catch (error: any) {
            if (timeoutId) { clearTimeout(timeoutId); }
            if (error.name === 'AbortError') {
                Alert.alert('Erro', 'Tempo de conexão esgotado. Verifique sua internet e tente novamente.');
            } else {
                Alert.alert('Erro', 'Não foi possível conectar ao servidor. Verifique sua conexão.');
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Funções Auxiliares para UI ---
    const getDicaSenhaCor = (ok: boolean) => {
        // Estilos virão do componente ou de um estilo global
        return ok ? { color: 'green' } : { color: '#e53935' };
    };

    const getSenhaForcaCor = () => {
        // Estilos virão do componente ou de um estilo global
        if (senhaForca === 'fraca') { return { backgroundColor: 'red' }; }
        if (senhaForca === 'média') { return { backgroundColor: 'orange' }; }
        if (senhaForca === 'forte') { return { backgroundColor: 'green' }; }
        return null;
    };

    const handleInputFocus = (fieldName: string) => {
        setCampoFocado(fieldName);
        // Lógica de scroll para o campo (se necessário)
        // Isso precisaria ser manipulado no componente que usa o hook
        // pois scrollViewRef não pode ser passado diretamente aqui.
        // O campoFocado já serve para indicar qual campo está ativo para a UI.
    };

    const handleInputBlur = () => {
        setCampoFocado(null);
    };

    const handleAnyInputFocus = (campo: string) => {
        setCampoFocado(campo);
    };

    // Efeito para visibilidade do logo (ainda precisa de lógica para ScrollView)
    useEffect(() => {
        const onKeyboardDidShow = () => setLogoVisivel(false);
        const onKeyboardDidHide = () => setLogoVisivel(true);
        const showListener = Keyboard.addListener('keyboardDidShow', onKeyboardDidShow);
        const hideListener = Keyboard.addListener('keyboardDidHide', onKeyboardDidHide);
        return () => {
            showListener.remove();
            hideListener.remove();
        };
    }, []);

    // Retorna todos os estados, handlers e refs necessários para o componente
    return {
        // Estados
        nome, setNome,
        email, setEmail,
        senha, setSenha,
        cpf, setCpf,
        rg, setRg,
        telefone, setTelefone,
        confirmarSenha, setConfirmarSenha,
        mostrarSenha, setMostrarSenha,
        mostrarConfirmarSenha, setMostrarConfirmarSenha,
        senhaMensagem, setSenhaMensagem,
        senhaForca, setSenhaForca,
        nomeInvalido, setNomeInvalido,
        errors, setErrors,
        loading, setLoading,
        campoFocado, setCampoFocado,
        logoVisivel, setLogoVisivel,
        senhaRequisitos, setSenhaRequisitos,

        // Handlers de Mudança
        handleChangeNome,
        handleChangeEmail,
        handleChangeCPF,
        handleChangeRG,
        handleChangeTelefone,
        handleChangeSenha,
        handleChangeConfirmarSenha,

        // Handlers de Ação
        handleCadastro,

        // Funções Auxiliares de UI
        getDicaSenhaCor,
        getSenhaForcaCor,
        handleInputFocus,
        handleInputBlur,
        handleAnyInputFocus,

        // Refs para Inputs
        nomeRef, emailRef, senhaRef, confirmarSenhaRef, cpfRef, rgRef, telefoneRef,
        scrollViewRef, // Adicionado ao objeto de retorno

        // Formatadores (exportados para uso no componente)
        formatCPF,
        formatRG,
        formatTelefone,
    };
};

export default useRegisterForm;
