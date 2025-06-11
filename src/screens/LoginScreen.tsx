// src/screens/LoginScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { baseUrl } from '../config/api';


// Definição do formato de resposta do login
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'USER';
    rg: string | null;
    cpf: string | null;
    cellphone: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

// Definição do formato de resposta do refresh
/*interface RefreshResponse {
  accessToken: string;
}*/

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [focusField, setFocusField] = useState<'email' | 'senha' | null>(null);
  const [loading, setLoading] = useState(false);
  const senhaInputRef = useRef<TextInput>(null);

  // Animações
  const logoScale = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [logoScale]);

 /* function runShake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }*/

  // Integração com /auth/login
 const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      // animação de shake, ou apenas:
      return Alert.alert('Ops', 'Preencha e-mail e senha');
    }

    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: senha }), // e não senha: senha!
      });

      // **LEIA JSON UMA ÚNICA VEZ**
      const json = await response.json().catch(() => null);
      console.log('[DEBUG] login response:', response.status, json);

      if (!response.ok) {
        // backend pode devolver { message: [...] } ou erro simples
        const msg =
          typeof json?.message === 'string'
            ? json.message
            : Array.isArray(json?.message)
            ? json.message.join('\n')
            : 'Credenciais inválidas';
        throw new Error(msg);
      }

      // agora é seguro fazer cast
      const data = json as AuthResponse;
      const { accessToken, refreshToken, user } = data;
      if (!accessToken || !refreshToken || !user?.role) {
        throw new Error('Resposta de login incompleta');
      }

      // **Salva tokens e role**
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('userRole', user.role);

      // navega
      navigation.replace('Dashboard');
    } catch (err: any) {
      console.warn('[DEBUG] login erro:', err);
      Alert.alert('Erro ao entrar', err.message || 'Não foi possível fazer login');
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled = loading || !email.trim() || !senha.trim();

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Animated.View
            style={[
              styles.container,
              { transform: [{ translateX: shakeAnim }] },
            ]}
          >
            <Animated.Image
              source={require('../assets/apae_logo.png')}
              style={[styles.logo, { transform: [{ scale: logoScale }] }]}
            />

            <View style={styles.card}>
              {/* E-mail */}
              <View
                style={[
                  styles.inputWrapper,
                  focusField === 'email' && styles.inputFocused,
                  email === '' && styles.inputError,
                ]}
              >
                <MaterialIcons name="email" size={20} color="#666" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="E-mail"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusField('email')}
                  onBlur={() => setFocusField(null)}
                  onSubmitEditing={() => senhaInputRef.current?.focus()}
                />
              </View>

              {/* Senha */}
              <View
                style={[
                  styles.inputWrapper,
                  focusField === 'senha' && styles.inputFocused,
                  senha === '' && styles.inputError,
                ]}
              >
                <MaterialCommunityIcons name="key" size={20} color="#666" style={styles.icon} />
                <TextInput
                  ref={senhaInputRef}
                  style={styles.input}
                  placeholder="Senha"
                  placeholderTextColor="#999"
                  secureTextEntry={!showSenha}
                  returnKeyType="done"
                  value={senha}
                  onChangeText={setSenha}
                  onFocus={() => setFocusField('senha')}
                  onBlur={() => setFocusField(null)}
                />
                <Pressable onPress={() => setShowSenha(v => !v)}>
                  <MaterialCommunityIcons
                    name={showSenha ? 'eye-off' : 'eye'}
                    size={20}
                    color="#666"
                  />
                </Pressable>
              </View>

              {/* Botão Entrar */}
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  (pressed || isButtonDisabled) && {
                    opacity: 0.6,
                    transform: pressed ? [{ scale: 0.97 }] : [],
                  },
                ]}
                onPress={handleLogin}
                disabled={isButtonDisabled}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Entrar</Text>
                )}
              </Pressable>

              {/* Voltar para Tela inicial */}
              <View style={styles.footer}>
                <Pressable onPress={() => navigation.navigate('Cadastro')}>
                  <Text style={styles.register}>Registre-Se</Text>
                </Pressable>
              </View>
              <View style={styles.footer}>
                <Pressable onPress={() => navigation.navigate('Dashboard')}>
                  <Text style={styles.link}>Voltar para Tela inicial</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#eef2f5' },
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { width: 140, height: 140, alignSelf: 'center', marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputFocused: { borderColor: '#007AFF' },
  inputError: { borderColor: '#E74C3C' },
  icon: { marginRight: 8 },
  input: { flex: 1, height: 48, fontSize: 16, color: '#333' },
  button: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  link: { color: '#3982b8', fontSize: 14 },
  register: { color: '#6eaa5e', fontSize: 18, marginBottom: 16, textAlign: 'center' },
});

