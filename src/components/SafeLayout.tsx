import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeLayoutProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: 'default' | 'light-content' | 'dark-content';
  showTabBar?: boolean;
}

export const SafeLayout: React.FC<SafeLayoutProps> = ({
  children,
  backgroundColor = '#f2f2f7',
  statusBarStyle = 'dark-content',
  showTabBar = false,
}) => {
  const insets = useSafeAreaInsets();

  const contentStyle = {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : insets.top,
    paddingBottom: showTabBar ? 0 : insets.bottom,
    backgroundColor,
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={Platform.OS === 'android' ? backgroundColor : 'transparent'}
        translucent={Platform.OS === 'android'}
      />
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
