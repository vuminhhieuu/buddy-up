import React, { useState, useMemo } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { Eye, EyeOff, Mail } from 'lucide-react-native';
import { ScreenContainer, Text, Input, Spacer, Button, SocialButton } from '../components/ui';
import { useTheme } from '../styles';
import { useTranslation } from 'react-i18next';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { signInWithEmail } from '../services/auth';
import { useAppDispatch } from '../store/hooks';
import { setAuthStartScreen, setUser } from '../store/slices/authSlice';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/AuthNavigator';
import { translateAuthError } from '../utils/authErrors';
import { supabase } from '../config/supabase';
import { AuthError } from '@supabase/supabase-js';

const LoginSchema = Yup.object().shape({
  email: Yup.string().email('auth.invalidEmail').required('auth.required'),
  password: Yup.string().required('auth.required'),
});

export const LoginScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordIconPressed, setPasswordIconPressed] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

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
        justifyContent: 'center' as const,
        flexDirection: 'row' as const,
      },
      socialButtonsContainer: {
        flexDirection: 'row' as const,
        marginHorizontal: -6,
      },
      forgotPasswordLink: {
        alignSelf: 'flex-end' as const,
        marginTop: theme.spacing[2],
      },
    }),
    [theme],
  );

  const handleNavigateToRegister = () => {
    dispatch(setAuthStartScreen('Register'));
    navigation.navigate('Register');
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

  const handleForgotPassword = () => {};

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

      {/* Tab Switcher (Login active) */}
      <View style={styles.tabSwitcher}>
        <View style={[styles.tabItem, styles.tabItemActive]}>
          <Text variant="body" color="inverse" style={{ fontWeight: '600' as const }}>
            {t('login')}
          </Text>
        </View>
        <Pressable style={styles.tabItem} onPress={handleNavigateToRegister}>
          <Text variant="body" style={{ fontWeight: '600' as const }}>
            {t('register')}
          </Text>
        </Pressable>
      </View>

      <Spacer size={6} />

      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={LoginSchema}
        onSubmit={async (values, { setStatus }) => {
          setSubmitting(true);
          setStatus(undefined);
          try {
            const result = await signInWithEmail({
              email: values.email,
              password: values.password,
            });
            if (result.session?.user) {
              dispatch(
                setUser({
                  userId: result.session.user.id,
                  email: result.session.user.email ?? null,
                }),
              );
            } else {
              const {
                data: { session },
              } = await supabase.auth.getSession();
              if (session?.user) {
                dispatch(
                  setUser({
                    userId: session.user.id,
                    email: session.user.email ?? null,
                  }),
                );
              }
            }
          } catch (err: unknown) {
            const errorMessage = translateAuthError(err as AuthError, t);
            setStatus(errorMessage);
            setTimeout(() => {
              Alert.alert(t('auth.loginFailedTitle'), errorMessage, [{ text: t('auth.ok') }], {
                cancelable: true,
              });
            }, 100);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, status }) => (
          <View>
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
              placeholder={t('auth.passwordPlaceholderLogin')}
              value={values.password}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              secureTextEntry={!showPassword}
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

            {/* Forgot Password Link */}
            <Pressable style={styles.forgotPasswordLink} onPress={handleForgotPassword}>
              <Text variant="caption" color="primary" style={{ fontWeight: '500' as const }}>
                {t('auth.forgotPassword')}
              </Text>
            </Pressable>

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
              label={t('login')}
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
                {t('auth.noAccount')}
              </Text>
              <Pressable
                style={{ marginLeft: theme.spacing[1] }}
                onPress={handleNavigateToRegister}
              >
                <Text variant="body" color="primary" style={{ fontWeight: '600' as const }}>
                  {t('auth.registerNow')}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </Formik>
    </ScreenContainer>
  );
};
