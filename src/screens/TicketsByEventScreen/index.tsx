// src/screens/TicketsByEventScreen/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import styles from './styles';
import TicketCard from './components/TicketCard';
import Carousel from 'react-native-reanimated-carousel';

export default function TicketsByEventScreen({ route }: any) {
  const { tickets = [] } = route.params;
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }
  if (!tickets || tickets.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Não foi possível carregar os ingressos.</Text>
      </View>
    );
  }

  const width = Dimensions.get('window').width;
  const height = Math.min(Dimensions.get('window').height * 0.8, 720);

  return (
    <View style={styles.container}>
      <Carousel
        width={width * 0.95}
        height={height}
        data={tickets}
        renderItem={({ item, index }: { item: any; index: number }) => (
          <TicketCard
            ticket={{
              ...item,
              buyer: item.buyer || { name: '', email: '', phone: '' },
            }}
            index={index}
            total={tickets.length}
          />
        )}
        mode="horizontal-stack"
        modeConfig={{
          showLength: 1,     // apenas 1 cartão visível
          stackInterval: 0,  // sem sobreposição do anterior
        }}
        autoPlay={false}
        loop={false}
        onSnapToItem={setCurrentIndex}
      />

      {/* Indicador de página (dots) */}
      {tickets.length > 1 && (
        <View style={styles.dotsContainer}>
          {tickets.map((_, idx) => (
            <View
              key={idx}
              style={[styles.dot, idx === currentIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}
