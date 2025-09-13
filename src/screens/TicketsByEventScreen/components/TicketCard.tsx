// src/screens/TicketsByEventScreen/components/TicketCard.tsx
import React from 'react';
import { View, Text, Image, ViewStyle, StyleProp } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { MaterialIcons, Feather, AntDesign } from '@expo/vector-icons';
import styles from '../styles';
import { Ticket } from '../types';

function maskPhone(phone: string) {
    if (!phone) {
        return '';
    }
    // Remove tudo que não for número
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        // Celular: (99) 99999-9999
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    } else if (cleaned.length === 10) {
        // Fixo: (99) 9999-9999
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}`;
    }
    return phone;
}

interface TicketCardProps {
    ticket: Ticket;
    index: number; // posição do ingresso na lista
    total: number; // total de ingressos
    style?: StyleProp<ViewStyle>;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, index, total, style }) => {
    return (
        <View style={[styles.ticketCardContainer, style]}>
            {/* Ingresso X de Y */}
            <Text style={styles.ticketCountText}>
                {`Ingresso ${index + 1} de ${total}`}
            </Text>

            {/* Badge para ingresso usado */}
            {ticket.used && (
                <View style={styles.usedTicketBadge}>
                    <Text style={styles.usedTicketText}>
                        ✓ INGRESSO UTILIZADO
                    </Text>
                </View>
            )}

            {/* Status pendente de sync */}
            {ticket.pendingSync && (
                <View style={styles.pendingSyncBadge}>
                    <Text style={styles.pendingSyncText}>
                        Pendente de sincronização
                    </Text>
                </View>
            )}

            {/* Header com imagem do evento */}
            {ticket.eventImageUrl && (
                <Image
                    source={{ uri: ticket.eventImageUrl }}
                    style={styles.eventImage}
                    resizeMode="cover"
                />
            )}
            <View style={styles.eventInfoRow}>
                <Text style={styles.eventTitle}>{ticket.type}</Text>
                <Text style={styles.eventDate}>
                    {new Date(ticket.eventDate).toLocaleDateString('pt-BR')} -{' '}
                    {new Date(ticket.eventDate).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </Text>
            </View>
            <View style={styles.ticketCardBox}>
                <View style={styles.ticketInfoVertical}>
                    {/* Informações do comprador */}
                    <View style={styles.infoSection}>
                        <View style={styles.infoItem}>
                            <AntDesign name="user" size={18} color="#4A90E2" />
                            <Text style={styles.buyerName}>{ticket.buyer.name}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <MaterialIcons name="email" size={18} color="#E74C3C" />
                            <Text style={styles.buyerEmail}>{ticket.buyer.email}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Feather name="phone" size={18} color="#27AE60" />
                            <Text style={styles.buyerPhone}>{maskPhone(ticket.buyer.phone)}</Text>
                        </View>
                    </View>

                    {/* Informações da compra */}
                    <View style={styles.infoSection}>
                        <View style={styles.infoItem}>
                            <AntDesign name="calendar" size={18} color="#9B59B6" />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Comprado em</Text>
                                <Text style={styles.infoValue}>{new Date(ticket.boughtAt).toLocaleDateString('pt-BR')}</Text>
                            </View>
                        </View>
                        <View style={styles.infoItem}>
                            <MaterialIcons name="attach-money" size={20} color="#F39C12" />
                            <Text style={styles.price}>R$ {ticket.price?.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.qrCodeContainer}>
                    {ticket.qrCodeDataUrl ? (
                        <Image
                            source={{ uri: ticket.qrCodeDataUrl }}
                            style={[styles.qrCodeImage, ticket.used && styles.qrCodeImageUsed]}
                            resizeMode="contain"
                        />
                    ) : ticket.qrCodeUrl ? (
                        <Image
                            source={{ uri: ticket.qrCodeUrl }}
                            style={[styles.qrCodeImage, ticket.used && styles.qrCodeImageUsed]}
                            resizeMode="contain"
                        />
                    ) : (
                        <View style={styles.qrCodeContainer}>
                            <QRCode value={ticket.code} size={180} />
                            {ticket.used && (
                                <View style={styles.qrCodeUsedOverlay}>
                                    <Text style={styles.qrCodeUsedText}>USADO</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
                <Text style={styles.ticketCode}>{ticket.code}</Text>
                {/* Botão para marcar/desmarcar uso offline removido */}
            </View>
        </View>
    );
};

export default TicketCard;
