// src/screens/Public/EventDetailScreen/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types/navigation'; // Adjust the import path as necessary
import styles from './styles';
import { getTicketById } from '../../../services/eventService';
import { authService } from '../../../services/authService';
import eventBanner from '../../../assets/event-banner.png';

export default function EventDetailScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'EventDetail'>>();
    const [event, setEvent] = useState<any>(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const [aspectRatio, setAspectRatio] = useState(16 / 9);
    const ticketId = '0ce23db5-6566-4abf-b467-f94f7fa676cc';

    useEffect(() => {
        async function fetchEvent() {
            try {
                const data = await getTicketById(ticketId);
                setEvent(data);
            } catch (err) {
                setError('Erro ao carregar evento.');
                Alert.alert('Erro', 'Não foi possível carregar o evento.');
            } finally {
                setLoading(false);
            }
        }
        fetchEvent();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text>Carregando evento...</Text>
            </View>
        );
    }

    if (error || !event) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>{error || 'Evento não encontrado.'}</Text>
            </View>
        );
    }

    const handleBuy = async () => {
        if (!event) { return; }
        const isLogged = await authService.isLoggedIn();
        if (!isLogged) {
            Alert.alert('É necessário estar logado para comprar ingressos.', 'Por favor, faça login para continuar.');
            navigation.navigate({ name: 'Login' } as any);
            return;
        }
        navigation.navigate('Purchase', {
            ticketId: event.id,
            eventTitle: event.title,
            price: event.price,
            maxQuantity: 5,
            quantity: quantity,
        });
    };

    const handleIncrement = () => {
        setQuantity(prev => (prev < 5 ? prev + 1 : prev));
    };
    const handleDecrement = () => {
        setQuantity(prev => Math.max(1, prev - 1));
    };

    return (
        <View style={styles.root}>
            <ScrollView contentContainerStyle={styles.container} alwaysBounceVertical={true}>
                <Image
                    source={imageError || !event.imageUrl ? eventBanner : { uri: event.imageUrl }}
                    style={[styles.banner, { aspectRatio }]}
                    resizeMode="contain"
                    onError={() => setImageError(true)}
                    onLoad={e => {
                        if (e.nativeEvent && e.nativeEvent.source && e.nativeEvent.source.width && e.nativeEvent.source.height) {
                            setAspectRatio(e.nativeEvent.source.width / e.nativeEvent.source.height);
                        }
                    }}
                />

                <Text style={styles.title}>{event.title}</Text>

                <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={16} color="#555" />
                    <Text style={styles.dateText}>{new Date(event.eventDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</Text>
                </View>

                <View style={styles.priceBox}>
                    <Text style={styles.price}>R${Number(event.price).toFixed(2)}</Text>

                    <View style={styles.counter}>
                        <TouchableOpacity onPress={handleDecrement} disabled={quantity === 1}>
                            <Text style={[styles.counterButton, quantity === 1 && styles.counterButtonDisabled]}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.counterValue}>{quantity}</Text>
                        <TouchableOpacity onPress={handleIncrement} disabled={quantity === 5}>
                            <Text style={[styles.counterButton, quantity === 5 && styles.counterButtonDisabled]}>+</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.total}>Total: R${(Number(event.price) * quantity).toFixed(2)}</Text>
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
                    Rua Jacob Audi, 132{'\n'}Penha do Rio do Peixe - Itapira - SP{'\n'}(19) 3813-8899
                </Text>
            </ScrollView>
        </View>
    );
}
