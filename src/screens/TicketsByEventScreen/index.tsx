// src/screens/TicketsByEventScreen/index.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import styles from './styles';
import TicketCard from './components/TicketCard';
import Carousel from 'react-native-reanimated-carousel';

export default function TicketsByEventScreen({ route }: any) {
  const { tickets = [] } = route.params;
  const [loading, setLoading] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    setLoading(false);
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#1976d2" />
      </SafeAreaView>
    );
  }
  if (!tickets.length) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Não foi possível carregar os ingressos.</Text>
      </SafeAreaView>
    );
  }

  const screenWidth = Dimensions.get('window').width;
  const carouselWidth = screenWidth;
  const cardWidth = screenWidth * 0.92;
  // calcula a margem que centraliza o card
  const sideMargin = (carouselWidth - cardWidth) / 2;

  return (
    <SafeAreaView style={styles.container}>
      {tickets.length > 1 && (
        <Animated.View style={[styles.carouselSpacer, { opacity: fadeAnim }]}>
          <Text style={styles.hintText}>Deslize para o lado →</Text>
        </Animated.View>
      )}

      <Carousel
        width={carouselWidth}
        height={800}
        data={tickets}
        renderItem={({ item, index }) => (
          <TicketCard
            ticket={{
              ...item,
              buyer: item.buyer || { name: '', email: '', phone: '' },
            }}
            index={index}
            total={tickets.length}
            // define largura fixa e margem lateral para centralizar
            style={{
              width: cardWidth,
              marginHorizontal: sideMargin,
            }}
          />
        )}
        mode="horizontal-stack"
        modeConfig={{ showLength: tickets.length }}
        autoPlay={false}
        pagingEnabled
        snapEnabled
      />
    </SafeAreaView>
  );
}
