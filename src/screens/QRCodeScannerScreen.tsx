import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

const refreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY3MDJhZWY3LWM3YzktNGNmYy05NGQ0LWY1Y2U5ODk0MjBjMyIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc0OTY2MDk1OSwiZXhwIjoxNzUwMjY1NzU5fQ.HS6KYtx3E7990j8hKodkNcGwGaL79lsa_bDOSDnwCpg';
let bearerToken = '';

async function getNewToken() {
  const response = await fetch('http://18.191.252.46/auth/refresh-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) throw new Error(`Erro HTTP ao atualizar token: ${response.status}`);

  const result = await response.json();
  return result.accessToken;
}

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);

    try {
      bearerToken = await getNewToken();

      const response = await fetch('http://18.191.252.46/sale/set-used', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ saleId: data }),
      });

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

      const result = await response.json();

      Alert.alert(
        'QR Code Válido',
        `O QR Code foi marcado como utilizado.\nResposta: ${JSON.stringify(result)}`,
        [{ text: 'OK', onPress: () => setScanned(false) }],
        { cancelable: false }
      );
    } catch (error) {
      Alert.alert(
        'Erro ao validar QR Code',
        `Detalhes do erro: ${error.message}`,
        [{ text: 'OK', onPress: () => setScanned(false) }],
        { cancelable: false }
      );
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Permissão da câmera não concedida.</Text>
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
