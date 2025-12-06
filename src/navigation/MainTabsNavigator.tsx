import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { BottomTabBar } from '../components/navigation';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectUnreadRequestsCount } from '../store/slices/buddySlice';
import { HomeScreen } from '../screens/home/HomeScreen';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { BuddyStackNavigator } from './BuddyStackNavigator';
import { logger } from '../utils/logger';
import { ChatStackNavigator } from './ChatStackNavigator';
import { selectUnreadCount, fetchConversationsAsync } from '../store/slices/chatSlice';
export type MainTabParamList = {
  Home: undefined;
  Buddy: undefined;
  Chat: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabsNavigator: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const unreadRequestsCount = useAppSelector(selectUnreadRequestsCount);
  const chatUnreadCount = useAppSelector(selectUnreadCount);
  const currentUserId = useAppSelector((state) => state.auth.userId);

  // Debug log
  if (__DEV__) {
    logger.debug('MainTabsNavigator', 'Unread requests count:', unreadRequestsCount);
  }

  useEffect(() => {
    if (!currentUserId) return;
    dispatch(fetchConversationsAsync());
    const interval = setInterval(() => {
      dispatch(fetchConversationsAsync());
    }, 30000);
    return () => clearInterval(interval);
  }, [currentUserId, dispatch]);

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => {
        const activeRouteName = state.routeNames[state.index];
        let hideTabBar = false;

        if (activeRouteName === 'Chat') {
          const route = state.routes[state.index];
          const nestedRoute = getFocusedRouteNameFromRoute(route) ?? 'ChatList';
          hideTabBar = nestedRoute !== 'ChatList';
        }

        if (hideTabBar) {
          return null;
        }

        return (
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
              {
                key: 'chat',
                label: t('navigation.chat'),
                icon: 'chat',
                badge:
                  state.routeNames[state.index].toLowerCase() === 'chat'
                    ? undefined
                    : chatUnreadCount > 0
                      ? chatUnreadCount
                      : undefined,
              },
              { key: 'profile', label: t('navigation.profile'), icon: 'profile' },
            ]}
          />
        );
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Buddy" component={BuddyStackNavigator} />
      <Tab.Screen name="Chat" component={ChatStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};
