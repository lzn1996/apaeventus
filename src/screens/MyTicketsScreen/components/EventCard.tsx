// src/screens/MyTicketsScreen/components/EventCard.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MyEvent } from '../types';
import styles from '../styles';

interface EventCardProps {
    event: MyEvent;
    onPress: () => void;
}

const getEventStatus = (event: MyEvent) => {
    const now = new Date();
    let eventDate: Date;
    if (event.date && event.time) {
        eventDate = new Date(`${event.date}T${event.time}`);
    } else if (event.date) {
        eventDate = new Date(event.date);
    } else {
        return { text: 'Data não informada', color: '#888' };
    }

    const isSameDay = now.toDateString() === eventDate.toDateString();
    const timeDifference = eventDate.getTime() - now.getTime();
    const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));

    if (isSameDay) {
        return { text: 'Em andamento', color: '#43a047' };
    }

    if (now < eventDate) {
        if (daysDifference <= 3) {
            return { text: 'Será realizado em breve', color: '#1976d2' };
        } else {
            return { text: 'Evento agendado', color: '#4caf50' };
        }
    }

    return { text: 'Já aconteceu', color: '#e53935' };
};

const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
    const status = getEventStatus(event);
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            {event.imageUrl && (
                <Image source={{ uri: event.imageUrl }} style={styles.cardImage} />
            )}
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{event.title}</Text>
                <Text style={styles.cardDate}>
                    {event.displayDate || event.date}
                    {event.displayTime ? ` - ${event.displayTime}` : event.time ? ` • ${event.time}` : ''}
                </Text>
                {/* <Text style={styles.cardLocation}>{event.location}</Text> */}
                <Text style={[styles.eventStatus, { color: status.color }]}>Status do Evento: {status.text}</Text>
            </View>
        </TouchableOpacity>
    );
};

export default EventCard;
