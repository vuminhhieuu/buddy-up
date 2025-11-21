import React from 'react';
import { ScrollView, StyleSheet, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { ScreenContainer, Text, Spacer, AchievementCard } from '../components/ui';
import type { Achievement } from '../types/profile';
import { useTranslation } from 'react-i18next';
import type { ProfileStackParamList } from '../navigation/ProfileStackNavigator';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileAchievements'>;
type RouteProps = RouteProp<ProfileStackParamList, 'ProfileAchievements'>;

export const ProfileAchievementsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { t } = useTranslation();
  const achievements: Achievement[] = route.params?.achievements ?? [];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text variant="body">← {t('common.back')}</Text>
        </Pressable>
        <Spacer size={4} />
        <Text variant="h4" style={styles.title}>
          {t('profileScreen.achievements.title')}
        </Text>
        <Spacer size={6} />
        {achievements.length === 0 ? (
          <Text variant="body" color="secondary">
            {t('profileScreen.achievements.empty')}
          </Text>
        ) : (
          achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} style={styles.card} />
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  title: {
    fontWeight: '700',
  },
  card: {
    marginBottom: 16,
  },
});
