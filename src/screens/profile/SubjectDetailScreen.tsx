import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { ScreenContainer, Text, Spacer, ProgressBar } from '../../components/ui';
import type { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';
import { useTranslation } from 'react-i18next';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'SubjectDetail'>;
type RouteProps = RouteProp<ProfileStackParamList, 'SubjectDetail'>;

export const SubjectDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { t } = useTranslation('profile');
  const subject = route.params?.subject;

  if (!subject) {
    return (
      <ScreenContainer>
        <Text variant="body" color="secondary">
          {t('subjects.empty')}
        </Text>
      </ScreenContainer>
    );
  }

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
        {subject.name}
      </Text>
      <Spacer size={3} />
      <View style={styles.progressRow}>
        <ProgressBar progress={subject.progress} variant="green" style={styles.progressBar} />
        <Text variant="bodySmall" color="secondary">
          {t('subjectDetail.progress', { value: subject.progress })}
        </Text>
      </View>
      <Spacer size={3} />
      <Text variant="body">{t('subjectDetail.hours', { count: subject.totalHours })}</Text>
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
  progressRow: {
    width: '100%',
  },
  progressBar: {
    marginBottom: 8,
  },
});
