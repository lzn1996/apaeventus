import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EventListScreen from '../screens/EventListScreen';
import EventFormScreen from '../screens/EventFormScreen';
import TicketScreen from '../screens/TicketScreen';
import QRCodeScannerScreen from '../screens/QRCodeScannerScreen';
import CadastroScreen from '../screens/CadastroScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Events" component={EventListScreen} />
      <Stack.Screen name="CreateEvent" component={EventFormScreen} />
      <Stack.Screen name="Tickets" component={TicketScreen} />
      <Stack.Screen name="Scanner" component={QRCodeScannerScreen} />
      <Stack.Screen name="Cadastro" component={CadastroScreen} />
    </Stack.Navigator>
  );
}
