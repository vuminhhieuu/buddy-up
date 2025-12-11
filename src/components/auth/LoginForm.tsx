import React, { useState, useMemo } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Eye, EyeOff, Mail } from 'lucide-react-native';
import { Text, Input, Spacer, Button, SocialButton } from '../ui';
import { useTheme } from '../../styles';
import { useTranslation } from 'react-i18next';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { signInWithEmail } from '../../services/auth';
import { useAppDispatch } from '../../store/hooks';
import { setUser } from '../../store/slices/authSlice';
import { translateAuthError } from '../../utils/authErrors';
import { AuthError } from '@supabase/supabase-js';
import { logger } from '../../utils/logger';
import { VALIDATION_MESSAGES } from '../../constants/validation';
import { useSocialAuth } from '../../hooks/useSocialAuth';

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email(VALIDATION_MESSAGES.invalidEmail)
    .required(VALIDATION_MESSAGES.required),
  password: Yup.string().required(VALIDATION_MESSAGES.required),
});

type LoginFormProps = {
  onSwitchToRegister: () => void;
};

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { theme } = useTheme();
  const { t } = useTranslation('auth');
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordIconPressed, setPasswordIconPressed] = useState(false);

  // Use the new social auth hook
  const { handleSocialLogin, socialLoading } = useSocialAuth({ mode: 'login' });

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

  const handleForgotPassword = () => {
    (navigation as any).navigate('ForgotPassword');
  };

  return (
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
            const displayName =
              result.session.user.user_metadata?.full_name ||
              result.session.user.user_metadata?.name ||
              result.session.user.user_metadata?.display_name ||
              result.session.user.email?.split('@')[0] ||
              null;
            dispatch(
              setUser({
                userId: result.session.user.id,
                email: result.session.user.email ?? null,
                displayName,
              }),
            );
          } else {
            // This should never happen if signInWithOAuth is working correctly
            logger.error(
              'LoginForm',
              'OAuth login succeeded but no session returned - this is a bug',
            );
            throw new Error('Authentication failed - no session returned');
          }
        } catch (err: unknown) {
          const errorMessage = translateAuthError(err as AuthError, t);
          setStatus(errorMessage);
          setTimeout(() => {
            Alert.alert(t('loginFailedTitle'), errorMessage, [{ text: t('ok') }], {
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
            label={t('email')}
            placeholder={t('emailPlaceholder')}
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
            label={t('password')}
            placeholder={t('passwordPlaceholderLogin')}
            value={values.password}
            onChangeText={handleChange('password')}
            onBlur={handleBlur('password')}
            secureTextEntry={!showPassword}
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
                      passwordIconPressed ? theme.colors.primary[500] : theme.colors.text.secondary
                    }
                  />
                ) : (
                  <Eye
                    size={20}
                    color={
                      passwordIconPressed ? theme.colors.primary[500] : theme.colors.text.secondary
                    }
                  />
                )}
              </Pressable>
            }
          />

          {/* Forgot Password Link */}
          <Pressable style={styles.forgotPasswordLink} onPress={handleForgotPassword}>
            <Text variant="caption" color="primary" style={{ fontWeight: '500' as const }}>
              {t('forgotPassword')}
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

          <Button label={t('login')} onPress={() => handleSubmit()} loading={submitting} />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text variant="caption" color="tertiary" style={{ marginHorizontal: theme.spacing[3] }}>
              {t('or')}
            </Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social buttons */}
          <View style={styles.socialButtonsContainer}>
            <SocialButton
              provider="google"
              onPress={() => handleSocialLogin('google')}
              loading={socialLoading === 'google'}
            />
            <SocialButton
              provider="facebook"
              onPress={() => handleSocialLogin('facebook')}
              loading={socialLoading === 'facebook'}
            />
          </View>

          <Spacer size={6} />

          {/* Footer */}
          <View style={styles.footer}>
            <Text variant="body" color="tertiary">
              {t('noAccount')}{' '}
            </Text>
            <Pressable style={{ marginLeft: theme.spacing[1] }} onPress={onSwitchToRegister}>
              <Text variant="body" color="primary" style={{ fontWeight: '600' as const }}>
                {t('registerNow')}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </Formik>
  );
};
