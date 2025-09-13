import React, {useState} from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

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
  const [menuVisible, setMenuVisible] = useState(false);

  const renderAdminButtons = () => {
    if (!isLogged || userRole !== 'ADMIN' || !navigation) {
      return null;
    }

    return (
      <View style={styles.menuContainer}>
        <TouchableOpacity
          onPress={() => setMenuVisible(!menuVisible)}
          style={styles.menuButton}
        >
          <MaterialIcons name="menu" size={24} color="#007AFF" />
        </TouchableOpacity>

        {menuVisible && (
          <View style={styles.dropdown}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('CreateEvent');
                setMenuVisible(false);
              }}
              style={styles.menuItem}
            >
              <MaterialIcons name="add" size={20} color="#007AFF" />
              <Text style={styles.menuText}>Criar Evento</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                navigation.navigate('AdminEvents');
                setMenuVisible(false);
              }}
              style={styles.menuItem}
            >
              <MaterialIcons name="event" size={20} color="#007AFF" />
              <Text style={styles.menuText}>Gerenciar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                navigation.navigate('Scanner');
                setMenuVisible(false);
              }}
              style={[styles.menuItem, styles.lastMenuItem]}
            >
              <MaterialCommunityIcons name="qrcode-scan" size={20} color="#007AFF" />
              <Text style={styles.menuText}>Ler QR Code</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.header}>
      {/* Overlay para fechar menu quando clicar fora */}
      {menuVisible && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setMenuVisible(false)}
          activeOpacity={1}
        />
      )}

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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
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
  menuContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  menuButton: {
    padding: 8,
  },
  dropdown: {
    position: 'absolute',
    top: 40,
    left: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 140,
    zIndex: 1001,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastMenuItem: {
    borderBottomWidth: 0, // Remove a borda do último item
  },
  menuText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
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
