// ./src/screens/CreateEventScreen.tsx
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
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { baseUrl } from '../config/api';
import { initEventTable, saveLocalEvent /*, getLocalEvents */ } from '../database/editprofile';

export default function CreateEventScreen({ navigation }: any) {
  useEffect(() => { initEventTable(); }, []);

  // Lê todos os eventos salvos localmente e loga/mostra em Alert
  /*useEffect(() => {
    getLocalEvents(events => {
      console.log('Eventos locais:', events);
      Alert.alert('Eventos em SQLite', JSON.stringify(events, null, 2));
    });
  }, []);*/

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<Asset | null>(null);

  async function refreshAccessToken(): Promise<string | null> {
    const old = await AsyncStorage.getItem('accessToken');
    const refresh = await AsyncStorage.getItem('refreshToken');
    if (!old || !refresh) return null;

    const res = await fetch(`${baseUrl}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${old}` },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return null;

    const json = await res.json();
    if (json.accessToken) {
      await AsyncStorage.setItem('accessToken', json.accessToken);
      if (json.refreshToken) await AsyncStorage.setItem('refreshToken', json.refreshToken);
      return json.accessToken;
    }
    return null;
  }

  const showDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: date, onChange: (_e, sel) => sel && setDate(sel), mode: 'datetime', is24Hour: false });
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
    const perm = Platform.Version >= 33 ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
    const granted = await PermissionsAndroid.request(perm, {
      title: 'Permissão de galeria',
      message: 'Precisamos acessar suas imagens para enviar o evento.',
      buttonPositive: 'OK', buttonNegative: 'Cancelar',
    });
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  const pickImage = async () => {
    if (!(await requestGalleryPermission())) {
      return Alert.alert('Permissão negada', 'Não foi possível acessar a galeria.');
    }
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, resp => {
      if (resp.didCancel) return;
      if (resp.errorMessage) return Alert.alert('Erro', resp.errorMessage);
      if (resp.assets?.[0]) setImageFile(resp.assets[0]);
    });
  };

 const handleSubmit = async () => {
  if (!title.trim() || !description.trim()) {
    return Alert.alert('Atenção', 'Título e descrição são obrigatórios.');
  }

  let token =
    (await refreshAccessToken()) ||
    (await AsyncStorage.getItem('accessToken'));
  if (!token) {
    return Alert.alert('Sessão inválida', 'Faça login novamente.');
  }

  const isForm = !!imageFile?.uri;
  const headers: Record<string,string> = { Authorization: `Bearer ${token}` };
  let body: any;

  if (isForm) {
    body = new FormData();
    body.append('title', title);
    body.append('description', description);
    body.append('eventDate', date.toISOString());          // COM milissegundos
    body.append('quantity', quantity || '0');
    body.append('price', price || '0');
    body.append('imageFile', {
      uri: imageFile!.uri,
      name: imageFile!.fileName || `image.jpg`,
      type: imageFile!.type || 'image/jpeg'
    } as any);
    // não adiciona Content-Type
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({
      title,
      description,
      eventDate: date.toISOString(),                      // COM milissegundos
      quantity: quantity || "0",                          // string
      price: price || "0"
    });
  }

  // wrapper para refazer após refresh
  const send = async (tkn: string) => {
    return fetch(`${baseUrl}/ticket`, {
      method: 'POST',
      headers: { ...headers, Authorization: `Bearer ${tkn}` },
      body
    });
  };

  try {
    let res = await send(token);

    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) return Alert.alert('Sessão expirada','Faça login novamente.');
      res = await send(newToken);
    }

    const text = await res.text();
    if (!res.ok) {
      console.error('Bad response:', text);
      return Alert.alert('Erro', `Status ${res.status}\n${text}`);
    }

    saveLocalEvent({ 
      title,
      description,
      date: date.toISOString(),
      quantity: Number(quantity) || 0,
      price: Number(price) || 0,
      imageUri: imageFile?.uri
    });

    Alert.alert('Sucesso','Evento criado!',[
      { text:'OK', onPress:()=>navigation.goBack() }
    ]);
  } catch (e) {
    console.warn(e);
    Alert.alert('Erro','Não foi possível criar o evento.');
  }
};



  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Título</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Nome do evento" />

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
          <Text>{date.toLocaleString()}</Text>
        </Pressable>
        {showPicker && Platform.OS === 'ios' && (
          <DateTimePicker value={date} mode="datetime" display="default" onChange={handleDateChange} />
        )}

        <Text style={styles.label}>Quantidade</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          placeholder="300"
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Preço (R$)</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="2"
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Imagem do evento</Text>
        <View style={styles.imagePickerContainer}>
          <Pressable style={styles.imageButton} onPress={pickImage}>
            <Text style={styles.imageButtonText}>{imageFile ? 'Trocar Imagem' : 'Escolher Imagem'}</Text>
          </Pressable>
          {imageFile?.uri && <Image source={{ uri: imageFile.uri }} style={styles.preview} />}
        </View>

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
  label: { fontWeight: '600', marginTop: 12, marginBottom: 4 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
    marginTop: 4,
  },
  imageButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
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
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});