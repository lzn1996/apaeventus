// ./src/screens/AdminEventsScreen.tsx
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { baseUrl } from '../config/api';

export default function AdminEventsScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Refresh token logic
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
      if (json.refreshToken) {
        await AsyncStorage.setItem('refreshToken', json.refreshToken);
      }
      return json.accessToken;
    }
    return null;
  }

  // Fetch events with retry on 401
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

  // Toggle active/inactive with retry
  const toggleActive = async (id: string, isActive: boolean) => {
    let token = await AsyncStorage.getItem('accessToken');
    let res = await fetch(`${baseUrl}/ticket/enable-disable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, isActive }),
    });

    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) return Alert.alert('Sessão expirada', 'Faça login novamente.');
      token = newToken;
      res = await fetch(`${baseUrl}/ticket/enable-disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, isActive }),
      });
    }

    if (!res.ok) {
      const txt = await res.text();
      return Alert.alert('Erro', `Status ${res.status}\n${txt}`);
    }
    fetchEvents();
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
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.image} />}
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <Text>{new Date(item.eventDate).toLocaleString()}</Text>
            </View>
            <Pressable
              style={[
                styles.toggleButton,
                item.isActive ? styles.btnDeactivate : styles.btnActivate,
              ]}
              onPress={() => toggleActive(item.id, !item.isActive)}
            >
              <Text style={styles.toggleText}>
                {item.isActive ? 'Desativar' : 'Ativar'}
              </Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f2f2f7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
  },
  image: { width: 60, height: 60, borderRadius: 6, marginRight: 12 },
  info: { flex: 1 },
  title: { fontWeight: '600', marginBottom: 4 },
  toggleButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  btnActivate: { backgroundColor: '#27ae60' },
  btnDeactivate: { backgroundColor: '#e74c3c' },
  toggleText: { color: '#fff', fontWeight: '600' },
});
