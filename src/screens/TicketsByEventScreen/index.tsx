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
  const [localTickets] = useState(tickets);

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

  if (!localTickets.length) {
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
        data={localTickets}
        renderItem={({ item, index }: { item: any; index: number }) => (
          <TicketCard
            ticket={{
              ...item,
              buyer: item.buyer || { name: '', email: '', phone: '' },
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
  );
}
