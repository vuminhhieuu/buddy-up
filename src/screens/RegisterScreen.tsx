import React, { useMemo, useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Eye, EyeOff, User, Mail } from 'lucide-react-native';
import { ScreenContainer, Text, Input, Spacer, Button } from '../components/ui';
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

  return (
    <ScreenContainer scroll contentContainerStyle={{ paddingBottom: theme.spacing[12] }}>
      {/* Header */}
      <View
        style={{
          alignItems: 'center',
          paddingTop: theme.spacing[8],
          marginBottom: theme.spacing[6],
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: theme.radius.lg,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.primary[400],
          }}
        >
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

      {/* Tab Switcher (static, Register active) */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.base,
          padding: theme.spacing[1],
        }}
      >
        <View
          style={{
            flex: 1,
            height: theme.sizes.button.sm,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: theme.radius.base,
          }}
        >
          <Text variant="body" style={{ fontWeight: '600' as const }}>
            {t('login')}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            height: theme.sizes.button.sm,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: theme.radius.base,
            backgroundColor: theme.colors.primary[500],
          }}
        >
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

              <Button label={t('register')} onPress={() => handleSubmit()} loading={submitting} />

              {/* Divider */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginVertical: theme.spacing[6],
                }}
              >
                <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
                <Text
                  variant="caption"
                  color="tertiary"
                  style={{ marginHorizontal: theme.spacing[3] }}
                >
                  {t('auth.or')}
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
              </View>

              {/* Social buttons */}
              <View style={{ flexDirection: 'row', marginHorizontal: -6 }}>
                <Pressable
                  style={{
                    flex: 1,
                    height: theme.sizes.button.md,
                    backgroundColor: theme.colors.surface,
                    borderWidth: 1.5,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.base,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    marginHorizontal: 6,
                  }}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24">
                    <Path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <Path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <Path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <Path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </Svg>
                  <View style={{ width: theme.spacing[2] }} />
                  <Text variant="body" style={{ fontWeight: '600' as const }}>
                    Google
                  </Text>
                </Pressable>
                <Pressable
                  style={{
                    flex: 1,
                    height: theme.sizes.button.md,
                    backgroundColor: theme.colors.surface,
                    borderWidth: 1.5,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.base,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    marginHorizontal: 6,
                  }}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24">
                    <Path
                      fill="#1877F2"
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                    />
                  </Svg>
                  <View style={{ width: theme.spacing[2] }} />
                  <Text variant="body" style={{ fontWeight: '600' as const }}>
                    Facebook
                  </Text>
                </Pressable>
              </View>

              <Spacer size={6} />

              {/* Footer */}
              <View
                style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
              >
                <Text variant="body" color="tertiary">
                  {t('auth.haveAccount')}{' '}
                </Text>
                <Pressable onPress={() => navigation.navigate('Login')}>
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
