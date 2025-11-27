import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthScreen, AuthScreenParams } from '../screens/auth/AuthScreen';
import { ProfileSetupScreen } from '../screens/auth/ProfileSetupScreen';
import { useAppSelector } from '../store/hooks';

export type AuthStackParamList = {
  Auth: AuthScreenParams;
  ProfileSetup: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  const { authStartScreen } = useAppSelector((state) => state.auth);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        initialParams={{ activeTab: authStartScreen }}
      />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
};
