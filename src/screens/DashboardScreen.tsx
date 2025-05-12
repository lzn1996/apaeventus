import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

interface DashboardScreenProps {
  navigation: any;
}

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  // Dados estáticos de exemplo; substitua pelos dados reais da API
  const stats = {
    ticketsSold: 124,
    ticketsUsed: 98,
    activeEvents: 3,
  };

  const modules = [
    { key: 'Eventos', screen: 'Events', color: '#FF9500' },
    { key: 'Ingressos', screen: 'Tickets', color: '#34C759' },
    { key: 'Check-in', screen: 'Scan', color: '#007AFF' },
    { key: 'Relatórios', screen: 'Reports', color: '#5856D6' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.welcome}>Olá, Organizadores!</Text>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.shadow]}>
          <Text style={styles.statValue}>{stats.ticketsSold}</Text>
          <Text style={styles.statLabel}>Ingressos Vendidos</Text>
        </View>
        <View style={[styles.statCard, styles.shadow]}>
          <Text style={styles.statValue}>{stats.ticketsUsed}</Text>
          <Text style={styles.statLabel}>Ingressos Usados</Text>
        </View>
        <View style={[styles.statCard, styles.shadow]}>
          <Text style={styles.statValue}>{stats.activeEvents}</Text>
          <Text style={styles.statLabel}>Eventos Ativos</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Módulos</Text>
      <View style={styles.modulesGrid}>
        {modules.map((mod) => (
          <TouchableOpacity
            key={mod.key}
            style={[styles.moduleCard, { backgroundColor: mod.color }]}
            onPress={() => navigation.navigate(mod.screen)}
          >
            <Text style={styles.moduleText}>{mod.key}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  content: {
    padding: 16,
  },
  welcome: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moduleCard: {
    width: '48%',
    height: 100,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  shadow: {
    // sombra iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // sombra Android
    elevation: 3,
  },
});
