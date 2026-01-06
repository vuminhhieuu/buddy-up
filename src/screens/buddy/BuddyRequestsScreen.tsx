import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Search } from 'lucide-react-native';
import { Text } from '../../components/ui/Text/Text';
import { Spacer } from '../../components/ui/Spacer/Spacer';
import { Input } from '../../components/ui/Input/Input';
import { ScreenContainer } from '../../components/ui/ScreenContainer/ScreenContainer';
import { BuddyStack } from '../../components/buddy/BuddyStack/BuddyStack';
import { Loading } from '../../components/ui/Loading/Loading';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import {
  fetchIncomingRequestsAsync,
  respondToBuddyRequestAsync,
  markRequestAsRead,
  selectIncomingRequests,
} from '../../store/slices/buddySlice';
import { incomingRequestToCardData } from '../../utils/buddy';
import { useTheme } from '../../styles';
import type { BuddyCardData } from '../../types/buddy';
import { showErrorToast, showInfoToast } from '../../utils/toast';
import type { BuddyStackParamList } from '../../navigation/BuddyStackNavigator';

type NavigationProp = NativeStackNavigationProp<BuddyStackParamList, 'BuddyRequests'>;

export const BuddyRequestsScreen: React.FC = () => {
  const { t } = useTranslation('buddy');
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.buddy);
  const incomingRequests = useAppSelector(selectIncomingRequests);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter requests by search keyword
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) {
      return incomingRequests;
    }
    const normalized = searchQuery.trim().toLowerCase();
    return incomingRequests.filter((request) =>
      request.sender.display_name.toLowerCase().includes(normalized),
    );
  }, [incomingRequests, searchQuery]);

  // Convert incoming requests to card data
  const cardData = useMemo(
    () => filteredRequests.map((request) => incomingRequestToCardData(request)),
    [filteredRequests],
  );

  // Fetch incoming requests on mount
  useEffect(() => {
    dispatch(fetchIncomingRequestsAsync());
  }, [dispatch]);

  // Mark requests as read when viewing
  useEffect(() => {
    incomingRequests.forEach((request) => {
      if (!request.read) {
        dispatch(markRequestAsRead(request.id));
      }
    });
  }, [dispatch, incomingRequests]);

  // Handle swipe left (reject)
  const handleSwipeLeft = useCallback(
    (card: BuddyCardData) => {
      const request = incomingRequests.find((req) => req.sender.user_id === card.userId);
      if (!request) {
        showErrorToast(t('request.invalidRequest'));
        return;
      }

      dispatch(respondToBuddyRequestAsync({ connectionId: request.id, action: 'reject' }))
        .unwrap()
        .then(() => {
          showInfoToast(t('request.rejected'));
        })
        .catch((error: { error?: string }) => {
          showErrorToast(error.error || t('request.rejectError'));
        });
    },
    [dispatch, incomingRequests, t],
  );

  // Handle swipe right (accept)
  const handleSwipeRight = useCallback(
    (card: BuddyCardData) => {
      const request = incomingRequests.find((req) => req.sender.user_id === card.userId);
      if (!request) {
        showErrorToast(t('request.invalidRequest'));
        return;
      }

      dispatch(respondToBuddyRequestAsync({ connectionId: request.id, action: 'accept' }))
        .unwrap()
        .then((result) => {
          navigation.navigate('ConnectionSuccess', {
            connection: result.connection,
            sender: request.sender,
          });
        })
        .catch((error: { error?: string }) => {
          showErrorToast(error.error || t('request.acceptError'));
        });
    },
    [dispatch, incomingRequests, navigation, t],
  );

  // Handle stack empty
  const handleStackEmpty = useCallback(() => {
    // Navigate back when all requests are processed
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Handle card press - navigate to detail screen
  const handleCardPress = useCallback(
    (card: BuddyCardData) => {
      navigation.navigate('BuddyDetail', { userId: card.userId });
    },
    [navigation],
  );

  return (
    <ScreenContainer contentContainerStyle={{ paddingHorizontal: 0, paddingTop: 0 }}>
      <View style={{ flex: 1 }}>
        <View
          style={{ paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[4], flex: 1 }}
        >
          {/* Header with back button and search */}
          <View style={{ marginBottom: theme.spacing[4] }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing[3],
              }}
            >
              <Pressable
                onPress={() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                  }
                }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: theme.radius.lg,
                  backgroundColor: theme.colors.surface,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
                accessibilityRole="button"
                accessibilityLabel={t('requests.goBack')}
              >
                <ArrowLeft size={20} color={theme.colors.text.primary} />
              </Pressable>

              <View style={{ flex: 1 }}>
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  left={<Search size={18} color={theme.colors.text.tertiary} />}
                  right={
                    searchQuery.length > 0 ? (
                      <Pressable
                        onPress={handleClearSearch}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text variant="bodySmall" color="secondary">
                          ✕
                        </Text>
                      </Pressable>
                    ) : undefined
                  }
                  style={{
                    paddingVertical: theme.spacing[2],
                  }}
                />
              </View>
            </View>
          </View>

          <View style={{ marginBottom: theme.spacing[4] }}>
            <Text variant="h6" color="primary" style={{ fontWeight: '600' }}>
              {t('requests.subtitle')}
            </Text>
            <Spacer size={1} />
            <Text variant="body" color="secondary">
              {t('requests.helperDescription')}
            </Text>
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            {loading && incomingRequests.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Loading />
                <Spacer size={4} />
                <Text variant="body" color="tertiary">
                  {t('requests.loading')}
                </Text>
              </View>
            ) : error ? (
              <EmptyState
                title={t('errorTitle')}
                description={error}
                actionLabel={t('retry')}
                onActionPress={() => dispatch(fetchIncomingRequestsAsync())}
                icon={<Text style={{ fontSize: 48 }}>⚠️</Text>}
              />
            ) : cardData.length === 0 ? (
              <EmptyState
                title={t('requests.noRequests')}
                description={
                  searchQuery
                    ? t('requests.noSearchResults', { keyword: searchQuery })
                    : t('requests.noRequestsMessage')
                }
                actionLabel={t('requests.goBack')}
                onActionPress={() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                  }
                }}
                icon={<Text style={{ fontSize: 48 }}>📭</Text>}
              />
            ) : (
              <BuddyStack
                cards={cardData}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onStackEmpty={handleStackEmpty}
                onCardPress={handleCardPress}
                loading={loading}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
};
