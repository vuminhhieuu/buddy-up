import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../Text/Text';
import { Card } from '../Card/Card';

export type StatCardProps = {
  value: string;
  label: string;
  emoji?: string;
  style?: ViewStyle;
  onPress?: () => void;
};

export const StatCard: React.FC<StatCardProps> = ({ value, label, emoji, style, onPress }) => {
  const { theme } = useTheme();

  const content = (
    <Card
      padding={4}
      elevation="md"
      style={styles.card}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={styles.content}>
        <View style={styles.valueRow}>
          <Text
            variant="h4"
            style={[
              styles.value,
              {
                fontFamily: theme.typography.families.display,
                fontWeight: theme.typography.weights.bold,
              },
            ]}
          >
            {value}
          </Text>
          {emoji && <Text style={styles.emoji}>{emoji}</Text>}
        </View>
        <Text variant="caption" color="secondary" style={styles.label}>
          {label}
        </Text>
      </View>
    </Card>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={style}>
        {content}
      </Pressable>
    );
  }

  return <View style={style}>{content}</View>;
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    flexWrap: 'nowrap',
  },
  value: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  emoji: {
    fontSize: 18,
    lineHeight: 22,
    marginLeft: 4,
    textAlign: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 13,
  },
});
