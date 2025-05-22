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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function CadastroScreen({ navigation }: { navigation: any }) {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [emailFocado, setEmailFocado] = useState(false);
    const [senhaFocada, setSenhaFocada] = useState(false); // NOVO: controla exibição das dicas
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
    });
    const [logoVisivel, setLogoVisivel] = useState(true);
    const scrollViewRef = useRef<ScrollView>(null);

    // Novos estados para requisitos da senha
    const [senhaRequisitos, setSenhaRequisitos] = useState({
        tamanho: false,
        letra: false,
        numero: false,
        simbolo: false,
    });

    const nomeRef = useRef<TextInput | null>(null);
    const emailRef = useRef<TextInput | null>(null);
    const senhaRef = useRef<TextInput | null>(null);
    const confirmarSenhaRef = useRef<TextInput | null>(null);

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

    const handleCadastro = () => {
        const newErrors = {
            nome: '',
            email: '',
            senha: '',
            confirmarSenha: '',
        };

        const trimmedNome = nome.trim();
        const trimmedEmail = email.trim();
        const trimmedSenha = senha.trim();
        const trimmedConfirmarSenha = confirmarSenha.trim();

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
        }
        setErrors(newErrors);

        const hasError = Object.values(newErrors).some(err => err !== '');
        if (hasError) {
            return;
        }

        console.log('Dados do Cadastro:', { nome, email, senha });
        Alert.alert('Sucesso', 'Usuário cadastrado com sucesso!');
        setNome('');
        setEmail('');
        setSenha('');
        setConfirmarSenha('');
        setSenhaForca('');
        setSenhaMensagem('');
        setNomeInvalido(false);
        setErrors({ nome: '', email: '', senha: '', confirmarSenha: '' });
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

                        <TextInput
                            ref={nomeRef}
                            style={[
                                styles.input,
                                nomeInvalido && styles.inputError,
                                errors.nome && styles.inputError,
                            ]}
                            placeholder="Nome completo"
                            placeholderTextColor="#999"
                            value={nome}
                            onChangeText={text => {
                                const apenasLetras = text.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
                                setNome(apenasLetras);
                                setNomeInvalido(
                                    apenasLetras.trim().length > 0 &&
                                    apenasLetras.trim().length < 3,
                                );
                            }}
                            autoFocus
                            returnKeyType="next"
                            onSubmitEditing={() => emailRef.current?.focus()}
                            onFocus={() => {
                                setEmailFocado(false);
                                setSenhaFocada(false);
                                // handleInputFocus(nomeRef);
                            }}
                        />
                        {nomeInvalido && (
                            <Text style={styles.avisoNome}>O nome está muito curto</Text>
                        )}
                        {errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}

                        <TextInput
                            ref={emailRef}
                            style={[styles.input, errors.email && styles.inputError]}
                            placeholder="Email"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            returnKeyType="next"
                            onFocus={() => {
                                setEmailFocado(true);
                                setSenhaFocada(false);
                            }}
                            onBlur={() => setEmailFocado(false)}
                            onSubmitEditing={() => senhaRef.current?.focus()}
                        />
                        {emailFocado && (
                            <Text style={styles.dicaEmail}>
                                Informe um e-mail válido (ex: seuemail@exemplo.com)
                            </Text>
                        )}
                        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                        <View
                            style={[
                                styles.passwordContainer,
                                errors.senha && styles.inputError,
                            ]}
                        >
                            <TextInput
                                ref={senhaRef}
                                style={styles.passwordInput}
                                placeholder="Senha"
                                placeholderTextColor="#999"
                                value={senha}
                                onChangeText={text => {
                                    setSenha(text);
                                    setSenhaForca(avaliarForcaSenha(text));
                                }}
                                secureTextEntry={!mostrarSenha}
                                returnKeyType="next"
                                onFocus={() => {
                                    setSenhaFocada(true);
                                    setEmailFocado(false);
                                    handleInputFocus(senhaRef);
                                }}
                                onBlur={() => setSenhaFocada(false)}
                                onSubmitEditing={() => confirmarSenhaRef.current?.focus()}
                            />
                            <TouchableOpacity onPress={() => setMostrarSenha(!mostrarSenha)}>
                                <Ionicons
                                    name={mostrarSenha ? 'eye-off' : 'eye'}
                                    size={24}
                                    color="#666"
                                />
                            </TouchableOpacity>
                        </View>
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

                        <View
                            style={[
                                styles.passwordContainer,
                                errors.confirmarSenha && styles.inputError,
                            ]}
                        >
                            <TextInput
                                ref={confirmarSenhaRef}
                                style={styles.passwordInput}
                                placeholder="Confirmar senha"
                                placeholderTextColor="#999"
                                value={confirmarSenha}
                                onChangeText={setConfirmarSenha}
                                secureTextEntry={!mostrarConfirmarSenha}
                                onFocus={() => handleInputFocus(confirmarSenhaRef)}
                            />
                            <TouchableOpacity
                                onPress={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                            >
                                <Ionicons
                                    name={mostrarConfirmarSenha ? 'eye-off' : 'eye'}
                                    size={24}
                                    color="#666"
                                />
                            </TouchableOpacity>
                        </View>
                        {errors.confirmarSenha && (
                            <Text style={styles.errorText}>{errors.confirmarSenha}</Text>
                        )}

                        <TouchableOpacity style={styles.button} onPress={handleCadastro}>
                            <Text style={styles.buttonText}>Cadastrar</Text>
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
