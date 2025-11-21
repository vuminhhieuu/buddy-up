import React from 'react';
import { View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Search, ArrowLeft, Filter as FilterIcon } from 'lucide-react-native';
import { useTheme } from '../../../styles';
import { Input } from '../../ui/Input/Input';
import { Text } from '../../ui/Text/Text';

export type BuddyHeroProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onBackPress: () => void;
  onFilterPress: () => void;
  activeFiltersCount: number;
};

export const BuddyHero: React.FC<BuddyHeroProps> = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  onBackPress,
  onFilterPress,
  activeFiltersCount,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={{ marginBottom: theme.spacing[5] }}>
      <LinearGradient
        colors={[theme.colors.primary[50], theme.colors.secondary[50]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: theme.radius.xxl,
          paddingVertical: theme.spacing[5],
          paddingHorizontal: theme.spacing[4],
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: theme.colors.primary[200],
            opacity: 0.15,
            top: -40,
            right: -20,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: theme.colors.secondary[200],
            opacity: 0.12,
            bottom: -30,
            left: -10,
          }}
        />

        {/* Controls row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing[3],
          }}
        >
          <Pressable
            onPress={onBackPress}
            style={{
              width: 44,
              height: 44,
              borderRadius: theme.radius.xl,
              backgroundColor: theme.colors.surface,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
              elevation: 2,
            }}
          >
            <ArrowLeft size={20} color={theme.colors.text.primary} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Input
              placeholder={t('buddy.searchPlaceholder')}
              value={searchQuery}
              onChangeText={(value) => onSearchChange(value)}
              left={<Search size={18} color={theme.colors.text.tertiary} />}
              right={
                searchQuery.length > 0 ? (
                  <Pressable
                    onPress={onClearSearch}
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

          <Pressable
            onPress={onFilterPress}
            style={{
              width: 44,
              height: 44,
              borderRadius: theme.radius.xl,
              backgroundColor: theme.colors.surface,
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
              elevation: 2,
            }}
          >
            <FilterIcon size={20} color={theme.colors.text.primary} />
            {activeFiltersCount > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: theme.colors.semantic.warning,
                  borderWidth: 2,
                  borderColor: theme.colors.surface,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text variant="caption" color="inverse" style={{ fontSize: 10, fontWeight: '700' }}>
                  {activeFiltersCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
};
