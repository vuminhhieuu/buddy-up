import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Keyboard, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BuddyStackParamList } from '../../navigation/BuddyStackNavigator';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useTranslation } from 'react-i18next';
import { Text } from '../../components/ui/Text/Text';
import { Spacer } from '../../components/ui/Spacer/Spacer';
import { ScreenContainer } from '../../components/ui/ScreenContainer/ScreenContainer';
import { BuddyHero } from '../../components/buddy/BuddyHero/BuddyHero';
import { SwipeHint } from '../../components/buddy/SwipeHint/SwipeHint';
import { FilterModal } from '../../components/buddy/FilterModal/FilterModal';
import { BuddyStack } from '../../components/buddy/BuddyStack/BuddyStack';
import { Loading } from '../../components/ui/Loading/Loading';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import {
  searchBuddiesAsync,
  setFilters,
  resetFilters,
  setCurrentStackIndex,
  sendBuddyRequestAsync,
  selectUnreadRequestsCount,
  fetchIncomingRequestsAsync,
  selectIncomingRequests,
  fetchSavedProfileIdsAsync,
  saveProfileAsync,
  unsaveProfileAsync,
} from '../../store/slices/buddySlice';
import { profileToCardData, countActiveFilters } from '../../utils/buddy';
import { getCurrentUserId } from '../../utils/buddy';
import { useTheme } from '../../styles';
import type { BuddyFilters, BuddyCardData } from '../../types/buddy';
import { DEFAULT_BUDDY_FILTERS } from '../../constants/buddy';
import { showSuccessToast, showErrorToast, showInfoToast } from '../../utils/toast';
import { ArrowRight } from 'lucide-react-native';

import {
  SWIPE_HINT_STORAGE_KEY,
  SEARCH_DEBOUNCE_MS,
  SWIPE_HINT_DURATION_MS,
} from '../../constants/buddy';

type NavigationProp = NativeStackNavigationProp<BuddyStackParamList, 'BuddyMain'>;

