// src/screens/QrScannerScreen.tsx
import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Button} from 'react-native';
import {CameraView, useCameraPermissions} from 'expo-camera';
import AwesomeAlert from 'react-native-awesome-alerts';
import {useNavigation} from '@react-navigation/native';
import {SafeLayout} from '../components/SafeLayout';
import {Header} from '../components/Header';
import {TabBar} from '../components/TabBar';
import { baseUrl } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function QrScannerScreen() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLogged] = useState(true);
  const [userRole] = useState<'ADMIN' | 'USER' | null>('ADMIN');

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(true);

  async function refreshAccessToken(): Promise<string | null> {
    const old = await AsyncStorage.getItem('accessToken');
    const refresh = await AsyncStorage.getItem('refreshToken');
    if (!old || !refresh) {
      return null;
    }

    const res = await fetch(`${baseUrl}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${old}`,
      },
      body: JSON.stringify({refreshToken: refresh}),
    });
    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    if (json.accessToken) {
      await AsyncStorage.setItem('accessToken', json.accessToken);
      if (json.refreshToken) {
        await AsyncStorage.setItem('refreshToken', json.refreshToken);
      }
      return json.accessToken;
    }
    return null;
  }

  function showAlert(title: string, message: string, success = true) {
    setAlertTitle(title);
    setAlertMessage(message);
    setIsSuccess(success);
    setAlertVisible(true);

    setTimeout(() => {
      setAlertVisible(false);
      setScanned(false);
      navigation.navigate('Dashboard' as never);
    }, 5000);
  }

  const handleTabPress = (tab: string) => {
    switch (tab) {
      case 'Home':
        navigation.navigate('Dashboard' as never);
        break;
      case 'Search':
        navigation.navigate('Dashboard' as never);
        break;
      case 'Tickets':
        navigation.navigate('MyTickets' as never);
        break;
      case 'Profile':
        navigation.navigate('ProfileEdit' as never);
        break;
    }
  };

  useEffect(() => {
    if (permission === null) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = async ({
    type: _type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setScanned(true);

    try {
      let bearerToken = await AsyncStorage.getItem('accessToken');

      if (!bearerToken) {
        throw new Error('Token não encontrado');
      }

      const url = `${baseUrl}/sale/set-used`;
      const headers = {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      };
      const body = JSON.stringify({saleId: data});

      let response = await fetch(url, {method: 'POST', headers, body});

      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          throw new Error('Não foi possível renovar o token');
        }

        const newHeaders = {
          Authorization: `Bearer ${newToken}`,
          'Content-Type': 'application/json',
        };
        response = await fetch(url, {method: 'POST', headers: newHeaders, body});
      }

      const text = await response.text();

      if (!response.ok) {
        let msg = text;
        try {
          const err = JSON.parse(text);
          msg = err.message || JSON.stringify(err);
        } catch (parseError) {
          console.error('Erro ao fazer parse da resposta:', parseError);
        }
        throw new Error(`HTTP ${response.status}: ${msg}`);
      }

      showAlert('QR Code Válido', `Venda ${data} marcada como usada.`, true);
    } catch (error: any) {
      showAlert(
        'Erro ao validar QR Code',
        `Erro: ${error.message || 'Ingresso já utilizado ou inválido.'}`,
        false,
      );
    }
  };

  if (permission === null || !permission.granted) {
    return (
      <SafeLayout showTabBar={true}>
        <Header
          title="Scanner QR Code"
          isLogged={isLogged}
          userRole={userRole}
          navigation={navigation}
        />
        <View style={styles.container}>
          <Text style={styles.permissionText}>
            Permissão da câmera não concedida.
          </Text>
          <Button title="Solicitar Permissão" onPress={requestPermission} />
        </View>
        <TabBar
          activeTab="Profile"
          onTabPress={handleTabPress}
          isLogged={isLogged}
          userRole={userRole}
        />
      </SafeLayout>
    );
  }

  return (
    <SafeLayout showTabBar={true}>
      <Header
        title="Leitor de QR Code"
        isLogged={isLogged}
        userRole={userRole}
        navigation={navigation}
      />

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        <View style={styles.overlay}>
          <View style={styles.layerTop} />
          <View style={styles.layerCenter}>
            <View style={styles.layerLeft} />
            <View style={styles.focused} />
            <View style={styles.layerRight} />
          </View>
          <View style={styles.layerBottom} />
        </View>
      </View>

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
          setScanned(false);
          navigation.navigate('Dashboard' as never);
        }}
        onDismiss={() => {
          setAlertVisible(false);
          setScanned(false);
          navigation.navigate('Dashboard' as never);
        }}
      />

      <TabBar
        activeTab="Profile"
        onTabPress={handleTabPress}
        isLogged={isLogged}
        userRole={userRole}
      />
    </SafeLayout>
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
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
  },
  layerTop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.6)'},
  layerCenter: {flexDirection: 'row'},
  layerLeft: {flex: 1, backgroundColor: 'rgba(0,0,0,0.6)'},
  focused: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#00FF00',
  },
  layerRight: {flex: 1, backgroundColor: 'rgba(0,0,0,0.6)'},
  layerBottom: {flex: 1, backgroundColor: 'rgba(0,0,0,0.6)'},
});
