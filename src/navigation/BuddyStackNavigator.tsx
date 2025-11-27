import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BuddyScreen } from '../screens/buddy/BuddyScreen';
import { BuddyRequestsScreen } from '../screens/buddy/BuddyRequestsScreen';
import { ConnectionSuccessScreen } from '../screens/buddy/ConnectionSuccessScreen';
import type { ConnectionRequest, BuddyProfile } from '../types/buddy';

export type BuddyStackParamList = {
  BuddyMain: undefined;
  BuddyRequests: undefined;
  ConnectionSuccess: {
    connection: ConnectionRequest;
    sender: BuddyProfile;
  };
};

const Stack = createNativeStackNavigator<BuddyStackParamList>();

export const BuddyStackNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="BuddyMain" component={BuddyScreen} />
    <Stack.Screen name="BuddyRequests" component={BuddyRequestsScreen} />
    <Stack.Screen name="ConnectionSuccess" component={ConnectionSuccessScreen} />
  </Stack.Navigator>
);
