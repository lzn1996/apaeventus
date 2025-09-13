import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OfflineNotificationProps {
  isConnected: boolean;
  hasLocalData: boolean;
  lastSyncDate?: Date | null;
}

export const OfflineNotification: React.FC<OfflineNotificationProps> = ({
  isConnected,
  hasLocalData,
  lastSyncDate,
}) => {
  if (isConnected) {
    return null; // Não mostra nada quando está conectado
  }

  return (
    <View style={styles.container}>
      <Ionicons
        name={hasLocalData ? 'cloud-offline' : 'warning'}
        size={16}
        color={hasLocalData ? '#FF9800' : '#F44336'}
        style={styles.icon}
      />
      <View style={styles.textContainer}>
        <Text style={[styles.title, hasLocalData ? styles.warning : styles.error]}>
          {hasLocalData ? 'Modo Offline' : 'Sem Conexão'}
        </Text>
        <Text style={styles.subtitle}>
          {hasLocalData
            ? `Usando dados salvos${lastSyncDate ? ` (${lastSyncDate.toLocaleDateString('pt-BR')})` : ''}`
            : 'Conecte-se para ver seus ingressos'
          }
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  warning: {
    color: '#FF9800',
  },
  error: {
    color: '#F44336',
  },
});
