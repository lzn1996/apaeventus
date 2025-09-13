import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity } from 'react-native';
import { getTickets } from '../services/eventService';

export default function EventListScreen({ navigation }: any) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const tickets = await getTickets();
        // Agrupa tickets por evento
        const eventsMap = new Map();
        tickets.forEach((ticket: any) => {
          if (!eventsMap.has(ticket.id)) {
            eventsMap.set(ticket.id, ticket);
          }
        });
        setEvents(Array.from(eventsMap.values()));
      } catch (err) {
        setEvents([]);
        console.warn('[EventListScreen] Erro ao buscar eventos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Carregando eventos...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Eventos</Text>
      <FlatList
        data={events}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}>
            <Text style={{ marginVertical: 8 }}>• {item.title} ({new Date(item.eventDate).toLocaleString('pt-BR')})</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ marginTop: 24 }}>Nenhum evento cadastrado.</Text>}
      />
      <Button title="Criar Novo Evento" onPress={() => navigation.navigate('CreateEvent')} />
    </View>
  );
}
