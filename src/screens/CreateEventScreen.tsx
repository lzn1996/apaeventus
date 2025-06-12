import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
  Image,
  PermissionsAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { DevSettings } from 'react-native'; // Dev button hidden
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { baseUrl } from '../config/api';
import { initEventTable, saveLocalEvent } from '../database/editprofile';

// ─── In-app Network Logger (intercept only /ticket) ─────────────────────────────
// ─── In-app Network Logger (disabled alerts, only console) ─────────────────────────────
if (__DEV__) {
  const originalFetch = global.fetch;
  global.fetch = async (url: string, options?: any) => {
    if (typeof url === 'string' && url.includes('/ticket')) {
      try {
        const parts = (options.body as any)?._parts as Array<[string, any]> || [];
        const token = options.headers?.Authorization || '';
        let curl = `curl -X POST "${url}" \
  -H 'Authorization: ${token}' \
`;
        parts.forEach(([k, v]) => {
          if (typeof v === 'string') curl += `  -F '${k}=${v}' \
`;
          else curl += `  -F '${k}=@${v.uri};type=${v.type}' \
`;
        });
        // // Alert.alert('cURL (/ticket)', curl); // debug alert commented out
        console.group('[NetworkLogger] /ticket Request');
        console.log('URL:', url);
        console.log('Headers:', options.headers);
        console.log('Body parts:', parts);
        console.groupEnd();
      } catch (err) {
        console.warn('NetworkLogger error:', err);
      }
    }
    return originalFetch(url, options);
  };
}
// ────────────────────────────────────────────────────────────────────────────────

// ─── Helpers de API ──────────────────────────────────────────────────────────── ────────────────────────────────────────────────────────────
async function refreshTokens(oldToken: string): Promise<string> {
  const refresh = await AsyncStorage.getItem('refreshToken');
  if (!refresh) throw new Error('Sem refresh token');

  const res = await fetch(`${baseUrl}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${oldToken}` },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!res.ok) throw new Error('Refresh expirou: ' + res.status);

  const { accessToken, refreshToken } = await res.json();
  await AsyncStorage.setItem('accessToken', accessToken);
  if (refreshToken) await AsyncStorage.setItem('refreshToken', refreshToken);
  return accessToken;
}

async function apiFetch(
  endpoint: string,
  method: string,
  formData: FormData
): Promise<Response> {
  let token = await AsyncStorage.getItem('accessToken');
  if (!token) throw new Error('Usuário não autenticado');

  // Remove o header Content-Type para permitir que o fetch defina o boundary automaticamente
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  let res = await fetch(`${baseUrl}${endpoint}`, { method, headers, body: formData });
  if (res.status === 401) {
    token = await refreshTokens(token);
    headers.Authorization = `Bearer ${token}`;
    res = await fetch(`${baseUrl}${endpoint}`, { method, headers, body: formData });
  }
  return res;
}
// ────────────────────────────────────────────────────────────────────────────────

