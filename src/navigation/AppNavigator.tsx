import React from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { MainTabsNavigator } from './MainTabsNavigator';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { CreateSessionScreen } from '../screens/session/CreateSessionScreen';
import CreateSessionSuccessScreen from '../screens/session/CreateSessionSuccessScreen';
import SessionDetailScreen from '../screens/session/SessionDetailScreen';
import EditSessionScreen from '../screens/session/EditSessionScreen';
import { CreateGroupTypeScreen } from '../screens/groups/CreateGroupTypeScreen';
import { CreatePublicGroupScreen } from '../screens/groups/CreatePublicGroupScreen';
import { CreateGroupSuccessScreen } from '../screens/groups/CreateGroupSuccessScreen';
import { GroupDetailScreen } from '../screens/groups/GroupDetailScreen';
import { useAppSelector } from '../store/hooks';
import { useFirstLaunch } from '../hooks/useFirstLaunch';
import { useTheme } from '../styles';
import { useTranslation } from 'react-i18next';
import { notificationRouter } from '../services/notifications/NotificationRouter';

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: { profileSetupInProgress: boolean };
  MainTabs: { screen?: string } | undefined;
  CreateSession: undefined;
  EditSession: { sessionId: string };
  CreateSessionSuccess:
    | {
        sessionTitle?: string;
        sessionDateTime?: string;
        scheduledStartIso?: string;
        scheduledEndIso?: string;
        duration?: string;
      }
    | undefined;
  SessionDetail: {
    sessionId: string;
    readOnly?: boolean;
    fromNotification?: boolean;
    fromSuccess?: boolean;
  };
  UpcomingSessionsAll: { initialTab?: number } | undefined;
  Notifications: undefined;
  CreateGroupType: undefined;
  CreatePublicGroup: { step?: number } | undefined;
  CreateGroupSuccess: { groupId: string; groupName: string };
  GroupDetail: { groupId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { userId, profileSetupInProgress } = useAppSelector((state) => state.auth);
  const { isFirstLaunch, isLoading, completeOnboarding } = useFirstLaunch();
  const { theme } = useTheme();
  const { t } = useTranslation('common');
  const navigationRef = useNavigationContainerRef();

  // Set navigation ref for notification router
  React.useEffect(() => {
    if (navigationRef) {
      notificationRouter.setNavigationRef(navigationRef);
    }
  }, [navigationRef]);

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
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isFirstLaunch ? (
          <Stack.Screen name="Onboarding">
            {() => <OnboardingNavigator onComplete={completeOnboarding} />}
          </Stack.Screen>
        ) : userId && !profileSetupInProgress ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
            <Stack.Screen name="CreateSession" component={CreateSessionScreen} />
            <Stack.Screen name="EditSession" component={EditSessionScreen} />
            <Stack.Screen name="CreateSessionSuccess" component={CreateSessionSuccessScreen} />
            <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
            <Stack.Screen
              name="UpcomingSessionsAll"
              component={require('../screens/session/UpcomingSessionsAllScreen').default}
            />
            <Stack.Screen
              name="Notifications"
              component={require('../screens/invitations/NotificationsScreen').default}
            />
            <Stack.Screen name="CreateGroupType" component={CreateGroupTypeScreen} />
            <Stack.Screen name="CreatePublicGroup" component={CreatePublicGroupScreen} />
            <Stack.Screen name="CreateGroupSuccess" component={CreateGroupSuccessScreen} />
            <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
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
