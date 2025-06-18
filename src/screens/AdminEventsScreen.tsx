import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { baseUrl } from '../config/api';

export default function AdminEventsScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const screenWidth = Dimensions.get('window').width;

  async function refreshAccessToken(): Promise<string | null> {
    const old = await AsyncStorage.getItem('accessToken');
    const refresh = await AsyncStorage.getItem('refreshToken');
    if (!old || !refresh) return null;

    const res = await fetch(`${baseUrl}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${old}`,
      },
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

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    let token = await AsyncStorage.getItem('accessToken');
    let res = await fetch(`${baseUrl}/ticket?showInactive=true`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        setLoading(false);
        return Alert.alert('Sessão expirada', 'Faça login novamente.');
      }
      token = newToken;
      res = await fetch(`${baseUrl}/ticket?showInactive=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    if (!res.ok) {
      const txt = await res.text();
      setLoading(false);
      return Alert.alert('Erro ao buscar eventos', `Status ${res.status}\n${txt}`);
    }

    const data = await res.json();
    setEvents(data);
    setLoading(false);
  }, []);

  const toggleActive = async (id: string, isActive: boolean) => {
    let token = await AsyncStorage.getItem('accessToken');
    let res = await fetch(`${baseUrl}/ticket/enable-disable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, isActive }),
    });

    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) return Alert.alert('Sessão expirada', 'Faça login novamente.');
      token = newToken;
      res = await fetch(`${baseUrl}/ticket/enable-disable`, {
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
    fetchEvents();
  };

  const deleteTicket = (id: string) => {
    Alert.alert(
      'Excluir Evento',
      'Tem certeza que deseja excluir este evento permanentemente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            let token = await AsyncStorage.getItem('accessToken');
            let res = await fetch(`${baseUrl}/ticket/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401) {
              const newToken = await refreshAccessToken();
              if (!newToken) return Alert.alert('Sessão expirada', 'Faça login novamente.');
              token = newToken;
              res = await fetch(`${baseUrl}/ticket/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
            }
            if (!res.ok) {
              const txt = await res.text();
              return Alert.alert('Erro ao excluir', `Status ${res.status}\n${txt}`);
            }
            Alert.alert('Sucesso', 'Ingresso excluído.', [{ text: 'OK', onPress: fetchEvents }]);
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.imageUrl && (
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
            )}
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                {item.title}
              </Text>
              <Text style={styles.date}>
                📅 {new Date(item.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </Text>
              <Text style={styles.time}>
                🕒 {new Date(item.eventDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.buttons}>
              <Pressable
                android_ripple={{ color: '#EEE' }}
                style={({ pressed }) => [
                  styles.toggleButton,
                  item.isActive ? styles.btnDeactivate : styles.btnActivate,
                  pressed && styles.pressed,
                ]}
                onPress={() => toggleActive(item.id, !item.isActive)}
              >
                <Text style={styles.toggleText} numberOfLines={1}>
                  {item.isActive ? 'Desativar' : 'Ativar'}
                </Text>
              </Pressable>
              <Pressable
                android_ripple={{ color: '#FCC' }}
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => deleteTicket(item.id)}
              >
                <Text style={styles.deleteText} numberOfLines={1}>Excluir</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F2F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
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
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 10,
    marginRight: 12,
  },
  info: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  date: { fontSize: 12, color: '#6B7280' },
  time: { fontSize: 12, color: '#6B7280' },
  buttons: { justifyContent: 'center' },
  toggleButton: {
    backgroundColor: '#4ADE80',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  btnActivate: { backgroundColor: '#10B981' },
  btnDeactivate: { backgroundColor: '#EF4444' },
  toggleText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  deleteButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  deleteText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  pressed: { opacity: 0.8 },
});