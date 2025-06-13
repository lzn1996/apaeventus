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
  const response = await fetch('http://18.191.252.46/auth/refresh-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${oldAccess}`,
    },
    body: JSON.stringify({ refreshToken: refresh }),
  });
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

    // DEBUG #1: mostra em um alert o conteúdo bruto que o leitor retornou
    /*Alert.alert(
      'DEBUG - QR Scan',
      `type: ${type}\n\ndata raw:\n${data}`,
      [{ text: 'OK', onPress: () => {} }],
      { cancelable: false }
    );*/

    try {
      // busca accessToken novo
      bearerToken = await getNewToken();

      // prepara detalhes da requisição
      const url = 'http://18.191.252.46/sale/set-used';
      const headers = {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      };
      const body = JSON.stringify({ saleId: data });

      // DEBUG #2: mostra a requisição completa antes do fetch
      /*Alert.alert(
        'DEBUG - Request',
        `POST ${url}\n\nHeaders:\n${JSON.stringify(headers, null, 2)}\n\nBody:\n${body}`,
        [{ text: 'OK', onPress: () => {} }],
        { cancelable: false }
      );*/
      // DEBUG #3: mostra o token usado

      // chama o endpoint marcando o saleId
  const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });
      // lê como texto para evitar JSON parse vazio
      const text = await response.text();
      if (!response.ok) {
        // tenta extrair mensagem do corpo
        let msg = text;
        try {
          const err = JSON.parse(text);
          msg = err.message || JSON.stringify(err);
        } catch {}
        throw new Error(`HTTP ${response.status}: ${msg}`);
      }

      // tenta parsear o JSON somente se houver algo
      let result: any = null;
      if (text) {
        try {
          result = JSON.parse(text);
        } catch {
          // não JSON = deixa result como texto bruto
          result = text;
        }
      }

      Alert.alert(
        'QR Code Válido',
        `Venda ${data} marcada como usada.`,
        [{ text: 'OK', onPress: () => setScanned(false) }],
        { cancelable: false }
      );
    } catch (error: any) {
      Alert.alert(
        'Erro ao validar QR Code',
        'Ingresso já utilizado ou inválido ',
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
