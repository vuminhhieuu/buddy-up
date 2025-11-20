import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../styles';

export const BuddyBackground: React.FC = () => {
  const { theme } = useTheme();
  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: -1 }]}>
      <LinearGradient
        colors={[theme.colors.primary[50], theme.colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={{
          position: 'absolute',
          width: 260,
          height: 260,
          borderRadius: 130,
          backgroundColor: theme.colors.primary[200],
          opacity: 0.2,
          top: -60,
          right: -40,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: theme.colors.secondary[200],
          opacity: 0.18,
          bottom: 120,
          left: -60,
        }}
      />
    </View>
  );
};
