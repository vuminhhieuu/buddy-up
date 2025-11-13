import React, { useMemo, useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { Eye, EyeOff, User, Mail } from 'lucide-react-native';
import { ScreenContainer, Text, Input, Spacer, Button, SocialButton } from '../components/ui';
import { useTheme } from '../styles';
import { useTranslation } from 'react-i18next';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { evaluatePasswordStrength } from '../utils/password';
import { signUpWithEmail } from '../services/auth';
import { useAppDispatch } from '../store/hooks';
import { setAuthStartScreen } from '../store/slices/authSlice';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/AuthNavigator';

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

export const RegisterScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordIconPressed, setPasswordIconPressed] = useState(false);
  const [confirmIconPressed, setConfirmIconPressed] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const dispatch = useAppDispatch();

  const styles = useMemo(
    () => ({
      headerContainer: {
        alignItems: 'center' as const,
        paddingTop: theme.spacing[8],
        marginBottom: theme.spacing[6],
      },
      headerIcon: {
        width: 56,
        height: 56,
        borderRadius: theme.radius.lg,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        backgroundColor: theme.colors.primary[400],
      },
      tabSwitcher: {
        flexDirection: 'row' as const,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.base,
        padding: theme.spacing[1],
      },
      tabItem: {
        flex: 1,
        height: theme.sizes.button.sm,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        borderRadius: theme.radius.base,
      },
      tabItemActive: {
        backgroundColor: theme.colors.primary[500],
      },
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

  const handleNavigateToLogin = () => {
    dispatch(setAuthStartScreen('Login'));
    navigation.navigate('Login');
  };

  const handleTogglePassword = () => {
    setShowPassword((s) => !s);
  };

  const handlePasswordIconPressIn = () => {
    setPasswordIconPressed(true);
  };

  const handlePasswordIconPressOut = () => {
    setPasswordIconPressed(false);
  };

  const handleToggleConfirm = () => {
    setShowConfirm((s) => !s);
  };

  const handleConfirmIconPressIn = () => {
    setConfirmIconPressed(true);
  };

  const handleConfirmIconPressOut = () => {
    setConfirmIconPressed(false);
  };

  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    console.log(`Social login with ${provider}`);
  };

  const handleFormSubmit = (handleFormikSubmit: () => void) => {
    handleFormikSubmit();
  };

  return (
    <ScreenContainer scroll contentContainerStyle={{ paddingBottom: theme.spacing[12] }}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerIcon}>
          <Text variant="h3">🤝</Text>
        </View>
        <Spacer size={2} />
        <Text variant="h4" style={{ fontWeight: '700' as const }}>
          {t('appName')}
        </Text>
        <Spacer size={1} />
        <Text variant="caption" color="tertiary">
          {t('auth.tagline')}
        </Text>
      </View>

      {/* Tab Switcher (Register active) */}
      <View style={styles.tabSwitcher}>
        <Pressable style={styles.tabItem} onPress={handleNavigateToLogin}>
          <Text variant="body" style={{ fontWeight: '600' as const }}>
            {t('login')}
          </Text>
        </Pressable>
        <View style={[styles.tabItem, styles.tabItemActive]}>
          <Text variant="body" color="inverse" style={{ fontWeight: '600' as const }}>
            {t('register')}
          </Text>
        </View>
      </View>

      <Spacer size={6} />

      <Formik
        initialValues={{ displayName: '', email: '', password: '', confirmPassword: '' }}
        validationSchema={RegisterSchema}
        onSubmit={async (values, { setStatus, resetForm }) => {
          setSubmitting(true);
          setStatus(undefined);
          try {
            await signUpWithEmail({
              email: values.email,
              password: values.password,
              displayName: values.displayName,
            });
            dispatch(setAuthStartScreen('Login'));
            resetForm();
            navigation.navigate('Login');
          } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : t('auth.registerFailed');
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
                    onPress={handleTogglePassword}
                    onPressIn={handlePasswordIconPressIn}
                    onPressOut={handlePasswordIconPressOut}
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
                    onPress={handleToggleConfirm}
                    onPressIn={handleConfirmIconPressIn}
                    onPressOut={handleConfirmIconPressOut}
                  >
                    {showConfirm ? (
                      <EyeOff
                        size={20}
                        color={
                          confirmIconPressed
                            ? theme.colors.primary[500]
                            : theme.colors.text.secondary
                        }
                      />
                    ) : (
                      <Eye
                        size={20}
                        color={
                          confirmIconPressed
                            ? theme.colors.primary[500]
                            : theme.colors.text.secondary
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

              <Button
                label={t('register')}
                onPress={() => handleFormSubmit(handleSubmit)}
                loading={submitting}
              />

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
                <Pressable onPress={handleNavigateToLogin}>
                  <Text variant="body" color="primary" style={{ fontWeight: '600' as const }}>
                    {t('auth.loginNow')}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      </Formik>
    </ScreenContainer>
  );
};
