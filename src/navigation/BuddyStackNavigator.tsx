import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BuddyScreen } from '../screens/BuddyScreen';
import { BuddyRequestsScreen } from '../screens/BuddyRequestsScreen';

export type BuddyStackParamList = {
  BuddyMain: undefined;
  BuddyRequests: undefined;
};

const Stack = createNativeStackNavigator<BuddyStackParamList>();

export const BuddyStackNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="BuddyMain" component={BuddyScreen} />
    <Stack.Screen name="BuddyRequests" component={BuddyRequestsScreen} />
  </Stack.Navigator>
);
