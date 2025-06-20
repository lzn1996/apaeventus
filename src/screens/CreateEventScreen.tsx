// src/screens/CreateEventScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Image,
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import AwesomeAlert from 'react-native-awesome-alerts';
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
  const [loading, setLoading] = useState(false);

  // estados do AwesomeAlert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(true);

  const showAlert = (alertTitleParam: string, message: string, success = true) => {
    setAlertTitle(alertTitleParam);
    setAlertMessage(message);
    setIsSuccess(success);
    setAlertVisible(true);
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

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
    if (Platform.OS !== 'android') {return true;}
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
      return showAlert('Permissão negada', 'Não foi possível acessar a galeria.', false);
    }
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, resp => {
      if (resp.didCancel) {return;}
      if (resp.errorMessage) {return showAlert('Erro', resp.errorMessage, false);}
      if (resp.assets?.[0]) {setImageFile(resp.assets[0]);}
    });
  };

  const handleSubmit = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      return showAlert('Sessão inválida', 'Faça login novamente.', false);
    }
    if (!title.trim() || !description.trim()) {
      return showAlert('Atenção', 'Título e descrição são obrigatórios.', false);
    }

    const isoDate =
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
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
      setLoading(true);
      const res = await fetch(`${baseUrl}/ticket`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!res.ok) {
        const errBody = await res.text();
        return showAlert('Erro', `Status ${res.status}\n${errBody}`, false);
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

      showAlert('Sucesso', `Evento criado! ID: ${json.id}`, true);
    } catch (e: any) {
      showAlert('Erro Exceção', e.message, false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Criar Novo Evento</Text>

        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Nome do evento"
        />

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Detalhes do evento"
          multiline
        />

        <Text style={styles.label}>Data e hora</Text>
        <View style={styles.rowButtons}>
          <Pressable onPress={showDatePicker} style={styles.dateButton}>
            <Text>📅 {date.toLocaleDateString()}</Text>
          </Pressable>
          <Pressable onPress={showTimePicker} style={styles.dateButton}>
            <Text>🕒 {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </Pressable>
        </View>

        {showDate && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
        {showTime && (
          <DateTimePicker
            value={date}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}

        <Text style={styles.label}>Quantidade de Ingressos</Text>
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
          {imageFile && <Image source={{ uri: imageFile.uri }} style={styles.preview} />}
        </View>

        <Pressable
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>Criar Evento</Text>
          }
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Dashboard')} style={({ pressed }) => [styles.buttonBack, pressed && styles.buttonBackPressed]}>
            <Text style={styles.buttonBackText}>Voltar</Text>
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
          if (isSuccess) {navigation.navigate('Dashboard');}
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 20 },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 12, color: '#111827' },
  label: { fontWeight: '600', marginTop: 16, color: '#374151' },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    marginRight: 8,
  },
  rowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  imagePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  imageButton: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 10,
  },
  imageButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  preview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginLeft: 12,
  },
  submitButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
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
