import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/navigationService';
//import { resetLocalDatabase } from './src/database/init';

// Chame uma vez para limpar o banco local (remova após o uso!)
// resetLocalDatabase();

export default function App() {
  return (
    <NavigationContainer ref={navigationRef}>
      <AppNavigator />
    </NavigationContainer>
  );
}
