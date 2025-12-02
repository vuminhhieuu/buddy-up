import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, Alert, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ScreenContainer, Text, Spacer, Button } from '../../components/ui';
import { BackButton } from '../../components/navigation/BackButton';
import { useTheme } from '../../styles';
import { useTranslation } from 'react-i18next';
import { OTPInput } from '../../components/auth/OTPInput';
import { verifyPasswordResetOTP } from '../../services/auth';
import { translateAuthError } from '../../utils/authErrors';
import { AuthError } from '@supabase/supabase-js';
import { useAppDispatch } from '../../store/hooks';
import { setIsPasswordResetFlow } from '../../store/slices/authSlice';

type VerifyOTPScreenParams = {
  email: string;
  mode?: 'forgot' | 'change';
};

type AnyStackParamList = {
  VerifyOTP: VerifyOTPScreenParams;
};

const OTP_EXPIRY_TIME = 5 * 60; // 5 minutes in seconds

export const VerifyOTPScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('auth');
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AnyStackParamList, 'VerifyOTP'>>();
  const dispatch = useAppDispatch();
  const email = route.params?.email || '';
  const mode: 'forgot' | 'change' = route.params?.mode || 'forgot';
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState(OTP_EXPIRY_TIME);
  const [canResend, setCanResend] = useState(false);
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    // Delay auto-focus để tránh conflict với navigation animation
    const focusTimer = setTimeout(() => {
      if (isMounted.current) {
        setShouldAutoFocus(true);
      }
    }, 300);

    return () => {
      isMounted.current = false;
      clearTimeout(focusTimer);
    };
  }, []);

  useEffect(() => {
    // Start countdown timer
    const startTimer = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    startTimer();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setErrorText(t('otpInvalid'));
      return;
    }

    setSubmitting(true);
    setErrorText('');
    try {
      // Bật cờ để không auto-login khi OTP tạo session tạm thời
      dispatch(setIsPasswordResetFlow(true));
      const result = await verifyPasswordResetOTP(email, otp);
      if (result.session && isMounted.current) {
        // Delay navigation một chút để tránh unmount conflict
        setTimeout(() => {
          (navigation as any).navigate('ResetPassword', { email, token: otp, mode });
        }, 100);
      } else {
        throw new Error('OTP verification failed');
      }
    } catch (err: unknown) {
      // Tắt cờ nếu verify thất bại
      dispatch(setIsPasswordResetFlow(false));

      if (!isMounted.current) return;

      // Phân biệt lỗi dựa trên thời gian còn lại
      const errorMessage = (err as Error)?.message || '';

      if (
        errorMessage.toLowerCase().includes('expired') ||
        errorMessage.toLowerCase().includes('invalid')
      ) {
        // Nếu còn thời gian thì là mã sai, hết thời gian thì là mã hết hạn
        if (timeRemaining > 0) {
          setErrorText(t('otpInvalid'));
        } else {
          setErrorText(t('otpExpired'));
        }
      } else {
        const translatedError = translateAuthError(err as AuthError, t, 'passwordReset');
        setErrorText(translatedError);
      }
    } finally {
      if (isMounted.current) {
        setSubmitting(false);
      }
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setErrorText('');
    try {
      const { requestPasswordReset } = await import('../../services/auth');
      await requestPasswordReset(email);
      if (!isMounted.current) return;

      setOtp('');
      setTimeRemaining(OTP_EXPIRY_TIME);
      setCanResend(false);
      // restart timer after resend
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      Alert.alert(t('otpSentTitle'), t('otpSent', { email }), [{ text: t('ok') }]);
    } catch (err: unknown) {
      if (!isMounted.current) return;
      const errorMessage = translateAuthError(err as AuthError, t, 'passwordReset');
      Alert.alert(t('error'), errorMessage, [{ text: t('ok') }]);
    }
  };

  return (
    <ScreenContainer scroll>
      {/* Header with back button and title */}
      <View style={styles.header}>
        <BackButton
          onPress={() => {
            // Explicit cancel: clear the reset flow flag
            dispatch(setIsPasswordResetFlow(false));
            navigation.goBack();
          }}
        />
        <Text variant="h4" style={styles.headerTitle}>
          {mode === 'change' ? t('verifyOTPTitleChange') : t('verifyOTPTitle')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <Spacer size={4} />

      {/* Description */}
      <Text variant="body" color="secondary">
        {mode === 'change'
          ? t('verifyOTPDescriptionChange', { email })
          : t('verifyOTPDescription', { email })}
      </Text>

      <Spacer size={6} />

      {/* OTP Input */}
      <OTPInput
        value={otp}
        onChangeText={(value) => {
          setOtp(value);
          if (errorText) setErrorText('');
        }}
        length={6}
        autoFocus={shouldAutoFocus}
        errorText={errorText}
      />

      <Spacer size={4} />

      {/* Timer */}
      {timeRemaining > 0 ? (
        <View style={{ alignItems: 'center' }}>
          <Text variant="caption" color="tertiary">
            {t('otpExpiresIn', { time: formatTime(timeRemaining) })}
          </Text>
        </View>
      ) : (
        <View style={{ alignItems: 'center' }}>
          <Text variant="caption" color="error">
            {t('otpExpired')}
          </Text>
        </View>
      )}

      <Spacer size={6} />

      {/* Verify Button */}
      <Button
        label={t('verifyOTP')}
        onPress={handleVerify}
        loading={submitting}
        disabled={otp.length !== 6 || timeRemaining === 0}
      />

      <Spacer size={4} />

      {/* Resend OTP */}
      <View style={{ alignItems: 'center' }}>
        <Text variant="body" color="tertiary" style={{ marginBottom: theme.spacing[2] }}>
          {t('didNotReceiveOTP')}
        </Text>
        <Pressable onPress={handleResendOTP} disabled={!canResend}>
          <Text
            variant="body"
            color={canResend ? 'primary' : 'tertiary'}
            style={{
              fontWeight: '600',
              textDecorationLine: canResend ? 'underline' : 'none',
            }}
          >
            {t('resendOTP')}
          </Text>
        </Pressable>
      </View>
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
