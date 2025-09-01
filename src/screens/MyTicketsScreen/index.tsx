// src/screens/MyTicketsScreen/index.tsx
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, BackHandler, Alert } from 'react-native';
import styles from './styles';
import EventCard from './components/EventCard';
import { MyEvent } from './types';
import { getUserProfile } from '../../services/userService';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useOfflineTickets } from '../../hooks/useOfflineTickets';
import { OfflineNotification } from '../../components/OfflineNotification';

interface GroupedTickets {
    event: MyEvent;
    tickets: any[];
}

export default function MyTicketsScreen({ navigation }: any) {
    const [grouped, setGrouped] = useState<GroupedTickets[]>([]);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);

    const {
        isConnected,
        hasLocalData,
        loading: offlineLoading,
        error: offlineError,
        lastSyncDate,
        syncTickets,
        getLocalTickets,
        clearLocalData,
    } = useOfflineTickets();

    const fetchData = React.useCallback(async () => {
        setLoading(true);

        try {
            // Sempre tenta buscar o perfil do usuário se conectado
            if (isConnected) {
                try {
                    const profile = await getUserProfile();
                    setUserProfile(profile);
                } catch (error) {
                    console.log('Erro ao buscar perfil:', error);
                }
            }

            // Se tem conexão, sincroniza os dados
            if (isConnected) {
                const syncSuccess = await syncTickets();
                if (syncSuccess) {
                    // Busca dados sincronizados do banco local
                    const localGrouped = await getLocalTickets();
                    setGrouped(localGrouped);
                }
            } else if (hasLocalData) {
                // Se não tem conexão mas tem dados locais, usa eles
                const localGrouped = await getLocalTickets();
                setGrouped(localGrouped);
            } else {
                // Sem conexão e sem dados locais
                setGrouped([]);
            }
        } catch (error: any) {
            console.log('Erro ao buscar dados:', error);
        } finally {
            setLoading(false);
        }
    }, [isConnected, hasLocalData, syncTickets, getLocalTickets]);

    // Atualiza os ingressos sempre que a tela ganhar foco
    useFocusEffect(
        React.useCallback(() => {
            fetchData();
        }, [fetchData])
    );

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
            pendingSync: ticket.pendingSync,
        }));

        navigation.navigate('TicketsByEvent', {
            eventId: group.event.id,
            eventTitle: group.event.title,
            tickets,
        });
    };

    const handleClearLocalData = () => {
        Alert.alert(
            'Limpar dados locais',
            'Tem certeza que deseja remover todos os ingressos salvos localmente? Você precisará estar conectado à internet para visualizá-los novamente.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await clearLocalData();
                        if (success) {
                            setGrouped([]);
                            Alert.alert('Sucesso', 'Dados locais removidos com sucesso');
                        } else {
                            Alert.alert('Erro', 'Erro ao remover dados locais');
                        }
                    },
                },
            ]
        );
    };

    if (loading || offlineLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Meus Ingressos</Text>
                </View>
                <Text>Carregando...</Text>
            </View>
        );
    }

    // Determina qual mensagem de erro/estado mostrar
    let statusMessage = '';
    let canShowTickets = false;

    if (!isConnected && !hasLocalData) {
        statusMessage = 'Sem conexão com a internet e nenhum ingresso salvo localmente. Conecte-se para sincronizar seus ingressos.';
    } else if (!isConnected && hasLocalData) {
        statusMessage = 'Modo offline - mostrando ingressos salvos localmente.';
        canShowTickets = true;
    } else if (isConnected && grouped.length === 0) {
        statusMessage = 'Você ainda não possui ingressos.';
    } else {
        canShowTickets = true;
    }

    return (
        <View style={styles.container}>
            <OfflineNotification
                isConnected={isConnected}
                hasLocalData={hasLocalData}
                lastSyncDate={lastSyncDate}
            />

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.replace('Dashboard')}
                    style={styles.backButton}
                >
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Meus Ingressos</Text>
                {/* Botão para limpar dados locais (apenas para debug/manutenção) */}
                {hasLocalData && (
                    <TouchableOpacity
                        onPress={handleClearLocalData}
                        style={styles.clearButton}
                    >
                        <Icon name="trash-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Informações de sincronização */}
            {lastSyncDate && (
                <View style={styles.syncInfoContainer}>
                    <Text style={styles.syncInfoText}>
                        Última sincronização: {lastSyncDate.toLocaleString('pt-BR')}
                    </Text>
                </View>
            )}

            {offlineError && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{offlineError}</Text>
                </View>
            )}

            {canShowTickets ? (
                <FlatList
                    data={grouped}
                    keyExtractor={item => item.event.id}
                    renderItem={({ item }) => (
                        <EventCard event={item.event} onPress={() => handleEventPress(item)} />
                    )}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>Nenhum ingresso encontrado.</Text>}
                />
            ) : (
                <View style={styles.statusContainer}>
                    <Text style={styles.statusText}>{statusMessage}</Text>
                    {!isConnected && (
                        <TouchableOpacity onPress={fetchData} style={styles.retryButton}>
                            <Text style={styles.retryText}>Tentar novamente</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}
