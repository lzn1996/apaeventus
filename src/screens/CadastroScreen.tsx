/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function CadastroScreen({ navigation }: { navigation: any }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
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

  const nomeRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const senhaRef = useRef<TextInput>(null);
  const confirmarSenhaRef = useRef<TextInput>(null);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const avaliarForcaSenha = (s: string) => {
    if (!s) {
      return '';
    }
    if (s.length < 6) {
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

    if (!nome.trim() || nome.length < 3) {
      newErrors.nome = 'Nome deve ter ao menos 3 caracteres.';
      setNomeInvalido(true); // Garante que o aviso seja exibido
      nomeRef.current?.focus();
    } else if (!validateEmail(email)) {
      newErrors.email = 'E-mail inválido.';
      emailRef.current?.focus();
    } else if (senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres.';
      senhaRef.current?.focus();
    } else if (senha !== confirmarSenha) {
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
    if (senha.length >= 6) {
      setErrors(prevErrors => ({ ...prevErrors, senha: '' }));
      setSenhaMensagem('');
    }
  }, [senha]);

  useEffect(() => {
    if (confirmarSenha === senha && senha.length >= 6) {
      setErrors(prevErrors => ({ ...prevErrors, confirmarSenha: '' }));
    } else if (confirmarSenha !== senha) {
      setErrors(prevErrors => ({ ...prevErrors, confirmarSenha: 'As senhas não coincidem.' }));
    } else if (senha.length < 6 && confirmarSenha.length > 0) {
      setErrors(prevErrors => ({ ...prevErrors, confirmarSenha: 'A senha deve ter pelo menos 6 caracteres.' }));
    } else if (confirmarSenha.length > 0 && senha.length === 0) {
        setErrors(prevErrors => ({ ...prevErrors, confirmarSenha: '' }));
    }
  }, [confirmarSenha, senha]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { flexGrow: 1 }]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Image
            source={require('../assets/apae_logo.png')}
            style={[styles.logo, { width: Dimensions.get('window').width * 0.5 }]}
            resizeMode="contain"
          />
          <Text style={styles.title}>Cadastre-se</Text>

          <TextInput
            ref={nomeRef}
            style={[styles.input, nomeInvalido && styles.inputError, errors.nome && styles.inputError]}
            placeholder="Nome completo"
            placeholderTextColor="#999"
            value={nome}
            onChangeText={text => {
              const apenasLetras = text.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
              setNome(apenasLetras);
              setNomeInvalido(apenasLetras.trim().length > 0 && apenasLetras.trim().length < 3);
            }}
            autoFocus
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />
          {nomeInvalido && <Text style={styles.avisoNome}>O nome está muito curto</Text>}
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
            onSubmitEditing={() => senhaRef.current?.focus()}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <View
            style={[
              styles.passwordContainer,
              errors.senha && styles.inputError,
            ]}>
            <TextInput
              ref={senhaRef}
              style={styles.passwordInput}
              placeholder="Senha"
              placeholderTextColor="#999"
              value={senha}
              onChangeText={text => {
                setSenha(text);
                setSenhaForca(avaliarForcaSenha(text));

                if (text.length > 0 && text.length < 6) {
                  setSenhaMensagem('A senha deve ter pelo menos 6 caracteres');
                } else {
                  setSenhaMensagem('');
                }
              }}
              secureTextEntry={!mostrarSenha}
              returnKeyType="next"
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
          {senhaMensagem && <Text style={styles.errorText}>{senhaMensagem}</Text>}
          {senha ? (
            <View style={{ width: '100%', marginBottom: 8 }}>
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
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
                  marginBottom: 2,
                }}
              />
              <Text
                style={[
                  styles.senhaForca,
                  senhaForca === 'fraca' && { color: 'red' },
                  senhaForca === 'média' && { color: '#e6b800' },
                  senhaForca === 'forte' && { color: 'green' },
                ]}>
                Senha {senhaForca}
              </Text>
              {senhaForca === 'fraca' && (
                <Text style={styles.dicaSenha}>
                  Adicione mais caracteres (mínimo 6).
                </Text>
              )}
              {senhaForca === 'média' && (
                <Text style={styles.dicaSenha}>
                  Tente adicionar números e/ou símbolos para torná-la mais forte.
                </Text>
              )}
            </View>
          ) : null}

          <View
            style={[
              styles.passwordContainer,
              errors.confirmarSenha && styles.inputError,
            ]}>
            <TextInput
              ref={confirmarSenhaRef}
              style={styles.passwordInput}
              placeholder="Confirmar senha"
              placeholderTextColor="#999"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              secureTextEntry={!mostrarConfirmarSenha}
            />
            <TouchableOpacity
              onPress={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}>
              <Ionicons
                name={mostrarConfirmarSenha ? 'eye-off' : 'eye'}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {errors.confirmarSenha && <Text style={styles.errorText}>{errors.confirmarSenha}</Text>}

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: '#f6fafd',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f6fafd',
  },
  container: {
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    height: 160,
    marginBottom: 24, // aumentado
    alignSelf: 'center',
  },
  title: {
    fontSize: 32, // maior
    fontWeight: 'bold',
    marginBottom: 36, // aumentado
    color: '#007bff',
    alignSelf: 'center',
    letterSpacing: 1,
  },
  input: {
    width: '100%',
    height: 53,
    backgroundColor: '#fff',
    borderColor: '#b0b8c1',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 18, // maior
    marginBottom: 22, // aumentado
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: '#e53935',
  },
  button: {
    width: '100%',
    backgroundColor: '#0271bb',
    paddingVertical: 16, // maior
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20, // aumentado
    marginBottom: 26, // aumentado
    elevation: 2,
    shadowColor: '#0271bb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20, // maior
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  loginLinkText: {
    color: '#007bff',
    fontSize: 17, // maior
    textDecorationLine: 'underline',
    marginTop: 10, // aumentado
    marginBottom: 10,
    fontWeight: '500',
  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#b0b8c1',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 22, // aumentado
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    fontSize: 18, // maior
    color: '#000',
  },
  errorText: {
    color: '#e53935',
    fontSize: 16, // maior
    marginBottom: 20, // aumentado
    marginLeft: 4,
    fontWeight: '500',
  },
  senhaForca: {
    fontSize: 16, // maior
    fontWeight: 'bold',
    marginBottom: 14, // aumentado
    marginLeft: 4,
    alignSelf: 'flex-start',
  },
  avisoNome: {
    color: '#e6b800',
    fontSize: 16,
    marginBottom: 14,
    marginLeft: 4,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  dicaSenha: {
    fontSize: 14,
    color: '#777',
    marginLeft: 4,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
});
