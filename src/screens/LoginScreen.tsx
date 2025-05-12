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
} from 'react-native';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nivel, setNivel] = useState<'administrador' | 'organizador' | 'recepcionista'>('administrador');
  const senhaInputRef = useRef<TextInput>(null);

  const handleLogin = () => {
    navigation.navigate('Dashboard');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
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

          <Text style={styles.label}>Acesso como:</Text>
          <View style={styles.levelContainer}>
            {['administrador', 'organizador', 'recepcionista'].map((n) => (
              <TouchableOpacity
                key={n}
                style={[
                  styles.levelButton,
                  nivel === n && styles.levelButtonActive,
                ]}
                onPress={() => setNivel(n as any)}
              >
                <Text
                  style={[
                    styles.levelText,
                    nivel === n && styles.levelTextActive,
                  ]}
                >
                  {n.charAt(0).toUpperCase() + n.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Entrar</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.navigate('RecuperarSenha')}>
              <Text style={styles.link}>Esqueceu a senha?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
              <Text style={styles.link}>Cadastrar-se</Text>
            </TouchableOpacity>
          </View>
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
  levelContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  levelButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#ccc',
    alignItems: 'center',
  },
  levelButtonActive: {
    backgroundColor: '#007AFF',
  },
  levelText: {
    color: '#333',
    fontSize: 14,
  },
  levelTextActive: {
    color: '#fff',
    fontWeight: '600',
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
});
