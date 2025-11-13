import React from 'react';
import { Pressable } from 'react-native';
import { ScreenContainer, Text, Spacer } from '../components/ui';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/AuthNavigator';
import { useAppDispatch } from '../store/hooks';
import { setAuthStartScreen } from '../store/slices/authSlice';

export const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const dispatch = useAppDispatch();

  return (
    <ScreenContainer>
      <Spacer size={12} />
      <Text variant="h3">{t('login')}</Text>
      <Spacer size={4} />
      <Text variant="body">
        {t(
          'auth.loginMockMessage',
          'Màn hình đăng nhập đang được xây dựng. Vui lòng quay lại sau.',
        )}
      </Text>
      <Spacer size={6} />
      <Pressable
        onPress={() => {
          dispatch(setAuthStartScreen('Register'));
          navigation.navigate('Register');
        }}
      >
        <Text variant="body" color="primary" style={{ fontWeight: '600' as const }}>
          {t('auth.registerNow')}
        </Text>
      </Pressable>
    </ScreenContainer>
  );
};
