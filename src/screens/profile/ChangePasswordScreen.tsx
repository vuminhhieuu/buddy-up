import React, { useState } from 'react';
import { View, Pressable, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Eye, EyeOff } from 'lucide-react-native';
import { ScreenContainer, Text, Input, Spacer, Button } from '../../components/ui';
import { BackButton } from '../../components/navigation/BackButton';
import { useTheme } from '../../styles';
import { useTranslation } from 'react-i18next';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { verifyCurrentPassword, requestPasswordReset } from '../../services/auth';
import { supabase } from '../../config/supabase';
import { translateAuthError } from '../../utils/authErrors';
import { AuthError } from '@supabase/supabase-js';
import { VALIDATION_MESSAGES } from '../../constants/validation';

export const ChangePasswordScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('auth');
  const navigation = useNavigation();
  const [submitting, setSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [currentPasswordIconPressed, setCurrentPasswordIconPressed] = useState(false);

  return (
    <ScreenContainer scroll>
      {/* Header with back button and title */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text variant="h4" style={styles.headerTitle}>
          {t('changePasswordTitle')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <Spacer size={4} />

      {/* Form bước 1: nhập mật khẩu hiện tại, sau đó gửi OTP */}
      <Formik
        initialValues={{ currentPassword: '' }}
        validationSchema={Yup.object().shape({
          currentPassword: Yup.string().required(VALIDATION_MESSAGES.required),
        })}
        onSubmit={async (values, { setStatus }) => {
          setSubmitting(true);
          setStatus(undefined);
          try {
            // Xác thực mật khẩu hiện tại
            await verifyCurrentPassword(values.currentPassword);
            // Gửi OTP đến email hiện tại của user
            const {
              data: { user },
            } = await supabase.auth.getUser();
            const email = user?.email;
            if (!email) throw new Error('No user email');
            await requestPasswordReset(email);
            Alert.alert(t('otpSentTitle'), t('otpSent', { email }), [
              {
                text: t('ok'),
                onPress: () => {
                  (navigation as any).navigate('VerifyOTP', { email, mode: 'change' });
                },
              },
            ]);
          } catch (err: unknown) {
            const errorMessage = translateAuthError(err as AuthError, t, 'passwordChange');
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
            <Input
              label={t('currentPassword')}
              placeholder={t('currentPasswordPlaceholder')}
              value={values.currentPassword}
              onChangeText={handleChange('currentPassword')}
              onBlur={handleBlur('currentPassword')}
              secureTextEntry={!showCurrentPassword}
              errorText={
                touched.currentPassword && errors.currentPassword
                  ? t(errors.currentPassword)
                  : undefined
              }
              right={
                <Pressable
                  onPress={() => setShowCurrentPassword((s) => !s)}
                  onPressIn={() => setCurrentPasswordIconPressed(true)}
                  onPressOut={() => setCurrentPasswordIconPressed(false)}
                >
                  {showCurrentPassword ? (
                    <EyeOff
                      size={20}
                      color={
                        currentPasswordIconPressed
                          ? theme.colors.primary[500]
                          : theme.colors.text.secondary
                      }
                    />
                  ) : (
                    <Eye
                      size={20}
                      color={
                        currentPasswordIconPressed
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

            <Button label={t('continue')} onPress={() => handleSubmit()} loading={submitting} />

            <Spacer size={4} />

            <Pressable
              onPress={async () => {
                try {
                  const {
                    data: { user },
                  } = await supabase.auth.getUser();
                  const email = user?.email;
                  if (!email) throw new Error('No user email');
                  await requestPasswordReset(email);
                  Alert.alert(t('otpSentTitle'), t('otpSent', { email }), [
                    {
                      text: t('ok'),
                      onPress: () => {
                        (navigation as any).navigate('VerifyOTP', { email, mode: 'forgot' });
                      },
                    },
                  ]);
                } catch (err: unknown) {
                  const errorMessage = translateAuthError(err as AuthError, t, 'passwordReset');
                  Alert.alert(t('error'), errorMessage, [{ text: t('ok') }]);
                }
              }}
            >
              <Text variant="body" color="primary" style={{ textDecorationLine: 'underline' }}>
                {t('forgotPasswordFromChange')}
              </Text>
            </Pressable>
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
