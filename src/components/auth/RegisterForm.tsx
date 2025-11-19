import React, { useMemo, useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { Eye, EyeOff, User, Mail } from 'lucide-react-native';
import { Text, Input, Spacer, Button, SocialButton } from '../ui';
import { useTheme } from '../../styles';
import { useTranslation } from 'react-i18next';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { evaluatePasswordStrength } from '../../utils/password';
import { signUpWithEmail } from '../../services/auth';
import { useAppDispatch } from '../../store/hooks';
import {
  setIsRegistering,
  setProfileSetupInProgress,
  setProfileData,
  setCurrentProfileStep,
} from '../../store/slices/authSlice';
import { translateAuthError } from '../../utils/authErrors';
const PasswordStrengthIndicator: React.FC<{
  password: string;
  theme: ReturnType<typeof useTheme>['theme'];
  t: ReturnType<typeof useTranslation>['t'];
}> = ({ password, theme, t }) => {
  const passwordStrength = useMemo(() => {
    try {
      return evaluatePasswordStrength(password || '');
    } catch {
      return { score: 0, strength: 'weak' as const };
    }
  }, [password]);

  const { strength } = passwordStrength;
  const strengthBarColor =
    strength === 'weak'
      ? theme.colors.semantic.error
      : strength === 'medium'
        ? theme.colors.semantic.warning
        : theme.colors.semantic.success;

  return (
    <>
      <View
        style={{
          height: 4,
          backgroundColor: theme.colors.border,
          borderRadius: 2,
          marginTop: theme.spacing[2],
        }}
      >
        <View
          style={{
            height: 4,
            width: strength === 'weak' ? '33%' : strength === 'medium' ? '66%' : '100%',
            backgroundColor: strengthBarColor,
            borderRadius: 2,
          }}
        />
      </View>
      <Text
        variant="caption"
        style={{
          marginTop: theme.spacing[1],
          color: strengthBarColor,
        }}
      >
        {t(
          strength === 'weak'
            ? 'auth.strengthWeak'
            : strength === 'medium'
              ? 'auth.strengthMedium'
              : 'auth.strengthStrong',
        )}
      </Text>
    </>
  );
};

const RegisterSchema = Yup.object().shape({
  displayName: Yup.string().min(2, 'auth.nameMin').required('auth.required'),
  email: Yup.string().email('auth.invalidEmail').required('auth.required'),
  password: Yup.string().min(6, 'auth.passwordMin').required('auth.required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'auth.passwordMismatch')
    .required('auth.required'),
});

type RegisterFormProps = {
  onSwitchToLogin: () => void;
  onNavigateToProfileSetup?: (displayName: string) => void;
};

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
  onNavigateToProfileSetup,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordIconPressed, setPasswordIconPressed] = useState(false);
  const [confirmIconPressed, setConfirmIconPressed] = useState(false);
  const dispatch = useAppDispatch();

  const styles = useMemo(
    () => ({
      divider: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        marginVertical: theme.spacing[6],
      },
      dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.border,
      },
      footer: {
        alignItems: 'center' as const,
        flexDirection: 'row' as const,
        justifyContent: 'center' as const,
      },
      socialButtonsContainer: {
        flexDirection: 'row' as const,
        marginHorizontal: -6,
      },
    }),
    [theme],
  );

  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    console.log(`Social login with ${provider}`);
  };

  return (
    <Formik
      initialValues={{ displayName: '', email: '', password: '', confirmPassword: '' }}
      validationSchema={RegisterSchema}
      onSubmit={async (values, { setStatus, resetForm }) => {
        setSubmitting(true);
        setStatus(undefined);
        try {
          dispatch(setIsRegistering(true));

          await signUpWithEmail({
            email: values.email,
            password: values.password,
            displayName: values.displayName,
          });

          dispatch(
            setProfileData({
              displayName: values.displayName,
            }),
          );

          dispatch(setProfileSetupInProgress(true));
          dispatch(setCurrentProfileStep(1));

          resetForm();

          setTimeout(() => {
            dispatch(setIsRegistering(false));
            onNavigateToProfileSetup?.(values.displayName);
          }, 100);
        } catch (err: unknown) {
          dispatch(setIsRegistering(false));
          const errorMessage = translateAuthError(err as Error, t, 'register');
          setStatus(errorMessage);
          setTimeout(() => {
            Alert.alert(t('auth.registerFailedTitle'), errorMessage, [{ text: t('auth.ok') }], {
              cancelable: true,
            });
          }, 100);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ handleChange, handleBlur, handleSubmit, values, errors, touched, status }) => {
        return (
          <View>
            {/* Display Name */}
            <Input
              label={t('auth.displayName')}
              placeholder={t('auth.displayNamePlaceholder')}
              value={values.displayName}
              onChangeText={handleChange('displayName')}
              onBlur={handleBlur('displayName')}
              autoCapitalize="words"
              autoCorrect={false}
              errorText={
                touched.displayName && errors.displayName ? t(errors.displayName) : undefined
              }
              right={<User size={20} color={theme.colors.text.tertiary} />}
            />

            <Spacer size={4} />

            {/* Email */}
            <Input
              label={t('auth.email')}
              placeholder={t('auth.emailPlaceholder')}
              value={values.email}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              errorText={touched.email && errors.email ? t(errors.email) : undefined}
              right={<Mail size={20} color={theme.colors.text.tertiary} />}
            />

            <Spacer size={4} />

            {/* Password */}
            <Input
              label={t('auth.password')}
              placeholder={t('auth.passwordPlaceholder')}
              value={values.password}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              secureTextEntry={!showPassword}
              maxLength={128}
              errorText={touched.password && errors.password ? t(errors.password) : undefined}
              right={
                <Pressable
                  onPress={() => setShowPassword((s) => !s)}
                  onPressIn={() => setPasswordIconPressed(true)}
                  onPressOut={() => setPasswordIconPressed(false)}
                >
                  {showPassword ? (
                    <EyeOff
                      size={20}
                      color={
                        passwordIconPressed
                          ? theme.colors.primary[500]
                          : theme.colors.text.secondary
                      }
                    />
                  ) : (
                    <Eye
                      size={20}
                      color={
                        passwordIconPressed
                          ? theme.colors.primary[500]
                          : theme.colors.text.secondary
                      }
                    />
                  )}
                </Pressable>
              }
            />

            {values.password ? (
              <PasswordStrengthIndicator password={values.password} theme={theme} t={t} />
            ) : null}

            <Spacer size={4} />

            {/* Confirm Password */}
            <Input
              label={t('auth.confirmPassword')}
              placeholder={t('auth.confirmPasswordPlaceholder')}
              value={values.confirmPassword}
              onChangeText={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              secureTextEntry={!showConfirm}
              maxLength={128}
              errorText={
                touched.confirmPassword && errors.confirmPassword
                  ? t(errors.confirmPassword)
                  : undefined
              }
              right={
                <Pressable
                  onPress={() => setShowConfirm((s) => !s)}
                  onPressIn={() => setConfirmIconPressed(true)}
                  onPressOut={() => setConfirmIconPressed(false)}
                >
                  {showConfirm ? (
                    <EyeOff
                      size={20}
                      color={
                        confirmIconPressed ? theme.colors.primary[500] : theme.colors.text.secondary
                      }
                    />
                  ) : (
                    <Eye
                      size={20}
                      color={
                        confirmIconPressed ? theme.colors.primary[500] : theme.colors.text.secondary
                      }
                    />
                  )}
                </Pressable>
              }
            />

            {status ? (
              <>
                <Spacer size={2} />
                <Text variant="caption" color="error">
                  {String(status)}
                </Text>
              </>
            ) : null}

            <Spacer size={6} />

            <Button label={t('register')} onPress={() => handleSubmit()} loading={submitting} />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text
                variant="caption"
                color="tertiary"
                style={{ marginHorizontal: theme.spacing[3] }}
              >
                {t('auth.or')}
              </Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social buttons */}
            <View style={styles.socialButtonsContainer}>
              <SocialButton provider="google" onPress={() => handleSocialLogin('google')} />
              <SocialButton provider="facebook" onPress={() => handleSocialLogin('facebook')} />
            </View>

            <Spacer size={6} />

            {/* Footer */}
            <View style={styles.footer}>
              <Text variant="body" color="tertiary">
                {t('auth.haveAccount')}{' '}
              </Text>
              <Pressable onPress={onSwitchToLogin}>
                <Text variant="body" color="primary" style={{ fontWeight: '600' as const }}>
                  {t('auth.loginNow')}
                </Text>
              </Pressable>
            </View>
          </View>
        );
      }}
    </Formik>
  );
};
