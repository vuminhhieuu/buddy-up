import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatListScreen } from '../screens/chat/ChatListScreen';
import { ChatRoomScreen } from '../screens/chat/ChatRoomScreen';
import { ChatInfoScreen } from '../screens/chat/ChatInfoScreen';

export type ChatStackParamList = {
  ChatList: undefined;
  ChatRoom: {
    chatId: string;
    type: 'direct' | 'group';
    title?: string | null;
    participant?: {
      name?: string | null;
      avatar?: string | null;
      tags?: string[] | null;
      status?: string | null;
    };
  };
  ChatInfo: {
    chatId: string;
    participantName?: string | null;
    avatar?: string | null;
    tags?: string[] | null;
  };
};

const Stack = createNativeStackNavigator<ChatStackParamList>();

export const ChatStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
      <Stack.Screen name="ChatInfo" component={ChatInfoScreen} />
    </Stack.Navigator>
  );
};
