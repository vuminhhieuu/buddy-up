import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabsNavigator } from './MainTabsNavigator';
import { AuthNavigator } from './AuthNavigator';
import { ProfileSetupNavigator } from './ProfileSetupNavigator';
import { useAppSelector } from '../store/hooks';

export type RootStackParamList = {
  Auth: undefined;
  ProfileSetup: undefined;
  MainTabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { userId, authStartScreen } = useAppSelector((state) => state.auth);
  const profile_setup_completed = useAppSelector(
    (state) => state.profileSetup.profile_setup_completed,
  );

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userId ? (
          <>
            {!profile_setup_completed ? (
              <Stack.Screen name="ProfileSetup" component={ProfileSetupNavigator} />
            ) : (
              <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
            )}
          </>
        ) : (
          <Stack.Screen name="Auth">
            {() => <AuthNavigator initialScreen={authStartScreen} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
