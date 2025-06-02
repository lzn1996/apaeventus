/* eslint-disable react-native/no-inline-styles */
import styles from './styles';
import React, { useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
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
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter';
import { formatRG, formatTelefone, formatCPF } from '../../utils/format';
import useRegisterForm from '../../hooks/useRegisterForm';
import { avaliarForcaSenha, validateCPF, validateEmail } from '../../utils/validation';
import { scrollToInput } from '../../utils/scroll';

export default function RegisterScreen({ navigation }: { navigation: any }) {
    const {
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
        logoVisivel, setLogoVisivel,
        loading,
        campoFocado, setCampoFocado,
        senhaRequisitos, setSenhaRequisitos,
        nomeRef, emailRef, senhaRef, confirmarSenhaRef, cpfRef, rgRef, telefoneRef,
        handleCadastro,
        handleAnyInputFocus,
        handleInputFocus,
        scrollViewRef,
        getDicaSenhaCor,
    } = useRegisterForm();

    useEffect(() => {
        const onKeyboardDidShow = () => setLogoVisivel(false);
        const onKeyboardDidHide = () => setLogoVisivel(true);
        const showListener = Keyboard.addListener('keyboardDidShow', onKeyboardDidShow);
        const hideListener = Keyboard.addListener('keyboardDidHide', onKeyboardDidHide);
        return () => {
            showListener.remove();
            hideListener.remove();
        };
    }, [setLogoVisivel]);

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

                        {/* Aviso de obrigatoriedade */}
                        <Text style={{ color: '#e53935', fontSize: 15, marginBottom: 10, alignSelf: 'center' }}>
                            Todos os campos são obrigatórios
                        </Text>

                        {/* Input de Nome com ícone */}
                        <InputComIcone
                            iconName="person"
                            inputRef={nomeRef}
                            value={nome}
                            onChangeText={text => {
                                const apenasLetras = text.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
                                setNome(apenasLetras);
                                if (apenasLetras.trim().length === 0) {
                                    setErrors(e => ({ ...e, nome: '' }));
                                    setNomeInvalido(false);
                                } else if (apenasLetras.trim().length < 3) {
                                    setErrors(e => ({ ...e, nome: '' })); // Não mostra erro enquanto digita
                                    setNomeInvalido(true);
                                } else {
                                    setErrors(e => ({ ...e, nome: '' }));
                                    setNomeInvalido(false);
                                }
                            }}
                            placeholder="Nome completo"
                            autoFocus
                            returnKeyType="next"
                            onSubmitEditing={() => emailRef.current?.focus()}
                            onFocus={() => handleAnyInputFocus('nome')}
                            onBlur={() => setCampoFocado(null)}
                            style={[
                                campoFocado === 'nome' && styles.inputFocus,
                                nome.trim().length > 0 && nome.trim().length < 3
                                    ? styles.inputWarning
                                    : nome.trim().length >= 3
                                    ? styles.inputSuccess
                                    : undefined,
                            ]}
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
                            onChangeText={text => {
                                setEmail(text);
                                if (text.trim().length === 0) {
                                    setErrors(e => ({ ...e, email: '' }));
                                } else if (!validateEmail(text)) {
                                    setErrors(e => ({ ...e, email: '' })); // Não mostra erro enquanto digita
                                } else {
                                    setErrors(e => ({ ...e, email: '' }));
                                }
                            }}
                            placeholder="Email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            returnKeyType="next"
                            onFocus={() => handleAnyInputFocus('email')}
                            onBlur={() => setCampoFocado(null)}
                            onSubmitEditing={() => cpfRef.current?.focus()}
                            style={[
                                campoFocado === 'email' && styles.inputFocus,
                                email.length > 0 && !validateEmail(email)
                                    ? styles.inputWarning
                                    : email.length > 0 && validateEmail(email)
                                    ? styles.inputSuccess
                                    : undefined,
                            ]}
                        />
                        {campoFocado === 'email' && (
                            <Text style={styles.dicaEmail}>
                                Informe um e-mail válido (ex: seuemail@exemplo.com)
                            </Text>
                        )}
                        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                        {/* Input de CPF */}
                        <InputComIcone
                            iconName="card"
                            inputRef={cpfRef}
                            value={formatCPF(cpf)}
                            onChangeText={text => {
                                const onlyNumbers = text.replace(/\D/g, '');
                                setCpf(onlyNumbers);
                                if (onlyNumbers.length === 0) {
                                    setErrors(e => ({ ...e, cpf: '' }));
                                } else if (onlyNumbers.length !== 11) {
                                    setErrors(e => ({ ...e, cpf: '' })); // Não mostra erro enquanto digita
                                } else if (!validateCPF(onlyNumbers)) {
                                    setErrors(e => ({ ...e, cpf: 'CPF inválido.' }));
                                } else {
                                    setErrors(e => ({ ...e, cpf: '' }));
                                }
                            }}
                            placeholder="CPF"
                            keyboardType="numeric"
                            maxLength={14} // 000.000.000-00
                            returnKeyType="next"
                            onFocus={() => handleAnyInputFocus('cpf')}
                            onBlur={() => setCampoFocado(null)}
                            onSubmitEditing={() => rgRef.current?.focus()}
                            style={[
                                campoFocado === 'cpf' && styles.inputFocus,
                                cpf.length === 11 && !validateCPF(cpf)
                                    ? styles.inputError
                                    : cpf.length === 11 && validateCPF(cpf)
                                    ? styles.inputSuccess
                                    : cpf.length > 0
                                    ? styles.inputWarning
                                    : undefined,
                            ]}
                        />
                        {/* Tooltip de validação do CPF */}
                        {campoFocado === 'cpf' && !errors.cpf && (
                            <Text
                                style={
                                    cpf.length === 11 && validateCPF(cpf)
                                        ? styles.tooltipValido
                                        : cpf.length === 11 && !validateCPF(cpf)
                                        ? styles.tooltipInvalido
                                        : styles.tooltipAviso
                                }
                            >
                                {cpf.length === 11 && validateCPF(cpf)
                                    ? 'CPF válido'
                                    : cpf.length === 11 && !validateCPF(cpf)
                                    ? 'CPF inválido'
                                    : 'Digite os 11 dígitos do CPF'}
                            </Text>
                        )}
                        {errors.cpf && <Text style={styles.errorText}>{errors.cpf}</Text>}

                        {/* Input de RG */}
                        <InputComIcone
                            iconName="id-card"
                            inputRef={rgRef}
                            value={formatRG(rg)}
                            onChangeText={text => {
                                const numeros = text.replace(/\D/g, '');
                                setRg(numeros);
                                if (numeros.length === 0) {
                                    setErrors(e => ({ ...e, rg: '' }));
                                } else if (numeros.length !== 9) {
                                    setErrors(e => ({ ...e, rg: '' }));
                                } else if (!/^\d{9}$/.test(numeros)) {
                                    setErrors(e => ({ ...e, rg: 'RG inválido.' }));
                                } else {
                                    setErrors(e => ({ ...e, rg: '' }));
                                }
                            }}
                            placeholder="RG"
                            keyboardType="numeric"
                            maxLength={10} // 00000000-0
                            returnKeyType="next"
                            onFocus={() => handleAnyInputFocus('rg')}
                            onBlur={() => setCampoFocado(null)}
                            onSubmitEditing={() => telefoneRef.current?.focus()}
                            style={[
                                campoFocado === 'rg' && styles.inputFocus,
                                rg.length === 9 && !/^\d{9}$/.test(rg)
                                    ? styles.inputError
                                    : rg.length === 9 && /^\d{9}$/.test(rg)
                                    ? styles.inputSuccess
                                    : rg.length > 0
                                    ? styles.inputWarning
                                    : undefined,
                            ]}
                        />
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
                                if (numeros.length === 0) {
                                    setErrors(e => ({ ...e, telefone: '' }));
                                } else if (numeros.length < 10) {
                                    setErrors(e => ({ ...e, telefone: '' })); // Não mostra erro enquanto digita
                                } else if (!/^\d{10,11}$/.test(numeros)) {
                                    setErrors(e => ({ ...e, telefone: 'Telefone inválido.' }));
                                } else {
                                    setErrors(e => ({ ...e, telefone: '' }));
                                }
                            }}
                            placeholder="Telefone"
                            keyboardType="phone-pad"
                            maxLength={15}
                            returnKeyType="next"
                            onFocus={() => handleAnyInputFocus('telefone')}
                            onBlur={() => setCampoFocado(null)}
                            onSubmitEditing={() => {
                                senhaRef.current?.focus();
                                scrollToInput(senhaRef, scrollViewRef);
                            }}
                            style={[
                                campoFocado === 'telefone' && styles.inputFocus,
                                telefone.length >= 10 && !/^\d{10,11}$/.test(telefone)
                                    ? styles.inputError
                                    : telefone.length >= 10 && /^\d{10,11}$/.test(telefone)
                                    ? styles.inputSuccess
                                    : telefone.length > 0
                                    ? styles.inputWarning
                                    : undefined,
                            ]}
                        />
                        {errors.telefone && <Text style={styles.errorText}>{errors.telefone}</Text>}

                        <InputComIcone
                            iconName="key"
                            inputRef={senhaRef}
                            value={senha}
                            onChangeText={text => {
                                setSenha(text);
                                setSenhaForca(avaliarForcaSenha(text));
                                setSenhaRequisitos({
                                    tamanho: text.length >= 8,
                                    letra: /[a-zA-Z]/.test(text),
                                    numero: /\d/.test(text),
                                    simbolo: /[^a-zA-Z0-9]/.test(text),
                                });
                                if (text.length === 0) {
                                    setErrors(e => ({ ...e, senha: '' }));
                                    setSenhaMensagem('');
                                } else if (text.length < 8) {
                                    setErrors(e => ({ ...e, senha: '' })); // Não mostra erro enquanto digita
                                    setSenhaMensagem('Senha muito curta.');
                                } else {
                                    setErrors(e => ({ ...e, senha: '' }));
                                    setSenhaMensagem('');
                                }
                            }}
                            placeholder="Senha"
                            secureTextEntry={!mostrarSenha}
                            returnKeyType="next"
                            onFocus={() => {
                                handleAnyInputFocus('senha');
                                handleInputFocus('senha');
                                scrollToInput(senhaRef, scrollViewRef);
                            }}
                            onBlur={() => setCampoFocado(null)}
                            onSubmitEditing={() => confirmarSenhaRef.current?.focus()}
                            showToggle
                            showValue={mostrarSenha}
                            onToggleShow={() => setMostrarSenha(!mostrarSenha)}
                            style={[
                                campoFocado === 'senha' && styles.inputFocus,
                                senha.length >= 8
                                    ? styles.inputSuccess
                                    : senha.length > 0
                                    ? styles.inputWarning
                                    : undefined,
                            ]}
                        />
                        {/* Dica só aparece se senha estiver focada */}
                        {campoFocado === 'senha' && (
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
                            <PasswordStrengthMeter
                                senha={senha}
                                senhaForca={senhaForca}
                            />
                        ) : null}
                        <InputComIcone
                            iconName="key"
                            inputRef={confirmarSenhaRef}
                            value={confirmarSenha}
                            onChangeText={text => {
                                setConfirmarSenha(text);
                                if (text.length === 0) {
                                    setErrors(e => ({ ...e, confirmarSenha: '' }));
                                } else if (text !== senha) {
                                    setErrors(e => ({ ...e, confirmarSenha: 'As senhas não coincidem.' }));
                                } else if (senha.length < 8) {
                                    setErrors(e => ({ ...e, confirmarSenha: 'A senha deve ter pelo menos 8 caracteres.' }));
                                } else {
                                    setErrors(e => ({ ...e, confirmarSenha: '' }));
                                }
                            }}
                            placeholder="Confirmar senha"
                            secureTextEntry={!mostrarConfirmarSenha}
                            onFocus={() => {
                                handleAnyInputFocus('confirmarSenha');
                                handleInputFocus('confirmarSenha');
                            }}
                            onBlur={() => setCampoFocado(null)}
                            showToggle
                            showValue={mostrarConfirmarSenha}
                            onToggleShow={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                            style={[
                                campoFocado === 'confirmarSenha' && styles.inputFocus,
                                errors.confirmarSenha ? styles.inputError : undefined,
                            ]}
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
