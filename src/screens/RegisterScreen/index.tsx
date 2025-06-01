/* eslint-disable react-native/no-inline-styles */
import styles from './styles';
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Platform,
    Image,
    Dimensions,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import InputComIcone from '../../components/InputComIcone';
import { formatRG, formatTelefone } from '../../utils/format';
import { baseUrl } from '../../config/api'; // Importa a baseUrl configurada

export default function RegisterScreen({ navigation }: { navigation: any }) {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [cpf, setCpf] = useState('');
    const [rg, setRg] = useState('');
    const [telefone, setTelefone] = useState('');
    const [emailFocado, setEmailFocado] = useState(false);
    const [senhaFocada, setSenhaFocada] = useState(false);
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
    const [senhaMensagem, setSenhaMensagem] = useState('');
    const [senhaForca, setSenhaForca] = useState<'fraca' | 'média' | 'forte' | ''>('');
    const [nomeInvalido, setNomeInvalido] = useState(false);
    const [errors, setErrors] = useState({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        cpf: '',
        rg: '',
        telefone: '',
    });
    const [logoVisivel, setLogoVisivel] = useState(true);
    const [loading, setLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    // Novos estados para requisitos da senha
    const [senhaRequisitos, setSenhaRequisitos] = useState({
        tamanho: false,
        letra: false,
        numero: false,
        simbolo: false,
    });
    const [cpfFocado, setCpfFocado] = useState(false);
    const [rgFocado, setRgFocado] = useState(false);

    const nomeRef = useRef<TextInput>(null) as React.RefObject<TextInput>;
    const emailRef = useRef<TextInput>(null) as React.RefObject<TextInput>;
    const senhaRef = useRef<TextInput>(null) as React.RefObject<TextInput>;
    const confirmarSenhaRef = useRef<TextInput>(null) as React.RefObject<TextInput>;
    const cpfRef = useRef<TextInput>(null) as React.RefObject<TextInput>;
    const rgRef = useRef<TextInput>(null) as React.RefObject<TextInput>;
    const telefoneRef = useRef<TextInput>(null) as React.RefObject<TextInput>;

    const validateEmail = (emailToValidate: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(emailToValidate);
    };

    const avaliarForcaSenha = (s: string) => {
        if (!s) {
            return '';
        }
        if (s.length < 8) {
            return 'fraca';
        }
        const temLetra = /[a-zA-Z]/.test(s);
        const temNumero = /\d/.test(s);
        const temEspecial = /[^a-zA-Z0-9]/.test(s);
        if (s.length >= 8 && temLetra && temNumero && temEspecial) {
            return 'forte';
        }
        if (temLetra && temNumero) {
            return 'média';
        }
        return 'fraca';
    };

    const handleCadastro = async () => {
        const newErrors = {
            nome: '',
            email: '',
            senha: '',
            confirmarSenha: '',
            cpf: '',
            rg: '',
            telefone: '',
        };

        const trimmedNome = nome.trim();
        const trimmedEmail = email.trim();
        const trimmedSenha = senha.trim();
        const trimmedConfirmarSenha = confirmarSenha.trim();
        const trimmedCpf = cpf.trim();
        const trimmedRg = rg.trim();
        const trimmedTelefone = telefone.trim();

        if (!trimmedNome || trimmedNome.length < 3) {
            newErrors.nome = 'Nome deve ter ao menos 3 caracteres.';
            setNomeInvalido(true);
            nomeRef.current?.focus();
        } else if (!validateEmail(trimmedEmail)) {
            newErrors.email = 'E-mail inválido.';
            emailRef.current?.focus();
        } else if (trimmedSenha.length < 8) {
            newErrors.senha = 'Senha deve ter pelo menos 8 caracteres.';
            senhaRef.current?.focus();
        } else if (trimmedSenha !== trimmedConfirmarSenha) {
            newErrors.confirmarSenha = 'As senhas não coincidem.';
            confirmarSenhaRef.current?.focus();
        } else if (trimmedCpf.length !== 11) {
            newErrors.cpf = 'CPF deve ter 11 dígitos.';
            cpfRef.current?.focus();
        } else if (!/^\d+$/.test(trimmedCpf)) {
            newErrors.cpf = 'CPF deve conter apenas números.';
            cpfRef.current?.focus();
        } else if (trimmedRg.length === 0) {
            newErrors.rg = 'RG é obrigatório.';
            rgRef.current?.focus();
        } else if (trimmedTelefone.length < 10) {
            newErrors.telefone = 'Telefone deve ter pelo menos 10 dígitos.';
            telefoneRef.current?.focus();
        }
        setErrors(newErrors);

        const hasError = Object.values(newErrors).some(err => err !== '');
        if (hasError) {
            return;
        }

        // INTEGRAÇÃO COM BACKEND
        // Aplica máscara ao RG antes de enviar
        const rgFormatado = rg.length === 9 ? `${rg.slice(0,8)}-${rg.slice(8)}` : rg;
        // const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:3333' : 'http://localhost:3333';
        setLoading(true);
        try {
            const response = await fetch(`${baseUrl}/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: nome,
                    email: email,
                    password: senha,
                    rg: rgFormatado,
                    cpf: cpf,
                    cellphone: telefone,
                }),
            });
            if (response.ok) {
                Alert.alert('Sucesso', 'Usuário cadastrado com sucesso!');
                setNome('');
                setEmail('');
                setSenha('');
                setConfirmarSenha('');
                setCpf('');
                setRg('');
                setTelefone('');
                setSenhaForca('');
                setSenhaMensagem('');
                setNomeInvalido(false);
                setErrors({ nome: '', email: '', senha: '', confirmarSenha: '', cpf: '', rg: '', telefone: '' });
            } else {
                let data = {};
                try {
                    data = await response.json();
                } catch (e) {}
                let mensagem = 'Erro ao cadastrar usuário.';
                if (data) {
                    if ('message' in data && typeof (data as any).message === 'string') {
                        mensagem = (data as any).message;
                    } else if ('message' in data && Array.isArray((data as any).message)) {
                        mensagem = (data as any).message.join('\n');
                    } else if (Array.isArray(data)) {
                        mensagem = data.map((item: any) => item.message || JSON.stringify(item)).join('\n');
                    }
                }
                Alert.alert('Erro', mensagem);
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (nome.trim().length >= 3) {
            setNomeInvalido(false);
            setErrors(prevErrors => ({ ...prevErrors, nome: '' }));
        }
    }, [nome]);

    useEffect(() => {
        if (validateEmail(email)) {
            setErrors(prevErrors => ({ ...prevErrors, email: '' }));
        }
    }, [email]);

    useEffect(() => {
        if (senha.length >= 8) {
            setErrors(prevErrors => ({ ...prevErrors, senha: '' }));
            setSenhaMensagem('');
        }
    }, [senha]);

    useEffect(() => {
        if (confirmarSenha === senha && senha.length >= 8) {
            setErrors(prevErrors => ({ ...prevErrors, confirmarSenha: '' }));
        } else if (confirmarSenha !== senha) {
            setErrors(prevErrors => ({
                ...prevErrors,
                confirmarSenha: 'As senhas não coincidem.',
            }));
        } else if (senha.length < 8 && confirmarSenha.length > 0) {
            setErrors(prevErrors => ({
                ...prevErrors,
                confirmarSenha: 'A senha deve ter pelo menos 8 caracteres.',
            }));
        } else if (confirmarSenha.length > 0 && senha.length === 0) {
            setErrors(prevErrors => ({ ...prevErrors, confirmarSenha: '' }));
        }
    }, [confirmarSenha, senha]);

    // Atualiza requisitos da senha em tempo real
    useEffect(() => {
        setSenhaRequisitos({
            tamanho: senha.length >= 8,
            letra: /[a-zA-Z]/.test(senha),
            numero: /\d/.test(senha),
            simbolo: /[^a-zA-Z0-9]/.test(senha),
        });
    }, [senha]);

    // Função utilitária para cor das dicas de senha
    const getDicaSenhaCor = (ok: boolean) => {
        return ok ? styles.dicaSenhaCorOk : styles.dicaSenhaCorErro;
    };
    const getSenhaForcaCor = () => {
        if (senhaForca === 'fraca') { return styles.senhaForcaCorFraca; }
        if (senhaForca === 'média') { return styles.senhaForcaCorMedia; }
        if (senhaForca === 'forte') { return styles.senhaForcaCorForte; }
        return null;
    };

    const scrollToInput = (y: number) => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
                y: y - 100, // desloca um pouco para cima para não ficar colado no topo
                animated: true,
            });
        }
    };

    const handleInputFocus = (ref: React.RefObject<TextInput | null>) => {
        if (ref.current) {
            ref.current.measure((x, y, width, height, pageX, pageY) => {
                scrollToInput(pageY || 0);
            });
        }
    };

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

    // Função para centralizar o reset de foco dos campos
    const handleAnyInputFocus = (campo: 'nome' | 'email' | 'senha' | 'cpf' | 'rg' | 'telefone' | 'confirmarSenha') => {
        setEmailFocado(false);
        setSenhaFocada(false);
        setCpfFocado(false);
        setRgFocado(false);
        // Ativa apenas o campo desejado
        if (campo === 'email') { setEmailFocado(true); }
        if (campo === 'senha') { setSenhaFocada(true); }
        if (campo === 'cpf') { setCpfFocado(true); }
        if (campo === 'rg') { setRgFocado(true); }
        // Se quiser adicionar outros campos focados, basta seguir o padrão
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={{ ...styles.scrollContainer, flexGrow: 1, paddingBottom: 32 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.container}>
                        {logoVisivel && (
                            <Image
                                source={require('../../assets/apae_logo.png')}
                                style={[
                                    styles.logo,
                                    {
                                        width: Dimensions.get('window').width * 0.8,
                                    },
                                ]}
                                resizeMode="contain"
                            />
                        )}
                        <Text style={styles.title}>Cadastre-se</Text>

                        {/* Input de Nome com ícone */}
                        <InputComIcone
                            iconName="person"
                            inputRef={nomeRef}
                            value={nome}
                            onChangeText={text => {
                                const apenasLetras = text.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
                                setNome(apenasLetras);
                                setNomeInvalido(
                                    apenasLetras.trim().length > 0 &&
                                    apenasLetras.trim().length < 3,
                                );
                            }}
                            placeholder="Nome completo"
                            autoFocus
                            returnKeyType="next"
                            onSubmitEditing={() => emailRef.current?.focus()}
                            onFocus={() => handleAnyInputFocus('nome')}
                            style={
                                errors.nome || nomeInvalido
                                    ? styles.inputError
                                    : nome.trim().length >= 3
                                    ? styles.inputSuccess
                                    : nome.trim().length > 0
                                    ? styles.inputWarning
                                    : undefined
                            }
                        />
                        {nomeInvalido && (
                            <Text style={styles.avisoNome}>O nome está muito curto</Text>
                        )}
                        {errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}

                        {/* Input de Email com ícone */}
                        <InputComIcone
                            iconName="mail"
                            inputRef={emailRef}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            returnKeyType="next"
                            onFocus={() => handleAnyInputFocus('email')}
                            onBlur={() => setEmailFocado(false)}
                            onSubmitEditing={() => cpfRef.current?.focus()}
                            style={
                                errors.email
                                    ? styles.inputError
                                    : validateEmail(email)
                                    ? styles.inputSuccess
                                    : email.trim().length > 0
                                    ? styles.inputWarning
                                    : undefined
                            }
                        />
                        {emailFocado && (
                            <Text style={styles.dicaEmail}>
                                Informe um e-mail válido (ex: seuemail@exemplo.com)
                            </Text>
                        )}
                        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                        {/* Input de CPF */}
                        <InputComIcone
                            iconName="card"
                            inputRef={cpfRef}
                            value={cpf}
                            onChangeText={text => setCpf(text.replace(/\D/g, ''))}
                            placeholder="CPF"
                            keyboardType="numeric"
                            maxLength={11}
                            returnKeyType="next"
                            onFocus={() => handleAnyInputFocus('cpf')}
                            onBlur={() => setCpfFocado(false)}
                            onSubmitEditing={() => rgRef.current?.focus()}
                            style={
                                errors.cpf
                                    ? styles.inputError
                                    : cpf.length === 11 && /^\d{11}$/.test(cpf)
                                    ? styles.inputSuccess
                                    : cpf.length > 0
                                    ? styles.inputWarning
                                    : undefined
                            }
                        />
                        {cpfFocado && (
                            <Text style={styles.dicaEmail}>
                                Apenas números, sem pontos ou traço
                            </Text>
                        )}
                        {errors.cpf && <Text style={styles.errorText}>{errors.cpf}</Text>}

                        {/* Input de RG */}
                        <InputComIcone
                            iconName="id-card"
                            inputRef={rgRef}
                            value={formatRG(rg)}
                            onChangeText={text => {
                                const numeros = text.replace(/\D/g, '').slice(0, 9);
                                setRg(numeros);
                            }}
                            placeholder="RG"
                            keyboardType="numeric"
                            maxLength={10}
                            returnKeyType="next"
                            onFocus={() => handleAnyInputFocus('rg')}
                            onBlur={() => setRgFocado(false)}
                            onSubmitEditing={() => telefoneRef.current?.focus()}
                            style={
                                errors.rg
                                    ? styles.inputError
                                    : rg.length > 0 && /^\d+$/.test(rg)
                                    ? styles.inputSuccess
                                    : rg.length > 0
                                    ? styles.inputWarning
                                    : undefined
                            }
                        />
                        {rgFocado && (
                            <Text style={styles.dicaEmail}>
                                Apenas números, sem pontos ou traço
                            </Text>
                        )}
                        {errors.rg && (
                            <Text style={styles.errorText}>{errors.rg}</Text>
                        )}

                        {/* Input de Telefone */}
                        <InputComIcone
                            iconName="call"
                            inputRef={telefoneRef}
                            value={formatTelefone(telefone)}
                            onChangeText={text => {
                                const numeros = text.replace(/\D/g, '').slice(0, 11);
                                setTelefone(numeros);
                            }}
                            placeholder="Telefone"
                            keyboardType="phone-pad"
                            maxLength={15}
                            returnKeyType="next"
                            onSubmitEditing={() => senhaRef.current?.focus()}
                            // Não há dica de foco para telefone, mas pode ser adicionado se desejar
                            style={
                                errors.telefone
                                    ? styles.inputError
                                    : telefone.length >= 10
                                    ? styles.inputSuccess
                                    : telefone.length > 0
                                    ? styles.inputWarning
                                    : undefined
                            }
                        />
                        {errors.telefone && <Text style={styles.errorText}>{errors.telefone}</Text>}

                        <InputComIcone
                            iconName="key"
                            inputRef={senhaRef}
                            value={senha}
                            onChangeText={text => {
                                setSenha(text);
                                setSenhaForca(avaliarForcaSenha(text));
                            }}
                            placeholder="Senha"
                            secureTextEntry={!mostrarSenha}
                            returnKeyType="next"
                            onFocus={() => {
                                handleAnyInputFocus('senha');
                                handleInputFocus(senhaRef);
                            }}
                            onBlur={() => setSenhaFocada(false)}
                            onSubmitEditing={() => confirmarSenhaRef.current?.focus()}
                            showToggle
                            showValue={mostrarSenha}
                            onToggleShow={() => setMostrarSenha(!mostrarSenha)}
                            style={errors.senha ? styles.inputError : undefined}
                        />
                        {/* Dica só aparece se senhaFocada for true */}
                        {senhaFocada && (
                            <View style={styles.dicaSenhaContainer}>
                                <Text style={styles.dicaSenhaTitulo}>
                                    Para uma senha forte, use:
                                </Text>
                                <View>
                                    <Text style={[styles.dicaSenhaItem, getDicaSenhaCor(senhaRequisitos.tamanho)]}>• Pelo menos 8 caracteres</Text>
                                    <Text style={[styles.dicaSenhaItem, getDicaSenhaCor(senhaRequisitos.letra)]}>• Letras (a-z, A-Z)</Text>
                                    <Text style={[styles.dicaSenhaItem, getDicaSenhaCor(senhaRequisitos.numero)]}>• Números (0-9)</Text>
                                    <Text style={[styles.dicaSenhaItem, getDicaSenhaCor(senhaRequisitos.simbolo)]}>• Símbolos (@, #, $, etc)</Text>
                                </View>
                            </View>
                        )}
                        {senhaMensagem && (
                            <Text style={styles.errorText}>{senhaMensagem}</Text>
                        )}
                        {senha ? (
                            <View style={styles.barraForcaContainer}>
                                <View
                                    style={[
                                        styles.barraForca,
                                        {
                                            backgroundColor:
                                                senhaForca === 'fraca'
                                                    ? '#e53935'
                                                    : senhaForca === 'média'
                                                    ? '#e6b800'
                                                    : senhaForca === 'forte'
                                                    ? 'green'
                                                    : '#ccc',
                                            width:
                                                senhaForca === 'fraca'
                                                    ? '33%'
                                                    : senhaForca === 'média'
                                                    ? '66%'
                                                    : senhaForca === 'forte'
                                                    ? '100%'
                                                    : '0%',
                                        },
                                    ]}
                                />
                                <Text
                                    style={[
                                        styles.senhaForca,
                                        getSenhaForcaCor(),
                                    ]}
                                >
                                    Senha {senhaForca}
                                </Text>
                                {senhaForca === 'fraca' && (
                                    <Text style={styles.dicaSenha}>
                                        Adicione mais caracteres, letras, números e símbolos.
                                    </Text>
                                )}
                                {senhaForca === 'média' && (
                                    <Text style={styles.dicaSenha}>
                                        Tente adicionar símbolos para torná-la mais forte.
                                    </Text>
                                )}
                            </View>
                        ) : null}

                        <InputComIcone
                            iconName="key"
                            inputRef={confirmarSenhaRef}
                            value={confirmarSenha}
                            onChangeText={setConfirmarSenha}
                            placeholder="Confirmar senha"
                            secureTextEntry={!mostrarConfirmarSenha}
                            onFocus={() => handleInputFocus(confirmarSenhaRef)}
                            showToggle
                            showValue={mostrarConfirmarSenha}
                            onToggleShow={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                            style={errors.confirmarSenha ? styles.inputError : undefined}
                        />
                        {errors.confirmarSenha && (
                            <Text style={styles.errorText}>{errors.confirmarSenha}</Text>
                        )}

                        <TouchableOpacity style={styles.button} onPress={handleCadastro} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Cadastrar</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.loginLinkText}>
                                Já tem uma conta? Faça Login
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}
