import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { RNCamera } from 'react-native-camera';
import api from '../services/api'; // Ajuste o caminho conforme necessário

export default function QRCodeScannerScreen() {
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const cameraRef = useRef<RNCamera>(null);

  const handleBarCodeRead = async (e: any) => {
    if (!scanning) return;
    setScanning(false);
    setLoading(true);
    setResult(null);
    try {
      const code = e.data;
      // Chama a API para validar e marcar como usado
      const response = await api.post('/sale/set-used', { saleId: code });
      setResult('Ingresso validado e marcado como usado!');
    } catch (error: any) {
      setResult(
        error?.response?.data?.message || 'Erro ao validar ingresso. Tente novamente.'
      );
    } finally {
      setLoading(false);
      setTimeout(() => {
        setScanning(true);
        setResult(null);
      }, 2500);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leitor de QR Code</Text>
      <View style={styles.cameraContainer}>
        <RNCamera
          ref={cameraRef}
          style={styles.camera}
          onBarCodeRead={scanning ? handleBarCodeRead : undefined}
          captureAudio={false}
        />
        {loading && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#1976d2" />
            <Text style={styles.loadingText}>Validando ingresso...</Text>
          </View>
        )}
        {result && (
          <View style={styles.overlay}>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        )}
      </View>
      <Text style={styles.infoText}>Aponte a câmera para o QR Code do ingresso</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fb', alignItems: 'center', paddingTop: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1976d2', marginBottom: 12 },
  cameraContainer: { width: '90%', aspectRatio: 1, borderRadius: 16, overflow: 'hidden', marginBottom: 18 },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', fontSize: 18, marginTop: 12 },
  resultText: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  infoText: { color: '#888', fontSize: 16, marginTop: 8 },
});