export const BuddyScreen: React.FC = () => {
  const { t } = useTranslation('buddy');
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const {
    filters,
    results,
    currentStackIndex,
    loading,
    error,
    totalCount,
    requestStatuses = {},
    savedProfileIds,
    savingProfileIds,
  } = useAppSelector((state) => state.buddy);
  const unreadRequestsCount = useAppSelector(selectUnreadRequestsCount);
  const pendingRequests = useAppSelector(selectIncomingRequests);
  const currentUserId = useAppSelector(getCurrentUserId);

  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || '');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [swipeHintVisible, setSwipeHintVisible] = useState(false);
  const swipeHintTimeout = useRef<NodeJS.Timeout | null>(null);
  const pendingRequestsCount = pendingRequests.length;
  const hasPendingRequests = pendingRequestsCount > 0;
  const hasFetchedRequests = useRef(false);
  const hasInitialLoaded = useRef(false);
  const isSearching = useRef(false);

  // Convert profiles to card data (memoized to avoid recalculation on every render)
  const visibleProfiles = useMemo(
    () =>
      results.filter((profile) => {
        const status = requestStatuses?.[profile.user_id];
        return status !== 'sent';
      }),
    [results, requestStatuses],
  );

  const cardData = useMemo(
    () =>
      visibleProfiles.map((profile) => {
        const base = profileToCardData(profile);
        const status = requestStatuses?.[base.userId] ?? 'idle';
        return {
          ...base,
          requestStatus: status,
        } as BuddyCardData;
      }),
    [visibleProfiles, requestStatuses],
  );

  useEffect(() => {
    return () => {
      if (swipeHintTimeout.current) {
        clearTimeout(swipeHintTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    const checkHint = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem(SWIPE_HINT_STORAGE_KEY);
        if (!hasSeen) {
          setSwipeHintVisible(true);
          swipeHintTimeout.current = setTimeout(
            () => setSwipeHintVisible(false),
            SWIPE_HINT_DURATION_MS,
          );
          await AsyncStorage.setItem(SWIPE_HINT_STORAGE_KEY, 'true');
        }
      } catch {
        setSwipeHintVisible(false);
      }
    };
    checkHint();
  }, []);

  // Fetch saved profiles on mount
  useEffect(() => {
    if (currentUserId) {
      dispatch(fetchSavedProfileIdsAsync(currentUserId));
    }
  }, [currentUserId, dispatch]);

  // Search function - optimized to prevent unnecessary re-renders
  const performSearch = useCallback(
    (searchOverride?: string) => {
      if (!currentUserId || isSearching.current) return;

      isSearching.current = true;

      const searchValue = searchOverride !== undefined ? searchOverride : searchQuery;
      const updatedFilters: BuddyFilters = {
        ...filters,
        searchQuery: searchValue.trim() || undefined,
      };

      dispatch(setFilters(updatedFilters));
      dispatch(
        searchBuddiesAsync({
          filters: updatedFilters,
          currentUserId,
        }),
      ).finally(() => {
        isSearching.current = false;
      });
    },
    [currentUserId, searchQuery, filters, dispatch],
  );

  // Debounced search - only triggers when searchQuery changes by user input
  useEffect(() => {
    // Skip if no user or if this is the initial mount
    if (!currentUserId || !hasInitialLoaded.current) return;

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    setDebounceTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, currentUserId]);

  // Initial search on mount - runs only once
  useEffect(() => {
    if (currentUserId && !hasInitialLoaded.current && !loading) {
      hasInitialLoaded.current = true;
      performSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // Fetch pending requests once to populate badge when launching screen
  useEffect(() => {
    if (currentUserId && !hasFetchedRequests.current) {
      dispatch(fetchIncomingRequestsAsync());
      hasFetchedRequests.current = true;
    }
  }, [currentUserId, dispatch]);

  // Handle filter apply
  const handleFilterApply = useCallback(
    (newFilters: BuddyFilters) => {
      if (isSearching.current) return;

      dispatch(setFilters(newFilters));
      setFilterModalVisible(false);
      if (currentUserId) {
        isSearching.current = true;
        dispatch(
          searchBuddiesAsync({
            filters: newFilters,
            currentUserId,
          }),
        ).finally(() => {
          isSearching.current = false;
        });
      }
    },
    [currentUserId, dispatch],
  );

  const handleOpenRequests = useCallback(() => {
    navigation.navigate('BuddyRequests');
  }, [navigation]);

  // Handle filter reset
  const handleFilterReset = useCallback(() => {
    if (isSearching.current) return;

    dispatch(resetFilters());
    setSearchQuery('');
    setFilterModalVisible(false);
    if (currentUserId) {
      isSearching.current = true;
      dispatch(
        searchBuddiesAsync({
          filters: DEFAULT_BUDDY_FILTERS,
          currentUserId,
        }),
      ).finally(() => {
        isSearching.current = false;
      });
    }
  }, [currentUserId, dispatch]);

  const getRequestErrorMessage = useCallback(
    (errorCode?: string) => {
      switch (errorCode) {
        case 'SELF_CONNECTION':
          return t('request.selfConnection');
        case 'ALREADY_EXISTS':
          return t('request.alreadyExists');
        case 'INVALID_USER':
          return t('request.invalidUser');
        default:
          return t('request.sentError');
      }
    },
    [t],
  );

  // Handle swipe left (skip)
  const handleSwipeLeft = useCallback(
    (card: BuddyCardData) => {
      const nextIndex = currentStackIndex + 1;
      if (nextIndex < cardData.length) {
        dispatch(setCurrentStackIndex(nextIndex));
      }
      showInfoToast(t('toast.skipped'));
    },
    [currentStackIndex, cardData.length, dispatch, t],
  );

  // Handle swipe right (send connection request)
  const handleSwipeRight = useCallback(
    (card: BuddyCardData) => {
      const nextIndex = currentStackIndex + 1;
      if (nextIndex < cardData.length) {
        dispatch(setCurrentStackIndex(nextIndex));
      }

      if (!currentUserId) {
        showErrorToast(t('request.invalidUser'));
        return;
      }

      const status = requestStatuses?.[card.userId];
      if (status === 'pending' || status === 'sent') {
        showInfoToast(t('request.alreadySent'));
        return;
      }

      dispatch(sendBuddyRequestAsync({ targetUserId: card.userId }))
        .unwrap()
        .then(() => {
          showSuccessToast(t('request.sentSuccess'));
        })
        .catch((error: { errorCode?: string }) => {
          showErrorToast(getRequestErrorMessage(error.errorCode));
        });
    },
    [
      currentStackIndex,
      cardData.length,
      currentUserId,
      requestStatuses,
      dispatch,
      t,
      getRequestErrorMessage,
    ],
  );

  // Handle stack empty
  const handleStackEmpty = () => {
    // TODO: Handle empty stack (load more or show message)
  };

  // Handle card press - navigate to detail screen
  const handleCardPress = useCallback(
    (card: BuddyCardData) => {
      navigation.navigate('BuddyDetail', { userId: card.userId });
    },
    [navigation],
  );

  // Count active filters using utility function
  const activeFiltersCount = countActiveFilters(filters).total;

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    Keyboard.dismiss();
  }, []);

  const handleToggleSave = useCallback(
    (card: BuddyCardData) => {
      if (!currentUserId) return;

      const alreadySaved = savedProfileIds.includes(card.userId);

      if (alreadySaved) {
        dispatch(unsaveProfileAsync({ userId: currentUserId, savedUserId: card.userId }));
        showInfoToast(t('toast.unsaved'));
      } else {
        dispatch(saveProfileAsync({ userId: currentUserId, savedUserId: card.userId }));
        showSuccessToast(t('toast.saved'));
      }
    },
    [currentUserId, savedProfileIds, dispatch, t],
  );

  const isSaved = useCallback(
    (cardId: string) => {
      return savedProfileIds.includes(cardId);
    },
    [savedProfileIds],
  );

  return (
    <ScreenContainer contentContainerStyle={{ paddingHorizontal: 0, paddingTop: 0 }}>
      <View style={{ flex: 1 }}>
        <SwipeHint visible={swipeHintVisible} message={t('swipeHint')} />

        <View
          style={{ paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[4], flex: 1 }}
        >
          <BuddyHero
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onClearSearch={handleClearSearch}
            onFilterPress={() => setFilterModalVisible(true)}
            activeFiltersCount={activeFiltersCount}
          />

          {hasPendingRequests ? (
            <Pressable
              onPress={handleOpenRequests}
              accessibilityRole="button"
              accessibilityLabel={t('requests.bannerLabel', { count: pendingRequestsCount })}
              style={{ marginBottom: theme.spacing[4] }}
            >
              <View
                style={{
                  borderRadius: theme.radius.lg,
                  paddingVertical: theme.spacing[3],
                  paddingHorizontal: theme.spacing[4],
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: theme.colors.primary[100],
                  borderWidth: 1,
                  borderColor: theme.colors.primary[200],
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: theme.colors.primary[500],
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text variant="bodySmall" color="inverse" style={{ fontWeight: '700' }}>
                      {pendingRequestsCount}
                    </Text>
                  </View>
                  <Text variant="body" color="primary" style={{ fontWeight: '600' }}>
                    {t('requests.bannerLabel', { count: pendingRequestsCount })}
                  </Text>
                </View>
                <ArrowRight color={theme.colors.primary[500]} size={20} />
              </View>
            </Pressable>
          ) : null}

          <View style={{ flex: 1, paddingBottom: insets.bottom + theme.spacing[4] }}>
            {loading && results.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Loading />
                <Spacer size={4} />
                <Text variant="body" color="tertiary">
                  {t('searching')}
                </Text>
              </View>
            ) : error ? (
              <EmptyState
                title={t('errorTitle')}
                description={error}
                actionLabel={t('retry')}
                onActionPress={performSearch}
              />
            ) : cardData.length === 0 ? (
              <EmptyState
                title={t('noResultsTitle')}
                description={t('noResultsMessage')}
                actionLabel={t('resetFilters')}
                onActionPress={handleFilterReset}
              />
            ) : (
              <BuddyStack
                cards={cardData}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onStackEmpty={handleStackEmpty}
                loading={loading}
                onSaveToggle={handleToggleSave}
                isSaved={isSaved}
                onCardPress={handleCardPress}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </View>

        {/* Filter Modal */}
        <FilterModal
          visible={filterModalVisible}
          filters={filters}
          onClose={() => setFilterModalVisible(false)}
          onApply={handleFilterApply}
          onReset={handleFilterReset}
          resultCount={totalCount}
        />
      </View>
    </ScreenContainer>
  );
};
