// src/screens/MyTicketsScreen/index.tsx
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, BackHandler } from 'react-native';
import styles from './styles';
import EventCard from './components/EventCard';
import { getAllEvents, getTicketsByEvent } from '../../database/ticketService';
import type { TicketDB } from '../../database/ticketService';
import { MyEvent } from './types';
import { getUserProfile } from '../../services/userService';
import NetInfo from '@react-native-community/netinfo';
import { syncFromServer } from '../../database/syncService';
import { getUserProfileLocal, saveUserProfileLocal } from '../../database/profileLocalService';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';

interface GroupedTickets {
    event: MyEvent;
    tickets: TicketDB[];
}

export default function MyTicketsScreen({ navigation }: any) {
    const [grouped, setGrouped] = useState<GroupedTickets[]>([]);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(true);
    const [showOnlineBanner, setShowOnlineBanner] = useState(false);

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let profile = userProfile;
            if (isConnected) {
                profile = await getUserProfile();
                setUserProfile(profile);
                // Salva perfil localmente
                if (profile && profile.id) {
                    await saveUserProfileLocal(profile);
                }
            } else {
                // Busca perfil do SQLite local
                profile = await getUserProfileLocal();
                setUserProfile(profile);
            }
            // Busca todos os ingressos do SQLite (de todos os eventos)
            const events = await getAllEvents();
            let allTickets: TicketDB[] = [];
            for (const event of events) {
                const tickets = await getTicketsByEvent(event.id);
                allTickets = allTickets.concat(tickets);
            }

            // Agrupa os ingressos por ticket.event_id
            const groupedMap: { [eventId: string]: GroupedTickets } = {};
            for (const ticket of allTickets) {
                const event = events.find(e => e.id === ticket.event_id);
                if (!event) {
                    continue;
                }
                if (!groupedMap[event.id]) {
                    groupedMap[event.id] = {
                        event: { ...event, location: event.location || '' },
                        tickets: [],
                    };
                }
                groupedMap[event.id].tickets.push(ticket);
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
            // Só exibe erro se estiver online; se offline, ignora erro de rede
            if (isConnected) {
                setError('Erro ao carregar seus ingressos ou perfil. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isConnected]);

    // Atualiza os ingressos sempre que a tela ganhar foco
    useFocusEffect(
        React.useCallback(() => {
            if (isConnected) {
                syncFromServer().then(fetchData);
            } else {
                fetchData();
            }
        }, [isConnected, fetchData])
    );

    useEffect(() => {
        let wasConnected: boolean | null = null;
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(!!state.isConnected);
            if (wasConnected === false && state.isConnected) {
                // Só sincroniza se acabou de voltar para online
                syncFromServer().then(fetchData);
                setShowOnlineBanner(true);
                setTimeout(() => setShowOnlineBanner(false), 5000);
            }
            wasConnected = state.isConnected;
        });
        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            eventImageUrl: group.event.imageUrl, // do evento
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
        // Log para depuração: quantos ingressos estão sendo enviados para o carrossel
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
                <Text style={styles.retryText} onPress={() => {
                    if (isConnected) {
                        syncFromServer().then(fetchData);
                    } else {
                        fetchData();
                    }
                }}>Tentar novamente</Text>
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
            {(!isConnected || showOnlineBanner) && (
                <View style={styles.connectionBannerContainer}>
                    <Text style={[styles.connectionBanner, isConnected ? styles.connectionOnline : styles.connectionOffline]}>
                        {isConnected ? 'Conectado' : 'Sem conexão - exibindo dados offline'}
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
