import React, { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/navigationService';
import NetInfoSyncListener from './src/components/NetInfoSyncListener';

export default function App() {
  useEffect(() => {
    // Desabilita o botão físico de voltar do Android em todas as telas
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        // Retorna true para impedir a ação padrão do botão de voltar
        return true;
      });

      return () => backHandler.remove();
    }
  }, []);

  return (
    <>
      <NetInfoSyncListener />
      <NavigationContainer ref={navigationRef}>
        <AppNavigator />
      </NavigationContainer>
    </>
  );
}
