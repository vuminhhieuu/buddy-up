import React, { useState, useMemo } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import i18n from '../../../config/i18n';
import { ScreenContainer, Text, Spacer, Button, RadioButton } from '../../../components/ui';
import { BackButton } from '../../../components/navigation';
import { useTheme } from '../../../styles';
import { groupStep2Schema } from '../../../utils/validation';
import { TopicSelector } from '../../../components/groups';

export type Step2TopicsData = {
  topics: string[];
  student_level: 'all' | 'beginner' | 'intermediate' | 'advanced';
  main_language: string;
  expected_activity_frequency: 'daily' | 'few_times_week' | 'weekly' | 'flexible';
};

export type Step2TopicsScreenProps = {
  initialData?: Partial<Step2TopicsData>;
  onNext: (data: Step2TopicsData) => void;
  onBack: () => void;
};

export const Step2TopicsScreen: React.FC<Step2TopicsScreenProps> = ({
  initialData,
  onNext,
  onBack,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('groups');

  const styles = useMemo(() => {
    return {
      header: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        marginBottom: 0,
      },
      headerTitle: {
        flex: 1,
        textAlign: 'center' as const,
        fontWeight: '700' as const,
      },
      progressBarContainer: {
        height: 4,
        backgroundColor: theme.colors.border,
        borderRadius: 2,
        marginTop: theme.spacing[1],
        overflow: 'hidden' as const,
      },
      progressBar: {
        height: 4,
        width: '50%',
        backgroundColor: theme.colors.primary[500],
        borderRadius: 2,
      },
      content: {
        paddingVertical: theme.spacing[3],
      },
    };
  }, [theme]);

  return (
    <ScreenContainer scroll={false} contentContainerStyle={{ paddingTop: 0 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <BackButton onPress={onBack} />
            <Text variant="h4" style={styles.headerTitle}>
              {t('step2.title')}
            </Text>
            <Text
              variant="body"
              color="primary"
              numberOfLines={1}
              style={{
                fontWeight: '700' as const,
                fontSize: theme.typography.scale.sm,
                minWidth: 50,
                textAlign: 'right',
              }}
            >
              {t('stepIndicator2')}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar} />
          </View>

          <Spacer size={4} />

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Formik
              initialValues={{
                topics: initialData?.topics || [],
                student_level: initialData?.student_level || 'all',
                expected_activity_frequency:
                  initialData?.expected_activity_frequency || 'few_times_week',
              }}
              validationSchema={groupStep2Schema}
              onSubmit={(values) => {
                // Get current app language, default to 'vi' if not set
                const currentLanguage = i18n.language || 'vi';
                const mainLanguage = currentLanguage.startsWith('vi') ? 'vi' : 'en';

                onNext({
                  topics: values.topics,
                  student_level: values.student_level as any,
                  main_language: mainLanguage,
                  expected_activity_frequency: values.expected_activity_frequency as any,
                });
              }}
            >
              {({ handleSubmit, setFieldValue, values, errors, touched }) => (
                <>
                  {/* Topics Section */}
                  <View style={{ marginBottom: theme.spacing[6] }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: theme.spacing[2],
                      }}
                    >
                      <Text variant="body" style={{ fontWeight: '600' as const }}>
                        {t('step2.mainTopics')}
                      </Text>
                      <Text variant="body" color="error" style={{ marginLeft: theme.spacing[1] }}>
                        *
                      </Text>
                    </View>
                    <Text
                      variant="bodySmall"
                      color="secondary"
                      style={{ marginBottom: theme.spacing[3] }}
                    >
                      {t('step2.topicsHelper')}
                    </Text>
                    <TopicSelector
                      selectedTopics={values.topics}
                      onTopicsChange={(topics) => setFieldValue('topics', topics)}
                      maxSelection={3}
                      searchPlaceholder={t('step2.searchTopics')}
                      selectedCountLabel={t('step2.selectedCount')}
                    />
                    {touched.topics && errors.topics && (
                      <Text variant="caption" color="error" style={{ marginTop: theme.spacing[1] }}>
                        {typeof errors.topics === 'string'
                          ? t(errors.topics)
                          : String(errors.topics)}
                      </Text>
                    )}
                  </View>

                  {/* Student Level Section */}
                  <View style={{ marginBottom: theme.spacing[6] }}>
                    <Text
                      variant="body"
                      style={{ fontWeight: '600' as const, marginBottom: theme.spacing[3] }}
                    >
                      {t('step2.studentLevel')}
                    </Text>
                    <View style={{ gap: theme.spacing[2] }}>
                      <RadioButton
                        selected={values.student_level === 'all'}
                        onPress={() => setFieldValue('student_level', 'all')}
                        label={t('step2.allLevels')}
                      />
                      <View
                        style={{
                          paddingLeft: theme.spacing[3],
                          marginTop: -theme.spacing[1],
                          marginBottom: theme.spacing[2],
                        }}
                      >
                        <Text variant="bodySmall" color="secondary">
                          {t('step2.allLevelsDescription')}
                        </Text>
                      </View>

                      <RadioButton
                        selected={values.student_level === 'beginner'}
                        onPress={() => setFieldValue('student_level', 'beginner')}
                        label={t('step2.beginner')}
                      />
                      <View
                        style={{
                          paddingLeft: theme.spacing[3],
                          marginTop: -theme.spacing[1],
                          marginBottom: theme.spacing[2],
                        }}
                      >
                        <Text variant="bodySmall" color="secondary">
                          {t('step2.beginnerDescription')}
                        </Text>
                      </View>

                      <RadioButton
                        selected={values.student_level === 'intermediate'}
                        onPress={() => setFieldValue('student_level', 'intermediate')}
                        label={t('step2.intermediate')}
                      />
                      <View
                        style={{
                          paddingLeft: theme.spacing[3],
                          marginTop: -theme.spacing[1],
                          marginBottom: theme.spacing[2],
                        }}
                      >
                        <Text variant="bodySmall" color="secondary">
                          {t('step2.intermediateDescription')}
                        </Text>
                      </View>

                      <RadioButton
                        selected={values.student_level === 'advanced'}
                        onPress={() => setFieldValue('student_level', 'advanced')}
                        label={t('step2.advanced')}
                      />
                      <View
                        style={{
                          paddingLeft: theme.spacing[3],
                          marginTop: -theme.spacing[1],
                          marginBottom: theme.spacing[2],
                        }}
                      >
                        <Text variant="bodySmall" color="secondary">
                          {t('step2.advancedDescription')}
                        </Text>
                      </View>
                    </View>
                    {touched.student_level && errors.student_level && (
                      <Text variant="caption" color="error" style={{ marginTop: theme.spacing[1] }}>
                        {t(errors.student_level as string)}
                      </Text>
                    )}
                  </View>

                  {/* Activity Frequency Section */}
                  <View style={{ marginBottom: theme.spacing[6] }}>
                    <Text
                      variant="body"
                      style={{ fontWeight: '600' as const, marginBottom: theme.spacing[2] }}
                    >
                      {t('step2.expectedActivityFrequency')}
                    </Text>
                    <Text
                      variant="bodySmall"
                      color="secondary"
                      style={{ marginBottom: theme.spacing[3] }}
                    >
                      {t('step2.activityFrequencyHelper')}
                    </Text>
                    <View style={{ gap: theme.spacing[2] }}>
                      <RadioButton
                        selected={values.expected_activity_frequency === 'daily'}
                        onPress={() => setFieldValue('expected_activity_frequency', 'daily')}
                        label={t('step2.daily')}
                      />
                      <View
                        style={{
                          paddingLeft: theme.spacing[3],
                          marginTop: -theme.spacing[1],
                          marginBottom: theme.spacing[2],
                        }}
                      >
                        <Text variant="bodySmall" color="secondary">
                          {t('step2.dailyDescription')}
                        </Text>
                      </View>

                      <RadioButton
                        selected={values.expected_activity_frequency === 'few_times_week'}
                        onPress={() =>
                          setFieldValue('expected_activity_frequency', 'few_times_week')
                        }
                        label={t('step2.fewTimesWeek')}
                      />
                      <View
                        style={{
                          paddingLeft: theme.spacing[3],
                          marginTop: -theme.spacing[1],
                          marginBottom: theme.spacing[2],
                        }}
                      >
                        <Text variant="bodySmall" color="secondary">
                          {t('step2.fewTimesWeekDescription')}
                        </Text>
                      </View>

                      <RadioButton
                        selected={values.expected_activity_frequency === 'weekly'}
                        onPress={() => setFieldValue('expected_activity_frequency', 'weekly')}
                        label={t('step2.weekly')}
                      />
                      <View
                        style={{
                          paddingLeft: theme.spacing[3],
                          marginTop: -theme.spacing[1],
                          marginBottom: theme.spacing[2],
                        }}
                      >
                        <Text variant="bodySmall" color="secondary">
                          {t('step2.weeklyDescription')}
                        </Text>
                      </View>

                      <RadioButton
                        selected={values.expected_activity_frequency === 'flexible'}
                        onPress={() => setFieldValue('expected_activity_frequency', 'flexible')}
                        label={t('step2.flexible')}
                      />
                      <View
                        style={{
                          paddingLeft: theme.spacing[3],
                          marginTop: -theme.spacing[1],
                          marginBottom: theme.spacing[2],
                        }}
                      >
                        <Text variant="bodySmall" color="secondary">
                          {t('step2.flexibleDescription')}
                        </Text>
                      </View>
                    </View>
                    {touched.expected_activity_frequency && errors.expected_activity_frequency && (
                      <Text variant="caption" color="error" style={{ marginTop: theme.spacing[1] }}>
                        {typeof errors.expected_activity_frequency === 'string'
                          ? t(errors.expected_activity_frequency)
                          : String(errors.expected_activity_frequency)}
                      </Text>
                    )}
                  </View>

                  {/* Info Text */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      backgroundColor: theme.colors.primary[50],
                      padding: theme.spacing[3],
                      borderRadius: theme.radius.md,
                      marginBottom: theme.spacing[4],
                    }}
                  >
                    <Text variant="bodySmall" color="primary">
                      ℹ️ {t('step2.canChangeLater')}
                    </Text>
                  </View>

                  {/* Navigation Buttons */}
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: theme.spacing[3],
                      marginBottom: theme.spacing[4],
                    }}
                  >
                    <Button
                      label={t('back')}
                      variant="outline"
                      onPress={onBack}
                      style={{ flex: 1 }}
                    />
                    <Button
                      label={t('continue')}
                      onPress={() => handleSubmit()}
                      disabled={values.topics.length === 0}
                      style={{ flex: 1 }}
                    />
                  </View>
                </>
              )}
            </Formik>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};
