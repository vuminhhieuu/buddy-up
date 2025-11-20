import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;
const SWIPE_OUT_DISTANCE = SCREEN_WIDTH * 1.5;

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
  // Early returns must come BEFORE all hooks
  // But we need useTranslation for i18n, so we'll handle loading/empty after hooks
  // For now, we'll use a simple check that doesn't require hooks

  // Now all hooks can be called safely
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const currentCard = cards[currentIndex];
  const nextCard = cards[currentIndex + 1];
  const currentCardSaved = currentCard ? isSaved?.(currentCard.userId) : false;
  const indicatorCount = useMemo(() => {
    const remaining = Math.max(0, cards.length - currentIndex);
    return Math.min(4, remaining);
  }, [cards.length, currentIndex]);

  // Define worklets and handlers (before hooks that might not execute)
  const resetPositionWorklet = () => {
    'worklet';
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    scale.value = withSpring(1);
    opacity.value = withSpring(1);
  };

  const swipeOut = (direction: 'left' | 'right', callback: () => void) => {
    'worklet';
    const distance = direction === 'right' ? SWIPE_OUT_DISTANCE : -SWIPE_OUT_DISTANCE;
    translateX.value = withSpring(distance, { damping: 20 }, () => {
      runOnJS(callback)();
    });
    translateY.value = withSpring(direction === 'right' ? 50 : -50);
    opacity.value = withSpring(0);
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

  // Reset position when currentIndex changes (new card)
  useEffect(() => {
    runOnUI(() => {
      'worklet';
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      opacity.value = withSpring(1);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      'worklet';
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      scale.value = 1 - Math.abs(event.translationX) / 1000;
    })
    .onEnd((event) => {
      'worklet';
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? 'right' : 'left';
        swipeOut(direction, () => handleSwipeComplete(direction));
      } else {
        resetPositionWorklet();
      }
    });

  const triggerSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (!currentCard) return;
      runOnUI(() => {
        'worklet';
        swipeOut(direction, () => handleSwipeComplete(direction));
      })();
    },
    [currentCard, handleSwipeComplete],
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

  // Swipe overlay animated styles (must be called before early returns)
  const swipeOverlayStyle = useAnimatedStyle(() => {
    const showLike = translateX.value > 50;
    const showPass = translateX.value < -50;
    return {
      opacity: showLike || showPass ? 1 : 0,
      transform: [{ translateY: -50 }],
    };
  });

  const likeOverlayStyle = useAnimatedStyle(() => {
    const showLike = translateX.value > 50;
    return {
      opacity: showLike ? 1 : 0,
      position: 'absolute',
    };
  });

  const passOverlayStyle = useAnimatedStyle(() => {
    const showPass = translateX.value < -50;
    return {
      opacity: showPass ? 1 : 0,
      position: 'absolute',
    };
  });

  // NOW early returns are safe (all hooks have been called)
  if (loading) {
    return (
      <View style={[{ height: 520, justifyContent: 'center', alignItems: 'center' }, style]}>
        <Loading message={t('buddy.loading')} />
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={[{ height: 520 }, style]}>
        <EmptyState
          title={t('buddy.stack.noMoreResults')}
          description={t('buddy.stack.adjustFilters')}
        />
      </View>
    );
  }

  // Check for no current card after hooks
  if (!currentCard) {
    return (
      <View style={[{ height: 520 }, style]}>
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
          height: 520,
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

        {/* Swipe Overlay Hints */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: '50%',
              left: '50%',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3,
              pointerEvents: 'none',
            },
            swipeOverlayStyle,
          ]}
        >
          {/* Like Overlay */}
          <Animated.View
            style={[
              {
                paddingHorizontal: theme.spacing[4],
                paddingVertical: theme.spacing[2],
                borderRadius: theme.radius.full,
                borderWidth: 1.5,
                borderColor: theme.colors.semantic.success,
                backgroundColor: theme.colors.semantic.success + '20',
                marginBottom: theme.spacing[2],
              },
              likeOverlayStyle,
            ]}
          >
            <Text style={{ color: theme.colors.semantic.success, fontWeight: '700' }}>
              {t('buddy.stack.overlay.like')}
            </Text>
          </Animated.View>
          {/* Pass Overlay */}
          <Animated.View
            style={[
              {
                paddingHorizontal: theme.spacing[4],
                paddingVertical: theme.spacing[2],
                borderRadius: theme.radius.full,
                borderWidth: 1.5,
                borderColor: theme.colors.semantic.error,
                backgroundColor: theme.colors.semantic.error + '20',
              },
              passOverlayStyle,
            ]}
          >
            <Text style={{ color: theme.colors.semantic.error, fontWeight: '700' }}>
              {t('buddy.stack.overlay.pass')}
            </Text>
          </Animated.View>
        </Animated.View>
      </View>

      {indicatorCount > 0 && (
        <View
          style={{
            flexDirection: 'row',
            gap: theme.spacing[1],
            marginTop: theme.spacing[4],
          }}
        >
          {Array.from({ length: indicatorCount }).map((_, index) => (
            <View
              key={`dot-${index}`}
              style={{
                width: index === 0 ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: index === 0 ? theme.colors.primary[500] : theme.colors.border,
              }}
            />
          ))}
        </View>
      )}

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
            shadowOpacity: 0.1,
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
            shadowOpacity: 0.1,
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
            shadowOpacity: 0.2,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 4,
          }}
        >
          <Text style={{ fontSize: 22, color: theme.colors.surface }}>✓</Text>
        </Pressable>
      </View>
    </View>
  );
};
