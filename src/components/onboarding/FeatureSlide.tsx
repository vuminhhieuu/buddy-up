import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../styles';
import { HandshakeLogo } from '../ui/HandshakeLogo';
import { Target, Flame, BookOpen, type LucideIcon } from 'lucide-react-native';

export type CenterIconType = 'logo' | 'target' | 'flame' | 'book' | 'emoji';

export interface FeatureSlideProps {
  emoji1: string;
  emoji2?: string;
  centerIcon: string; // For backward compatibility, but centerIconType takes precedence
  centerIconType?: CenterIconType; // New prop to specify icon type
  title: string;
  description: string;
  backgroundColor: string;
  decorativeIcons?: string[];
}

const ICON_MAP: Record<CenterIconType, LucideIcon | null> = {
  logo: null, // Handled separately
  target: Target,
  flame: Flame,
  book: BookOpen,
  emoji: null, // Handled separately
};

export const FeatureSlide: React.FC<FeatureSlideProps> = ({
  emoji1,
  emoji2,
  centerIcon,
  centerIconType = 'emoji',
  title,
  description,
  backgroundColor,
  decorativeIcons = ['📊', '⭐', '🔥', '✅'],
}) => {
  const { theme } = useTheme();

  const renderCenterIcon = () => {
    if (centerIconType === 'logo') {
      return (
        <HandshakeLogo
          size="small"
          style={{ width: 32, height: 32 }}
          backgroundColor={theme.colors.surface}
        />
      );
    }

    const IconComponent = centerIconType !== 'emoji' ? ICON_MAP[centerIconType] : null;
    if (IconComponent) {
      return <IconComponent size={28} color={theme.colors.primary[600]} strokeWidth={2.5} />;
    }

    // Fallback to emoji
    return <Text style={styles.centerIcon}>{centerIcon}</Text>;
  };

  const renderContentIcon = () => {
    if (centerIconType === 'logo') {
      return (
        <HandshakeLogo
          size="small"
          style={{ width: 28, height: 28 }}
          backgroundColor={theme.colors.surface}
        />
      );
    }

    const IconComponent = centerIconType !== 'emoji' ? ICON_MAP[centerIconType] : null;
    if (IconComponent) {
      return <IconComponent size={24} color={theme.colors.primary[600]} strokeWidth={2.5} />;
    }

    // Fallback to emoji
    return <Text style={styles.contentIcon}>{centerIcon}</Text>;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Top illustration area */}
      <View style={[styles.illustrationContainer, { backgroundColor }]}>
        {/* Small decorative icons */}
        <Text style={[styles.smallIcon, { top: 20, left: 40 }]}>{decorativeIcons[0] ?? '📊'}</Text>
        <Text style={[styles.smallIcon, { top: 30, right: 40 }]}>{decorativeIcons[1] ?? '⭐'}</Text>
        <Text style={[styles.smallIcon, { bottom: 60, left: 30 }]}>
          {decorativeIcons[2] ?? '🔥'}
        </Text>
        <Text style={[styles.smallIcon, { bottom: 50, right: 50 }]}>
          {decorativeIcons[3] ?? '✅'}
        </Text>

        <View style={styles.emojiRow}>
          <View style={styles.emojiBox}>
            <Text style={styles.emoji}>{emoji1}</Text>
          </View>

          {emoji2 && (
            <>
              <View style={styles.centerIconWrapper}>
                <View
                  style={[styles.centerIconCircle, { backgroundColor: theme.colors.primary[400] }]}
                >
                  {renderCenterIcon()}
                </View>
              </View>

              <View style={styles.emojiBox}>
                <Text style={styles.emoji}>{emoji2}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Bottom content area */}
      <View style={styles.contentContainer}>
        <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary[50] }]}>
          {renderContentIcon()}
        </View>

        <Text
          style={[
            styles.title,
            {
              fontFamily: theme.typography.families.display,
              fontWeight: '700',
              color: theme.colors.text.primary,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.description,
            {
              fontFamily: theme.typography.families.body,
              color: theme.colors.text.secondary,
            },
          ]}
        >
          {description}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  illustrationContainer: {
    flex: 7,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emojiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBox: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  emoji: {
    fontSize: 80,
  },
  centerIconWrapper: {
    marginHorizontal: 10,
  },
  centerIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  centerIcon: {
    fontSize: 32,
  },
  smallIcon: {
    fontSize: 20,
    position: 'absolute',
    opacity: 0.3,
  },
  contentContainer: {
    flex: 3,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  contentIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 22,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
