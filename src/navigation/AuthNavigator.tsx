import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthScreen, AuthScreenParams } from '../screens/auth/AuthScreen';
import { ProfileSetupScreen } from '../screens/auth/ProfileSetupScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { VerifyOTPScreen } from '../screens/auth/VerifyOTPScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { useAppSelector } from '../store/hooks';

export type AuthStackParamList = {
  Auth: AuthScreenParams;
  ProfileSetup: undefined;
  ForgotPassword: undefined;
  VerifyOTP: { email: string; mode?: 'forgot' | 'change' };
  ResetPassword: { email: string; token: string; mode?: 'forgot' | 'change' };
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
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};
