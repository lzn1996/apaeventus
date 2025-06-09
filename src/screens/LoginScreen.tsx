import React, { useState, useRef } from 'react';
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
            onChangeText={setEmail}
          />

          <TextInput
            ref={senhaInputRef}
            style={styles.input}
            placeholder="Senha"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            value={senha}
            onChangeText={setSenha}
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
          {/* Botão de reset do banco para testes */}
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
