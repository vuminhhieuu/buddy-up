import React, { useState, useEffect, useCallback } from 'react';
import { View, ViewStyle, Dimensions, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  runOnUI,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../../../styles';
import { BuddyCard } from '../BuddyCard/BuddyCard';
import { Loading } from '../../ui/Loading/Loading';
import { EmptyState } from '../../ui/EmptyState/EmptyState';
import type { BuddyCardData } from '../../../types/buddy';
import {
  SWIPE_THRESHOLD_PERCENTAGE,
  SWIPE_OUT_DISTANCE_PERCENTAGE,
  CARD_HEIGHT,
  SCALE_DIVISOR,
} from '../../../constants/buddy';
import { SPRING_RESET_CONFIG, SPRING_SWIPE_OUT_CONFIG } from '../../../constants/animations';

// Calculate swipe thresholds based on screen width
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * SWIPE_THRESHOLD_PERCENTAGE;
const SWIPE_OUT_DISTANCE = SCREEN_WIDTH * SWIPE_OUT_DISTANCE_PERCENTAGE;

export type BuddyStackProps = {
  cards: BuddyCardData[];
  onSwipeLeft: (card: BuddyCardData) => void;
  onSwipeRight: (card: BuddyCardData) => void;
  onStackEmpty?: () => void;
  loading?: boolean;
  style?: ViewStyle;
  onSaveToggle?: (card: BuddyCardData) => void;
  isSaved?: (cardId: string) => boolean;
};

export const BuddyStack: React.FC<BuddyStackProps> = ({
  cards,
  onSwipeLeft,
  onSwipeRight,
  onStackEmpty,
  loading = false,
  style,
  onSaveToggle,
  isSaved,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const currentCard = cards[currentIndex];
  const nextCard = cards[currentIndex + 1];
  const showActions = Boolean(currentCard);
  const currentCardSaved = currentCard ? isSaved?.(currentCard.userId) : false;

  // Define worklets and handlers (before hooks that might not execute)
  const resetPositionWorklet = () => {
    'worklet';
    translateX.value = withSpring(0, SPRING_RESET_CONFIG);
    translateY.value = withSpring(0, SPRING_RESET_CONFIG);
    scale.value = withSpring(1, SPRING_RESET_CONFIG);
    opacity.value = withSpring(1, SPRING_RESET_CONFIG);
  };

  const handleSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      if (!currentCard) return;

      if (direction === 'right') {
        onSwipeRight(currentCard);
      } else {
        onSwipeLeft(currentCard);
      }

      const nextIndex = currentIndex + 1;
      if (nextIndex >= cards.length) {
        onStackEmpty?.();
      } else {
        setCurrentIndex(nextIndex);
      }
    },
    [currentCard, currentIndex, cards.length, onSwipeLeft, onSwipeRight, onStackEmpty],
  );

  const swipeOut = (direction: 'left' | 'right') => {
    'worklet';
    const distance = direction === 'right' ? SWIPE_OUT_DISTANCE : -SWIPE_OUT_DISTANCE;
    translateX.value = withSpring(distance, SPRING_SWIPE_OUT_CONFIG, () => {
      runOnJS(handleSwipeComplete)(direction);
    });
    translateY.value = withSpring(direction === 'right' ? 40 : -40, SPRING_SWIPE_OUT_CONFIG);
    opacity.value = withSpring(0, SPRING_SWIPE_OUT_CONFIG);
  };

  // Reset position when currentIndex changes (new card)
  useEffect(() => {
    runOnUI(() => {
      'worklet';
      translateX.value = withSpring(0, SPRING_RESET_CONFIG);
      translateY.value = withSpring(0, SPRING_RESET_CONFIG);
      scale.value = withSpring(1, SPRING_RESET_CONFIG);
      opacity.value = withSpring(1, SPRING_RESET_CONFIG);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  useEffect(() => {
    if (currentIndex >= cards.length) {
      setCurrentIndex(0);
    }
  }, [cards.length, currentIndex]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      'worklet';
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      scale.value = 1 - Math.abs(event.translationX) / SCALE_DIVISOR;
    })
    .onEnd((event) => {
      'worklet';
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? 'right' : 'left';
        swipeOut(direction);
      } else {
        resetPositionWorklet();
      }
    });

  const triggerSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (!currentCard) return;
      runOnUI(() => {
        'worklet';
        swipeOut(direction);
      })();
    },
    [currentCard],
  );

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const animatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(translateX.value, [-SCREEN_WIDTH, SCREEN_WIDTH], [-15, 15]);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  const nextCardStyle = useAnimatedStyle(() => {
    const nextScale = currentIndex < cards.length - 1 ? 0.95 : 1;
    const nextOpacity = currentIndex < cards.length - 1 ? 0.8 : 1;
    return {
      transform: [{ scale: nextScale }],
      opacity: nextOpacity,
    };
  });

  // NOW early returns are safe (all hooks have been called)
  if (loading) {
    return (
      <View
        style={[{ height: CARD_HEIGHT, justifyContent: 'center', alignItems: 'center' }, style]}
      >
        <Loading message={t('buddy.loading')} />
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={[{ height: CARD_HEIGHT }, style]}>
        <EmptyState
          title={t('buddy.stack.noMoreResults')}
          description={t('buddy.stack.adjustFilters')}
        />
      </View>
    );
  }

  if (!currentCard) {
    return (
      <View style={[{ height: CARD_HEIGHT }, style]}>
        <EmptyState
          title={t('buddy.stack.allViewed')}
          description={t('buddy.stack.adjustFilters')}
        />
      </View>
    );
  }

  return (
    <View style={[{ alignItems: 'center' }, style]}>
      <View
        style={{
          height: CARD_HEIGHT,
          width: '100%',
          maxWidth: 390,
          alignSelf: 'center',
          position: 'relative',
          marginTop: theme.spacing[2],
        }}
      >
        {/* Next Card (Back) */}
        {nextCard && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: '100%',
                height: '100%',
                zIndex: 1,
              },
              nextCardStyle,
            ]}
          >
            <BuddyCard data={nextCard} fullHeight />
          </Animated.View>
        )}

        {/* Current Card (Front) */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: '100%',
              height: '100%',
              zIndex: 2,
            },
            animatedStyle,
          ]}
        >
          <GestureDetector gesture={panGesture}>
            <View style={{ flex: 1, height: '100%' }}>
              <BuddyCard data={currentCard} fullHeight />
            </View>
          </GestureDetector>
        </Animated.View>
      </View>

      {showActions && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing[4],
            marginTop: theme.spacing[4],
          }}
        >
          <Pressable
            accessibilityLabel={t('buddy.actions.skip')}
            onPress={() => triggerSwipe('left')}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              borderWidth: 3,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: 22, color: theme.colors.text.secondary }}>✕</Text>
          </Pressable>

          <Pressable
            accessibilityLabel={t('buddy.actions.save')}
            onPress={() => currentCard && onSaveToggle?.(currentCard)}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              borderWidth: 2,
              borderColor: theme.colors.semantic.warning,
              backgroundColor: currentCardSaved
                ? theme.colors.semantic.warning
                : theme.colors.surface,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 22 }}>{currentCardSaved ? '❤️' : '💛'}</Text>
          </Pressable>

          <Pressable
            accessibilityLabel={t('buddy.actions.connect')}
            onPress={() => triggerSwipe('right')}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: theme.colors.primary[500],
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.18,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 22, color: theme.colors.surface }}>✓</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};
