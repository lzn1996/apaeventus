// src/screens/AdminEventsScreen.tsx
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {baseUrl} from '../config/api';
import {SafeLayout} from '../components/SafeLayout';
import {Header} from '../components/Header';
import {TabBar} from '../components/TabBar';
import { authService } from '../services/authService';

export default function AdminEventsScreen() {
  const navigation = useNavigation();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLogged] = useState(true);
  const [userRole] = useState<'ADMIN' | 'USER' | null>('ADMIN');

  // Busca lista de eventos
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    let token = await AsyncStorage.getItem('accessToken');
    let res = await fetch(`${baseUrl}/ticket?showInactive=true`, {
      headers: {Authorization: `Bearer ${token}`},
    });

    // se token expirou, tenta renovar e refazer fetch
    if (res.status === 401) {
      const newToken = await authService.refreshAccessToken();
      if (!newToken) {
        setLoading(false);
        return Alert.alert('Sessão expirada', 'Faça login novamente.');
      }
      token = newToken;
      res = await fetch(`${baseUrl}/ticket?showInactive=true`, {
        headers: {Authorization: `Bearer ${token}`},
      });
    }

    if (!res.ok) {
      const txt = await res.text();
      setLoading(false);
      return Alert.alert(
        'Erro ao buscar eventos',
        `Status ${res.status}\n${txt}`,
      );
    }

    const data = await res.json();
    setEvents(data);
    setLoading(false);
  }, []);

  // Alterna ativo/inativo
  const toggleActive = async (id: string, isActive: boolean) => {
    let token = await AsyncStorage.getItem('accessToken');
    let res = await fetch(`${baseUrl}/ticket/enable-disable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({id, isActive}),
    });

    if (res.status === 401) {
      const newToken = await authService.refreshAccessToken();
      if (!newToken) {
        return Alert.alert('Sessão expirada', 'Faça login novamente.');
      }
      token = newToken;
      res = await fetch(`${baseUrl}/ticket/enable-disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({id, isActive}),
      });
    }

    if (!res.ok) {
      const txt = await res.text();
      return Alert.alert('Erro', `Status ${res.status}\n${txt}`);
    }
    fetchEvents();
  };

  // Exclui permanentemente
  const deleteTicket = (id: string) => {
    Alert.alert(
      'Excluir Evento',
      'Tem certeza que deseja excluir este evento permanentemente?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            let token = await AsyncStorage.getItem('accessToken');
            let res = await fetch(`${baseUrl}/ticket/${id}`, {
              method: 'DELETE',
              headers: {Authorization: `Bearer ${token}`},
            });
            if (res.status === 401) {
              const newToken = await authService.refreshAccessToken();
              if (!newToken) {
                return Alert.alert('Sessão expirada', 'Faça login novamente.');
              }
              token = newToken;
              res = await fetch(`${baseUrl}/ticket/${id}`, {
                method: 'DELETE',
                headers: {Authorization: `Bearer ${token}`},
              });
            }
            if (!res.ok) {
              const txt = await res.text();
              return Alert.alert(
                'Erro ao excluir',
                `Status ${res.status}\n${txt}`,
              );
            }
            Alert.alert('Sucesso', 'Evento excluído.', [
              {text: 'OK', onPress: fetchEvents},
            ]);
          },
        },
      ],
    );
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

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        await fetch(`${baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {Authorization: `Bearer ${token}`},
        });
      }
    } catch (e) {
      console.warn('Erro no logout:', e);
    } finally {
      await AsyncStorage.multiRemove([
        'accessToken',
        'refreshToken',
        'userRole',
      ]);
      navigation.navigate('Login' as never);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  if (loading) {
    return (
      <SafeLayout showTabBar={true}>
        <Header
          title="Gerenciar Eventos"
          isLogged={isLogged}
          userRole={userRole}
          onLogout={handleLogout}
          navigation={navigation}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
        <TabBar
          activeTab="Profile"
          onTabPress={handleTabPress}
          isLogged={isLogged}
          userRole={userRole}
        />
      </SafeLayout>
    );
  }

  return (
    <SafeLayout showTabBar={true}>
      <Header
        title="Gerenciar Eventos"
        isLogged={isLogged}
        userRole={userRole}
        onLogout={handleLogout}
        navigation={navigation}
      />

      <FlatList
        data={events}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({item}) => (
          <View style={styles.card}>
            {item.imageUrl && (
              <Image source={{uri: item.imageUrl}} style={styles.image} />
            )}
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                {item.title}
              </Text>
              <Text style={styles.date}>
                📅{' '}
                {new Date(item.eventDate).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                })}
              </Text>
              <Text style={styles.time}>
                🕒{' '}
                {new Date(item.eventDate).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <View style={styles.buttons}>
              <Pressable
                android_ripple={{color: '#EEE'}}
                style={({pressed}) => [
                  styles.toggleButton,
                  item.isActive ? styles.btnDeactivate : styles.btnActivate,
                  pressed && styles.pressed,
                ]}
                onPress={() => toggleActive(item.id, !item.isActive)}>
                <Text style={styles.toggleText}>
                  {item.isActive ? 'Desativar' : 'Ativar'}
                </Text>
              </Pressable>
              <Pressable
                android_ripple={{color: '#FCC'}}
                style={({pressed}) => [
                  styles.deleteButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => deleteTicket(item.id)}>
                <Text style={styles.deleteText}>Excluir</Text>
              </Pressable>
            </View>
          </View>
        )}
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
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  list: {paddingHorizontal: 16, paddingBottom: 16},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: {width: 0, height: 4},
      },
      android: {elevation: 4},
    }),
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 10,
    marginRight: 12,
  },
  info: {flex: 1, justifyContent: 'center'},
  title: {fontSize: 15, fontWeight: '700', color: '#1F2937'},
  date: {fontSize: 12, color: '#6B7280'},
  time: {fontSize: 12, color: '#6B7280'},
  buttons: {justifyContent: 'center'},
  toggleButton: {
    backgroundColor: '#4ADE80',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  btnActivate: {backgroundColor: '#10B981'},
  btnDeactivate: {backgroundColor: '#EF4444'},
  toggleText: {color: '#fff', fontSize: 12, fontWeight: '600'},
  deleteButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    textAlign: 'center',
  },
  deleteText: {color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center'},
  pressed: {opacity: 0.8},
});
