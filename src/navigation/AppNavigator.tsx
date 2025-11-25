import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabsNavigator } from './MainTabsNavigator';
import { AuthNavigator } from './AuthNavigator';
import { CreateSessionScreen } from '../screens/CreateSessionScreen';
import { useAppSelector } from '../store/hooks';

export type RootStackParamList = {
  Auth: { profileSetupInProgress: boolean };
  MainTabs: undefined;
  CreateSession: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { userId, profileSetupInProgress } = useAppSelector((state) => state.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userId && !profileSetupInProgress ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
            <Stack.Screen name="CreateSession" component={CreateSessionScreen} />
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
