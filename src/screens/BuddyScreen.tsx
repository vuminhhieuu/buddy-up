import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useTranslation } from 'react-i18next';
import { Text } from '../components/ui/Text/Text';
import { Spacer } from '../components/ui/Spacer/Spacer';
import { ScreenContainer } from '../components/ui/ScreenContainer/ScreenContainer';
import { BuddyBackground } from '../components/buddy/BuddyBackground/BuddyBackground';
import { BuddyHero } from '../components/buddy/BuddyHero/BuddyHero';
import { SwipeHint } from '../components/buddy/SwipeHint/SwipeHint';
import { FilterModal } from '../components/buddy/FilterModal/FilterModal';
import { BuddyStack } from '../components/buddy/BuddyStack/BuddyStack';
import { Loading } from '../components/ui/Loading/Loading';
import { EmptyState } from '../components/ui/EmptyState/EmptyState';
import {
  searchBuddiesAsync,
  setFilters,
  resetFilters,
  setCurrentStackIndex,
  sendBuddyRequestAsync,
} from '../store/slices/buddySlice';
import { profileToCardData, countActiveFilters } from '../utils/buddy';
import { getCurrentUserId } from '../utils/buddy';
import { useTheme } from '../styles';
import type { BuddyFilters, BuddyCardData } from '../types/buddy';
import { DEFAULT_BUDDY_FILTERS } from '../types/buddy';
import { showSuccessToast, showErrorToast, showInfoToast } from '../utils/toast';

import {
  SWIPE_HINT_STORAGE_KEY,
  SEARCH_DEBOUNCE_MS,
  SWIPE_HINT_DURATION_MS,
} from '../constants/buddy';

export const BuddyScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const {
    filters,
    results,
    currentStackIndex,
    loading,
    error,
    totalCount,
    requestStatuses = {},
  } = useAppSelector((state) => state.buddy);
  const currentUserId = useAppSelector(getCurrentUserId);

  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || '');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [savedProfiles, setSavedProfiles] = useState<Record<string, boolean>>({});
  const [swipeHintVisible, setSwipeHintVisible] = useState(false);
  const swipeHintTimeout = useRef<NodeJS.Timeout | null>(null);

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

  // Search function
  const performSearch = useCallback(() => {
    if (!currentUserId) return;

    const updatedFilters: BuddyFilters = {
      ...filters,
      searchQuery: searchQuery.trim() || undefined,
    };

    dispatch(setFilters(updatedFilters));
    dispatch(
      searchBuddiesAsync({
        filters: updatedFilters,
        currentUserId,
      }),
    );
  }, [currentUserId, searchQuery, filters, dispatch]);

  // Debounced search
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (!currentUserId) return;

    const timer = setTimeout(() => {
      performSearch();
    }, SEARCH_DEBOUNCE_MS);

    setDebounceTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Initial search on mount
  useEffect(() => {
    if (currentUserId && results.length === 0 && !loading) {
      performSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // Handle filter apply
  const handleFilterApply = useCallback(
    (newFilters: BuddyFilters) => {
      dispatch(setFilters(newFilters));
      setFilterModalVisible(false);
      if (currentUserId) {
        dispatch(
          searchBuddiesAsync({
            filters: newFilters,
            currentUserId,
          }),
        );
      }
    },
    [currentUserId, dispatch],
  );

  // Handle filter reset
  const handleFilterReset = useCallback(() => {
    dispatch(resetFilters());
    setSearchQuery('');
    setFilterModalVisible(false);
    if (currentUserId) {
      dispatch(
        searchBuddiesAsync({
          filters: DEFAULT_BUDDY_FILTERS,
          currentUserId,
        }),
      );
    }
  }, [currentUserId, dispatch]);

  const getRequestErrorMessage = useCallback(
    (errorCode?: string) => {
      switch (errorCode) {
        case 'SELF_CONNECTION':
          return t('buddy.request.selfConnection');
        case 'ALREADY_EXISTS':
          return t('buddy.request.alreadyExists');
        case 'INVALID_USER':
          return t('buddy.request.invalidUser');
        default:
          return t('buddy.request.sentError');
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
      showInfoToast(t('buddy.toast.skipped'));
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
        showErrorToast(t('buddy.request.invalidUser'));
        return;
      }

      const status = requestStatuses?.[card.userId];
      if (status === 'pending' || status === 'sent') {
        showInfoToast(t('buddy.request.alreadySent'));
        return;
      }

      dispatch(sendBuddyRequestAsync({ targetUserId: card.userId }))
        .unwrap()
        .then(() => {
          showSuccessToast(t('buddy.request.sentSuccess'));
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
      const alreadySaved = Boolean(savedProfiles[card.userId]);
      setSavedProfiles((prev) => {
        const next = { ...prev };
        if (alreadySaved) {
          delete next[card.userId];
        } else {
          next[card.userId] = true;
        }
        return next;
      });
      if (alreadySaved) {
        showInfoToast(t('buddy.toast.unsaved'));
      } else {
        showSuccessToast(t('buddy.toast.saved'));
      }
    },
    [savedProfiles, t],
  );

  const isSaved = useCallback(
    (cardId: string) => {
      return Boolean(savedProfiles[cardId]);
    },
    [savedProfiles],
  );

  return (
    <ScreenContainer contentContainerStyle={{ paddingHorizontal: 0, paddingTop: 0 }}>
      <View style={{ flex: 1 }}>
        <BuddyBackground />
        <SwipeHint visible={swipeHintVisible} message={t('buddy.swipeHint')} />

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
            onFilterPress={() => setFilterModalVisible(true)}
            activeFiltersCount={activeFiltersCount}
          />

          <View style={{ flex: 1 }}>
            {loading && results.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Loading />
                <Spacer size={4} />
                <Text variant="body" color="tertiary">
                  {t('buddy.searching')}
                </Text>
              </View>
            ) : error ? (
              <EmptyState
                title={t('buddy.errorTitle')}
                description={error}
                actionLabel={t('buddy.retry')}
                onActionPress={performSearch}
                icon={<Text style={{ fontSize: 48 }}>⚠️</Text>}
              />
            ) : cardData.length === 0 ? (
              <EmptyState
                title={t('buddy.noResultsTitle')}
                description={t('buddy.noResultsMessage')}
                actionLabel={t('buddy.resetFilters')}
                onActionPress={handleFilterReset}
                icon={<Text style={{ fontSize: 48 }}>🔍</Text>}
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
