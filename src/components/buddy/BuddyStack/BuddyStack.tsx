import React, { useState, useEffect } from 'react';
import { View, ViewStyle, Dimensions, Text } from 'react-native';
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
};

export const BuddyStack: React.FC<BuddyStackProps> = ({
  cards,
  onSwipeLeft,
  onSwipeRight,
  onStackEmpty,
  loading = false,
  style,
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

  const handleSwipeComplete = (direction: 'left' | 'right') => {
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
  };

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
      opacity: showLike || showPass ? 0.8 : 0,
      transform: [{ translateX: -60 }, { translateY: -60 }],
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
    <View
      style={[
        {
          height: 520,
          width: '100%',
          maxWidth: 390,
          alignSelf: 'center',
          position: 'relative',
          marginTop: theme.spacing[2],
        },
        style,
      ]}
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
          <BuddyCard data={nextCard} />
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
          <View>
            <BuddyCard data={currentCard} />
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
            width: 120,
            height: 120,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
            pointerEvents: 'none',
          },
          swipeOverlayStyle,
        ]}
      >
        {/* Like Overlay */}
        <Animated.View style={likeOverlayStyle}>
          <Text style={{ fontSize: 120 }}>💚</Text>
        </Animated.View>
        {/* Pass Overlay */}
        <Animated.View style={passOverlayStyle}>
          <Text style={{ fontSize: 120 }}>❌</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
};
