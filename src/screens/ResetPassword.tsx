// src/screens/RecoverPasswordScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';

export default function RecoverPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

 const handleRecover = async () => {
  if (!email) {
    return Alert.alert('Erro', 'Digite um e-mail válido.');
  }

 /* const curlExample = `curl --location 'https://apaeventus.rafaelcostadev.com/recover-password/generate' \\
--header 'Content-Type: application/json' \\
--data-raw '{ "email": "${email}" }'`;

  Alert.alert('Requisição enviada', curlExample);
  */

  try {
    setLoading(true);
    const response = await fetch('https://apaeventus.rafaelcostadev.com/recover-password/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    let data: any = null;

    // Tenta ler o corpo apenas se houver conteúdo
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 0) {
      data = await response.json();
    }

    if (response.ok) {
      Alert.alert('Sucesso', 'Se o e-mail existir, você receberá instruções para recuperar sua senha.');
    } else {
      Alert.alert('Erro', data?.message || 'Não foi possível enviar a solicitação.');
    }
  } catch (error) {
    console.error('Erro ao recuperar senha:', error);
    Alert.alert('Erro', 'Falha na requisição de rede.');
  } finally {
    setLoading(false);
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar Senha</Text>

      <TextInput
        style={styles.input}
        placeholder="Digite seu e-mail"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRecover}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Enviando...' : 'Recuperar'}</Text>
      </Pressable>

      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Voltar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 20 },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#aaa' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  backButton: { marginTop: 20, alignItems: 'center' },
  backButtonText: { color: '#007AFF', fontSize: 16 },
});
