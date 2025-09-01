import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showLogo?: boolean;
  onBackPress?: () => void;
  rightButtons?: React.ReactNode;
  isLogged?: boolean;
  userRole?: 'ADMIN' | 'USER' | null;
  onLogout?: () => void;
  navigation?: any;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  showLogo = false,
  onBackPress,
  rightButtons,
  isLogged = false,
  userRole,
  onLogout,
  navigation,
}) => {
  const renderAdminButtons = () => {
    if (!isLogged || userRole !== 'ADMIN' || !navigation) {
      return null;
    }

    return (
      <View style={styles.adminButtons}>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateEvent')}
          style={styles.iconButton}
        >
          <MaterialIcons name="add" size={28} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('AdminEvents')}
          style={styles.iconButton}
        >
          <MaterialIcons name="event" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Scanner')}
          style={styles.iconButton}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.header}>
      {/* Left Side */}
      <View style={styles.leftContainer}>
        {showBackButton && onBackPress ? (
          <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
        ) : (
          renderAdminButtons() || <View style={styles.placeholder} />
        )}
      </View>

      {/* Center */}
      <View style={styles.centerContainer}>
        {showLogo ? (
          <Image source={require('../assets/apae_logo.png')} style={styles.logo} />
        ) : title ? (
          <Text style={styles.title}>{title}</Text>
        ) : null}
      </View>

      {/* Right Side */}
      <View style={styles.rightContainer}>
        {rightButtons ? (
          rightButtons
        ) : isLogged && onLogout ? (
          <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
            <MaterialCommunityIcons name="logout" size={24} color="#E74C3C" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 60,
  },
  leftContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 2,
    alignItems: 'center',
  },
  rightContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 8,
  },
  adminButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginHorizontal: 4,
    padding: 4,
  },
  logo: {
    width: 160,
    height: 80,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  logoutButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
});
