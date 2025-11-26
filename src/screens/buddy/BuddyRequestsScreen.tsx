import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useTranslation } from 'react-i18next';
import { Text } from '../../components/ui/Text/Text';
import { Spacer } from '../../components/ui/Spacer/Spacer';
import { ScreenContainer } from '../../components/ui/ScreenContainer/ScreenContainer';
import { BuddyBackground } from '../../components/buddy/BuddyBackground/BuddyBackground';
import { BuddyStack } from '../../components/buddy/BuddyStack/BuddyStack';
import { Loading } from '../../components/ui/Loading/Loading';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { BuddyHero } from '../../components/buddy/BuddyHero/BuddyHero';
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

  const handleFilterPress = useCallback(() => {
    showInfoToast(t('requests.filterComingSoon'));
  }, [t]);

  return (
    <ScreenContainer contentContainerStyle={{ paddingHorizontal: 0, paddingTop: 0 }}>
      <View style={{ flex: 1 }}>
        <BuddyBackground />

        <View
          style={{ paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[4], flex: 1 }}
        >
          <BuddyHero
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onClearSearch={handleClearSearch}
            onBackPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }}
            onFilterPress={handleFilterPress}
            activeFiltersCount={searchQuery ? 1 : 0}
          />

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
