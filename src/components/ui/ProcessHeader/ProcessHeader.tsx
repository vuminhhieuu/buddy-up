import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from '../Text/Text';

export type ProcessHeaderProps = {
  leftText: string;
  rightText: string;
  onSkip?: () => void;
  skipText?: string;
  leftColor?: string;
  rightColor?: string;
  leftFontSize?: number;
  rightFontSize?: number;
  leftFontWeight?: string;
  rightFontWeight?: string;
  progress?: number;
  progressBarColor?: string;
  progressBarBgColor?: string;
  containerStyle?: object;
  children?: React.ReactNode;
};

export const ProcessHeader: React.FC<ProcessHeaderProps> = ({
  leftText,
  rightText,
  onSkip,
  skipText = 'Skip',
  leftColor = '#2196F3',
  rightColor = '#888',
  leftFontSize = 16,
  rightFontSize = 16,
  leftFontWeight = '700',
  rightFontWeight = 'normal',
  progress,
  progressBarColor = '#2196F3',
  progressBarBgColor = '#eee',
  containerStyle,
  children,
}) => {
  const parseFontWeight = (fw: any) => {
    if (typeof fw === 'number') return fw;
    if (fw === 'bold' || fw === 'normal') return fw;
    if (fw === '700' || fw === 700) return 'bold';
    if (fw === '400' || fw === 400) return 'normal';
    const num = Number(fw);
    if (!isNaN(num)) return num;
    return fw;
  };

  return (
    <View style={[styles.header, containerStyle]}>
      {/* Top row: children (usually back button) on left, optional skip on right */}
      <View style={styles.topRow}>
        <View style={styles.leftChild}>{children}</View>
        {onSkip ? (
          <Pressable style={styles.skipButton} onPress={onSkip} accessibilityRole="button">
            <Text variant="body" style={styles.skipText}>
              {skipText}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.row}>
        <Text
          variant="body"
          style={{
            fontWeight: parseFontWeight(leftFontWeight),
            fontSize: leftFontSize,
            color: leftColor,
            flex: 1,
            textAlign: 'left',
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
          adjustsFontSizeToFit={true}
          minimumFontScale={0.7}
        >
          {leftText}
        </Text>
        <Text
          variant="body"
          style={{
            fontWeight: parseFontWeight(rightFontWeight),
            fontSize: rightFontSize,
            color: rightColor,
            marginLeft: 8,
            flex: 1,
            textAlign: 'right',
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
          adjustsFontSizeToFit={true}
          minimumFontScale={0.7}
        >
          {rightText}
        </Text>
      </View>
      {typeof progress === 'number' && (
        <View style={[styles.progressBarContainer, { backgroundColor: progressBarBgColor }]}>
          <View
            style={[
              styles.progressBar,
              { width: `${Math.round(progress * 100)}%`, backgroundColor: progressBarColor },
            ]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  progressBar: {
    borderRadius: 2,
    height: 4,
  },
  progressBarContainer: {
    borderRadius: 2,
    height: 4,
    overflow: 'hidden',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leftChild: {
    flex: 1,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  skipText: {
    color: '#888',
  },
});
