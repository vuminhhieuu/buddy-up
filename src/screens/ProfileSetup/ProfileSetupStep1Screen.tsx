import React, { useMemo, useState } from 'react';
import { View, Alert, Dimensions } from 'react-native';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import {
  ScreenContainer,
  Text,
  Spacer,
  Button,
  Input,
  AvatarPickerSection,
} from '../../components/ui';
import { SkipButton } from '../../components/ui/SkipButton/SkipButton';
import { useTheme } from '../../styles';
import { profileStep1Schema } from '../../utils/validation';
import { uploadAvatarToStorage, updateProfileStep1 } from '../../services/profile';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setProfileData, setCurrentProfileStep } from '../../store/slices/authSlice';

export type ProfileSetupStep1ScreenProps = {
  onNext?: (stepData: { displayName: string; studyGoal: string; avatarUri?: string }) => void;
  onSkip?: () => void;
};

export const ProfileSetupStep1Screen: React.FC<ProfileSetupStep1ScreenProps> = ({
  onNext,
  onSkip,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { userId, displayName: registeredDisplayName, profileData } = useAppSelector((s) => s.auth);
  const { displayName: profileDisplayName, avatarUrl, studyGoal: profileStudyGoal } = profileData;

  const [avatarUri, setAvatarUri] = useState<string | undefined>(avatarUrl);
  const [submitting, setSubmitting] = useState(false);

  const handleAvatarSelected = async (uri: string) => {
    setAvatarUri(uri);
    dispatch(setProfileData({ avatarUrl: uri }));
  };

  const styles = useMemo(() => {
    const containerWidth = Dimensions.get('window').width - theme.spacing[8];
    return {
      header: {
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[2],
      },
      skipButton: {
        alignSelf: 'flex-end' as const,
        paddingVertical: theme.spacing[2],
      },
      titleRow: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        marginBottom: theme.spacing[2],
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
        width: containerWidth * 0.25,
        backgroundColor: theme.colors.primary[500],
        borderRadius: 2,
      },
      content: {
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[6],
      },
    };
  }, [theme]);

  const handleSkip = () => {
    onSkip?.();
  };

  return (
    <ScreenContainer>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          {/* Skip Button */}
          <SkipButton onSkip={handleSkip} style={styles.skipButton} />

          {/* Title Row */}
          <View style={styles.titleRow}>
            <Text
              variant="body"
              color="primary"
              style={{
                fontWeight: '700' as const,
                fontSize: theme.typography.scale.sm,
                color: theme.colors.primary[500],
              }}
            >
              {t('profileSetup.step', { current: 1 })}
            </Text>
            <Text variant="body" color="tertiary" style={{ fontSize: theme.typography.scale.sm }}>
              {t('profileSetup.basicInfo')}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar} />
          </View>
        </View>

        {/* Content - Fixed */}
        <View
          style={{
            flex: 1,
            paddingHorizontal: theme.spacing[4],
            paddingVertical: theme.spacing[3],
            justifyContent: 'space-between',
          }}
        >
          {/* Top Section */}
          <View>
            {/* Title */}
            <Text variant="h5" style={{ fontWeight: '600' as const, textAlign: 'center' as const }}>
              {t('profileSetup.step1Title')}
            </Text>
            <Spacer size={1} />
            <Text variant="body" color="tertiary" style={{ textAlign: 'center' as const }}>
              {t('profileSetup.step1Subtitle')}
            </Text>

            <Spacer size={3} />

            {/* Avatar Picker */}
            <AvatarPickerSection
              avatarUri={avatarUri}
              displayName={registeredDisplayName || profileDisplayName}
              onAvatarSelected={handleAvatarSelected}
              loading={submitting}
            />

            <Spacer size={3} />

            {/* Form and Button */}
            <Formik
              initialValues={{
                displayName: registeredDisplayName || profileDisplayName || '',
                studyGoal: profileStudyGoal || '',
              }}
              validationSchema={profileStep1Schema}
              onSubmit={async (values, { setStatus }) => {
                setStatus(undefined);
                if (!userId) {
                  setStatus(t('common.error'));
                  return;
                }

                try {
                  setSubmitting(true);

                  let uploadedAvatarUrl: string | undefined;

                  if (avatarUri && !avatarUri.startsWith('http')) {
                    uploadedAvatarUrl = await uploadAvatarToStorage(userId, avatarUri);
                  }

                  await updateProfileStep1(
                    userId,
                    values.displayName,
                    values.studyGoal,
                    uploadedAvatarUrl || avatarUri,
                  );

                  dispatch(
                    setProfileData({
                      displayName: values.displayName,
                      studyGoal: values.studyGoal,
                      avatarUrl: uploadedAvatarUrl || avatarUri,
                    }),
                  );

                  dispatch(setCurrentProfileStep(2));

                  onNext?.({
                    displayName: values.displayName,
                    studyGoal: values.studyGoal,
                    avatarUri: uploadedAvatarUrl || avatarUri,
                  });
                } catch (err) {
                  const errorMessage = err instanceof Error ? err.message : t('common.error');
                  setStatus(errorMessage);
                  Alert.alert(t('common.error'), errorMessage);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched, status }) => (
                <>
                  <View>
                    {/* Display Name Input - with required indicator */}
                    <View style={{ marginBottom: theme.spacing[3] }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: theme.spacing[1],
                        }}
                      >
                        <Text variant="body" style={{ fontWeight: '600' as const }}>
                          {t('profileSetup.displayNameLabel')}
                        </Text>
                        <Text variant="body" color="error" style={{ marginLeft: theme.spacing[1] }}>
                          *
                        </Text>
                      </View>
                      <Input
                        placeholder={t('profileSetup.displayNamePlaceholder')}
                        value={values.displayName}
                        onChangeText={handleChange('displayName')}
                        onBlur={handleBlur('displayName')}
                        autoCapitalize="words"
                        autoCorrect={false}
                        editable={!submitting}
                        errorText={
                          touched.displayName && errors.displayName
                            ? t(errors.displayName)
                            : undefined
                        }
                      />
                    </View>

                    {/* Study Goal Input - with required indicator */}
                    <View style={{ marginBottom: theme.spacing[2] }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: theme.spacing[1],
                        }}
                      >
                        <Text variant="body" style={{ fontWeight: '600' as const }}>
                          {t('profileSetup.studyGoalLabel')}
                        </Text>
                        <Text variant="body" color="error" style={{ marginLeft: theme.spacing[1] }}>
                          *
                        </Text>
                      </View>
                      <Input
                        placeholder={t('profileSetup.studyGoalPlaceholder')}
                        value={values.studyGoal}
                        onChangeText={handleChange('studyGoal')}
                        onBlur={handleBlur('studyGoal')}
                        maxLength={200}
                        editable={!submitting}
                        errorText={
                          touched.studyGoal && errors.studyGoal ? t(errors.studyGoal) : undefined
                        }
                      />
                    </View>

                    {/* Status Error */}
                    {status ? (
                      <Text variant="caption" color="error">
                        {status}
                      </Text>
                    ) : null}
                  </View>
                  <View>
                    <Button
                      label={t('profileSetup.nextButton')}
                      onPress={() => handleSubmit()}
                      loading={submitting}
                      disabled={!values.displayName || !values.studyGoal || submitting}
                    />
                  </View>
                </>
              )}
            </Formik>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
};
