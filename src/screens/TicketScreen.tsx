import React from 'react';
import { View, Text, FlatList } from 'react-native';

const mockTickets = [
  { id: '1', type: 'VIP', price: 'R$ 50,00' },
  { id: '2', type: 'Meia', price: 'R$ 25,00' },
];

export default function TicketScreen() {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Ingressos (Mock)</Text>
      <FlatList
        data={mockTickets}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Text style={{ marginVertical: 8 }}>• {item.type} - {item.price}</Text>
        )}
      />
    </View>
  );
}
