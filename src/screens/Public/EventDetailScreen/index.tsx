// src/screens/Public/EventDetailScreen/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types/navigation'; // Adjust the import path as necessary
import styles from './styles';
import { getTicketById } from '../../../services/eventService';
import { authService } from '../../../services/authService';
import eventBanner from '../../../assets/event-banner.png';

declare module '*.png';

export default function EventDetailScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'EventDetail'>>();
    const route = useRoute();
    const { ticketId } = route.params as { ticketId: string };
    const [event, setEvent] = useState<any>(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const [aspectRatio, setAspectRatio] = useState(16 / 9);

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
    }, [ticketId]);

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
        let isLogged = await authService.isLoggedIn();
        let accessToken = await authService.getAccessToken();

        // Se não está logado mas tem token, tenta forçar refresh automático
        if (!isLogged && accessToken) {
            try {
                // Faz uma requisição protegida para forçar o refresh
                await require('../../../services/api').default.get('/user/profile');
                // Após o refresh, verifica novamente
                isLogged = await authService.isLoggedIn();
                accessToken = await authService.getAccessToken();
                console.log('[EventDetailScreen] Após tentativa de refresh: isLogged:', isLogged, '| accessToken:', accessToken);
            } catch (e) {
                console.log('[EventDetailScreen] Falha ao tentar refresh automático:', e);
            }
        }

        if (!isLogged) {
            try {
                // POST logout no backend
                const baseUrl = require('../../../config/api').baseUrl;
                const tokenLogout = await authService.getAccessToken();
                if (tokenLogout) {
                    await fetch(`${baseUrl}/auth/logout`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${tokenLogout}`,
                        },
                    });
                }
                await authService.clearTokens();
            } catch (e) {
                console.log('[EventDetailScreen] Erro ao fazer logout no backend:', e);
            }
            Alert.alert('É necessário estar logado para comprar ingressos.', 'Por favor, faça login para continuar.');
            navigation.navigate({ name: 'Login' } as any);
            return;
        }
        console.log('[EventDetailScreen] Navegando para PurchaseScreen com:', {
            ticketId: event.id,
            eventTitle: event.title,
            price: event.price,
            quantity: quantity,
            maxQuantity: 5,
        });
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
                    <Text style={styles.dateText}>
                        {new Date(event.eventDate).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                        })}
                    </Text>
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

                    <Text style={styles.total}>
                      Total: R${(Number(event.price) * quantity).toFixed(2)}
                    </Text>
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
                {/* Pequeno botão para voltar ao Dashboard */}
                <View style={styles.backContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.backText}>Voltar</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

// const styles = StyleSheet.create({
//     root: { flex: 1 },
//     container: { padding: 24 },
//     loadingContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         padding: 24,
//     },
//     banner: { width: '100%', marginBottom: 16 },
//     title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
//     dateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
//     dateText: { marginLeft: 8, color: '#555' },
//     priceBox: { marginVertical: 16, alignItems: 'center' },
//     price: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
//     counter: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
//     counterButton: {
//         fontSize: 20,
//         fontWeight: 'bold',
//         paddingHorizontal: 12,
//         color: '#1976d2',
//     },
//     counterButtonDisabled: { color: '#ccc' },
//     counterValue: { fontSize: 18, marginHorizontal: 12 },
//     total: { fontSize: 18, marginTop: 8 },
//     buyButton: {
//         backgroundColor: '#1976d2',
//         paddingVertical: 14,
//         borderRadius: 8,
//         alignItems: 'center',
//         marginBottom: 24,
//     },
//     buyButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
//     descriptionBox: { marginBottom: 24 },
//     sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
//     description: { fontSize: 16, lineHeight: 22, color: '#444' },
//     address: { fontSize: 14, color: '#666', textAlign: 'center' },
//     errorText: { color: 'red', textAlign: 'center' },
//     backContainer: {
//         alignItems: 'center',
//         marginTop: 16,
//     },
//     backText: {
//         color: '#1976d2',
//         fontSize: 16,
//         fontWeight: '600',
//     },
// });

