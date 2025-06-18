// src/screens/TicketsByEventScreen/index.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import styles from './styles';
import TicketCard from './components/TicketCard';
import Carousel from 'react-native-reanimated-carousel';

export default function TicketsByEventScreen({ route }: any) {
    const { tickets = [] } = route.params;
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(false);
    }, []);

    if (loading) {
        return <View style={styles.container}><Text>Carregando...</Text></View>;
    }
    if (!tickets || tickets.length === 0) {
        return <View style={styles.container}><Text>Não foi possível carregar os ingressos.</Text></View>;
    }

    const width = Dimensions.get('window').width;

    return (
        <View style={styles.container}>
            <View style={styles.carouselSpacer} />
            <Carousel
  width={400}
  height={900} // ajuste conforme necessário
  style={styles.carousel}
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
                modeConfig={{ showLength: tickets.length }}
                autoPlay={false}
            />
        </View>
    );
}
