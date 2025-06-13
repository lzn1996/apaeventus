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
import { initEventTable, saveLocalEvent } from '../database/editprofile';

export default function CreateEventScreen({ navigation }: any) {
  useEffect(() => { initEventTable(); }, []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<Asset | null>(null);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const localDateString = `${date.toLocaleDateString()} às ${pad(date.getHours())}:${pad(date.getMinutes())}`;

  const handleDateChange = (_: any, sel?: Date) => {
    setShowDate(false);
    if (sel) {
      const updated = new Date(date);
      updated.setFullYear(sel.getFullYear());
      updated.setMonth(sel.getMonth());
      updated.setDate(sel.getDate());
      setDate(updated);
    }
  };

  const handleTimeChange = (_: any, sel?: Date) => {
    setShowTime(false);
    if (sel) {
      const updated = new Date(date);
      updated.setHours(sel.getHours());
      updated.setMinutes(sel.getMinutes());
      setDate(updated);
    }
  };

  const showDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        onChange: handleDateChange,
        mode: 'date',
        is24Hour: true,
      });
    } else {
      setShowDate(true);
    }
  };

  const showTimePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        onChange: handleTimeChange,
        mode: 'time',
        is24Hour: true,
      });
    } else {
      setShowTime(true);
    }
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

  const handleSubmit = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) return Alert.alert('Sessão inválida', 'Faça login novamente.');
    if (!title.trim() || !description.trim()) return Alert.alert('Atenção', 'Título e descrição são obrigatórios.');

    const pad = (n: number) => n.toString().padStart(2, '0');
    const isoDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
      `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

    const form = new FormData();
    form.append('title', title);
    form.append('description', description);
    form.append('eventDate', isoDate);
    form.append('quantity', quantity || '0');
    form.append('price', price || '0');
    if (imageFile) {
      form.append('imageFile', {
        uri: imageFile.uri,
        type: imageFile.type || 'image/jpeg',
        name: imageFile.fileName || 'file.jpg',
      } as any);
    }

    try {
      const res = await fetch(`${baseUrl}/ticket`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: form,
      });

      if (!res.ok) {
        const errBody = await res.text();
        return Alert.alert('Erro', `Status ${res.status}\n${errBody}`);
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

      Alert.alert('Sucesso', `Evento criado! ID: ${json.id}`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      Alert.alert('Erro Exceção', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Título</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Nome do evento" />

        <Text style={styles.label}>Descrição</Text>
        <TextInput style={[styles.input, { height: 100 }]} value={description} onChangeText={setDescription} placeholder="Detalhes do evento" multiline />

        <Text style={styles.label}>Data e hora</Text>
        <Pressable onPress={showDatePicker} style={styles.dateButton}>
          <Text>Selecionar data: {date.toLocaleDateString()}</Text>
        </Pressable>
        <Pressable onPress={showTimePicker} style={styles.dateButton}>
          <Text>Selecionar hora: {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </Pressable>
        <Text style={styles.label}>Selecionado: {localDateString}</Text>

        {showDate && (
          <DateTimePicker value={date} mode="date" display="default" onChange={handleDateChange} />
        )}
        {showTime && (
          <DateTimePicker value={date} mode="time" display="default" onChange={handleTimeChange} />
        )}

        <Text style={styles.label}>Quantidade</Text>
        <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} placeholder="0" keyboardType="number-pad" />

        <Text style={styles.label}>Preço (R$)</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="0" keyboardType="decimal-pad" />

        <Text style={styles.label}>Imagem do evento</Text>
        <View style={styles.imagePickerContainer}>
          <Pressable style={styles.imageButton} onPress={pickImage}>
            <Text style={styles.imageButtonText}>{imageFile ? 'Trocar Imagem' : 'Escolher Imagem'}</Text>
          </Pressable>
          {imageFile && <Image source={{ uri: imageFile.uri }} style={styles.preview} />}
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
    marginTop: 8,
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
});
