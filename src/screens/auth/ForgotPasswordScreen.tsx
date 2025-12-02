import React, { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer, Text, Input, Spacer, Button } from '../../components/ui';
import { BackButton } from '../../components/navigation/BackButton';
import { useTheme } from '../../styles';
import { useTranslation } from 'react-i18next';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Mail } from 'lucide-react-native';
import { requestPasswordReset } from '../../services/auth';
import { translateAuthError } from '../../utils/authErrors';
import { AuthError } from '@supabase/supabase-js';
import { VALIDATION_MESSAGES } from '../../constants/validation';

const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email(VALIDATION_MESSAGES.invalidEmail)
    .required(VALIDATION_MESSAGES.required),
});

export const ForgotPasswordScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('auth');
  const navigation = useNavigation();
  const [submitting, setSubmitting] = useState(false);

  return (
    <ScreenContainer scroll>
      {/* Header with back button and title */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text variant="h4" style={styles.headerTitle}>
          {t('forgotPasswordTitle')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <Spacer size={4} />

      {/* Description */}
      <Text variant="body" color="secondary">
        {t('forgotPasswordDescription')}
      </Text>

      <Spacer size={6} />

      {/* Form */}
      <Formik
        initialValues={{ email: '' }}
        validationSchema={ForgotPasswordSchema}
        onSubmit={async (values, { setStatus }) => {
          setSubmitting(true);
          setStatus(undefined);
          try {
            await requestPasswordReset(values.email);
            Alert.alert(
              t('otpSentTitle'),
              t('otpSent', { email: values.email }),
              [
                {
                  text: t('ok'),
                  onPress: () => {
                    (navigation as any).navigate('VerifyOTP', { email: values.email });
                  },
                },
              ],
              { cancelable: false },
            );
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
            {/* Email Input */}
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

            {status ? (
              <>
                <Spacer size={2} />
                <Text variant="caption" color="error">
                  {String(status)}
                </Text>
              </>
            ) : null}

            <Spacer size={6} />

            <Button label={t('sendOTP')} onPress={() => handleSubmit()} loading={submitting} />
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
