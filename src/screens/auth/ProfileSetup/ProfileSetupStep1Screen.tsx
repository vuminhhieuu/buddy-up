import React, { useMemo, useState } from 'react';
import {
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react-native';
import {
  ScreenContainer,
  Text,
  Spacer,
  ProfileSetupNextButton,
  Input,
  AvatarPickerSection,
  ProfileSetupHeader,
} from '../../../components/ui';
import { useTheme } from '../../../styles';
import { profileStep1Schema } from '../../../utils/validation';
import { uploadAvatarToStorage, updateProfileStep1 } from '../../../services/profile';
import { saveStepForUser } from '../../../lib/supabaseHelpers';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  setProfileData,
  setCurrentProfileStep,
  setProfileSetupInProgress,
} from '../../../store/slices/authSlice';
import { getCurrentLocation } from '../../../utils/location';
import { showSuccessToast, showErrorToast } from '../../../utils/toast';

export type ProfileSetupStep1ScreenProps = {
  onNext?: (stepData: { displayName: string; studyGoal: string; avatarUri?: string }) => void;
  onSkip?: () => void;
};

export const ProfileSetupStep1Screen: React.FC<ProfileSetupStep1ScreenProps> = ({ onNext }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { userId, displayName: registeredDisplayName, profileData } = useAppSelector((s) => s.auth);
  const { displayName: profileDisplayName, avatarUrl, studyGoal: profileStudyGoal } = profileData;

  const [avatarUri, setAvatarUri] = useState<string | undefined>(avatarUrl);
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleAvatarSelected = async (uri: string) => {
    setAvatarUri(uri);
    dispatch(setProfileData({ avatarUrl: uri }));
  };

  const handleGetCurrentLocation = async (
    setFieldValue: (field: string, value: string) => void,
  ) => {
    try {
      setGettingLocation(true);
      const result = await getCurrentLocation();

      if (result.success && result.location) {
        setFieldValue('location', result.location);
        showSuccessToast(t('profileSetup.locationSuccess'));
      } else {
        const errorMessage = result.error || t('profileSetup.locationError');
        if (result.error === 'Location permission denied') {
          Alert.alert(
            t('common.error', { ns: 'common' }),
            t('profileSetup.locationPermissionDenied'),
            [{ text: t('common.ok', { ns: 'common' }) }],
          );
        } else {
          showErrorToast(errorMessage);
        }
      }
    } catch (error) {
      showErrorToast(t('profileSetup.locationError'));
    } finally {
      setGettingLocation(false);
    }
  };

  const styles = useMemo(() => {
    return {
      header: {
        paddingHorizontal: 0,
        paddingVertical: theme.spacing[2],
      },
      content: {
        paddingVertical: theme.spacing[6],
      },
    };
  }, [theme]);

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <ProfileSetupHeader
            step={1}
            progress={0.25}
            rightText={t('profileSetup.basicInfo')}
            showSkipButton={true}
            containerStyle={styles.header}
          />

          {/* Content - Fixed */}
          <View
            style={{
              flex: 1,
              paddingVertical: theme.spacing[3],
              justifyContent: 'space-between',
            }}
          >
            {/* Top Section */}
            <View>
              {/* Title */}
              <Text
                variant="h5"
                style={{ fontWeight: '600' as const, textAlign: 'center' as const }}
              >
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
                  bio: profileData?.bio || '',
                  location: profileData?.location || '',
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
                      values.bio || undefined,
                      values.location || undefined,
                    );

                    dispatch(
                      setProfileData({
                        displayName: values.displayName,
                        studyGoal: values.studyGoal,
                        avatarUrl: uploadedAvatarUrl || avatarUri,
                        bio: values.bio || undefined,
                        location: values.location || undefined,
                      }),
                    );

                    try {
                      const step1Payload: Record<string, any> = {
                        display_name: values.displayName,
                        main_learning_goal: values.studyGoal,
                        avatar_url: uploadedAvatarUrl || avatarUri,
                      };

                      // Only include bio and location if provided
                      if (values.bio?.trim()) {
                        step1Payload.bio = values.bio.trim();
                      }
                      if (values.location?.trim()) {
                        step1Payload.location = values.location.trim();
                      }

                      const r = await saveStepForUser(userId, step1Payload, true);
                      if (r?.error) {
                        const errorMessage = r.error?.message || 'Failed to save step 1';
                        setStatus(errorMessage);
                        Alert.alert(t('common.error'), errorMessage);
                        return;
                      }
                    } catch (err) {
                      const errorMessage = err instanceof Error ? err.message : t('common.error');
                      setStatus(errorMessage);
                      Alert.alert(t('common.error'), errorMessage);
                      return;
                    }

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
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  values,
                  errors,
                  touched,
                  status,
                  setFieldValue,
                }) => (
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
                          <Text
                            variant="body"
                            color="error"
                            style={{ marginLeft: theme.spacing[1] }}
                          >
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
                      <View style={{ marginBottom: theme.spacing[3] }}>
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
                          <Text
                            variant="body"
                            color="error"
                            style={{ marginLeft: theme.spacing[1] }}
                          >
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

                      {/* Bio Input - optional */}
                      <View style={{ marginBottom: theme.spacing[3] }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: theme.spacing[1],
                          }}
                        >
                          <Text variant="body" style={{ fontWeight: '600' as const }}>
                            {t('profileSetup.bioLabel')}
                          </Text>
                          <Text
                            variant="body"
                            color="tertiary"
                            style={{ marginLeft: theme.spacing[1], fontSize: 12 }}
                          >
                            {t('profileSetup.bioOptional')}
                          </Text>
                        </View>
                        <Input
                          placeholder={t('profileSetup.bioPlaceholder')}
                          value={values.bio}
                          onChangeText={handleChange('bio')}
                          onBlur={handleBlur('bio')}
                          maxLength={500}
                          multiline
                          numberOfLines={3}
                          editable={!submitting}
                        />
                      </View>

                      {/* Location Input - optional */}
                      <View style={{ marginBottom: theme.spacing[2] }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: theme.spacing[1],
                          }}
                        >
                          <Text variant="body" style={{ fontWeight: '600' as const }}>
                            {t('profileSetup.locationLabel')}
                          </Text>
                          <Text
                            variant="body"
                            color="tertiary"
                            style={{ marginLeft: theme.spacing[1], fontSize: 12 }}
                          >
                            {t('profileSetup.locationOptional')}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
                          <View style={{ flex: 1 }}>
                            <Input
                              placeholder={t('profileSetup.locationPlaceholder')}
                              value={values.location}
                              onChangeText={handleChange('location')}
                              onBlur={handleBlur('location')}
                              maxLength={100}
                              editable={!submitting && !gettingLocation}
                            />
                          </View>
                          <Pressable
                            onPress={() => handleGetCurrentLocation(setFieldValue)}
                            disabled={submitting || gettingLocation}
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: theme.radius.md,
                              backgroundColor: theme.colors.primary[100],
                              borderWidth: 1.5,
                              borderColor: theme.colors.primary[300],
                              justifyContent: 'center',
                              alignItems: 'center',
                              opacity: submitting || gettingLocation ? 0.5 : 1,
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={t('profileSetup.getCurrentLocation')}
                          >
                            {gettingLocation ? (
                              <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                            ) : (
                              <MapPin size={20} color={theme.colors.primary[500]} />
                            )}
                          </Pressable>
                        </View>
                      </View>

                      {/* Status Error */}
                      {status ? (
                        <Text variant="caption" color="error">
                          {status}
                        </Text>
                      ) : null}
                    </View>
                    <View>
                      <ProfileSetupNextButton
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
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};
