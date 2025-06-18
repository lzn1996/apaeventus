import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  FlatList,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { baseUrl } from '../../config/api';
import { getUserSales, Sale } from '../../services/saleService';
import { getUserProfile } from '../../services/userService';
import EventCard from './components/EventCard';
import { MyEvent } from './types';
import styles from './styles';
import Icon from 'react-native-vector-icons/MaterialIcons';


interface GroupedTickets {
  event: MyEvent;
  tickets: Sale[];
}

export default function MyTicketsScreen({ navigation }: any) {
  const [grouped, setGrouped] = useState<GroupedTickets[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  const refreshAccessToken = async (): Promise<string | null> => {
    const oldToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!oldToken || !refreshToken) return null;

    const res = await fetch(`${baseUrl}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${oldToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;

    const js = await res.json();
    if (js.accessToken) {
      await AsyncStorage.setItem('accessToken', js.accessToken);
      if (js.refreshToken) {
        await AsyncStorage.setItem('refreshToken', js.refreshToken);
      }
      return js.accessToken;
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
      if (isConnected) {
        await refreshAccessToken();
        await getUserProfile();
      }

      const sales = await getUserSales();

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
              time: time?.slice(0, 5) || '',
              imageUrl: ev.imageUrl,
              location: ev.location || '',
              displayDate: new Date(ev.eventDate).toLocaleDateString('pt-BR', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
              displayTime: new Date(ev.eventDate).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
            tickets: [],
          };
        }
        map[id].tickets.push(sale);
      });

      const arr = Object.values(map).sort((a, b) => {
        const ta = new Date(`${a.event.date}T${a.event.time}`).getTime();
        const tb = new Date(`${b.event.date}T${b.event.time}`).getTime();
        return tb - ta;
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
      event: group.event,      // aqui você carrega título, date, time, displayDate…
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
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText} onPress={fetchData}>
          Tentar novamente
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {!isConnected && (
        <View style={styles.connectionBannerContainer}>
          <Text style={[styles.connectionBanner, styles.connectionOffline]}>
            Sem conexão, recarregue para atualizar.
          </Text>
        </View>
      )}

 <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.navigate('Dashboard')}
        style={styles.backButton}
      >
        <Icon name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Meus Ingressos</Text>
    </View>



      <FlatList
        data={grouped}
        keyExtractor={item => item.event.id}
        renderItem={({ item }) => (
          <EventCard event={item.event} onPress={() => handleEventPress(item)} />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Você ainda não possui ingressos.</Text>
        }
      />
    </SafeAreaView>
  );
}
