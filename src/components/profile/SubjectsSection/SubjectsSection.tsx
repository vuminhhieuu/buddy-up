import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';
import { Icon } from '../../ui/Icon/Icon';
import { SubjectCard } from '../../ui/SubjectCard/SubjectCard';
import { Spacer } from '../../ui/Spacer/Spacer';
import type { Subject } from '../../../types/profile';
import { useTranslation } from 'react-i18next';

export type SubjectsSectionProps = {
  subjects: Subject[];
  onSubjectPress?: (subject: Subject) => void;
  style?: ViewStyle;
};

const SubjectsSectionComponent: React.FC<SubjectsSectionProps> = ({
  subjects,
  onSubjectPress,
  style,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('profile');

  return (
    <View style={[styles.container, { paddingHorizontal: theme.spacing[3] }, style]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="book" size={20} color={theme.colors.primary[500]} />
          <Spacer size={2} horizontal />
          <Text
            variant="h4"
            style={[
              styles.title,
              {
                fontFamily: theme.typography.families.display,
                fontWeight: theme.typography.weights.bold,
              },
            ]}
          >
            {t('subjects.title')}
          </Text>
        </View>
      </View>

      <Spacer size={4} />

      {subjects.length === 0 ? (
        <Text variant="bodySmall" color="secondary">
          {t('subjects.empty')}
        </Text>
      ) : (
        <View style={styles.subjectsList}>
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onPress={() => onSubjectPress?.(subject)}
              style={styles.subjectCard}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export const SubjectsSection = React.memo(SubjectsSectionComponent);

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
  },
  subjectsList: {},
  subjectCard: {
    marginBottom: 12,
  },
});
