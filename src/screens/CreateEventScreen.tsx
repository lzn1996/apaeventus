// src/screens/CreateEventScreen.tsx
import React, {useState} from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import AwesomeAlert from 'react-native-awesome-alerts';
import {baseUrl} from '../config/api';
import api from '../services/api';
import {SafeLayout} from '../components/SafeLayout';
import {Header} from '../components/Header';
import {TabBar} from '../components/TabBar';
import {useNavigation} from '@react-navigation/native';

export default function CreateEventScreen() {
  const navigation = useNavigation();
  const [isLogged] = useState(true);
  const [userRole] = useState<'ADMIN' | 'USER' | null>('ADMIN');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Inicializa com 1 dia à frente da data atual
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);

  // estados do AwesomeAlert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(true);

  const showAlert = (msgTitle: string, message: string, success = true) => {
    setAlertTitle(msgTitle);
    setAlertMessage(message);
    setIsSuccess(success);
    setAlertVisible(true);
  };

  const handleTabPress = (tab: string) => {
    switch (tab) {
      case 'Home':
        navigation.navigate('Dashboard' as never);
        break;
      case 'Search':
        navigation.navigate('Dashboard' as never);
        break;
      case 'Tickets':
        navigation.navigate('MyTickets' as never);
        break;
      case 'Profile':
        navigation.navigate('ProfileEdit' as never);
        break;
    }
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  const handleDateChange = (_: any, sel?: Date) => {
    setShowDate(false);
    if (sel) {
      const minimumDate = new Date();
      minimumDate.setDate(minimumDate.getDate() + 1);
      minimumDate.setHours(0, 0, 0, 0); // Zera horas para comparar apenas a data

      const selectedDate = new Date(sel);
      selectedDate.setHours(0, 0, 0, 0);

      // Só permite datas a partir de amanhã
      if (selectedDate >= minimumDate) {
        const updated = new Date(date);
        updated.setFullYear(sel.getFullYear());
        updated.setMonth(sel.getMonth());
        updated.setDate(sel.getDate());
        setDate(updated);
      } else {
        // Avisa o usuário que a data é inválida
        showAlert(
          'Data Inválida',
          'O evento deve ser criado com pelo menos 1 dia de antecedência. Por favor, selecione uma data a partir de amanhã.',
          false
        );
      }
    }
  };

  const handleTimeChange = (_: any, sel?: Date) => {
    setShowTime(false);
    if (sel) {
      const updated = new Date(date);
      updated.setHours(sel.getHours());
      updated.setMinutes(sel.getMinutes());

      const now = new Date();
      const minimumDate = new Date();
      minimumDate.setDate(minimumDate.getDate() + 1);

      // Se a data selecionada é exatamente amanhã, valida o horário
      const isNextDay = updated.toDateString() === minimumDate.toDateString();

      if (isNextDay) {
        // Se é o próximo dia, precisa ser pelo menos 24h a partir de agora
        const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        if (updated >= twentyFourHoursFromNow) {
          setDate(updated);
        } else {
          // Se o horário é muito cedo, ajusta para 24h + 5 minutos a partir de agora e avisa o usuário
          const validTime = new Date(twentyFourHoursFromNow.getTime() + 5 * 60 * 1000); // Adiciona 5 minutos
          const validTimeStr = validTime.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          });

          showAlert(
            'Horário Inválido',
            `O evento deve ser criado com pelo menos 24 horas de antecedência. O horário foi ajustado automaticamente para ${validTimeStr}.`,
            false
          );

          setDate(validTime);
        }
      } else {
        // Se é mais de um dia no futuro, pode ser qualquer horário
        setDate(updated);
      }
    }
  };

  const showDatePicker = () => {
    const minimumDate = new Date();
    minimumDate.setDate(minimumDate.getDate() + 1);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        onChange: handleDateChange,
        mode: 'date',
        is24Hour: true,
        minimumDate: minimumDate,
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

  const pickImageFromCamera = async () => {
    try {
      const {status} = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        return showAlert(
          'Permissão negada',
          'Precisamos de permissão para usar a câmera.',
          false,
        );
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images' as any,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageFile(result.assets[0]);
      }
    } catch (error) {
      console.log('Erro ao usar câmera:', error);
      showAlert('Erro', 'Não foi possível abrir a câmera.', false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Selecionar Imagem',
      'Como você gostaria de adicionar a imagem do evento?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Câmera',
          onPress: pickImageFromCamera,
        },
        {
          text: 'Galeria',
          onPress: pickImage,
        },
      ],
      {cancelable: true},
    );
  };

  const pickImage = async () => {
    try {
      // Verificar permissão primeiro
      const {status} = await ImagePicker.getMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        const {status: newStatus} =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (newStatus !== 'granted') {
          return showAlert(
            'Permissão negada',
            'Precisamos de permissão para acessar suas fotos.',
            false,
          );
        }
      }

      // Opções mais flexíveis
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images' as any,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        setImageFile(result.assets[0]);
      }
    } catch (error) {
      console.log('Erro ao selecionar imagem:', error);
      showAlert('Erro', 'Não foi possível abrir a galeria.', false);
    }
  };
  const handleSubmit = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      return showAlert('Sessão inválida', 'Faça login novamente.', false);
    }
    if (!title.trim() || !description.trim()) {
      return showAlert(
        'Atenção',
        'Título e descrição são obrigatórios.',
        false,
      );
    }

    const isoDate =
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate(),
      )}` +
      `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
        date.getSeconds(),
      )}`;

    try {
      setLoading(true);

      if (imageFile) {
        // Para upload com imagem, usar FormData
        const form = new FormData();
        form.append('title', title);
        form.append('description', description);
        form.append('eventDate', isoDate);
        form.append('quantity', quantity || '0');
        form.append('price', price || '0');

        // Estrutura correta para FormData com imagem no React Native
        const imageUri = Platform.OS === 'ios'
          ? imageFile.uri.replace('file://', '')
          : imageFile.uri;

        form.append('imageFile', {
          uri: imageUri,
          type: imageFile.mimeType || 'image/jpeg',
          name: imageFile.fileName || `event_image_${Date.now()}.jpg`,
        } as any);

        // Usar fetch para FormData com imagem (melhor compatibilidade)
        const response = await fetch(`${baseUrl}/ticket`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Não definir Content-Type para FormData - deixar o browser configurar
          },
          body: form,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Status ${response.status}: ${errorText}`);
        }

        await response.json();
        showAlert('Sucesso', 'Evento criado!', true);
      } else {
        // Para dados sem imagem, usar JSON
        await api.post('/ticket', {
          title,
          description,
          eventDate: isoDate,
          quantity: parseInt(quantity, 10) || 0,
          price: parseFloat(price) || 0,
        });

        showAlert('Sucesso', 'Evento criado!', true);
      }
    } catch (e: any) {
      console.error('Erro na requisição:', e);

      if (e.response) {
        // Erro da API
        console.error('Erro da API:', {
          status: e.response.status,
          data: e.response.data,
        });
        showAlert('Erro', `Status ${e.response.status}: ${e.response.data?.message || 'Erro desconhecido'}`, false);
      } else if (e.request) {
        // Erro de rede
        console.error('Erro de rede:', e.request);
        showAlert('Erro de Rede', 'Verifique sua conexão e tente novamente.', false);
      } else {
        // Outro erro
        showAlert('Erro Exceção', e.message, false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeLayout showTabBar={true}>
      <Header
        title="Criar Evento"
        isLogged={isLogged}
        userRole={userRole}
        navigation={navigation}
      />

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
            <Text>
              🕒{' '}
              {date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </Pressable>
        </View>

        {showDate && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={(() => {
              const minimumDate = new Date();
              minimumDate.setDate(minimumDate.getDate() + 1);
              return minimumDate;
            })()}
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
          <Pressable style={styles.imageButton} onPress={showImageOptions}>
            <Text style={styles.imageButtonText}>
              {imageFile ? 'Trocar Imagem' : 'Escolher Imagem'}
            </Text>
          </Pressable>
          {imageFile && (
            <Image source={{uri: imageFile.uri}} style={styles.preview} />
          )}
        </View>

        <Pressable
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Criar Evento</Text>
          )}
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
          if (isSuccess) {
            navigation.navigate('Dashboard' as never);
          }
        }}
      />

      <TabBar
        activeTab="Profile"
        onTabPress={handleTabPress}
        isLogged={isLogged}
        userRole={userRole}
      />
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  container: {padding: 20},
  heading: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827',
  },
  label: {fontWeight: '600', marginTop: 16, color: '#374151'},
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
});
