import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';

let bearerToken = '';

async function getNewToken() {
  // 1) busca os tokens no AsyncStorage
  const oldAccess = await AsyncStorage.getItem('accessToken');
  const refresh = await AsyncStorage.getItem('refreshToken');
  if (!oldAccess || !refresh) {
    throw new Error('Tokens não encontrados no armazenamento');
  }

  // 2) chama o refresh-token
  const response = await fetch(
    'http://18.191.252.46/auth/refresh-token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${oldAccess}`
      },
      body: JSON.stringify({ refreshToken: refresh })
    }
  );
  if (!response.ok) {
    throw new Error(`Falha ao atualizar token: ${response.status}`);
  }

  // 3) atualiza no storage e retorna o novo access
  const result = await response.json();
  await AsyncStorage.setItem('accessToken', result.accessToken);
  if (result.refreshToken) {
    await AsyncStorage.setItem('refreshToken', result.refreshToken);
  }
  return result.accessToken;
}

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // solicita permissão na montagem
  useEffect(() => {
    if (permission === null) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    try {
      // busca accessToken novo
      bearerToken = await getNewToken();

      // chama o endpoint marcando o saleId
      const response = await fetch(
        'http://18.191.252.46/sale/set-used',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ saleId: data })
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();

      Alert.alert(
        'QR Code Válido',
        `Venda ${data} marcada como usada.\nResposta: ${JSON.stringify(result)}`,
        [{ text: 'OK', onPress: () => setScanned(false) }],
        { cancelable: false }
      );
    } catch (error: any) {
      Alert.alert(
        'Erro ao validar QR Code',
        error.message,
        [{ text: 'OK', onPress: () => setScanned(false) }],
        { cancelable: false }
      );
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Permissão da câmera não concedida.
        </Text>
        <Button title="Solicitar Permissão" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <CameraView
      style={styles.camera}
      onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
    >
      <View style={styles.layerContainer}>
        <View style={styles.layerTop} />
        <View style={styles.layerCenter}>
          <View style={styles.layerLeft} />
          <View style={styles.focused} />
          <View style={styles.layerRight} />
        </View>
        <View style={styles.layerBottom} />
      </View>
    </CameraView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  permissionText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  layerContainer: { flex: 1 },
  layerTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  layerCenter: { flexDirection: 'row' },
  layerLeft: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  focused: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#00FF00',
  },
  layerRight: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  layerBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
});
