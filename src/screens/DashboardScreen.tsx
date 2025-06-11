// src/screens/DashboardScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons          from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Event } from '../types';
import { baseUrl } from '../config/api';


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

/** ----------------------
 *   FUNÇÃO DE LOGOUT
 *  ----------------------
 */
async function handleLogout(navigation: any) {
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
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userRole']);
    navigation.replace('Login');
  } catch (error) {
    console.warn('Erro ao tentar deslogar:', error);
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userRole']);
    navigation.replace('Login');
  }
}

export default function DashboardScreen({ navigation }: any) {
  type TabName = 'Home' | 'Search' | 'Tickets' | 'Profile';
  const [activeTab, setActiveTab] = useState<TabName>('Home');

  // --- Autenticação simplificada via AsyncStorage “userRole” ---
  const [isLogged, setIsLogged] = useState(false);
  // “ADMIN” | “USER” | null
  const [userRole, setUserRole] = useState<'ADMIN' | 'USER' | null>(null);

  // Carregando dados iniciais
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);

  // Estados de eventos
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [nextEvents, setNextEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);

  // Busca
  const [searchQuery, setSearchQuery] = useState<string>('');

  /**
   * Lê o “userRole” do AsyncStorage e atualiza isLogged / userRole.
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
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

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

      setAllEvents(mapped);
      if (mapped.length === 0) {
        setFeaturedEvents([]);
        setNextEvents([]);
      } else {
        setFeaturedEvents([mapped[0]]);
        setNextEvents(mapped.slice(1));
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
      if (!isActive) return;
      await fetchEventsFromBackend();
    }

    const unsubscribeFocus = navigation.addListener('focus', initialize);
    initialize();

    return () => {
      isActive = false;
      unsubscribeFocus();
    };
  }, [navigation, loadUserRole, fetchEventsFromBackend]);

  /**
   * Tratamento ao clicar em “Perfil/Admin”:
   */
// src/screens/DashboardScreen.tsx

