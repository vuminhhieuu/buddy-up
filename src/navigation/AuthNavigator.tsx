import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthScreen, AuthScreenParams } from '../screens/AuthScreen';

export type AuthStackParamList = {
  Auth: AuthScreenParams;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

type AuthNavigatorProps = {
  initialScreen?: 'Register' | 'Login';
};

export const AuthNavigator: React.FC<AuthNavigatorProps> = ({ initialScreen = 'Register' }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        initialParams={{ activeTab: initialScreen }}
      />
    </Stack.Navigator>
  );
};
