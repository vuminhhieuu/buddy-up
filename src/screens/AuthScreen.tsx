import React, { useMemo, useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { ScreenContainer, Text, Spacer } from '../components/ui';
import { useTheme } from '../styles';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RegisterForm } from '../components/auth/RegisterForm';
import { LoginForm } from '../components/auth/LoginForm';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setAuthStartScreen } from '../store/slices/authSlice';

export type AuthScreenParams = {
  activeTab?: 'Register' | 'Login';
};

export const AuthScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { authStartScreen } = useAppSelector((state) => state.auth);

  const params = (route.params as AuthScreenParams) || {};
  const initialTab = params.activeTab || authStartScreen;
  const [activeTab, setActiveTab] = useState<'Register' | 'Login'>(initialTab);

  useEffect(() => {
    setActiveTab(authStartScreen);
  }, [authStartScreen]);

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
    }),
    [theme],
  );

  const handleSwitchToLogin = () => {
    setActiveTab('Login');
    dispatch(setAuthStartScreen('Login'));
  };

  const handleSwitchToRegister = () => {
    setActiveTab('Register');
    dispatch(setAuthStartScreen('Register'));
  };

  const handleNavigateToProfileSetup = () => {
    (navigation as any).navigate('ProfileSetup');
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

      {/* Tab Switcher */}
      <View style={styles.tabSwitcher}>
        <Pressable
          style={[styles.tabItem, activeTab === 'Login' && styles.tabItemActive]}
          onPress={handleSwitchToLogin}
        >
          <Text
            variant="body"
            color={activeTab === 'Login' ? 'inverse' : undefined}
            style={{ fontWeight: '600' as const }}
          >
            {t('login')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabItem, activeTab === 'Register' && styles.tabItemActive]}
          onPress={handleSwitchToRegister}
        >
          <Text
            variant="body"
            color={activeTab === 'Register' ? 'inverse' : undefined}
            style={{ fontWeight: '600' as const }}
          >
            {t('register')}
          </Text>
        </Pressable>
      </View>

      <Spacer size={6} />

      {/* Render Form based on activeTab */}
      {activeTab === 'Register' ? (
        <RegisterForm
          onSwitchToLogin={handleSwitchToLogin}
          onNavigateToProfileSetup={handleNavigateToProfileSetup}
        />
      ) : (
        <LoginForm onSwitchToRegister={handleSwitchToRegister} />
      )}
    </ScreenContainer>
  );
};
