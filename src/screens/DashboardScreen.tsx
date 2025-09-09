// src/screens/DashboardScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons          from 'react-native-vector-icons/MaterialIcons';
import AwesomeAlert from 'react-native-awesome-alerts';
import { Event } from '../types/Event';
import { baseUrl } from '../config/api';
import { SafeLayout } from '../components/SafeLayout';
import { Header } from '../components/Header';
import { TabBar } from '../components/TabBar';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface EventRaw {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  imageUrl: string | null;
  quantity: number;
  price: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  sold: number;
}

export default function DashboardScreen({ navigation }: any) {
  type TabName = 'Home' | 'Search' | 'Tickets' | 'Profile';
  const [activeTab, setActiveTab] = useState<TabName>('Home');
  const isConnected = useNetworkStatus();

  // --- Autenticação simplificada via AsyncStorage "userRole" ---
  const [isLogged, setIsLogged] = useState(false);
  // "ADMIN" | "USER" | null
  const [userRole, setUserRole] = useState<'ADMIN' | 'USER' | null>(null);

  // Carregando dados iniciais
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);

  // Estados de eventos
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [nextEvents, setNextEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);

  // Busca
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Estados do AwesomeAlert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(true);
  const [onConfirmAction, setOnConfirmAction] = useState<() => void>(() => () => {});

  const showAlert = useCallback((
    title: string,
    message: string,
    success: boolean = true,
    onConfirm: () => void = () => {}
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setIsSuccess(success);
    setOnConfirmAction(() => onConfirm);
    setAlertVisible(true);
  }, []);

  const handleOfflineAlert = useCallback((tab: string) => {
    const tabNames: { [key: string]: string } = {
      Search: 'buscar eventos',
      Profile: 'acessar o perfil',
    };

    showAlert(
      'Sem Conexão',
      `Você precisa estar conectado à internet para ${tabNames[tab] || 'esta funcionalidade'}.`,
      false,
      () => {
        // Se não estiver logado, mostra segunda opção para login
        if (!isLogged) {
          showAlert(
            'Fazer Login',
            'Deseja fazer login agora?',
            true,
            () => navigation.navigate('Login')
          );
        }
      }
    );
  }, [showAlert, isLogged, navigation]);

  const handleLogout = useCallback(async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (accessToken) {
        await fetch(`${baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }
    } catch (err) {
      console.warn('Erro no logout remoto:', err);
    } finally {
      // limpa tudo local
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userRole']);
      // simplesmente atualiza o estado para "deslogado"
      setIsLogged(false);
      setUserRole(null);
      // opcional: voltar para a tab Home
      setActiveTab('Home');
    }
  }, []);

  /**
   * Lê o "userRole" do AsyncStorage e atualiza isLogged / userRole.
   */
  const loadUserRole = useCallback(async () => {
    try {
      const role = await AsyncStorage.getItem('userRole');
      if (role === 'ADMIN' || role === 'USER') {
        setUserRole(role);
        setIsLogged(true);
      } else {
        setUserRole(null);
        setIsLogged(false);
      }
    } catch (err) {
      console.warn('Erro ao ler userRole do AsyncStorage', err);
      setUserRole(null);
      setIsLogged(false);
    }
  }, []);

  /**
   * Busca sempre os eventos, mesmo sem login.
   */
  const fetchEventsFromBackend = useCallback(async () => {
    try {
      setLoadingEvents(true);

      const accessToken = await AsyncStorage.getItem('accessToken');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) {headers.Authorization = `Bearer ${accessToken}`;}

      const res = await fetch(`${baseUrl}/ticket?showInactive=false`, {
        method: 'GET',
        headers,
      });
      if (!res.ok) {
        console.warn('Erro ao buscar tickets:', res.status);
        setFeaturedEvents([]);
        setNextEvents([]);
        setAllEvents([]);
        return;
      }

      const rawData = (await res.json()) as EventRaw[];
      const mapped: Event[] = rawData.map(e => {
        const fullImageUrl = e.imageUrl
          ? e.imageUrl.startsWith('http')
            ? e.imageUrl
            : `${baseUrl}/${e.imageUrl}`
          : undefined;
        return {
          id: e.id,
          title: e.title,
          date: e.eventDate,
          imageUrl: fullImageUrl,
        };
      });

      // Ordena eventos por data (mais próximos primeiro)
      const sortedEvents = mapped.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });

      setAllEvents(sortedEvents);
      if (sortedEvents.length === 0) {
        setFeaturedEvents([]);
        setNextEvents([]);
      } else {
        setFeaturedEvents([sortedEvents[0]]);
        setNextEvents(sortedEvents.slice(1));
      }
    } catch (error) {
      console.warn('Erro fetchEvents:', error);
      setFeaturedEvents([]);
      setNextEvents([]);
      setAllEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Quando a tela monta ou volta ao foco:
  // 1) Carrega userRole / isLogged
  // 2) Carrega eventos
  useEffect(() => {
    let isActive = true;

    async function initialize() {
      await loadUserRole();
      if (!isActive) {return;}
      await fetchEventsFromBackend();
    }

    const unsubscribeFocus = navigation.addListener('focus', initialize);
    initialize();

    return () => {
      isActive = false;
      unsubscribeFocus();
    };
  }, [navigation, loadUserRole, fetchEventsFromBackend]);

  /* Tratamento ao clicar em "Perfil/Admin"*/
  const onProfileOrAdminPress = useCallback(() => {
    if (!isLogged) {
      navigation.navigate('Login');
    } else {
      navigation.navigate('ProfileEdit');
    }
    setActiveTab('Profile');
  }, [isLogged, navigation]);

  const handleTabPress = (tabName: string) => {
    const tab = tabName as TabName;
    switch (tab) {
      case 'Search':
        setActiveTab('Search');
        break;

      case 'Tickets':
        // Permite acesso à tela de ingressos mesmo deslogado
        // A tela MyTicketsScreen mostrará apenas ingressos salvos localmente
        navigation.navigate('MyTickets');
        setActiveTab('Tickets');
        break;

      case 'Profile':
        onProfileOrAdminPress();
        break;

      default:
        setActiveTab('Home');
    }
  };

  // Spinner enquanto carrega eventos
  if (loadingEvents) {
    return (
      <SafeLayout showTabBar={true}>
        <Header
          showLogo={true}
          isLogged={isLogged}
          userRole={userRole}
          onLogout={handleLogout}
          navigation={navigation}
        />
        <View style={[styles.centeredContainer, styles.fullFlex]}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
        <TabBar
          activeTab="Home"
          onTabPress={handleTabPress}
          isLogged={isLogged}
          userRole={userRole}
          isConnected={isConnected}
          onOfflineAlert={handleOfflineAlert}
        />
      </SafeLayout>
    );
  }

  // Filtra eventos pela busca
  const filteredEvents = allEvents.filter(ev =>
    ev.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const goToPurchase = (ticketId: string, title: string) => {
    navigation.navigate('EventDetail', { ticketId, title });
  };

  return (
     <SafeLayout showTabBar={true}>
      <AwesomeAlert
        show={alertVisible}
        title={alertTitle}
        message={alertMessage}
        showCancelButton={false}
        showConfirmButton
        confirmText="OK"
        confirmButtonColor={isSuccess ? '#4CAF50' : '#F44336'}
        closeOnTouchOutside
        closeOnHardwareBackPress
        onConfirmPressed={() => {
          setAlertVisible(false);
          onConfirmAction();
        }}
      />
      <Header
        showLogo={true}
        isLogged={isLogged}
        userRole={userRole}
        onLogout={handleLogout}
        navigation={navigation}
      />

      {/* ============ Conteúdo das abas ============ */}
      {activeTab === 'Search' ? (
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.searchHeader}>
            <MaterialIcons name="search" size={24} color="#90b1db" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar por nome..."
              autoFocus
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>
          <ScrollView
            contentContainerStyle={styles.searchContainer}
            showsVerticalScrollIndicator={false}
          >
            {filteredEvents.length > 0 ? (
              filteredEvents.map(event => (
                <Pressable
                  key={event.id}
                  style={styles.searchCard}
                  onPress={() => goToPurchase(event.id, event.title)}
                >
                  {event.imageUrl && (
                    <Image source={{ uri: event.imageUrl }} style={styles.searchImage} />
                  )}
                  <View style={styles.searchTextContainer}>
                    <Text style={styles.searchTitleText}>{event.title}</Text>
                    <Text style={styles.searchDateText}>
                      {formatDateToLabel(event.date)}
                    </Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <Text style={styles.noResultsText}>Nenhum evento encontrado.</Text>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* ===== Evento em Destaque ===== */}
          <Text style={styles.sectionTitle}>Evento em Destaque</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.horizontalList,
              featuredEvents.length === 1 && styles.singleItemContainer,
            ]}
          >
            {featuredEvents.length > 0 ? (
              featuredEvents.map(event => (
                <Pressable
                  key={event.id}
                  style={styles.featureCard}
                  onPress={() => goToPurchase(event.id, event.title)}
                >
                  {event.imageUrl && (
                    <Image source={{ uri: event.imageUrl }} style={styles.featureImage} />
                  )}
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.featureTitle}>{event.title}</Text>
                    <Text style={styles.featureDate}>{formatDateToLabel(event.date)}</Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <Text style={styles.noneText}>Nenhum evento em destaque.</Text>
            )}
          </ScrollView>

          {/* ===== Próximos Eventos ===== */}
          <Text style={styles.sectionTitle}>Próximos Eventos</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.horizontalList,
              nextEvents.length === 1 && styles.singleItemContainer,
            ]}
          >
            {nextEvents.length > 0 ? (
              nextEvents.map(event => (
                <Pressable
                  key={event.id}
                  style={styles.nextCard}
                  onPress={() => goToPurchase(event.id, event.title)}
                >
                  {event.imageUrl && (
                    <Image source={{ uri: event.imageUrl }} style={styles.nextImage} />
                  )}
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.nextTitle}>{event.title}</Text>
                    <Text style={styles.nextDate}>{formatDateToLabel(event.date)}</Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <Text style={styles.noneText}>Nenhum próximo evento.</Text>
            )}
          </ScrollView>
        </ScrollView>
      )}

      <TabBar
        activeTab={activeTab}
        onTabPress={handleTabPress}
        isLogged={isLogged}
        userRole={userRole}
        isConnected={isConnected}
        onOfflineAlert={handleOfflineAlert}
      />
    </SafeLayout>
  );
}

// Formata "2025-06-14T19:00:00.000Z" em "14 jun 2025, 19h"
function formatDateToLabel(eventDate: string): string {
  try {
    const data = new Date(eventDate);
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = data.toLocaleDateString('pt-BR', { month: 'short' });
    const ano = data.getFullYear();
    const hora = data.getHours().toString().padStart(2, '0');
    return `${dia} ${mes} ${ano}, ${hora}h`;
  } catch {
    return eventDate;
  }
}

const styles = StyleSheet.create({
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  content: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginTop: 20,
    marginBottom: 12,
  },
  horizontalList: {
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  singleItemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  featureCard: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  cardTextContainer: {
    padding: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  featureDate: {
    fontSize: 14,
    color: '#8e8e93',
  },
  nextCard: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  nextImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  nextTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1c1c1e',
    marginBottom: 2,
  },
  nextDate: {
    fontSize: 12,
    color: '#8e8e93',
  },
  noneText: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
  centeredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullFlex: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
  },
  searchCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchImage: {
    width: 80,
    height: 80,
    resizeMode: 'cover',
  },
  searchTextContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  searchTitleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  searchDateText: {
    fontSize: 14,
    color: '#8e8e93',
  },
  noResultsText: {
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
  },
});