const onProfileOrAdminPress = useCallback(() => {
    if (!isLogged) {
      navigation.navigate('Login');
    } else {
      navigation.navigate('ProfileEdit');
    }
    setActiveTab('Profile');
  }, [isLogged, navigation]);



  /**
   * Ao clicar nas abas:
   * - “Tickets” exige login
   * - “Profile/Admin” chama onProfileOrAdminPress()
   */
  const handleTabPress = (tabName: TabName) => {
    switch (tabName) {
      case 'Search':
        setActiveTab('Search');
        break;

      case 'Tickets':
        if (!isLogged) {
          Alert.alert('Atenção', 'Faça login para ver os ingressos.');
          return;
        }
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
      <SafeAreaView style={styles.safe}>
        <View style={[styles.centeredContainer, { flex: 1 }]}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  // Filtra eventos pela busca
  const filteredEvents = allEvents.filter(ev =>
    ev.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  /**
   * Ao tocar em cima de um evento, navega para a tela de compra.
   * Passamos o ticketId (event.id) e o title (para exibir opcionalmente) como params.
   */
  const goToPurchase = (ticketId: string, title: string) => {
    navigation.navigate('EventDetail', { ticketId, title });
  };
/*
  // 1) Função para dar refresh no accessToken
  const refreshAccessToken = async (): Promise<string | null> => {
    const old = await AsyncStorage.getItem('accessToken');
    const refresh = await AsyncStorage.getItem('refreshToken');
    if (!old || !refresh) return null;
    const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
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
      if (js.refreshToken) await AsyncStorage.setItem('refreshToken', js.refreshToken);
      return js.accessToken;
    }
    return null;
  };
*/
  /**
   * Função para ativar/desativar evento.
   * (Comentada pois não está sendo usada atualmente)
   */
  /*
  // 2) Função para ativar/desativar evento
  const toggleActive = async (id: string, isActive: boolean) => {
    // tenta refresh antes de tudo
    let token = (await refreshAccessToken()) || (await AsyncStorage.getItem('accessToken'));
    if (!token) return Alert.alert('Sessão inválida', 'Faça login novamente.');
    // dispara o POST
    let res = await fetch(`${BASE_URL}/ticket/enable-disable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, isActive }),
    });
    // se 401, refresh e retry
    if (res.status === 401) {
      token = (await refreshAccessToken()) || token;
      res = await fetch(`${BASE_URL}/ticket/enable-disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, isActive }),
      });
    }
    if (!res.ok) {
      const txt = await res.text();
      return Alert.alert('Erro', `Status ${res.status}\n${txt}`);
    }
    // recarrega
    await fetchEventsFromBackend();
  };*/



  return (
    <SafeAreaView style={styles.safe}>
      {/* ================== Header ================== */}
     <View style={styles.header}>
  {isLogged && userRole === 'ADMIN' ? (
    <View style={styles.adminButtons}>
      <Pressable
        onPress={() => navigation.navigate('CreateEvent')}
        style={styles.iconButton}
      >
           <MaterialIcons name="add" size={28} color="#007AFF" />
      </Pressable>
      <Pressable
        onPress={() => navigation.navigate('AdminEvents')}
        style={styles.iconButton}
      >
        <MaterialIcons name="event" size={24} color="#007AFF" />
      </Pressable>
       <Pressable
        onPress={() => navigation.navigate('Scanner')}
        style={styles.iconButton}
      >
    <MaterialCommunityIcons name="qrcode-scan" size={24} color="#007AFF" />
      </Pressable>
    </View>
  ) : (
    <View style={styles.menuButtonPlaceholder} />
  )}

  <View style={styles.logoWrapper}>
    <Image source={require('../assets/apae_logo.png')} style={styles.logo} />
  </View>

  {isLogged && (
    <Pressable onPress={() => handleLogout(navigation)} style={styles.logoutButton}>
      <MaterialCommunityIcons name="logout" size={24} color="#E74C3C" />
    </Pressable>
  )}
</View>

      {/* ============ Conteúdo das abas ============ */}
      {activeTab === 'Search' ? (
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.searchHeader}>
            <MaterialIcons name="search" size={24} color="#666" style={{ marginRight: 8 }} />
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
            contentContainerStyle={styles.horizontalList}
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
            contentContainerStyle={styles.horizontalList}
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

      {/* ================== Tab Bar ================== */}
      <View style={styles.tabBar}>
        {/* Home */}
        <Pressable onPress={() => handleTabPress('Home')} style={styles.tabItem}>
          <MaterialIcons
            name="home"
            size={26}
            color={activeTab === 'Home' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.tabLabel, activeTab === 'Home' && styles.tabLabelActive]}>
            Home
          </Text>
        </Pressable>

        {/* Busca */}
        <Pressable onPress={() => handleTabPress('Search')} style={styles.tabItem}>
          <MaterialIcons
            name="search"
            size={26}
            color={activeTab === 'Search' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.tabLabel, activeTab === 'Search' && styles.tabLabelActive]}>
            Busca
          </Text>
        </Pressable>

        {/* Ingressos */}
        <Pressable onPress={() => handleTabPress('Tickets')} style={styles.tabItem}>
          <MaterialCommunityIcons
            name="ticket-outline"
            size={26}
            color={activeTab === 'Tickets' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.tabLabel, activeTab === 'Tickets' && styles.tabLabelActive]}>
            Ingressos
          </Text>
        </Pressable>

        {/* Conta / Perfil / Admin */}
        <Pressable onPress={() => handleTabPress('Profile')} style={styles.tabItem}>
          {isLogged ? (
            userRole === 'ADMIN' ? (
              // ADMIN: ícone shield-account + label “Admin”
              <MaterialCommunityIcons
                name="shield-account"
                size={28}
                color={activeTab === 'Profile' ? '#007AFF' : '#666'}
              />
            ) : (
              // USER: ícone account-circle + label “Perfil”
              <MaterialIcons
                name="account-circle"
                size={28}
                color={activeTab === 'Profile' ? '#007AFF' : '#666'}
              />
            )
          ) : (
            // Não logado: ícone person + label “Conta”
            <MaterialIcons
              name="person"
              size={28}
              color={activeTab === 'Profile' ? '#007AFF' : '#666'}
            />
          )}
          <Text style={[styles.tabLabel, activeTab === 'Profile' && styles.tabLabelActive]}>
            {isLogged
              ? userRole === 'ADMIN'
                ? 'Admin'
                : 'Perfil'
              : 'Conta'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// Formata “2025-06-14T19:00:00.000Z” em “14 jun, 19h”
function formatDateToLabel(isoString: string): string {
  try {
    const dateObj = new Date(isoString);
    const day = dateObj.getDate();
    const monthNames = [
      'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
      'jul', 'ago', 'set', 'out', 'nov', 'dez',
    ];
    const month = monthNames[dateObj.getMonth()];
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    return `${day} ${month}, ${hours}h${minutes !== '00' ? minutes : ''}`;
  } catch {
    return isoString;
  }
}

const { width } = Dimensions.get('window');
const cardWidth = width * 0.75;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  // centraliza o logo
  logoWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 100,
    resizeMode: 'contain',
  },
  menuButtonPlaceholder: {
    width: 32, // espaço fixo à esquerda para manter logo centralizado
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 16,
    alignItems: 'center',
  },

  // ====== Busca ======
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f2f2f7',
    paddingHorizontal: 12,
    fontSize: 14,
  },
  searchContainer: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  searchCard: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  searchImage: {
    width: 80,
    height: 80,
  },
  searchTextContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  searchTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  searchDateText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  noResultsText: {
    marginTop: 20,
    color: '#666',
    alignSelf: 'center',
  },

  // ====== Home ======
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 20,
    marginLeft: 16,
  },
  noneText: {
    marginLeft: 16,
    color: '#666',
  },
  horizontalList: {
    paddingLeft: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  featureCard: {
    width: cardWidth,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  featureImage: {
    width: '100%',
    height: cardWidth * 0.55,
  },
  cardTextContainer: {
    padding: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  featureDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  nextCard: {
    width: cardWidth * 0.8,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  nextImage: {
    width: '100%',
    height: (cardWidth * 0.8) * 0.55,
  },
  nextTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  nextDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  // ====== Tab Bar ======
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 64,
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    marginTop: 2,
    fontSize: 12,
    color: '#666',
  },
  tabLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  centeredContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
  paddingHorizontal: 12,
  paddingVertical: 6,
},
searchInfo: {
  flex: 1,
},
toggleButton: {
  marginTop: 8,
  paddingVertical: 6,
  paddingHorizontal: 12,
  backgroundColor: '#E74C3C',
  borderRadius: 6,
},
toggleText: {
  color: '#fff',
  fontWeight: '600',
},
adminButtons: {
  alignItems: 'center',
},
iconButton: {
  marginHorizontal: 8,
  padding: 4,
},


});
