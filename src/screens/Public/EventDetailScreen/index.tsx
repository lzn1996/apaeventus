// src/screens/Public/EventDetailScreen/index.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types/navigation';
import AwesomeAlert from 'react-native-awesome-alerts';
import styles from './styles';
import { getTicketById } from '../../../services/eventService';
import { authService } from '../../../services/authService';
import eventBanner from '../../../assets/event-banner.png';
import { SafeLayout } from '../../../components/SafeLayout';
import { Header } from '../../../components/Header';
import { TabBar } from '../../../components/TabBar';

declare module '*.png';

export default function EventDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'EventDetail'>>();
  const route = useRoute();
  const { ticketId } = route.params as { ticketId: string };

  const [event, setEvent] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isLogged] = useState(true);
  const [userRole] = useState<'ADMIN' | 'USER' | null>('USER');

  // AwesomeAlert states
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(true);
  const [onConfirmAction, setOnConfirmAction] = useState<() => void>(() => () => {});

  // error/loading for image
  const [imageError, setImageError] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(16 / 9);

  const handleTabPress = (tab: string) => {
    switch (tab) {
      case 'Home':
        navigation.navigate('EventDetail' as never);
        break;
      case 'Tickets':
        navigation.navigate('MyTickets' as never);
        break;
      case 'Profile':
        navigation.navigate('EventDetail' as never);
        break;
    }
  };

  // helper to show awesome alerts
  function showAlert(
    title: string,
    message: string,
    success = true,
    onConfirm: () => void = () => {}
  ) {
    setAlertTitle(title);
    setAlertMessage(message);
    setIsSuccess(success);
    setOnConfirmAction(() => onConfirm);
    setAlertVisible(true);
  }

  useEffect(() => {
    async function loadEvent() {
      try {
        const data = await getTicketById(ticketId);
        setEvent(data);
      } catch (e) {
        showAlert(
          'Erro',
          'Não foi possível carregar o evento.',
          false,
          () => navigation.goBack()
        );
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [ticketId, navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Carregando evento...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Evento não encontrado.</Text>
      </View>
    );
  }

  const handleBuy = async () => {
    let userIsLogged = await authService.isLoggedIn();
    let token = await authService.getAccessToken();

    // tenta refresh se tiver token mas não estiver marcado como logado
    if (!userIsLogged && token) {
      try {
        await require('../../../services/api').default.get('/user/profile');
        userIsLogged = await authService.isLoggedIn();
        token = await authService.getAccessToken();
      } catch {}
    }

    if (!userIsLogged) {
      // limpa sessão e avisa
      try {
        const baseUrl = require('../../../config/api').baseUrl;
        const tk = await authService.getAccessToken();
        if (tk) {
          await fetch(`${baseUrl}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` },
          });
        }
        await authService.clearTokens();
      } catch {}
      showAlert(
        'Atenção',
        'É necessário estar logado para comprar ingressos.',
        false,
        () => navigation.goBack()
      );
      return;
    }

    navigation.navigate('Purchase', {
      ticketId: event.id,
      eventTitle: event.title,
      price: event.price,
      maxQuantity: 5,
      quantity,
    });
  };

  return (
    <SafeLayout showTabBar={true}>
      {/* AwesomeAlert */}
      <AwesomeAlert
        show={alertVisible}
        title={alertTitle}
        message={alertMessage}
        closeOnTouchOutside
        closeOnHardwareBackPress
        showCancelButton={false}
        showConfirmButton
        confirmText="OK"
        confirmButtonColor={isSuccess ? '#4CAF50' : '#F44336'}
        onConfirmPressed={() => {
          setAlertVisible(false);
          onConfirmAction();
        }}
      />

      <Header
        title="Detalhes do Evento"
      />

      <ScrollView contentContainerStyle={styles.container} alwaysBounceVertical>
        {/* Banner */}
        <Image
          source={imageError || !event.imageUrl ? eventBanner : { uri: event.imageUrl }}
          style={[styles.banner, { aspectRatio }]}
          resizeMode="contain"
          onError={() => setImageError(true)}
          onLoad={(e) => {
            const { width, height } = e.nativeEvent.source || {};
            if (width && height) {
              setAspectRatio(width / height);
            }
          }}
        />

        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={16} color="#555" />
          <Text style={styles.dateText}>
            {new Date(event.eventDate).toLocaleString('pt-BR', {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </Text>
        </View>

        <View style={styles.priceBox}>
          <Text style={styles.price}>R${Number(event.price).toFixed(2)}</Text>
          <View style={styles.counter}>
            <TouchableOpacity onPress={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity === 1}>
              <Text style={[styles.counterButton, quantity === 1 && styles.counterButtonDisabled]}>–</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{quantity}</Text>
            <TouchableOpacity onPress={() => setQuantity(q => Math.min(5, q + 1))} disabled={quantity === 5}>
              <Text style={[styles.counterButton, quantity === 5 && styles.counterButtonDisabled]}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.total}>Total: R${(Number(event.price) * quantity).toFixed(2)}</Text>
        </View>

        <TouchableOpacity style={styles.buyButton} onPress={handleBuy}>
          <Text style={styles.buyButtonText}>Comprar</Text>
        </TouchableOpacity>

        <View style={styles.descriptionBox}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>

        <Text style={styles.address}>
          Rua Jacob Audi, 132{'\n'}
          Penha do Rio do Peixe - Itapira - SP{'\n'}
          (19) 3813-8899
        </Text>
      </ScrollView>

      <TabBar
        activeTab="Home"
        onTabPress={handleTabPress}
        isLogged={isLogged}
        userRole={userRole}
      />
    </SafeLayout>
  );
}
