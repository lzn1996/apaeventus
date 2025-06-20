// src/screens/EditProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { baseUrl } from '../config/api';
import api from '../services/api';
import { getUserProfileLocal, saveUserProfileLocal } from '../database/profileLocalService';
import { jwtDecode } from 'jwt-decode';
import AwesomeAlert from 'react-native-awesome-alerts';

export default function EditProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rg, setRg] = useState('');
  const [cellphone, setCellphone] = useState('');
  // estados do AwesomeAlert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(true);

  const showAlert = (title: string, message: string, success = true) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setIsSuccess(success);
    setAlertVisible(true);
  };

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
      navigation.navigate('Login');
    }
  };

  /** 2) Inicializa tabela e carrega perfil (local + remoto) */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Busca o id do usuário autenticado
        let userId = '';
        const accessToken = await AsyncStorage.getItem('accessToken');
        if (accessToken) {
          try {
            const decoded: any = jwtDecode(accessToken);
            userId = decoded.id || '';
          } catch (e) {
            console.log('[EditProfileScreen] Erro ao decodificar accessToken:', e);
          }
        }
        // Busca perfil local pelo id do usuário
        let local = null;
        if (userId) {
          const db = await require('../database/db').openDatabase();
          const res = await db.executeSql('SELECT * FROM user_profile WHERE id = ? LIMIT 1', [userId]);
          if (res[0].rows.length > 0) {
            local = res[0].rows.item(0);
          }
        } else {
          local = await getUserProfileLocal();
        }
        if (local) {
          setName(local.name || '');
          setEmail(local.email || '');
          setRg(local.rg || '');
          setCellphone(local.cellphone || local.phone || '');
        }
        // Log extra: headers da requisição /user
        api.interceptors.request.use(config => {
          if (config.url?.includes('/user')) {
            console.log('[EditProfileScreen] Header Authorization enviado:', config.headers?.Authorization);
          }
          return config;
        });
        // Busca do backend e atualiza local
        const res = await api.get('/user');
        const js = res.data;
        setName(js.name || '');
        setEmail(js.email || '');
        setRg(js.rg || '');
        setCellphone(js.cellphone || js.phone || '');
        // Salva perfil atualizado localmente com id correto
        await saveUserProfileLocal({
          id: js.id || userId || '1',
          name: js.name || '',
          email: js.email || '',
          cellphone: js.cellphone || js.phone || '',
          phone: js.phone || '',
          rg: js.rg || '',
        });
      } catch (e: any) {
        showAlert('Atualização cadastral', 'Atualize seus dados se necessário.', true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** 3) Salva alterações no servidor e SQLite, depois força logout */
  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      return showAlert('Atenção', 'Nome e e-mail são obrigatórios.', false);
    }
    try {
      // Monta objeto apenas com campos preenchidos e permitidos
      const payload: any = { name, rg, cellphone };
      // Só envia password se preenchido
      if (password && password.trim().length > 0) {
        payload.password = password;
      }
      // Só envia e-mail se o backend permitir alteração (remova se não for permitido)
      payload.email = email;
      await api.patch('/user', payload);
      // Atualiza perfil local (sem senha) com id correto
      let userId = '';
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (accessToken) {
        try {
          const decoded: any = jwtDecode(accessToken);
          userId = decoded.id || '';
        } catch {}
      }
      await saveUserProfileLocal({
        id: userId || '1',
        name,
        email,
        cellphone,
        phone: cellphone,
        rg,
      });
      showAlert('Sucesso', 'Dados atualizados! Você será deslogado para segurança em 5 segundos, entre no aplicativo novamente! ', true);
      setTimeout(doLogout, 7000);
    } catch (e: any) {
      let msg = 'Erro ao salvar.';
      if (e?.response) {
        msg += `\nStatus ${e.response.status}`;
        if (typeof e.response.data === 'string') { msg += `\n${e.response.data}`; }
      }
      showAlert('Erro de rede', e.message || String(msg), false);
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      navigation.replace('Dashboard');
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [navigation]);

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
        <Pressable
        style={styles.buttonBack}
        onPress={() => navigation.navigate('Dashboard')}
        >
        <Text style={styles.buttonBackText}>← Voltar</Text>
      </Pressable>
      </ScrollView>
      <AwesomeAlert
        show={alertVisible}
        showProgress={false}
        title={alertTitle}
        message={alertMessage}
        closeOnTouchOutside
        closeOnHardwareBackPress
        showConfirmButton
        confirmText="OK"
        confirmButtonColor={isSuccess ? '#4CAF50' : '#F44336'}
        onConfirmPressed={() => {
          setAlertVisible(false);
        }}
      />
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
    buttonBack: {
    marginTop: 16,
    alignSelf: 'center',
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  buttonBackPressed: {
    backgroundColor: '#155a9c',
  },
  buttonBackText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
