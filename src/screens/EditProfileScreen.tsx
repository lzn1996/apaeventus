// src/screens/EditProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { baseUrl } from '../config/api';

import {
  initProfileTable,
  getLocalProfile,
  saveLocalProfile,
} from '../database/editprofile.ts';    // vê só: ../db e não ../db.ts

export default function EditProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rg, setRg] = useState('');
  const [cellphone, setCellphone] = useState('');

  /** 0) Logout forçado */
  const doLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        await fetch(`${baseUrl}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (e) {
      console.warn('Erro no logout:', e);
    } finally {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userRole']);
      navigation.replace('Login');
    }
  };

  /** 1) Refresh de token */
  const refreshAccessToken = async (): Promise<string | null> => {
    const old = await AsyncStorage.getItem('accessToken');
    const refresh = await AsyncStorage.getItem('refreshToken');
    if (!old || !refresh) return null;

    const res = await fetch(`${baseUrl}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${old}`,
      },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return null;

    const js = await res.json();
    if (js.accessToken) {
      await AsyncStorage.setItem('accessToken', js.accessToken);
      if (js.refreshToken) {
        await AsyncStorage.setItem('refreshToken', js.refreshToken);
      }
      return js.accessToken;
    }
    return null;
  };

  /** 2) Inicializa tabela e carrega perfil (local + remoto) */
  useEffect(() => {
    // cria tabela e tenta ler cache SQLite
    initProfileTable();
    getLocalProfile(row => {
      if (row) {
        setName(row.name);
        setEmail(row.email);
        setRg(row.rg);
        setCellphone(row.cellphone);
      }
    });

    // então busca no servidor para atualizar cache
    (async () => {
      try {
        let token = await AsyncStorage.getItem('accessToken');
        if (!token) throw new Error('Token inválido');

        let res = await fetch(`${baseUrl}/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          token = (await refreshAccessToken())!;
          if (!token) throw new Error('Sessão expirada');
          res = await fetch(`${baseUrl}/user`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        if (!res.ok) throw new Error(`Status ${res.status}`);

        const js = await res.json();
        setName(js.name || '');
        setEmail(js.email || '');
        setRg(js.rg || '');
        setCellphone(js.cellphone || '');

        // atualiza cache local
        saveLocalProfile({
          name: js.name || '',
          email: js.email || '',
          rg: js.rg || '',
          cellphone: js.cellphone || '',
        });
      } catch (e: any) {
Alert.alert('Atualização cadastral!', 'Atualize seus dados se necessário.');      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** 3) Salva alterações no servidor e SQLite, depois força logout */
  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      return Alert.alert('Atenção', 'Nome e e-mail são obrigatórios.');
    }

    try {
      let token = await AsyncStorage.getItem('accessToken');
      if (!token) throw new Error('Token inválido');

      let res = await fetch(`${baseUrl}/user`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, password, rg, cellphone }),
      });

      if (res.status === 401) {
        token = (await refreshAccessToken())!;
        if (!token) {
          return Alert.alert('Sessão expirada', 'Faça login novamente.');
        }
        res = await fetch(`${baseUrl}/user`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, email, password, rg, cellphone }),
        });
      }

      const text = await res.text();
      if (!res.ok) {
        return Alert.alert('Erro ao salvar', `Status ${res.status}\n${text}`);
      }

      // grava cache local
      saveLocalProfile({ name, email, rg, cellphone });

      Alert.alert(
        'Sucesso',
        'Dados atualizados! Você será deslogado para segurança.',
        [{ text: 'OK', onPress: doLogout }]
      );
    } catch (e: any) {
      console.warn(e);
      Alert.alert('Erro de rede', e.message || String(e));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nome completo"
        />

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Senha (opcional)</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="********"
          secureTextEntry
        />

        <Text style={styles.label}>RG</Text>
        <TextInput
          style={styles.input}
          value={rg}
          onChangeText={setRg}
          placeholder="44444444-4"
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Celular</Text>
        <TextInput
          style={styles.input}
          value={cellphone}
          onChangeText={setCellphone}
          placeholder="19987654321"
          keyboardType="phone-pad"
        />

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>Salvar Alterações</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f2f2f7' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16 },
  label: { fontWeight: '600', marginTop: 12, marginBottom: 4 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});