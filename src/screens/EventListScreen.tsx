import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity } from 'react-native';
import { getAllEvents } from '../database/eventLocalService';

export default function EventListScreen({ navigation }: any) {
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => {
    getAllEvents()
      .then(evts => {
        setEvents(evts);
      })
      .catch(err => {
        setEvents([]);
        console.warn('[EventListScreen] Erro ao buscar eventos locais:', err);
      });
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Eventos</Text>
      <FlatList
        data={events}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}>
            <Text style={{ marginVertical: 8 }}>• {item.title} ({new Date(item.date).toLocaleString('pt-BR')})</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ marginTop: 24 }}>Nenhum evento cadastrado.</Text>}
      />
      <Button title="Criar Novo Evento" onPress={() => navigation.navigate('CreateEvent')} />
    </View>
  );
}
