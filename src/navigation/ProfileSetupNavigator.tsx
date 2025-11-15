import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileSetupStep1 } from '../screens/profile-setup/ProfileSetupStep1';
import { ProfileSetupStep2 } from '../screens/profile-setup/ProfileSetupStep2';
import { ProfileSetupStep3 } from '../screens/profile-setup/ProfileSetupStep3';
import { ProfileSetupStep4 } from '../screens/profile-setup/ProfileSetupStep4';

export type ProfileSetupStackParamList = {
  ProfileSetupStep1: undefined;
  ProfileSetupStep2: undefined;
  ProfileSetupStep3: undefined;
  ProfileSetupStep4: undefined;
};

const Stack = createNativeStackNavigator<ProfileSetupStackParamList>();

export const ProfileSetupNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProfileSetupStep1" component={ProfileSetupStep1} />
      <Stack.Screen name="ProfileSetupStep2" component={ProfileSetupStep2} />
      <Stack.Screen name="ProfileSetupStep3" component={ProfileSetupStep3} />
      <Stack.Screen name="ProfileSetupStep4" component={ProfileSetupStep4} />
    </Stack.Navigator>
  );
};
