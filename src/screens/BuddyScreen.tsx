import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, ViewStyle, Pressable, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useTranslation } from 'react-i18next';
import { Input } from '../components/ui/Input/Input';
import { Text } from '../components/ui/Text/Text';
import { Spacer } from '../components/ui/Spacer/Spacer';
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
import { Search, Filter, X, ArrowLeft } from 'lucide-react-native';
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

  // Convert profiles to card data (memoized to avoid recalculation on every render)
  const cardData = useMemo(() => results.map(profileToCardData), [results]);

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
  };

  // Handle swipe right (save/connect)
  const handleSwipeRight = (card: (typeof cardData)[0]) => {
    const nextIndex = currentStackIndex + 1;
    if (nextIndex < cardData.length) {
      dispatch(setCurrentStackIndex(nextIndex));
    }
    // TODO: Implement save/connect logic in future PR
  };

  // Handle stack empty
  const handleStackEmpty = () => {
    // TODO: Handle empty stack (load more or show message)
  };

  // Count active filters using utility function
  const activeFiltersCount = countActiveFilters(filters).total;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header with Back, Search and Filter - Full Width */}
      <View
        style={{
          paddingTop: theme.spacing[5],
          paddingBottom: theme.spacing[4],
          paddingHorizontal: theme.spacing[5],
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.03,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        {/* Single Row: Back Button + Search + Filter Button */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing[4],
          }}
        >
          <Pressable
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.surface,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ArrowLeft size={20} color={theme.colors.text.primary} />
          </Pressable>

          <View style={{ flex: 1, minWidth: 0, height: 40, justifyContent: 'center' }}>
            <Input
              placeholder={t('buddy.searchPlaceholder')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              left={<Search size={18} color={theme.colors.text.tertiary} />}
              right={
                searchQuery.length > 0 ? (
                  <Pressable
                    onPress={() => {
                      setSearchQuery('');
                      Keyboard.dismiss();
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={18} color={theme.colors.text.tertiary} />
                  </Pressable>
                ) : undefined
              }
              style={{
                paddingVertical: theme.spacing[2],
                fontSize: theme.typography.scale.base,
              }}
            />
          </View>

          <Pressable
            onPress={() => setFilterModalVisible(true)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.surface,
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <Filter size={20} color={theme.colors.text.primary} />
            {activeFiltersCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: theme.colors.semantic.error,
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 5,
                  borderWidth: 2,
                  borderColor: theme.colors.surface,
                }}
              >
                <Text
                  variant="caption"
                  color="inverse"
                  style={{ fontSize: 10, fontWeight: '700' as const }}
                >
                  {activeFiltersCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Content with spacing from header */}
      <View style={{ flex: 1, paddingTop: theme.spacing[4] }}>
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
          />
        ) : cardData.length === 0 ? (
          <EmptyState
            title={t('buddy.noResultsTitle')}
            description={t('buddy.noResultsMessage')}
            actionLabel={t('buddy.resetFilters')}
            onActionPress={handleFilterReset}
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
  );
};
