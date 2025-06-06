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
      setGrouped(Array.from(map.values()));
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
    return <View style={styles.container}><Text>Carregando...</Text></View>;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>{error}</Text>
        <Text>Verifique sua conexão ou faça login novamente.</Text>
        <Text onPress={fetchData}>Tentar novamente</Text>
      </View>
    );
  }

  if (!userProfile) {
    return <View style={styles.container}><Text>Carregando perfil do usuário...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={grouped}
        keyExtractor={item => item.event.id}
        renderItem={({ item }) => (
          <EventCard event={item.event} onPress={() => handleEventPress(item)} />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}
