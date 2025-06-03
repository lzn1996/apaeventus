import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EventListScreen from '../screens/EventListScreen';
import EventFormScreen from '../screens/EventFormScreen';
import TicketScreen from '../screens/TicketScreen';
import QRCodeScannerScreen from '../screens/QRCodeScannerScreen';
import RegisterScreen from '../screens/RegisterScreen'; // Registration screen for new users
import SplashScreen from '../screens/SplashScreen'; // Splash screen for initial loading
import EventDetailScreen from '../screens/Public/EventDetailScreen'; // Public event detail screen


const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />{/* Splash screen for initial loading */}
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Events" component={EventListScreen} />
      <Stack.Screen name="CreateEvent" component={EventFormScreen} />
      <Stack.Screen name="Tickets" component={TicketScreen} />
      <Stack.Screen name="Scanner" component={QRCodeScannerScreen} />
      <Stack.Screen name="Cadastro" component={RegisterScreen} />{/* Registration screen for new users */}
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ headerShown: false }}/>{/* Public event detail screen */}

    </Stack.Navigator>
  );
}
