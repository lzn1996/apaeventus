/* eslint-disable react-native/no-inline-styles */
import React, {useState, useRef} from 'react';
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
import {Picker} from '@react-native-picker/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function CadastroScreen({navigation}: {navigation: any}) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [tipoAcesso, setTipoAcesso] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
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

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
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
      nomeRef.current?.focus();
    } else if (!validateEmail(email)) {
      newErrors.email = 'E-mail inválido.';
      emailRef.current?.focus();
    } else if (senha.length < 6) {
      newErrors.senha = 'Senha deve ter ao menos 6 caracteres.';
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

    if (!tipoAcesso) {
      Alert.alert('Erro', 'Por favor, selecione o tipo de acesso.');
      return;
    }

    console.log('Dados do Cadastro:', {nome, email, senha, tipoAcesso});
    Alert.alert('Sucesso', 'Usuário cadastrado com sucesso!');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, {flexGrow: 1}]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Image
            source={require('../assets/apae_logo.png')}
            style={[styles.logo, {width: Dimensions.get('window').width * 0.5}]}
            resizeMode="contain"
          />

          <Text style={styles.title}>Cadastre-se</Text>

          <TextInput
            ref={nomeRef}
            style={[styles.input, errors.nome && styles.inputError]}
            placeholder="Nome completo"
            placeholderTextColor="#999"
            value={nome}
            onChangeText={setNome}
            autoFocus
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />
          {errors.nome ? (
            <Text style={styles.errorText}>{errors.nome}</Text>
          ) : null}

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
          {errors.email ? (
            <Text style={styles.errorText}>{errors.email}</Text>
          ) : null}

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
              onChangeText={setSenha}
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
          {errors.senha ? (
            <Text style={styles.errorText}>{errors.senha}</Text>
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
          {errors.confirmarSenha ? (
            <Text style={styles.errorText}>{errors.confirmarSenha}</Text>
          ) : null}

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={tipoAcesso}
              onValueChange={itemValue => setTipoAcesso(itemValue)}
              style={styles.picker}>
              <Picker.Item label="Selecione o tipo de acesso" value="" />
              <Picker.Item label="Usuário" value="usuario" />
              <Picker.Item label="Organizador" value="organizador" />
            </Picker>
          </View>

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
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  container: {
    alignItems: 'center',
  },
  logo: {
    height: 160,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
    alignSelf: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderColor: '#999',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  inputError: {
    borderColor: 'red',
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#333',
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    width: '100%',
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    elevation: 2, // Android
    shadowColor: '#000', // iOS
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLinkText: {
    color: '#0078C9',
    fontSize: 14,
    textDecorationLine: 'underline',
  },

  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#000',
  },
  errorText: {
    color: 'red',
    fontSize: 13,
    marginBottom: 8,
    marginLeft: 4,
  },
});
