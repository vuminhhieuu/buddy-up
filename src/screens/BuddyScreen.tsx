import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useTranslation } from 'react-i18next';
import { Text } from '../components/ui/Text/Text';
import { Spacer } from '../components/ui/Spacer/Spacer';
import { ScreenContainer } from '../components/ui/ScreenContainer/ScreenContainer';
import { Toast } from '../components/ui/Toast/Toast';
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
} from '../store/slices/buddySlice';
import { profileToCardData, countActiveFilters } from '../utils/buddy';
import { getCurrentUserId } from '../utils/buddy';
import { useTheme } from '../styles';
import type { BuddyFilters } from '../types/buddy';

export const BuddyScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { filters, results, currentStackIndex, loading, error, totalCount } = useAppSelector(
    (state) => state.buddy,
  );
  const currentUserId = useAppSelector(getCurrentUserId);

  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || '');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [savedProfiles, setSavedProfiles] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const [swipeHintVisible, setSwipeHintVisible] = useState(false);
  const swipeHintTimeout = useRef<NodeJS.Timeout | null>(null);

  // Convert profiles to card data (memoized to avoid recalculation on every render)
  const cardData = useMemo(() => results.map(profileToCardData), [results]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }
    toastTimeout.current = setTimeout(() => setToastVisible(false), 2200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeout.current) {
        clearTimeout(toastTimeout.current);
      }
      if (swipeHintTimeout.current) {
        clearTimeout(swipeHintTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    const SWIPE_HINT_KEY = 'buddy_swipe_hint_seen';
    async function checkHint() {
      try {
        const hasSeen = await AsyncStorage.getItem(SWIPE_HINT_KEY);
        if (!hasSeen) {
          setSwipeHintVisible(true);
          swipeHintTimeout.current = setTimeout(() => setSwipeHintVisible(false), 3000);
          await AsyncStorage.setItem(SWIPE_HINT_KEY, 'true');
        }
      } catch {
        setSwipeHintVisible(false);
      }
    }
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
    }, 500); // 500ms debounce

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
  const handleFilterApply = (newFilters: BuddyFilters) => {
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
  };

  // Handle filter reset
  const handleFilterReset = () => {
    dispatch(resetFilters());
    setSearchQuery('');
    setFilterModalVisible(false);
    if (currentUserId) {
      dispatch(
        searchBuddiesAsync({
          filters: { ...filters, searchQuery: undefined },
          currentUserId,
        }),
      );
    }
  };

  // Handle swipe left (skip)
  const handleSwipeLeft = (card: (typeof cardData)[0]) => {
    const nextIndex = currentStackIndex + 1;
    if (nextIndex < cardData.length) {
      dispatch(setCurrentStackIndex(nextIndex));
    }
    showToast(t('buddy.toast.skipped'));
  };

  // Handle swipe right (save/connect)
  const handleSwipeRight = (card: (typeof cardData)[0]) => {
    const nextIndex = currentStackIndex + 1;
    if (nextIndex < cardData.length) {
      dispatch(setCurrentStackIndex(nextIndex));
    }
    showToast(t('buddy.toast.connected'));
  };

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
    (card: (typeof cardData)[0]) => {
      setSavedProfiles((prev) => {
        const next = { ...prev };
        if (next[card.userId]) {
          delete next[card.userId];
          showToast(t('buddy.toast.unsaved'));
        } else {
          next[card.userId] = true;
          showToast(t('buddy.toast.saved'));
        }
        return next;
      });
    },
    [showToast, t],
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
        <Toast message={toastMessage ?? ''} visible={toastVisible} />

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
