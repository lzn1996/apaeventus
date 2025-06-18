import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/navigationService';
import NetInfoSyncListener from './src/components/NetInfoSyncListener';

export default function App() {
  return (
    <>
      <NetInfoSyncListener />
      <NavigationContainer ref={navigationRef}>
        <AppNavigator />
      </NavigationContainer>
    </>
  );
}
