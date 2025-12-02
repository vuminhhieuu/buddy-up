import React, { useState, useMemo } from 'react';
import { View, Pressable, Alert, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Eye, EyeOff } from 'lucide-react-native';
import { ScreenContainer, Text, Input, Spacer, Button } from '../../components/ui';
import { BackButton } from '../../components/navigation/BackButton';
import { useTheme } from '../../styles';
import { useTranslation } from 'react-i18next';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { evaluatePasswordStrength } from '../../utils/password';
import { resetPassword } from '../../services/auth';
import { translateAuthError } from '../../utils/authErrors';
import { AuthError } from '@supabase/supabase-js';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  VALIDATION_MESSAGES,
} from '../../constants/validation';
import { useAppDispatch } from '../../store/hooks';
import { setAuthStartScreen, setIsPasswordResetFlow } from '../../store/slices/authSlice';
import { supabase } from '../../config/supabase';

type ResetPasswordScreenParams = {
  email: string;
  token: string;
  mode?: 'forgot' | 'change';
};

type AnyStackParamList = {
  ResetPassword: ResetPasswordScreenParams;
};

const ResetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(PASSWORD_MIN_LENGTH, VALIDATION_MESSAGES.passwordMin)
    .required(VALIDATION_MESSAGES.required),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], VALIDATION_MESSAGES.passwordMismatch)
    .required(VALIDATION_MESSAGES.required),
});

const PasswordStrengthIndicator: React.FC<{
  password: string;
}> = ({ password }) => {
  const { theme } = useTheme();
  const { t } = useTranslation('auth');

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

  if (!password) return null;

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
            ? 'strengthWeak'
            : strength === 'medium'
              ? 'strengthMedium'
              : 'strengthStrong',
        )}
      </Text>
    </>
  );
};

export const ResetPasswordScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('auth');
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AnyStackParamList, 'ResetPassword'>>();
  const dispatch = useAppDispatch();
  const email = route.params?.email || '';
  const token = route.params?.token || '';
  const mode: 'forgot' | 'change' = route.params?.mode || 'forgot';
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordIconPressed, setPasswordIconPressed] = useState(false);
  const [confirmPasswordIconPressed, setConfirmPasswordIconPressed] = useState(false);

  // Cleanup cờ flow nếu thoát màn hình
  React.useEffect(() => {
    return () => {
      dispatch(setIsPasswordResetFlow(false));
    };
  }, [dispatch]);

  return (
    <ScreenContainer scroll>
      {/* Header with back button and title */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text variant="h4" style={styles.headerTitle}>
          {mode === 'change' ? t('setNewPasswordTitle') : t('resetPasswordTitle')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <Spacer size={4} />

      {/* Description */}
      <Text variant="body" color="secondary">
        {mode === 'change' ? t('resetPasswordDescriptionChange') : t('resetPasswordDescription')}
      </Text>

      <Spacer size={6} />

      {/* Form */}
      <Formik
        initialValues={{ password: '', confirmPassword: '' }}
        validationSchema={ResetPasswordSchema}
        onSubmit={async (values, { setStatus }) => {
          setSubmitting(true);
          setStatus(undefined);
          try {
            await resetPassword(email, token, values.password);
            // Tắt cờ flow reset password
            dispatch(setIsPasswordResetFlow(false));

            if (mode === 'forgot') {
              // Đăng xuất sau khi đổi mật khẩu để buộc người dùng đăng nhập lại bằng mật khẩu mới
              await supabase.auth.signOut();
              Alert.alert(
                t('success'),
                t('passwordResetSuccess'),
                [
                  {
                    text: t('ok'),
                    onPress: () => {
                      dispatch(setAuthStartScreen('Login'));
                      (navigation as any).navigate('Auth', { activeTab: 'Login' });
                    },
                  },
                ],
                { cancelable: false },
              );
            } else {
              // change mode: giữ phiên, quay về Profile
              Alert.alert(
                t('success'),
                t('passwordChangeSuccess'),
                [
                  {
                    text: t('ok'),
                    onPress: () => {
                      (navigation as any).navigate('ProfileMain');
                    },
                  },
                ],
                { cancelable: false },
              );
            }
          } catch (err: unknown) {
            const errorMessage = translateAuthError(err as AuthError, t, 'passwordReset');
            setStatus(errorMessage);
            setTimeout(() => {
              Alert.alert(t('error'), errorMessage, [{ text: t('ok') }], {
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
            {/* New Password */}
            <Input
              label={t('newPassword')}
              placeholder={t('passwordPlaceholder')}
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

            {/* Password Strength Indicator */}
            <PasswordStrengthIndicator password={values.password} />

            <Spacer size={4} />

            {/* Confirm Password */}
            <Input
              label={t('confirmNewPassword')}
              placeholder={t('confirmPasswordPlaceholder')}
              value={values.confirmPassword}
              onChangeText={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              secureTextEntry={!showConfirmPassword}
              errorText={
                touched.confirmPassword && errors.confirmPassword
                  ? t(errors.confirmPassword)
                  : undefined
              }
              right={
                <Pressable
                  onPress={() => setShowConfirmPassword((s) => !s)}
                  onPressIn={() => setConfirmPasswordIconPressed(true)}
                  onPressOut={() => setConfirmPasswordIconPressed(false)}
                >
                  {showConfirmPassword ? (
                    <EyeOff
                      size={20}
                      color={
                        confirmPasswordIconPressed
                          ? theme.colors.primary[500]
                          : theme.colors.text.secondary
                      }
                    />
                  ) : (
                    <Eye
                      size={20}
                      color={
                        confirmPasswordIconPressed
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
              label={t('resetPassword')}
              onPress={() => handleSubmit()}
              loading={submitting}
            />
          </View>
        )}
      </Formik>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
});
