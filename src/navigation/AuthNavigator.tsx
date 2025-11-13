import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RegisterScreen } from '../screens/RegisterScreen';
import { LoginScreen } from '../screens/LoginScreen';

export type AuthStackParamList = {
  Register: undefined;
  Login: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

type AuthNavigatorProps = {
  initialScreen?: 'Register' | 'Login';
};

export const AuthNavigator: React.FC<AuthNavigatorProps> = ({ initialScreen = 'Register' }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialScreen}>
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};
