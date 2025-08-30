// src/screens/MyTicketsScreen/index.tsx
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, BackHandler } from 'react-native';
import styles from './styles';
import EventCard from './components/EventCard';
import { MyEvent } from './types';
import { getUserProfile } from '../../services/userService';
import { getUserSales } from '../../services/saleService';
import { Sale } from '../../services/saleService';
import NetInfo from '@react-native-community/netinfo';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';

interface GroupedTickets {
    event: MyEvent;
    tickets: any[];
}

export default function MyTicketsScreen({ navigation }: any) {
    const [grouped, setGrouped] = useState<GroupedTickets[]>([]);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(true);

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (!isConnected) {
                setError('Sem conexão com a internet. Conecte-se para ver seus ingressos.');
                setLoading(false);
                return;
            }

            // Busca perfil do usuário
            const profile = await getUserProfile();
            setUserProfile(profile);

            // Busca vendas/ingressos do usuário na API
            const sales: Sale[] = await getUserSales();

            const buyer_name = profile?.name || '';
            const buyer_email = profile?.email || '';
            const buyer_phone = profile?.cellphone || profile?.phone || '';

            // Agrupa os ingressos por evento
            const groupedMap: { [eventId: string]: GroupedTickets } = {};

            for (const sale of sales) {
                const eventId = sale.ticket.id;
                const ticketId = sale.id;

                if (!groupedMap[eventId]) {
                    groupedMap[eventId] = {
                        event: {
                            id: eventId,
                            title: sale.ticket.title || '',
                            date: sale.ticket.eventDate.split('T')[0],
                            time: sale.ticket.eventDate.split('T')[1]?.slice(0, 5) || '',
                            location: sale.ticket.description || '',
                            imageUrl: sale.ticket.imageUrl || '',
                        },
                        tickets: [],
                    };
                }

                groupedMap[eventId].tickets.push({
                    id: ticketId,
                    event_id: eventId,
                    type: sale.ticket.title || '',
                    code: ticketId,
                    used: sale.used,
                    qrCodeUrl: sale.qrCodeUrl || '',
                    pdfUrl: sale.pdfUrl || '',
                    qrCodeDataUrl: sale.qrCodeDataUrl || '',
                    buyer_name,
                    buyer_email,
                    buyer_phone,
                    boughtAt: sale.createdAt || '',
                    price: sale.ticket.price || 0,
                });
            }

            // Mapeia para array e ordena por data
            const groupedArr: GroupedTickets[] = Object.values(groupedMap);
            groupedArr.sort((a, b) => {
                const dateA = new Date(`${a.event.date}${a.event.time ? 'T' + a.event.time : ''}`).getTime();
                const dateB = new Date(`${b.event.date}${b.event.time ? 'T' + b.event.time : ''}`).getTime();
                return dateB - dateA;
            });

            // Formata a data e o horário para exibição amigável no card
            groupedArr.forEach(group => {
                const dateStr = group.event.date;
                const timeStr = group.event.time;
                let eventDate: Date;
                if (dateStr && timeStr) {
                    eventDate = new Date(`${dateStr}T${timeStr}`);
                } else if (dateStr) {
                    eventDate = new Date(dateStr);
                } else {
                    eventDate = new Date();
                }
                group.event.displayDate = eventDate.toLocaleDateString('pt-BR', {
                    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                });
                group.event.displayTime = eventDate.toLocaleTimeString('pt-BR', {
                    hour: '2-digit', minute: '2-digit',
                });
            });

            setGrouped(groupedArr);
        } catch (e: any) {
            console.log('Erro ao buscar dados:', e);
            setError('Erro ao carregar seus ingressos. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }, [isConnected]);

    // Atualiza os ingressos sempre que a tela ganhar foco
    useFocusEffect(
        React.useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(!!state.isConnected);
        });
        return () => unsubscribe();
    }, []);

    // Garante que o botão físico de voltar do Android leve para o Dashboard
    useEffect(() => {
        const onBackPress = () => {
            navigation.replace('Dashboard');
            return true;
        };
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
    }, [navigation]);

    const handleEventPress = (group: GroupedTickets) => {
        // Injeta os dados do usuário autenticado no campo buyer de cada ingresso
        const buyer = userProfile
            ? {
                    name: userProfile.name || '',
                    email: userProfile.email || '',
                    phone: userProfile.cellphone || userProfile.phone || '',
                }
            : { name: '', email: '', phone: '' };

        // Passa todos os ingressos daquele evento
        const tickets = group.tickets.map((ticket) => ({
            eventImageUrl: group.event.imageUrl,
            id: ticket.id,
            type: ticket.type,
            code: ticket.code,
            used: ticket.used,
            qrCodeUrl: ticket.qrCodeUrl,
            pdfUrl: ticket.pdfUrl,
            qrCodeDataUrl: ticket.qrCodeDataUrl,
            eventDate: (group.event.date && group.event.time)
                ? `${group.event.date}T${group.event.time}`
                : group.event.date || '',
            buyer,
            boughtAt: ticket.boughtAt,
            price: ticket.price,
        }));

        navigation.navigate('TicketsByEvent', {
            eventId: group.event.id,
            eventTitle: group.event.title,
            tickets,
        });
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Meus Ingressos</Text>
                </View>
                <Text>Carregando...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Meus Ingressos</Text>
                </View>
                <Text style={styles.errorText}>{error}</Text>
                <Text style={styles.emptyText}>Verifique sua conexão ou faça login novamente.</Text>
                <Text style={styles.retryText} onPress={fetchData}>Tentar novamente</Text>
            </View>
        );
    }

    if (!userProfile) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Meus Ingressos</Text>
                </View>
                <Text>Carregando perfil do usuário...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Banner de status de conexão */}
            {!isConnected && (
                <View style={styles.connectionBannerContainer}>
                    <Text style={[styles.connectionBanner, styles.connectionOffline]}>
                        Sem conexão - conecte-se para ver seus ingressos
                    </Text>
                </View>
            )}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.replace('Dashboard')}
                    style={styles.backButton}
                >
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Meus Ingressos</Text>
            </View>
            <FlatList
                data={grouped}
                keyExtractor={item => item.event.id}
                renderItem={({ item }) => (
                    <EventCard event={item.event} onPress={() => handleEventPress(item)} />
                )}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.emptyText}>Você ainda não possui ingressos.</Text>}
            />
        </View>
    );
}
