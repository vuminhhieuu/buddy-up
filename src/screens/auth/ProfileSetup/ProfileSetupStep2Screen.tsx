import React, { useMemo, useState } from 'react';
import { View, Pressable, Dimensions } from 'react-native';
import { ScreenContainer, Text, ProfileSetupNextButton, Spacer } from '../../../components/ui';
import { SkipButton } from '../../../components/ui/SkipButton/SkipButton';
import { ProcessHeader } from '../../../components/ui';
import { useTheme } from '../../../styles';
import { useTranslation } from 'react-i18next';
import { Formik } from 'formik';
import { profileStep2Schema } from '../../../utils/validation';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { saveStepForUser } from '../../../lib/supabaseHelpers';
import { setProfileData } from '../../../store/slices/authSlice';
import { logger } from '../../../utils/logger';
import { Sun, CloudSun, Moon, PartyPopper, Zap, ArrowLeft } from 'lucide-react-native';
import { BASE_HORIZONTAL_PADDING } from '../../../constants/layout';

export type ProfileSetupStep2ScreenProps = {
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
};

export const ProfileSetupStep2Screen: React.FC<ProfileSetupStep2ScreenProps> = ({
  onNext,
  onBack,
  onSkip,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { profileData, userId } = useAppSelector((s: any) => s.auth);

  const [submitting, setSubmitting] = useState(false);

  const styles = useMemo(() => {
    const baseHorizontalPadding = BASE_HORIZONTAL_PADDING + theme.spacing[4];
    const containerWidth = Dimensions.get('window').width - baseHorizontalPadding * 2;
    return {
      header: {
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[2],
      },
      backButton: {
        width: 35,
        height: 35,
        borderRadius: theme.radius.md,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: theme.spacing[2],
        alignSelf: 'flex-start' as const,
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
        width: containerWidth * 0.5,
        backgroundColor: theme.colors.primary[500],
        borderRadius: 2,
      },
      grid: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        justifyContent: 'space-between' as const,
      },
      tileHalf: {
        width: (containerWidth - theme.spacing[3]) / 2,
        paddingVertical: theme.spacing[5],
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.surface,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginBottom: theme.spacing[3],
      },
      tileFull: {
        width: containerWidth,
        paddingVertical: theme.spacing[5],
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.surface,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginBottom: theme.spacing[3],
      },
      tileActive: {
        borderColor: theme.colors.primary[500],
        backgroundColor: theme.colors.primary[50],
      },
      section: { marginBottom: theme.spacing[6] },
      radioRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingVertical: theme.spacing[4],
        paddingHorizontal: theme.spacing[3],
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        marginBottom: theme.spacing[3],
      },
      radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: theme.colors.border,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginRight: theme.spacing[3],
      },
      radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.colors.primary[500],
      },
      footer: {
        paddingBottom: theme.spacing[4],
      },
      skipButton: {
        alignSelf: 'flex-end' as const,
        paddingVertical: theme.spacing[2],
      },
    };
  }, [theme]);

  type TimeKey = 'morning' | 'noon' | 'evening' | 'weekend' | 'flexible';
  const TIME_OPTIONS: { key: TimeKey; labelKey: string; icon: React.ReactElement }[] = [
    {
      key: 'morning',
      labelKey: 'time.morning',
      icon: <Sun size={22} color={theme.colors.primary[500]} />,
    },
    {
      key: 'noon',
      labelKey: 'time.noon',
      icon: <CloudSun size={22} color={theme.colors.primary[500]} />,
    },
    {
      key: 'evening',
      labelKey: 'time.evening',
      icon: <Moon size={22} color={theme.colors.primary[500]} />,
    },
    {
      key: 'weekend',
      labelKey: 'time.weekend',
      icon: <PartyPopper size={22} color={theme.colors.primary[500]} />,
    },
    {
      key: 'flexible',
      labelKey: 'time.flexible',
      icon: <Zap size={22} color={theme.colors.primary[500]} />,
    },
  ];

  type StyleKey = 'serious' | 'balanced' | 'relaxed';
  const STYLE_OPTIONS: { key: StyleKey; labelKey: string }[] = [
    { key: 'serious', labelKey: 'learningStyle.serious' },
    { key: 'relaxed', labelKey: 'learningStyle.relaxed' },
    { key: 'balanced', labelKey: 'learningStyle.balanced' },
  ];

  return (
    <ScreenContainer scroll>
      <View style={{ flex: 1 }}>
        <ProcessHeader
          leftText={t('profileSetup.step', { current: 2 })}
          rightText={t('profileSetup.headerTitle')}
          progress={0.5}
          leftColor={theme.colors.primary[500]}
          rightColor={theme.colors.text.tertiary}
          leftFontSize={theme.typography.scale.sm}
          rightFontSize={theme.typography.scale.sm}
          leftFontWeight="700"
          rightFontWeight="normal"
          progressBarColor={theme.colors.primary[500]}
          progressBarBgColor={theme.colors.border}
          containerStyle={styles.header}
        >
          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              onPress={onBack || (() => {})}
              style={styles.backButton}
            >
              <ArrowLeft size={18} color={theme.colors.text.primary} />
            </Pressable>

            <SkipButton style={styles.skipButton} />
          </View>
        </ProcessHeader>

        <View
          style={{
            flex: 1,
            paddingHorizontal: theme.spacing[4],
            paddingVertical: theme.spacing[3],
          }}
        >
          {/* <Text variant="h5" style={{ fontWeight: '700' as const }}>
            {t('profileSetup.step2Title')}
          </Text> */}
          <Spacer size={4} />

          <Formik
            initialValues={{
              availableTimes:
                Array.isArray(profileData.availableTimes) && profileData.availableTimes.length > 0
                  ? profileData.availableTimes
                  : [],
              learningStyle: profileData.learningStyle ? profileData.learningStyle : '',
            }}
            validationSchema={profileStep2Schema}
            onSubmit={async (values) => {
              setSubmitting(true);
              try {
                dispatch(
                  setProfileData({
                    availableTimes: values.availableTimes,
                    learningStyle: values.learningStyle as any,
                  }),
                );

                try {
                  if (userId) {
                    const r = await saveStepForUser(
                      userId,
                      {
                        available_times: values.availableTimes,
                        learning_times: values.availableTimes,
                        learning_style: values.learningStyle,
                      },
                      true,
                    );
                    if (r?.error) {
                      logger.warn(
                        'ProfileSetupStep2Screen',
                        '[onSubmit] saveStepForUser error',
                        r.error,
                      );
                    }
                  }
                } catch (err) {
                  logger.warn('ProfileSetupStep2Screen', 'Failed to save step 2 to Supabase', err);
                }

                onNext?.();
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ values, setFieldValue, handleSubmit, errors, touched }) => {
              const toggleTime = (key: TimeKey) => {
                const exists = values.availableTimes.includes(key);
                setFieldValue(
                  'availableTimes',
                  exists
                    ? values.availableTimes.filter((k: string) => k !== key)
                    : [...values.availableTimes, key],
                );
              };

              const renderTimeTile = (key: TimeKey, halfWidth = true) => {
                const active = values.availableTimes.includes(key);
                return (
                  <Pressable
                    key={key}
                    onPress={() => toggleTime(key)}
                    style={[
                      halfWidth ? styles.tileHalf : styles.tileFull,
                      active && styles.tileActive,
                    ]}
                  >
                    {TIME_OPTIONS.find((o) => o.key === key)?.icon}
                    <Spacer size={2} />
                    <Text variant="body" style={{ fontWeight: '600' as const }}>
                      {t(TIME_OPTIONS.find((o) => o.key === key)!.labelKey)}
                    </Text>
                  </Pressable>
                );
              };

              return (
                <>
                  <View style={styles.section}>
                    <Text
                      variant="h5"
                      style={{ fontWeight: '700' as const, marginBottom: theme.spacing[2] }}
                    >
                      {t('profileSetup.availableTimesLabel')}
                    </Text>
                    <Spacer size={3} />
                    <Text variant="body" color="tertiary">
                      {t('profileSetup.step2Subtitle1')}
                    </Text>
                    <Spacer size={3} />
                    <View style={styles.grid}>
                      {renderTimeTile('morning')}
                      {renderTimeTile('noon')}
                      {renderTimeTile('evening')}
                      {renderTimeTile('weekend')}
                      {renderTimeTile('flexible', false)}
                    </View>
                    {touched.availableTimes && errors.availableTimes ? (
                      <Text variant="caption" color="error" style={{ marginTop: theme.spacing[1] }}>
                        {t(String(errors.availableTimes))}
                      </Text>
                    ) : null}
                  </View>
                  <Spacer size={3} />
                  <View style={styles.section}>
                    <Text
                      variant="h5"
                      style={{ fontWeight: '700' as const, marginBottom: theme.spacing[2] }}
                    >
                      {t('profileSetup.learningStyleLabel')}
                    </Text>
                    <Spacer size={1} />
                    <Text variant="body" color="tertiary">
                      {t('profileSetup.step2Subtitle2')}
                    </Text>
                    <Spacer size={3} />
                    {STYLE_OPTIONS.map((opt) => {
                      const active = values.learningStyle === opt.key;
                      return (
                        <Pressable
                          key={opt.key}
                          onPress={() => setFieldValue('learningStyle', opt.key)}
                          style={styles.radioRow}
                        >
                          <View
                            style={[
                              styles.radioOuter,
                              active && { borderColor: theme.colors.primary[500] },
                            ]}
                          >
                            {active ? <View style={styles.radioInner} /> : null}
                          </View>
                          <Text variant="body">{t(opt.labelKey)}</Text>
                        </Pressable>
                      );
                    })}
                    {touched.learningStyle && errors.learningStyle ? (
                      <Text variant="caption" color="error">
                        {t(String(errors.learningStyle))}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.footer}>
                    <ProfileSetupNextButton
                      onPress={() => handleSubmit()}
                      loading={submitting}
                      disabled={
                        submitting || !values.availableTimes.length || !values.learningStyle
                      }
                    />
                  </View>
                </>
              );
            }}
          </Formik>
        </View>
      </View>
    </ScreenContainer>
  );
};
