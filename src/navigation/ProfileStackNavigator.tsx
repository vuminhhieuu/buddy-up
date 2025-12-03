import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ProfileAchievementsScreen } from '../screens/profile/ProfileAchievementsScreen';
import { ProfileSettingsScreen } from '../screens/profile/ProfileSettingsScreen';
import { SubjectDetailScreen } from '../screens/profile/SubjectDetailScreen';
import { ChangePasswordScreen } from '../screens/profile/ChangePasswordScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { VerifyOTPScreen } from '../screens/auth/VerifyOTPScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import type { Achievement, Subject } from '../types/profile';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  ProfileAchievements: { achievements: Achievement[] };
  ProfileSettings: { section?: string };
  SubjectDetail: { subject: Subject };
  ChangePassword: undefined;
  EditProfile: undefined;
  VerifyOTP: { email: string; mode?: 'forgot' | 'change' };
  ResetPassword: { email: string; token: string; mode?: 'forgot' | 'change' };
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStackNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="ProfileAchievements" component={ProfileAchievementsScreen} />
    <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
    <Stack.Screen name="SubjectDetail" component={SubjectDetailScreen} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
  </Stack.Navigator>
);
