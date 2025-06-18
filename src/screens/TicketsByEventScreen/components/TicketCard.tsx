// src/screens/TicketsByEventScreen/components/TicketCard.tsx
import React from 'react';
import { View, Text, Image, ViewStyle, StyleProp } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import styles from '../styles';
import { Ticket } from '../types';

function maskPhone(phone: string) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

interface TicketCardProps {
  ticket: Ticket;
  index: number;
  total: number;
  style?: StyleProp<ViewStyle>;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, index, total, style }) => (
  <View style={[styles.ticketCardContainer, style]}>
    <Text style={styles.ticketCountText}>
      {`Ingresso ${index + 1} de ${total}`}
    </Text>
    {ticket.pendingSync && (
      <View style={styles.pendingSyncBadge}>
        <Text style={styles.pendingSyncText}>
          Pendente de sincronização
        </Text>
      </View>
    )}
    {ticket.eventImageUrl && (
      <Image
        source={{ uri: ticket.eventImageUrl }}
        style={styles.eventImage}
        resizeMode="cover"
      />
    )}
    <View style={styles.eventInfoRow}>
      <Text style={styles.eventTitle}>{ticket.type}</Text>

    </View>
    <View style={styles.ticketCardBox}>
      <View style={styles.ticketInfoRow}>
        <View style={styles.ticketInfoLeft}>
          <Text style={styles.buyerName}>{ticket.buyer.name}</Text>
          <Text style={styles.buyerEmail}>{ticket.buyer.email}</Text>
          <Text style={styles.buyerPhone}>{maskPhone(ticket.buyer.phone)}</Text>
        </View>
        <View style={styles.ticketInfoRight}>
          {/* Removido o "Comprado em" devido a datas inválidas */}
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

export default TicketCard;
