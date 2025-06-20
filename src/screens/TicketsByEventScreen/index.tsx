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
        return <View style={styles.container}><Text>Carregando...</Text></View>;
    }
    if (!tickets || tickets.length === 0) {
        return <View style={styles.container}><Text>Não foi possível carregar os ingressos.</Text></View>;
    }

    const width = Dimensions.get('window').width;
    const height = Math.min(Dimensions.get('window').height * 0.8, 720); // Responsivo: até 80% da tela, máx 720

    return (
        <View style={styles.container}>
            <View style={styles.carouselSpacer} />
            <Carousel
                width={width * 0.95} // Mais responsivo, ocupa quase toda a largura
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
                modeConfig={{ showLength: 1 }}
                autoPlay={false}
                onSnapToItem={setCurrentIndex}
            />
            {/* Indicador de página (dots) */}
            <View style={styles.dotsContainer}>
                {tickets.map((_: any, idx: number) => (
                    <View
                        key={idx}
                        style={[styles.dot, idx === currentIndex && styles.dotActive]}
                    />
                ))}
            </View>
        </View>
    );
}
