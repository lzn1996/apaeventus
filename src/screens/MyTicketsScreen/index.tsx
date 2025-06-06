// src/screens/MyTicketsScreen/index.tsx
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text } from 'react-native';
import styles from './styles';
import EventCard from './components/EventCard';
import { getUserSales } from '../../services/saleService';
import { Sale } from '../../services/saleService';
import { MyEvent } from './types';
import { getUserProfile } from '../../services/userService';

interface GroupedTickets {
    event: MyEvent;
    tickets: Sale[];
}

export default function MyTicketsScreen({ navigation }: any) {
    const [grouped, setGrouped] = useState<GroupedTickets[]>([]);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Busca o perfil do usuário autenticado
            const profile = await getUserProfile();
            setUserProfile(profile);
            const data = await getUserSales();
            // Agrupa os ingressos por ticket.id
            const map = new Map<string, GroupedTickets>();
            data.forEach((sale: Sale) => {
                const ticketId = sale.ticket.id;
                if (!map.has(ticketId)) {
                    map.set(ticketId, {
                        event: {
                            id: ticketId,
                            title: sale.ticket.title,
                            date: new Date(sale.ticket.eventDate).toLocaleDateString('pt-BR'),
                            location: sale.ticket.description,
                            imageUrl: sale.ticket.imageUrl,
                        },
                        tickets: [sale],
                    });
                } else {
                    map.get(ticketId)!.tickets.push(sale);
                }
            });
            // Ordena os eventos por data real do evento (eventDate) em ordem decrescente
            const groupedArr = Array.from(map.values()).sort((a, b) => {
                const dateA = new Date(a.tickets[0].ticket.eventDate).getTime();
                const dateB = new Date(b.tickets[0].ticket.eventDate).getTime();
                return dateB - dateA;
            });
            // Formata a data e o horário para exibição amigável no card
            groupedArr.forEach(group => {
                const eventDate = new Date(group.tickets[0].ticket.eventDate);
                group.event.date = eventDate.toLocaleDateString('pt-BR', {
                    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                });
                group.event.time = eventDate.toLocaleTimeString('pt-BR', {
                    hour: '2-digit', minute: '2-digit',
                });
            });
            setGrouped(groupedArr);
        } catch (e: any) {
            // Se for erro de autenticação, redireciona para login
            if (e?.response?.status === 401 || e?.message?.includes('autenticado')) {
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                return;
            }
            setError('Erro ao carregar seus ingressos ou perfil. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleEventPress = (group: GroupedTickets) => {
        // Injeta os dados do usuário autenticado no campo buyer de cada ingresso
        const buyer = userProfile
            ? {
                    name: userProfile.name || '',
                    email: userProfile.email || '',
                    phone: userProfile.cellphone || userProfile.phone || '',
                }
            : { name: '', email: '', phone: '' };
        const tickets = group.tickets.map((sale) => ({
            eventImageUrl: sale.ticket.imageUrl,
            id: sale.id,
            type: sale.ticket.title,
            code: sale.id,
            used: sale.used,
            qrCodeUrl: sale.qrCodeUrl,
            pdfUrl: sale.pdfUrl,
            qrCodeDataUrl: sale.qrCodeDataUrl,
            eventDate: sale.ticket.eventDate,
            buyer,
            boughtAt: sale.createdAt,
            price: sale.ticket.price,
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
            <View style={styles.header}>
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
