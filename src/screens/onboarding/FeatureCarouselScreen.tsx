import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { FeatureSlide, type CenterIconType } from '../../components/onboarding/FeatureSlide';
import { useTheme } from '../../styles';
import { ScreenContainer } from '../../components/ui';

interface FeatureCarouselScreenProps {
  onComplete: () => void;
}

interface FeatureData {
  id: string;
  emoji1: string;
  emoji2?: string;
  centerIcon: string;
  centerIconType?: CenterIconType;
  title: string;
  description: string;
  backgroundColor: string;
}

export const FeatureCarouselScreen: React.FC<FeatureCarouselScreenProps> = ({ onComplete }) => {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const { t } = useTranslation('common');
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const features: FeatureData[] = [
    {
      id: '1',
      emoji1: '👨‍🎓',
      emoji2: '👩‍💼',
      centerIcon: '🤝',
      centerIconType: 'logo',
      title: t('onboarding.carousel.slide1.title'),
      description: t('onboarding.carousel.slide1.description'),
      backgroundColor: '#E8F5E9',
    },
    {
      id: '2',
      emoji1: '📅',
      emoji2: '📝',
      centerIcon: '📚',
      centerIconType: 'book',
      title: t('onboarding.carousel.slide2.title'),
      description: t('onboarding.carousel.slide2.description'),
      backgroundColor: '#E3F2FD',
    },
    {
      id: '3',
      emoji1: '📊',
      emoji2: '⭐',
      centerIcon: '🎯',
      centerIconType: 'target',
      title: t('onboarding.carousel.slide3.title'),
      description: t('onboarding.carousel.slide3.description'),
      backgroundColor: '#F3E5F5',
    },
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  const renderItem = ({ item }: { item: FeatureData }) => (
    <View
      style={{ width, height: '100%' }}
      accessible
      accessibilityLabel={t('onboarding.carousel.slideIndicator', {
        index: currentIndex + 1,
        total: features.length,
        defaultValue: `Slide ${currentIndex + 1} of ${features.length}`,
      })}
    >
      <FeatureSlide
        emoji1={item.emoji1}
        emoji2={item.emoji2}
        centerIcon={item.centerIcon}
        centerIconType={item.centerIconType}
        title={item.title}
        description={item.description}
        backgroundColor={item.backgroundColor}
      />
    </View>
  );

  const scrollToIndex = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  return (
    <ScreenContainer
      contentContainerStyle={{ paddingHorizontal: 0, paddingTop: 0 }}
      style={{ backgroundColor: theme.colors.background }}
    >
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={features}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
          style={styles.flatList}
        />

        {/* Pagination */}
        <View style={styles.paginationContainer}>
          {features.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => scrollToIndex(index)}
              accessibilityRole="button"
              accessibilityState={{ selected: currentIndex === index }}
              accessibilityLabel={t('onboarding.carousel.slideIndicator', {
                index: index + 1,
                total: features.length,
                defaultValue: `Slide ${index + 1} of ${features.length}`,
              })}
              style={[styles.paginationTouchable]}
            >
              <View
                style={[
                  styles.paginationDot,
                  { backgroundColor: theme.colors.neutral[300] },
                  currentIndex === index && {
                    width: 24,
                    backgroundColor: theme.colors.primary[500],
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.startButton,
              {
                backgroundColor: theme.colors.primary[500],
                ...theme.shadows.lg,
              },
            ]}
            onPress={onComplete}
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.carousel.startButton')}
            accessibilityHint={t('onboarding.carousel.startHint', {
              defaultValue: 'Finish onboarding',
            })}
          >
            <Text
              style={[
                styles.startButtonText,
                {
                  fontFamily: theme.typography.families.display,
                  fontWeight: '600',
                  color: theme.colors.text.inverse,
                },
              ]}
            >
              {t('onboarding.carousel.startButton')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flatList: {
    flex: 1,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  paginationTouchable: {
    paddingHorizontal: 4,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 4,
  },
  startButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});
