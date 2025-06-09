// src/screens/MyTicketsScreen/components/EventCard.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MyEvent } from '../types';
import styles from '../styles';

interface EventCardProps {
    event: MyEvent;
    onPress: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => (
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
            <Text style={styles.cardLocation}>{event.location}</Text>
        </View>
    </TouchableOpacity>
);

export default EventCard;
