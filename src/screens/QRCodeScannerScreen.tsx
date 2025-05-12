import React from 'react';
import { View, Text } from 'react-native';

export default function QRCodeScannerScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Leitor de QR Code (Mock)</Text>
      <Text>(aqui futuramente usaremos a câmera)</Text>
    </View>
  );
}
