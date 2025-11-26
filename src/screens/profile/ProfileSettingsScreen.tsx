import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer, Text, Spacer } from '../../components/ui';
import { useTranslation } from 'react-i18next';
import type { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileSettings'>;
type RouteProps = RouteProp<ProfileStackParamList, 'ProfileSettings'>;

const SECTION_TRANSLATION_KEYS: Record<string, string> = {
  profile: 'settings.editProfile',
  friends: 'settings.friends',
  notifications: 'settings.notifications',
  security: 'settings.security',
  language: 'settings.language',
  help: 'settings.help',
};

export const ProfileSettingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { t } = useTranslation('profile');
  const section = route.params?.section ?? 'profile';
  const translationKey = SECTION_TRANSLATION_KEYS[section] ?? 'profileScreen.settings.title';
  const title = t(translationKey);

  return (
    <ScreenContainer scroll>
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Text variant="body">← {t('common.back')}</Text>
      </Pressable>
      <Spacer size={4} />
      <Text variant="h4" style={styles.title}>
        {title}
      </Text>
      <Spacer size={3} />
      <Text variant="body" color="secondary">
        {t('settings.placeholder')}
      </Text>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
  },
  title: {
    fontWeight: '700',
  },
});
