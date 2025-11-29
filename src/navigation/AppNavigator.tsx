import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { MainTabsNavigator } from './MainTabsNavigator';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { CreateSessionScreen } from '../screens/session/CreateSessionScreen';
import CreateSessionSuccessScreen from '../screens/session/CreateSessionSuccessScreen';
import { useAppSelector } from '../store/hooks';
import { useFirstLaunch } from '../hooks/useFirstLaunch';
import { useTheme } from '../styles';
import { useTranslation } from 'react-i18next';

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: { profileSetupInProgress: boolean };
  MainTabs: undefined;
  CreateSession: undefined;
  CreateSessionSuccess:
    | {
        sessionTitle?: string;
        sessionDateTime?: string;
        scheduledStartIso?: string;
        scheduledEndIso?: string;
        duration?: string;
      }
    | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { userId, profileSetupInProgress } = useAppSelector((state) => state.auth);
  const { isFirstLaunch, isLoading, completeOnboarding } = useFirstLaunch();
  const { theme } = useTheme();
  const { t } = useTranslation('common');

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        accessibilityRole="progressbar"
        accessibilityLabel={t('loading')}
      >
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isFirstLaunch ? (
          <Stack.Screen name="Onboarding">
            {() => <OnboardingNavigator onComplete={completeOnboarding} />}
          </Stack.Screen>
        ) : userId && !profileSetupInProgress ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
            <Stack.Screen name="CreateSession" component={CreateSessionScreen} />
            <Stack.Screen name="CreateSessionSuccess" component={CreateSessionSuccessScreen} />
          </>
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            initialParams={{ profileSetupInProgress }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