/*import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Alert,
} from 'react-native';
import { authService } from '../services/authService';
import { syncAll } from '../database/syncService';
import api from '../services/api';
import { initDatabase } from '../database/init';
import NetInfo from '@react-native-community/netinfo';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const senhaInputRef = useRef<TextInput>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[LoginScreen] Iniciando login para', email);
      // Login na API
      const response = await api.post('/auth/login', { email, password: senha });
      const { accessToken, refreshToken } = response.data;
      await authService.setTokens(accessToken, refreshToken);
      console.log('[LoginScreen] Tokens salvos, inicializando banco...');
      // Inicializa banco e sincroniza
      await initDatabase();
      console.log('[LoginScreen] Banco inicializado, sincronizando...');
      await syncAll('', async () => true);
      console.log('[LoginScreen] Sync concluído, navegando para Dashboard');
      navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
    } catch (err: any) {
      console.error('[LoginScreen] Erro no login:', err);
      setError('E-mail ou senha inválidos!');
      Alert.alert('Erro', 'E-mail ou senha inválidos!');
    } finally {
      setLoading(false);
    }
  };

  // Função para resetar o banco SQLite (apenas para testes)
  const handleResetDatabase = async () => {
    try {
      const db = await require('../database/db').openDatabase();
      await db.executeSql('DROP TABLE IF EXISTS tickets');
      await db.executeSql('DROP TABLE IF EXISTS events');
      await initDatabase();
      Alert.alert('Banco resetado', 'As tabelas foram excluídas e recriadas.');
    } catch (err) {
      Alert.alert('Erro ao resetar banco', String(err));
    }
  };

  // Listener para sincronizar sempre que ficar online após login
  React.useEffect(() => {
    if (!loading) { return; }
    let unsubscribe: (() => void) | null = null;
    unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        syncAll('', async () => true);
      }
    });
    return () => {
      if (unsubscribe) { unsubscribe(); }
    };
  }, [loading]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.title}>ApaEventus</Text>

          <TextInput
            style={styles.input}
            placeholder="E-mail"
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
            returnKeyType="next"
            onSubmitEditing={() => senhaInputRef.current?.focus()}
            value={email}
            onChangeText={text => {
              setEmail(text);
              if (error) { setError(null); }
            }}
          />

          <TextInput
            ref={senhaInputRef}
            style={styles.input}
            placeholder="Senha"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            value={senha}
            onChangeText={text => {
              setSenha(text);
              if (error) { setError(null); }
            }}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
            <Text style={styles.loginButtonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.navigate('RecuperarSenha')}>
              <Text style={styles.link}>Esqueceu a senha?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              Keyboard.dismiss();
              setTimeout(() => navigation.navigate('Cadastro'), 50);
            }}>
              <Text style={styles.link}>Cadastrar-se</Text>
            </TouchableOpacity>
          </View>
          {/* Botão de reset do banco para testes *//*}
          {__DEV__ && (
            <TouchableOpacity style={[styles.loginButton, { backgroundColor: '#E53935' }]} onPress={handleResetDatabase}>
              <Text style={styles.loginButtonText}>Resetar Banco (TESTE)</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  loginButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  link: {
    color: '#007AFF',
    fontSize: 14,
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
  },
});
*/