import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ProfileAchievementsScreen } from '../screens/ProfileAchievementsScreen';
import { ProfileSettingsScreen } from '../screens/ProfileSettingsScreen';
import { SubjectDetailScreen } from '../screens/SubjectDetailScreen';
import type { Achievement, Subject } from '../types/profile';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  ProfileAchievements: { achievements: Achievement[] };
  ProfileSettings: { section?: string };
  SubjectDetail: { subject: Subject };
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStackNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="ProfileAchievements" component={ProfileAchievementsScreen} />
    <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
    <Stack.Screen name="SubjectDetail" component={SubjectDetailScreen} />
  </Stack.Navigator>
);
