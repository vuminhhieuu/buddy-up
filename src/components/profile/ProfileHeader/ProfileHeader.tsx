import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';
import { Avatar } from '../../ui/Avatar/Avatar';
import { LevelBadge } from '../../ui/LevelBadge/LevelBadge';
import { Icon } from '../../ui/Icon/Icon';
import { Spacer } from '../../ui/Spacer/Spacer';
import type { UserProfile } from '../../../types/profile';

export type ProfileHeaderProps = {
  profile: UserProfile;
  onSettingsPress?: () => void;
  onEditAvatarPress?: () => void;
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  onSettingsPress,
  onEditAvatarPress,
}) => {
  const { theme } = useTheme();
  const avatarScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.spring(avatarScale, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: '#E8F5E9',
        },
      ]}
    >
      {/* Settings Button */}
      {onSettingsPress && (
        <Pressable
          onPress={onSettingsPress}
          style={styles.settingsButton}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <View
            style={[
              styles.settingsButtonInner,
              {
                backgroundColor: theme.colors.surface,
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 3,
              },
            ]}
          >
            <Icon name="settings" size={18} color={theme.colors.text.secondary} />
          </View>
        </Pressable>
      )}

      {/* Avatar with Edit Button */}
      <View style={styles.avatarContainer}>
        <Animated.View
          style={[
            styles.avatarWrapper,
            {
              transform: [{ scale: avatarScale }],
            },
          ]}
        >
          <View
            style={[
              styles.avatar,
              {
                borderWidth: 4,
                borderColor: theme.colors.surface,
                shadowColor: theme.colors.primary[500],
                shadowOpacity: 0.3,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 8 },
                elevation: 5,
              },
            ]}
          >
            <Avatar uri={profile.avatarUri} name={profile.name} size="xxxl" />
          </View>
        </Animated.View>
        {onEditAvatarPress && (
          <Pressable
            onPress={onEditAvatarPress}
            style={[
              styles.editButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.primary[500],
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 3,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Edit avatar"
          >
            <Icon name="pencil" size={12} color={theme.colors.primary[500]} />
          </Pressable>
        )}
      </View>

      <Spacer size={4} />

      {/* User Info */}
      <View style={styles.userInfo}>
        <View style={styles.nameContainer}>
          <Text
            variant="h2"
            style={[
              styles.name,
              {
                fontFamily: theme.typography.families.display,
                fontWeight: theme.typography.weights.bold,
              },
            ]}
          >
            {profile.name}
          </Text>
          <Spacer size={2} horizontal />
          <LevelBadge level={profile.level} />
        </View>
        {profile.subtitle && (
          <>
            <Spacer size={1} />
            <Text variant="body" color="secondary" style={styles.subtitle}>
              {profile.subtitle}
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 28,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    top: 28,
    right: 20,
    zIndex: 10,
  },
  settingsButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  userInfo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 28,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
});
