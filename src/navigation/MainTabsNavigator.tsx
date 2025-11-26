import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBar } from '../components/navigation';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../store/hooks';
import { selectUnreadRequestsCount } from '../store/slices/buddySlice';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { BuddyStackNavigator } from './BuddyStackNavigator';
import { logger } from '../utils/logger';
export type MainTabParamList = {
  Home: undefined;
  Buddy: undefined;
  Chat: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabsNavigator: React.FC = () => {
  const { t } = useTranslation();
  const unreadRequestsCount = useAppSelector(selectUnreadRequestsCount);

  // Debug log
  if (__DEV__) {
    logger.debug('MainTabsNavigator', 'Unread requests count:', unreadRequestsCount);
  }

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <BottomTabBar
          activeKey={state.routeNames[state.index].toLowerCase()}
          onTabPress={(key) => {
            const routeName =
              key === 'home'
                ? 'Home'
                : key === 'buddy'
                  ? 'Buddy'
                  : key === 'chat'
                    ? 'Chat'
                    : 'Profile';
            navigation.navigate(routeName as keyof MainTabParamList);
          }}
          tabs={[
            { key: 'home', label: t('navigation.home'), icon: 'home' },
            {
              key: 'buddy',
              label: t('navigation.buddy'),
              icon: 'buddy',
              badge:
                state.routeNames[state.index].toLowerCase() === 'buddy'
                  ? undefined
                  : unreadRequestsCount > 0
                    ? unreadRequestsCount
                    : undefined,
            },
            { key: 'chat', label: t('navigation.chat'), icon: 'chat' },
            { key: 'profile', label: t('navigation.profile'), icon: 'profile' },
          ]}
        />
      )}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Buddy" component={BuddyStackNavigator} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};
