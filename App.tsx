import React, {useEffect} from 'react';
import {BackHandler, Platform} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import {navigationRef} from './src/navigation/navigationService';
import NetInfoSyncListener from './src/components/NetInfoSyncListener';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          return true;
        },
      );

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
