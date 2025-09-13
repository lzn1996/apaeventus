import React from 'react';
import { View, Text, TextInput, Button } from 'react-native';

export default function EventFormScreen({ navigation }: any) {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Criar Evento (Mock)</Text>
      <TextInput placeholder="Nome do Evento" style={{ borderWidth: 1, marginVertical: 10, padding: 8 }} />
      <TextInput placeholder="Data" style={{ borderWidth: 1, marginVertical: 10, padding: 8 }} />
      <TextInput placeholder="Local" style={{ borderWidth: 1, marginVertical: 10, padding: 8 }} />
      <Button title="Salvar" onPress={() => navigation.navigate('Dashboard' as never)} />
    </View>
  );
}
