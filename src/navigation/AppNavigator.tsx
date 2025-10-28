import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EventListScreen from '../screens/EventListScreen';
import TicketScreen from '../screens/TicketScreen';
import QRCodeScannerScreen from '../screens/QRCodeScannerScreen';
import RegisterScreen from '../screens/RegisterScreen'; // Registration screen for new users
import SplashScreen from '../screens/SplashScreen'; // Splash screen for initial loading
import EventDetailScreen from '../screens/Public/EventDetailScreen'; // Public event detail screen
import PurchaseScreen from '../screens/PurchaseScreen'; // Importing PurchaseScreen
import MyTicketsScreen from '../screens/MyTicketsScreen';
import TicketsByEventScreen from '../screens/TicketsByEventScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import AdminEventsScreen from '../screens/AdminEventsScreen';
import RecoverPasswordScreen from '../screens/ResetPassword';
import ChatbotScreen from '../screens/ChatbotScreen';

// import PrimeiroAcesso from '../screens/PrimeiroAcesso';
// import CreateEventScreen from '../screens/CreateEventScreen';
// import AdminEventsScreen from '../screens/AdminEventsScreen';
// import EditProfileScreen from '../screens/EditProfileScreen';



const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
<Stack.Navigator initialRouteName="Splash">
  <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />{/* Splash screen for initial loading */}
  <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
  <Stack.Screen name="Events" component={EventListScreen} />
  <Stack.Screen name="Tickets" component={TicketScreen} />
  <Stack.Screen name="Scanner" component={QRCodeScannerScreen} options={{ headerShown: false }} />
  <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
  {/* <Stack.Screen name="PrimeiroAcesso" component={PrimeiroAcesso} options={{ headerShown: false }} /> */}
  {/* <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Novo Evento' }} /> */}
  {/* <Stack.Screen name="AdminEvents" component={AdminEventsScreen} options={{ title: 'Gerenciar Eventos' }}/> */}
  {/* <Stack.Screen name="ProfileEdit" component={EditProfileScreen} options={{ title: 'Meu Perfil' }}/> */}
  <Stack.Screen name="Cadastro" component={RegisterScreen} />{/* Registration screen for new users */}
  <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ headerShown: false }}/>{/* Public event detail screen */}
  <Stack.Screen name="Purchase" component={PurchaseScreen} options={{ headerShown: false }} />{/* Purchase screen for ticket buying */}
  <Stack.Screen name="MyTickets" component={MyTicketsScreen}  options={{ headerShown: false }} />
  <Stack.Screen name="TicketsByEvent" component={TicketsByEventScreen} options={{ headerShown: false }} />
  <Stack.Screen name="ProfileEdit" component={EditProfileScreen} options={{ headerShown: false }}/>
  <Stack.Screen name="AdminEvents" component={AdminEventsScreen} options={{ headerShown: false }}/>
  <Stack.Screen name="CreateEvent" component={CreateEventScreen}options={{ headerShown: false }} />
  <Stack.Screen name="Chatbot" component={ChatbotScreen} options={{ headerShown: false }} />
   <Stack.Screen name="Reset" component={RecoverPasswordScreen} options={{ headerShown: false }} />
</Stack.Navigator>
  );
}
