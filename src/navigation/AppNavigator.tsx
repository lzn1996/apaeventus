import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EventListScreen from '../screens/EventListScreen';
import EventFormScreen from '../screens/EventFormScreen';
import TicketScreen from '../screens/TicketScreen';
import QRCodeScannerScreen from '../screens/QRCodeScannerScreen';
import RegisterScreen from '../screens/RegisterScreen';
import SplashScreen from '../screens/SplashScreen';
import EventDetailScreen from '../screens/Public/EventDetailScreen';


const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="EventDetail">
      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Events" component={EventListScreen} />
      <Stack.Screen name="CreateEvent" component={EventFormScreen} />
      <Stack.Screen name="Tickets" component={TicketScreen} />
      <Stack.Screen name="Scanner" component={QRCodeScannerScreen} />
      <Stack.Screen name="Cadastro" component={RegisterScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ headerShown: false }}/>

    </Stack.Navigator>
  );
}
