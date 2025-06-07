// src/screens/TicketsByEventScreen/components/TicketCard.tsx
import React from 'react';
import { View, Text, Image, ViewStyle, StyleProp } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
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
                <View style={styles.ticketInfoRow}>
                    <View style={styles.ticketInfoLeft}>
                        <Text style={styles.buyerName}>{ticket.buyer.name}</Text>
                        <Text style={styles.buyerEmail}>{ticket.buyer.email}</Text>
                        <Text style={styles.buyerPhone}>{maskPhone(ticket.buyer.phone)}</Text>
                    </View>
                    <View style={styles.ticketInfoRight}>
                        <Text style={styles.boughtAt}>
                            Comprado em:{' '}
                            {new Date(ticket.boughtAt).toLocaleDateString('pt-BR')}
                        </Text>
                        <Text style={styles.price}>R$ {ticket.price?.toFixed(2)}</Text>
                    </View>
                </View>
                <View style={styles.qrCodeContainer}>
                    {ticket.qrCodeDataUrl ? (
                        <Image
                            source={{ uri: ticket.qrCodeDataUrl }}
                            style={styles.qrCodeImage}
                            resizeMode="contain"
                        />
                    ) : ticket.qrCodeUrl ? (
                        <Image
                            source={{ uri: ticket.qrCodeUrl }}
                            style={styles.qrCodeImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <QRCode value={ticket.code} size={180} />
                    )}
                </View>
                <Text style={styles.ticketCode}>{ticket.code}</Text>
            </View>
        </View>
    );
};

export default TicketCard;
