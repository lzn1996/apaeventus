import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { baseUrl } from '../../config/api';
import { getUserSales, Sale } from '../../services/saleService';
import { getUserProfile } from '../../services/userService';
import {
  saveUserProfileLocal,
  getUserProfileLocal,
} from '../../database/profileLocalService';
import EventCard from './components/EventCard';
import { MyEvent } from './types';

interface GroupedTickets {
  event: MyEvent;
  tickets: Sale[];
}

export default function MyTicketsScreen({ navigation }: any) {
  const [grouped, setGrouped] = useState<GroupedTickets[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  // tenta renovar o accessToken com o refreshToken
  const refreshAccessToken = async (): Promise<string | null> => {
    const oldToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!oldToken || !refreshToken) return null;
    try {
      const res = await fetch(`${baseUrl}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${oldToken}` },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;
      const js = await res.json();
      if (js.accessToken) {
        await AsyncStorage.setItem('accessToken', js.accessToken);
        if (js.refreshToken) await AsyncStorage.setItem('refreshToken', js.refreshToken);
        return js.accessToken;
      }
    } catch {
      return null;
    }
    return null;
  };

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isConnected);
      if (state.isConnected) fetchData();
    });
    fetchData();
    return () => unsub();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // renovar token se conectado
      if (isConnected) {
        await refreshAccessToken();
        const profile = await getUserProfile();
        if (profile?.id) await saveUserProfileLocal(profile);
      } else {
        await getUserProfileLocal();
      }

      // buscar vendas do usuário
      const sales = await getUserSales();

      // agrupar por evento
      const map: Record<string, GroupedTickets> = {};
      sales.forEach(sale => {
        const ev = sale.ticket;
        const id = ev.id;
        if (!map[id]) {
          const [date, time] = ev.eventDate.split('T');
          map[id] = {
            event: {
              id,
              title: ev.title,
              date,
              time: time?.slice(0,5) || '',
              imageUrl: ev.imageUrl,
              location: ev.location || '',
              displayDate: new Date(ev.eventDate).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }),
              displayTime: new Date(ev.eventDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            },
            tickets: [],
          };
        }
        map[id].tickets.push(sale);
      });

      // ordenar e setar estado
      const arr = Object.values(map).sort((a, b) => {
        const da = new Date(`${a.event.date}T${a.event.time}`).getTime();
        const db = new Date(`${b.event.date}T${b.event.time}`).getTime();
        return db - da;
      });
      setGrouped(arr);
    } catch (e: any) {
      console.error('[MyTicketsScreen] Error:', e);
      setError('Não foi possível carregar seus ingressos.');
    } finally {
      setLoading(false);
    }
  };

  const handleEventPress = (group: GroupedTickets) => {
    navigation.navigate('TicketsByEvent', {
      eventId: group.event.id,
      eventTitle: group.event.title,
      tickets: group.tickets,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <Text style={styles.retry} onPress={fetchData}>Tentar novamente</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Text style={styles.bannerText}>Sem conexão, exibindo dados em cache</Text>
        </View>
      )}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Ingressos</Text>
      </View>
      <FlatList
        data={grouped}
        keyExtractor={item => item.event.id}
        renderItem={({ item }) => (
          <EventCard event={item.event} onPress={() => handleEventPress(item)} />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={styles.empty}>Você ainda não possui ingressos.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#007AFF', paddingVertical: 12, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '600' },
  offlineBanner: { backgroundColor: '#FFC107', padding: 6, alignItems: 'center' },
  bannerText: { color: '#333', fontSize: 12 },
  list: { padding: 16 },
  separator: { height: 12 },
  empty: { textAlign: 'center', marginTop: 32, color: '#666', fontSize: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  error: { color: 'red', fontSize: 16, marginBottom: 8 },
  retry: { color: '#007AFF', fontWeight: '600' },
});
