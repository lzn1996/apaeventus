// src/screens/TicketsByEventScreen/index.tsx
import React, {useEffect, useState} from 'react';
import {View, Text, Dimensions, ScrollView} from 'react-native';
import styles from './styles';
import TicketCard from './components/TicketCard';
import Carousel from 'react-native-reanimated-carousel';
import {SafeLayout} from '../../components/SafeLayout';
import {Header} from '../../components/Header';
import {TabBar} from '../../components/TabBar';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import {useNavigation} from '@react-navigation/native';

export default function TicketsByEventScreen({route}: any) {
  const navigation = useNavigation();
  const {tickets = []} = route.params;
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localTickets, setLocalTickets] = useState(tickets);
  const [isLogged] = useState(true);
  const [userRole] = useState<'ADMIN' | 'USER' | null>('USER');
  const isConnected = useNetworkStatus();

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

  const handleOfflineAlert = () => {
    // Esta tela mostra ingressos já carregados, não precisa de lógica especial
  };

  useEffect(() => {
    // Ordena os ingressos: não utilizados primeiro, depois os utilizados
    const sortedTickets = [...tickets].sort((a, b) => {
      // Se a.used é false e b.used é true, a vem primeiro (retorna -1)
      // Se a.used é true e b.used é false, b vem primeiro (retorna 1)
      // Se ambos têm o mesmo status, mantém a ordem original (retorna 0)
      if (a.used === b.used) {
        return 0;
      }
      return a.used ? 1 : -1;
    });

    setLocalTickets(sortedTickets);
    setLoading(false);
  }, [tickets]);

  if (loading) {
    return (
      <SafeLayout showTabBar={true}>
        <Header title="Meus Ingressos" />
        <ScrollView
          style={styles.scrollViewStyle}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.centerContent}>
            <Text>Carregando...</Text>
          </View>
        </ScrollView>
        <TabBar
          activeTab="Tickets"
          onTabPress={handleTabPress}
          isLogged={isLogged}
          userRole={userRole}
          isConnected={isConnected}
          onOfflineAlert={handleOfflineAlert}
        />
      </SafeLayout>
    );
  }

  if (!localTickets.length) {
    return (
      <SafeLayout showTabBar={true}>
        <Header title="Meus Ingressos" />
        <ScrollView
          style={styles.scrollViewStyle}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.centerContent}>
            <Text>Não foi possível carregar os ingressos.</Text>
          </View>
        </ScrollView>
        <TabBar
          activeTab="Tickets"
          onTabPress={handleTabPress}
          isLogged={isLogged}
          userRole={userRole}
          isConnected={isConnected}
          onOfflineAlert={handleOfflineAlert}
        />
      </SafeLayout>
    );
  }

  const width = Dimensions.get('window').width;
  const height = Math.min(Dimensions.get('window').height * 0.8, 720);

  return (
    <SafeLayout showTabBar={true}>
      <Header title="Meus Ingressos" />
      <ScrollView
        style={styles.scrollViewStyle}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.carouselContainer}>
          <Carousel
            width={width * 0.95}
            height={height}
            data={localTickets}
            renderItem={({item, index}: {item: any; index: number}) => (
              <TicketCard
                ticket={{
                  ...item,
                  buyer: item.buyer || {name: '', email: '', phone: ''},
                }}
                index={index}
                total={localTickets.length}
              />
            )}
            // modo padrão, sem stack nem triângulos:
            pagingEnabled
            snapEnabled
            autoPlay={false}
            loop={false}
            onSnapToItem={setCurrentIndex}
          />

          {localTickets.length > 1 && (
            <View style={styles.dotsContainer}>
              {localTickets.map((_: any, idx: number) => (
                <View
                  key={idx}
                  style={[styles.dot, idx === currentIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <TabBar
        activeTab="Tickets"
        onTabPress={handleTabPress}
        isLogged={isLogged}
        userRole={userRole}
        isConnected={isConnected}
        onOfflineAlert={handleOfflineAlert}
      />
    </SafeLayout>
  );
}
