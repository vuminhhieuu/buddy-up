import React, { useState } from 'react';
import {
  View,
  ViewStyle,
  ScrollView,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
import { Chip } from '../../ui/Chip';
import { Checkbox } from '../../ui/Checkbox';
import { RadioButton } from '../../ui/RadioButton';
import { Slider } from '../../ui/Slider';
import { ToggleSwitch } from '../../ui/ToggleSwitch';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { Spacer } from '../../ui/Spacer/Spacer';
import { ChevronDown, X, Search } from 'lucide-react-native';
import type {
  BuddyFilters,
  LearningGoal,
  AvailableTime,
  LearningStyle,
  Level,
  SortOption,
} from '../../../types/buddy';

export type FilterModalProps = {
  visible: boolean;
  filters: BuddyFilters;
  onClose: () => void;
  onApply: (filters: BuddyFilters) => void;
  onReset: () => void;
  resultCount?: number;
};

// Default learning goals list
const DEFAULT_LEARNING_GOALS: LearningGoal[] = [
  'JLPT N3',
  'React Native',
  'TOEIC',
  'IELTS',
  'Python',
  'Data Science',
  'UI/UX',
  'Marketing',
];

// Available times with labels
const AVAILABLE_TIMES: Array<{ value: AvailableTime; label: string }> = [
  { value: 'morning', label: '☀️ Buổi sáng' },
  { value: 'afternoon', label: '🌤️ Buổi trưa' },
  { value: 'evening', label: '🌙 Buổi tối' },
  { value: 'late_night', label: '🌃 Đêm muộn' },
  { value: 'weekend', label: '🎉 Cuối tuần' },
  { value: 'flexible', label: '⚡ Linh hoạt' },
];

// Learning styles with labels
const LEARNING_STYLES: Array<{ value: LearningStyle; label: string }> = [
  { value: 'serious', label: '📋 Nghiêm túc, có kế hoạch rõ ràng' },
  { value: 'relaxed', label: '😊 Thoải mái, không quá căng thẳng' },
  { value: 'balanced', label: '🎯 Vừa học vừa chơi, cân bằng' },
  { value: 'not_important', label: '💫 Không quan trọng' },
];

// Levels with labels
const LEVELS: Array<{ value: Level; label: string }> = [
  { value: 'beginner', label: '🌱 Mới bắt đầu' },
  { value: 'intermediate', label: '🌿 Trung bình' },
  { value: 'advanced', label: '🌳 Nâng cao' },
];

// Sort options with labels
const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'best_match', label: 'Phù hợp nhất ⭐' },
  { value: 'nearest', label: 'Gần nhất' },
  { value: 'newest', label: 'Mới nhất' },
];

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  filters,
  onClose,
  onApply,
  onReset,
  resultCount,
}) => {
  const { theme } = useTheme();
  const [localFilters, setLocalFilters] = useState<BuddyFilters>(filters);
  const [goalSearch, setGoalSearch] = useState('');
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [selectedSort, setSelectedSort] = useState<SortOption>(filters.sortBy || 'best_match');

  React.useEffect(() => {
    setLocalFilters(filters);
    setSelectedSort(filters.sortBy || 'best_match');
  }, [filters]);

  const handleApply = () => {
    onApply({ ...localFilters, sortBy: selectedSort });
  };

  const handleReset = () => {
    setLocalFilters({
      learningGoals: [],
      availableTimes: [],
      learningStyle: undefined,
      distance: { min: 0, max: 50 },
      age: { min: 18, max: 60 },
      level: undefined,
      sortBy: 'best_match',
      onlyOnline: false,
      onlyVerified: false,
      hideRejected: false,
      prioritizeFreeSchedule: false,
    });
    setSelectedSort('best_match');
    setGoalSearch('');
    onReset();
  };

  const toggleLearningGoal = (goal: LearningGoal) => {
    const current = localFilters.learningGoals || [];
    const updated = current.includes(goal) ? current.filter((g) => g !== goal) : [...current, goal];
    setLocalFilters({ ...localFilters, learningGoals: updated });
  };

  const toggleAvailableTime = (time: AvailableTime) => {
    const current = localFilters.availableTimes || [];
    const updated = current.includes(time) ? current.filter((t) => t !== time) : [...current, time];
    setLocalFilters({ ...localFilters, availableTimes: updated });
  };

  const filteredGoals = DEFAULT_LEARNING_GOALS.filter((goal) =>
    goal.toLowerCase().includes(goalSearch.toLowerCase()),
  );

  const countActiveFilters = () => {
    let count = 0;
    if (localFilters.learningGoals?.length) count += localFilters.learningGoals.length;
    if (localFilters.availableTimes?.length) count += localFilters.availableTimes.length;
    if (localFilters.learningStyle) count += 1;
    if (localFilters.distance && localFilters.distance.max !== 50) count += 1;
    if (localFilters.age && (localFilters.age.min !== 18 || localFilters.age.max !== 60))
      count += 1;
    if (localFilters.level) count += 1;
    if (localFilters.onlyOnline) count += 1;
    if (localFilters.onlyVerified) count += 1;
    if (localFilters.hideRejected) count += 1;
    if (localFilters.prioritizeFreeSchedule) count += 1;
    return count;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radius.xxl,
              borderTopRightRadius: theme.radius.xxl,
              maxHeight: '85%',
              paddingBottom: Platform.OS === 'ios' ? 40 : 20,
            }}
          >
            {/* Pull Handle */}
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: theme.colors.border,
                borderRadius: 2,
                alignSelf: 'center',
                marginTop: theme.spacing[3],
                marginBottom: theme.spacing[4],
              }}
            />

            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: theme.spacing[5],
                paddingBottom: theme.spacing[4],
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.neutral[100],
              }}
            >
              <Pressable
                onPress={onClose}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.colors.neutral[100],
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X color={theme.colors.text.secondary} size={18} />
              </Pressable>
              <View style={{ alignItems: 'center' }}>
                <Text variant="h5" color="primary" style={{ fontWeight: '700' as const }}>
                  Bộ lọc
                </Text>
                <Text variant="caption" color="tertiary">
                  {countActiveFilters()} bộ lọc đang áp dụng
                </Text>
              </View>
              <Pressable onPress={handleReset}>
                <Text variant="body" color="info" style={{ fontWeight: '600' as const }}>
                  Đặt lại
                </Text>
              </Pressable>
            </View>

            {/* Content */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: theme.spacing[5] }}
              showsVerticalScrollIndicator={false}
            >
              {/* Learning Goals */}
              <View style={{ marginBottom: theme.spacing[8] }}>
                <Text variant="h6" color="primary" style={{ marginBottom: theme.spacing[3] }}>
                  Mục tiêu học tập
                </Text>
                <Input
                  placeholder="Tìm mục tiêu..."
                  value={goalSearch}
                  onChangeText={setGoalSearch}
                  left={
                    <View style={{ marginRight: theme.spacing[2] }}>
                      <Search color={theme.colors.text.tertiary} size={16} />
                    </View>
                  }
                />
                <Spacer size={3} />
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: theme.spacing[2],
                  }}
                >
                  {filteredGoals.map((goal) => (
                    <Chip
                      key={goal}
                      label={goal}
                      selected={(localFilters.learningGoals || []).includes(goal)}
                      onPress={() => toggleLearningGoal(goal)}
                    />
                  ))}
                </View>
              </View>

              {/* Available Times */}
              <View style={{ marginBottom: theme.spacing[8] }}>
                <Text variant="h6" color="primary" style={{ marginBottom: theme.spacing[3] }}>
                  Thời gian rảnh
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: theme.spacing[3],
                  }}
                >
                  {AVAILABLE_TIMES.map((time) => (
                    <View key={time.value} style={{ width: '47%' }}>
                      <Checkbox
                        checked={(localFilters.availableTimes || []).includes(time.value)}
                        onPress={() => toggleAvailableTime(time.value)}
                        label={time.label}
                      />
                    </View>
                  ))}
                </View>
              </View>

              {/* Learning Style */}
              <View style={{ marginBottom: theme.spacing[8] }}>
                <Text variant="h6" color="primary" style={{ marginBottom: theme.spacing[3] }}>
                  Phong cách học
                </Text>
                <View style={{ gap: theme.spacing[3] }}>
                  {LEARNING_STYLES.map((style) => (
                    <RadioButton
                      key={style.value}
                      selected={localFilters.learningStyle === style.value}
                      onPress={() =>
                        setLocalFilters({ ...localFilters, learningStyle: style.value })
                      }
                      label={style.label}
                    />
                  ))}
                </View>
              </View>

              {/* Distance */}
              <View style={{ marginBottom: theme.spacing[8] }}>
                <Text variant="h6" color="primary" style={{ marginBottom: theme.spacing[3] }}>
                  Khoảng cách
                </Text>
                <Slider
                  value={localFilters.distance?.max || 50}
                  min={0}
                  max={50}
                  onValueChange={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      distance: { min: 0, max: value },
                    })
                  }
                  showLabels
                  labelLeft="🏠 Rất gần"
                  labelRight="🚗 Xa hơn"
                />
                <Spacer size={2} />
                <ToggleSwitch
                  value={localFilters.onlyOnline || false}
                  onValueChange={(value) => setLocalFilters({ ...localFilters, onlyOnline: value })}
                  label="Chỉ hiện người online ngay"
                />
              </View>

              {/* Age */}
              <View style={{ marginBottom: theme.spacing[8] }}>
                <Text variant="h6" color="primary" style={{ marginBottom: theme.spacing[3] }}>
                  Độ tuổi
                </Text>
                <Slider
                  value={localFilters.age?.min || 18}
                  min={18}
                  max={60}
                  onValueChange={(value) => {
                    const maxAge = Math.min(60, value + 6);
                    setLocalFilters({
                      ...localFilters,
                      age: { min: value, max: maxAge },
                    });
                  }}
                  showValue
                />
                <Text
                  variant="body"
                  color="success"
                  style={{
                    textAlign: 'center',
                    marginTop: theme.spacing[2],
                    fontWeight: '600' as const,
                  }}
                >
                  {localFilters.age?.min || 18} - {localFilters.age?.max || 60} tuổi
                </Text>
              </View>

              {/* Level */}
              <View style={{ marginBottom: theme.spacing[8] }}>
                <Text variant="h6" color="primary" style={{ marginBottom: theme.spacing[3] }}>
                  Trình độ
                </Text>
                <SegmentedControl
                  segments={LEVELS.map((l) => l.label)}
                  selectedIndex={
                    localFilters.level
                      ? LEVELS.findIndex((l) => l.value === localFilters.level)
                      : -1
                  }
                  onChange={(index) =>
                    setLocalFilters({ ...localFilters, level: LEVELS[index].value })
                  }
                />
              </View>

              {/* Sort */}
              <View style={{ marginBottom: theme.spacing[8] }}>
                <Text variant="h6" color="primary" style={{ marginBottom: theme.spacing[3] }}>
                  Sắp xếp kết quả theo
                </Text>
                <Pressable
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: theme.spacing[4],
                    backgroundColor: theme.colors.surface,
                    borderWidth: 1.5,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    minHeight: theme.sizes.input.md,
                  }}
                >
                  <Text variant="body" color="primary" style={{ fontWeight: '500' as const }}>
                    {SORT_OPTIONS.find((opt) => opt.value === selectedSort)?.label ||
                      'Phù hợp nhất ⭐'}
                  </Text>
                  <ChevronDown color={theme.colors.text.tertiary} size={14} />
                </Pressable>
              </View>

              {/* Advanced Options */}
              <View style={{ marginBottom: theme.spacing[8] }}>
                <Pressable
                  onPress={() => setAdvancedExpanded(!advancedExpanded)}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: theme.spacing[3],
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.neutral[100],
                    marginTop: theme.spacing[4],
                  }}
                >
                  <Text variant="h6" color="tertiary" style={{ fontWeight: '600' as const }}>
                    Tùy chọn nâng cao
                  </Text>
                  <ChevronDown
                    color={theme.colors.text.tertiary}
                    size={14}
                    style={{
                      transform: [{ rotate: advancedExpanded ? '180deg' : '0deg' }],
                    }}
                  />
                </Pressable>
                {advancedExpanded && (
                  <View style={{ gap: theme.spacing[4], marginTop: theme.spacing[4] }}>
                    <ToggleSwitch
                      value={localFilters.onlyVerified || false}
                      onValueChange={(value) =>
                        setLocalFilters({ ...localFilters, onlyVerified: value })
                      }
                      label="Chỉ hiện hồ sơ đã xác thực ✓"
                    />
                    <ToggleSwitch
                      value={localFilters.hideRejected || false}
                      onValueChange={(value) =>
                        setLocalFilters({ ...localFilters, hideRejected: value })
                      }
                      label="Ẩn người đã từ chối trước đó"
                    />
                    <ToggleSwitch
                      value={localFilters.prioritizeFreeSchedule || false}
                      onValueChange={(value) =>
                        setLocalFilters({ ...localFilters, prioritizeFreeSchedule: value })
                      }
                      label="Ưu tiên người có lịch trống"
                    />
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View
              style={{
                paddingHorizontal: theme.spacing[5],
                paddingTop: theme.spacing[4],
                borderTopWidth: 1,
                borderTopColor: theme.colors.neutral[100],
                backgroundColor: theme.colors.surface,
              }}
            >
              {resultCount !== undefined && (
                <Text
                  variant="bodySmall"
                  color="secondary"
                  style={{
                    textAlign: 'center',
                    marginBottom: theme.spacing[3],
                    fontWeight: '500' as const,
                  }}
                >
                  Tìm thấy {resultCount} kết quả phù hợp
                </Text>
              )}
              <Button label="Áp dụng bộ lọc" onPress={handleApply} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
