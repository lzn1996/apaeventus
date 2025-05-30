import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import styles from './styles';

export default function EventDetailScreen() {
    const event = {
        title: 'Festa Junina - 2025',
        description: 'Prepare-se para a tradicional Festa Junina da APAE Itapira!\nUm evento repleto de comidas típicas, quadrilha animada e um super show da renomada dupla sertaneja César & Paulinho. Diversão garantida para toda a família!',
        price: 30.0,
        date: '14/06/2025 às 19h',
        imageUrl: require('../../../assets/event-banner.png'),
        address: 'Rua Jacob Audi, 132\nPenha do Rio do Peixe - Itapira - SP\n(19) 3813-8899',
    };
    const [quantity, setQuantity] = useState(1);
    const total = event.price * quantity;

    const handleBuy = () => {
        // lógica de compra ou redirecionamento
        // TODO: Implement purchase logic or show a confirmation modal/toast here
        console.log(`Comprando ${quantity} ingresso(s) por R$${total.toFixed(2)}`);
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Image
                source={event.imageUrl}
                style={styles.banner}
            />

            <Text style={styles.title}>{event.title}</Text>

            <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={16} color="#555" />
                <Text style={styles.dateText}>{event.date}</Text>
            </View>

            <View style={styles.priceBox}>
                <Text style={styles.price}>R${event.price.toFixed(2)}</Text>

                <View style={styles.counter}>
                    <TouchableOpacity onPress={() => setQuantity(prev => Math.max(1, prev - 1))}>
                        <Text style={styles.counterButton}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>{quantity}</Text>
                    <TouchableOpacity onPress={() => setQuantity(prev => prev + 1)}>
                        <Text style={styles.counterButton}>+</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.total}>Total: R${total.toFixed(2)}</Text>
            </View>

            <TouchableOpacity style={styles.buyButton} onPress={handleBuy}>
                <Text style={styles.buyButtonText}>Comprar</Text>
            </TouchableOpacity>

            <View style={styles.descriptionBox}>
                <Text style={styles.sectionTitle}>{event.title}</Text>
                <Text style={styles.description}>
                    {event.description}
                </Text>
            </View>

            <Text style={styles.address}>
                {event.address}
            </Text>
        </ScrollView>
    );
}
