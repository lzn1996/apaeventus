import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface TabBarProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
  isLogged: boolean;
  userRole?: 'ADMIN' | 'USER' | null;
}

export const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onTabPress,
  isLogged,
  userRole,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
      {/* Home */}
      <TouchableOpacity onPress={() => onTabPress('Home')} style={styles.tabItem}>
        <MaterialIcons
          name="home"
          size={26}
          color={activeTab === 'Home' ? '#007AFF' : '#666'}
        />
        <Text style={[styles.tabLabel, activeTab === 'Home' && styles.tabLabelActive]}>
          Home
        </Text>
      </TouchableOpacity>

      {/* Busca */}
      <TouchableOpacity onPress={() => onTabPress('Search')} style={styles.tabItem}>
        <MaterialIcons
          name="search"
          size={26}
          color={activeTab === 'Search' ? '#007AFF' : '#666'}
        />
        <Text style={[styles.tabLabel, activeTab === 'Search' && styles.tabLabelActive]}>
          Busca
        </Text>
      </TouchableOpacity>

      {/* Ingressos */}
      <TouchableOpacity onPress={() => onTabPress('Tickets')} style={styles.tabItem}>
        <MaterialCommunityIcons
          name="ticket-outline"
          size={26}
          color={activeTab === 'Tickets' ? '#007AFF' : '#666'}
        />
        <Text style={[styles.tabLabel, activeTab === 'Tickets' && styles.tabLabelActive]}>
          Ingressos
        </Text>
      </TouchableOpacity>

      {/* Conta / Perfil / Admin */}
      <TouchableOpacity onPress={() => onTabPress('Profile')} style={styles.tabItem}>
        {isLogged ? (
          userRole === 'ADMIN' ? (
            <MaterialCommunityIcons
              name="shield-account"
              size={28}
              color={activeTab === 'Profile' ? '#007AFF' : '#666'}
            />
          ) : (
            <MaterialIcons
              name="account-circle"
              size={28}
              color={activeTab === 'Profile' ? '#007AFF' : '#666'}
            />
          )
        ) : (
          <MaterialIcons
            name="person"
            size={28}
            color={activeTab === 'Profile' ? '#007AFF' : '#666'}
          />
        )}
        <Text style={[styles.tabLabel, activeTab === 'Profile' && styles.tabLabelActive]}>
          {isLogged
            ? userRole === 'ADMIN'
              ? 'Admin'
              : 'Perfil'
            : 'Conta'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: 64,
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    marginTop: 2,
    fontSize: 12,
    color: '#666',
  },
  tabLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
