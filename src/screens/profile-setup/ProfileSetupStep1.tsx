import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Formik } from 'formik';
import { useTheme } from '../../styles';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { initializeStep1, updateStep1 } from '../../store/slices/profileSetupSlice';
import { ScreenContainer, Text, Input, Button, Spacer } from '../../components/ui';
import { StepHeader, AvatarPickerButton } from '../../components/profile-setup';
import { useProfileSetupStep1 } from '../../hooks/useProfileSetupStep1';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileSetupStackParamList } from '../../navigation/ProfileSetupNavigator';

type ProfileSetupStep1Props = NativeStackScreenProps<
  ProfileSetupStackParamList,
  'ProfileSetupStep1'
>;

export const ProfileSetupStep1: React.FC<ProfileSetupStep1Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const displayName = useAppSelector((state) => state.auth.displayName);
  const step1Data = useAppSelector((state) => state.profileSetup.step1Data);
  const isSubmitting = useAppSelector((state) => state.profileSetup.isSubmitting);

  const { validationSchema, handleSubmit, handleSkip } = useProfileSetupStep1({
    onSuccess: () => {
      navigation.navigate('ProfileSetupStep2');
    },
  });

  useEffect(() => {
    dispatch(initializeStep1({ displayName }));
  }, [displayName, dispatch]);

  if (!step1Data) {
    return null;
  }

  return (
    <ScreenContainer>
      <StepHeader
        currentStep={1}
        totalSteps={4}
        title={t('profileSetup.step1.headerTitle')}
        onSkip={handleSkip}
        isLoading={isSubmitting}
      />

      <View
        style={{
          paddingHorizontal: theme.spacing[4],
          paddingBottom: theme.spacing[6],
          flex: 1,
        }}
      >
        {/* Title & Subtitle */}
        <Text
          variant="h3"
          style={{
            marginBottom: theme.spacing[2],
            textAlign: 'center',
          }}
        >
          {t('profileSetup.step1.title')}
        </Text>
        <Text
          variant="body"
          color="tertiary"
          style={{
            marginBottom: theme.spacing[3],
            textAlign: 'center',
          }}
        >
          {t('profileSetup.step1.subtitle')}
        </Text>

        {/* Avatar Picker */}
        <AvatarPickerButton
          currentUri={step1Data.avatarUri}
          onSelectImage={(uri) => {
            dispatch(updateStep1({ avatarUri: uri }));
          }}
          isLoading={isSubmitting}
        />

        {/* Form */}
        <Formik
          initialValues={step1Data}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ handleChange, handleBlur, handleSubmit: formSubmit, values, errors, touched }) => (
            <View>
              {/* Display Name Label */}
              <View style={{ flexDirection: 'row', marginBottom: theme.spacing[2] }}>
                <Text variant="h6" style={{ fontWeight: '600' as const }}>
                  {t('profileSetup.step1.displayNameLabel').replace(' *', '')}
                </Text>
                <Text
                  variant="h6"
                  style={{
                    fontWeight: '600' as const,
                    color: theme.colors.semantic.error,
                    marginLeft: 2,
                  }}
                >
                  {' *'}
                </Text>
              </View>

              {/* Display Name Input */}
              <Input
                label={undefined}
                placeholder={t('profileSetup.step1.displayNamePlaceholder')}
                value={values.displayName}
                onChangeText={handleChange('displayName')}
                onBlur={handleBlur('displayName')}
                editable={!isSubmitting}
                errorText={
                  touched.displayName && errors.displayName ? t(errors.displayName) : undefined
                }
              />

              <Spacer size={4} />

              {/* Primary Goal Label */}
              <View style={{ flexDirection: 'row', marginBottom: theme.spacing[2] }}>
                <Text variant="h6" style={{ fontWeight: '600' as const }}>
                  {t('profileSetup.step1.primaryGoalLabel').replace(' *', '')}
                </Text>
                <Text
                  variant="h6"
                  style={{
                    fontWeight: '600' as const,
                    color: theme.colors.semantic.error,
                    marginLeft: 2,
                  }}
                >
                  {' *'}
                </Text>
              </View>

              {/* Primary Goal Input */}
              <Input
                label={undefined}
                placeholder={t('profileSetup.step1.primaryGoalPlaceholder')}
                value={values.primaryGoal}
                onChangeText={handleChange('primaryGoal')}
                onBlur={handleBlur('primaryGoal')}
                editable={!isSubmitting}
                helperText={t('profileSetup.step1.primaryGoalHelp')}
                errorText={
                  touched.primaryGoal && errors.primaryGoal ? t(errors.primaryGoal) : undefined
                }
              />

              <Spacer size={6} />

              {/* Continue Button */}
              <Button
                label={t('profileSetup.step1.continue')}
                onPress={() => formSubmit()}
                loading={isSubmitting}
                disabled={isSubmitting || !values.displayName.trim() || !values.primaryGoal.trim()}
              />
            </View>
          )}
        </Formik>
      </View>
    </ScreenContainer>
  );
};