export default function CreateEventScreen({ navigation }: any) {
  useEffect(() => { initEventTable(); }, []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<Asset | null>(null);

  // Gera string de data para envio e exibição
  const pad = (n: number) => n.toString().padStart(2, '0');
  const localDateString =
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

  const showDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        onChange: (_e, sel) => sel && setDate(sel),
        mode: 'datetime',
        is24Hour: false,
      });
    } else {
      setShowPicker(true);
    }
  };

  const handleDateChange = (_: any, sel?: Date) => {
    if (Platform.OS === 'ios') setShowPicker(false);
    if (sel) setDate(sel);
  };

  async function requestGalleryPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    const perm = Platform.Version >= 33
      ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
    const granted = await PermissionsAndroid.request(perm, {
      title: 'Permissão de galeria',
      message: 'Precisamos acessar suas imagens para enviar o evento.',
      buttonPositive: 'OK',
      buttonNegative: 'Cancelar',
    });
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  const pickImage = async () => {
    if (!(await requestGalleryPermission())) {
      return Alert.alert('Permissão negada');
    }
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, resp => {
      if (resp.didCancel) return;
      if (resp.errorMessage) return Alert.alert('Erro', resp.errorMessage!);
      if (resp.assets?.[0]) setImageFile(resp.assets[0]);
    });
  };

  const handleRegenerateToken = async () => {
    try {
      const old = await AsyncStorage.getItem('accessToken');
      if (!old) throw new Error('Nenhum token encontrado');
      await refreshTokens(old);
      const refresh = await AsyncStorage.getItem('refreshToken');
      Alert.alert('Novo Refresh Token', refresh || 'Indisponível');
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  };

  const handleSubmit = async () => {
    // Recupera token para cURL e requisição
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      return Alert.alert('Sessão inválida', 'Faça login novamente.');
    }
    if (!title.trim() || !description.trim()) {
      return Alert.alert('Atenção', 'Título e descrição são obrigatórios.');
    }

    const form = new FormData();
    form.append('title', title);
    form.append('description', description);
    // Append Z to match ISO format expected by backend
    form.append('eventDate', localDateString);
    form.append('quantity', quantity || '0');
    form.append('price', price || '0');
    if (imageFile) {
      form.append('imageFile', {
        uri: imageFile.uri,
        type: imageFile.type || 'image/jpeg',
        name: imageFile.fileName || 'file.jpg',
      } as any);
    }

    // Build cURL command for bash export
    const parts = (form as any)._parts as Array<[string, any]>;
    const tokenHeader = `Bearer ${token}`;
    let curlCmd = `curl -X POST "${baseUrl}/ticket"
-H 'Authorization: ${tokenHeader}'
`;
    parts.forEach(([k, v]) => {
      if (typeof v === 'string') {
        curlCmd += `-F '${k}=${v}'
`;
      } else {
        curlCmd += `-F '${k}=@${v.uri};type=${v.type}'
`;
      }
    });
    // Alert.alert('cURL', curlCmd); // comentado para não exibir em produção
    // Continue sending request

    try {
      const res = await apiFetch('/ticket', 'POST', form);
      if (!res.ok) {
        let errBody: any;
        try { errBody = await res.json(); } catch { errBody = await res.text(); }
        console.error('Erro Detalhado:', errBody);
        return Alert.alert(
          'Erro Detalhado',
          `Status ${res.status}\n${JSON.stringify(errBody, null, 2)}`
        );
      }
      const json = await res.json();
      saveLocalEvent({
        title,
        description,
        date: date.toISOString(),
        quantity: Number(quantity) || 0,
        price: Number(price) || 0,
        imageUri: imageFile?.uri,
      });
      Alert.alert(
        'Sucesso',
        `Evento criado! ID: ${json.id}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      console.error('Exceção no submit:', e);
      Alert.alert('Erro Exceção', e.message + '\n' + (e.stack || ''));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Nome do evento"
        />

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Detalhes do evento"
          multiline
        />

        <Text style={styles.label}>Data e hora</Text>
        <Pressable onPress={showDatePicker} style={styles.dateButton}>
          <Text>{localDateString}</Text>
        </Pressable>
        {showPicker && Platform.OS === 'ios' && (
          <DateTimePicker
            value={date}
            mode="datetime"
            display="default"
            onChange={handleDateChange}
          />
        )}

        <Text style={styles.label}>Quantidade</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          placeholder="0"
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Preço (R$)</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="0"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Imagem do evento</Text>
        <View style={styles.imagePickerContainer}>
          <Pressable style={styles.imageButton} onPress={pickImage}>
            <Text style={styles.imageButtonText}>
              {imageFile ? 'Trocar Imagem' : 'Escolher Imagem'}
            </Text>
          </Pressable>
          {imageFile && (
            <Image source={{ uri: imageFile.uri }} style={styles.preview} />
          )}
        </View>

        <Pressable style={styles.regenButton} onPress={handleRegenerateToken}>
          <Text style={styles.regenText}>Regenerar Token</Text>
        </Pressable>

        {/* Botão para abrir o Dev Menu manualmente */}
        

        <Pressable style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Criar Evento</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f2f2f7' },
  container: { padding: 16 },
  label: { fontWeight: '600', marginTop: 12 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  imagePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  imageButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 6,
  },
  imageButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  preview: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginLeft: 12,
  },
  regenButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  regenText: {
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  devMenuButton: {
    backgroundColor: '#FFD60A',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  devMenuText: {
    color: '#000',
    fontWeight: '600',
  },
});
