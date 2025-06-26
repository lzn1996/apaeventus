// src/screens/QrScannerScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  ActivityIndicator,
  Pressable,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AwesomeAlert from 'react-native-awesome-alerts';
import { useNavigation } from '@react-navigation/native';

let bearerToken = '';

async function getNewToken() {
  const oldAccess = await AsyncStorage.getItem('accessToken');
  const refresh = await AsyncStorage.getItem('refreshToken');
  if (!oldAccess || !refresh) {
    throw new Error('Tokens não encontrados no armazenamento');
  }
  const response = await fetch(
    'https://apaeventus.rafaelcostadev.com/auth/refresh-token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${oldAccess}`,
      },
      body: JSON.stringify({ refreshToken: refresh }),
    }
  );
  if (!response.ok) {
    throw new Error(`Falha ao atualizar token: ${response.status}`);
  }
  const result = await response.json();
  await AsyncStorage.setItem('accessToken', result.accessToken);
  if (result.refreshToken) {
    await AsyncStorage.setItem('refreshToken', result.refreshToken);
  }
  return result.accessToken;
}

export default function QrScannerScreen() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // estados do AwesomeAlert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(true);

  function showAlert(title: string, message: string, success = true) {
    setAlertTitle(title);
    setAlertMessage(message);
    setIsSuccess(success);
    setAlertVisible(true);
  }

  useEffect(() => {
    if (permission === null) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setScanned(true);

    try {
      bearerToken = await getNewToken();

      const url = 'https://apaeventus.rafaelcostadev.com/sale/set-used';
      const headers = {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      };
      const body = JSON.stringify({ saleId: data });

      const response = await fetch(url, { method: 'POST', headers, body });
      const text = await response.text();
      if (!response.ok) {
        let msg = text;
        try {
          const err = JSON.parse(text);
          msg = err.message || JSON.stringify(err);
        } catch {}
        throw new Error(`HTTP ${response.status}: ${msg}`);
      }

      showAlert('QR Code Válido', `Venda ${data} marcada como usada.`, true);
    } catch (error: any) {
      showAlert(
        'Erro ao validar QR Code','Ingresso já utilizado ou inválido.',
        false
      );
    }
  };

  // Enquanto aguarda permissão
  if (permission === null || !permission.granted) {
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
    <SafeAreaView style={styles.safe}>
      {/* Botão de voltar */}
      <Pressable style={styles.backButton} onPress={() => navigation.navigate('Dashboard')}>
        <Text style={styles.backButtonText}>← Voltar</Text>
      </Pressable>

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

      <AwesomeAlert
        show={alertVisible}
        showProgress={false}
        title={alertTitle}
        message={alertMessage}
        closeOnTouchOutside
        closeOnHardwareBackPress
        showConfirmButton
        confirmText="OK"
        confirmButtonColor={isSuccess ? '#4CAF50' : '#F44336'}
        onConfirmPressed={() => {
          setAlertVisible(false);
          setScanned(false); // permitir nova leitura
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000', // para o preview da câmera
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
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
  layerTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  layerCenter: { flexDirection: 'row' },
  layerLeft: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  focused: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#00FF00',
  },
  layerRight: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  layerBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
});
