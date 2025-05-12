import React from 'react';
import { View, Text, Button, FlatList } from 'react-native';

const mockEvents = [
  { id: '1', name: 'Festa Junina' },
  { id: '2', name: 'Palestra Inclusão' },
];

export default function EventListScreen({ navigation }: any) {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Eventos (Mock)</Text>
      <FlatList
        data={mockEvents}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Text style={{ marginVertical: 8 }}>• {item.name}</Text>
        )}
      />
      <Button title="Criar Novo Evento" onPress={() => navigation.navigate('CreateEvent')} />
    </View>
  );
}
