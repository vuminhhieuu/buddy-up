import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';
import { Input } from '../../ui/Input/Input';
import { Chip } from '../../ui/Chip';
import { Checkbox } from '../../ui/Checkbox';
import { RadioButton } from '../../ui/RadioButton';
import { ToggleSwitch } from '../../ui/ToggleSwitch';
import { SegmentedControl } from '../../ui/SegmentedControl';
import { Spacer } from '../../ui/Spacer/Spacer';
import { X, Search, ChevronDown } from 'lucide-react-native';
import {
  countActiveFilters,
  getAvailableTimeLucideIcon,
  getLearningStyleLucideIcon,
} from '../../../utils/buddy';
import { AcademicFilters } from './AcademicFilters';
import type {
  BuddyFilters,
  LearningGoal,
  AvailableTime,
  LearningStyle,
  Level,
} from '../../../types/buddy';
import {
  DEFAULT_LEARNING_GOALS,
  AVAILABLE_TIMES_CONFIG,
  LEARNING_STYLES_CONFIG,
  LEVELS_CONFIG,
} from '../../../constants/buddy';

export type FilterModalProps = {
  visible: boolean;
  filters: BuddyFilters;
  onClose: () => void;
  onApply: (filters: BuddyFilters) => void;
  onReset: () => void;
  resultCount?: number;
};

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  filters,
  onClose,
  onApply,
  onReset,
  resultCount,
}) => {
  const { t } = useTranslation('buddy');
  const { theme } = useTheme();
  const [localFilters, setLocalFilters] = useState<BuddyFilters>(filters);
  const [goalSearch, setGoalSearch] = useState('');
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleReset = () => {
    setLocalFilters({
      learningGoals: [],
      availableTimes: [],
      learningStyle: undefined,
      level: undefined,
      onlyOnline: false,
      onlyVerified: false,
      hideRejected: false,
      prioritizeFreeSchedule: false,
      onlySaved: false,
      // Academic filters
      university: undefined,
      major: undefined,
      subjects: [],
      projects: [],
      prioritizeSameUniversity: false,
      prioritizeSameMajor: false,
    });
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
              height: '85%',
              flexDirection: 'column',
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

            {/* Header - Fixed */}
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
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text variant="h5" color="primary" style={{ fontWeight: '700' as const }}>
                  {t('filter.title')}
                </Text>
                <Text variant="caption" color="tertiary">
                  {t('filter.appliedCount', {
                    count: countActiveFilters(localFilters).total,
                  })}
                </Text>
              </View>
              <Pressable onPress={handleApply} style={{ minWidth: 60, alignItems: 'flex-end' }}>
                <Text variant="body" color="primary" style={{ fontWeight: '700' as const }}>
                  {t('filter.apply')}
                </Text>
              </Pressable>
            </View>

            {/* Content - ScrollView */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                padding: theme.spacing[5],
                paddingBottom: theme.spacing[4],
              }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              onScrollBeginDrag={() => {
                Keyboard.dismiss();
              }}
            >
              {/* Active Filters Section */}
              {countActiveFilters(localFilters).total > 0 && (
                <View style={{ marginBottom: theme.spacing[6] }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: theme.spacing[3],
                    }}
                  >
                    <Text variant="h6" color="primary" style={{ fontWeight: '600' as const }}>
                      {t('filter.activeFilters')}
                    </Text>
                    <Pressable
                      onPress={handleReset}
                      style={{
                        paddingHorizontal: theme.spacing[3],
                        paddingVertical: theme.spacing[2],
                      }}
                    >
                      <Text
                        variant="bodySmall"
                        color="error"
                        style={{ fontWeight: '600' as const }}
                      >
                        {t('filter.clearAll')}
                      </Text>
                    </Pressable>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: theme.spacing[2],
                    }}
                  >
                    {/* University */}
                    {localFilters.university && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: theme.colors.primary[100],
                          borderRadius: theme.radius.full,
                          paddingLeft: theme.spacing[3],
                          paddingRight: theme.spacing[2],
                          paddingVertical: theme.spacing[2],
                          borderWidth: 1.5,
                          borderColor: theme.colors.primary[300],
                        }}
                      >
                        <Text
                          variant="bodySmall"
                          color="primary"
                          style={{ fontWeight: '500' as const }}
                        >
                          🏫 {localFilters.university}
                        </Text>
                        <Pressable
                          onPress={() =>
                            setLocalFilters({ ...localFilters, university: undefined })
                          }
                          style={{
                            marginLeft: theme.spacing[2],
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: theme.colors.primary[500],
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <X size={12} color={theme.colors.surface} />
                        </Pressable>
                      </View>
                    )}
                    {/* Major */}
                    {localFilters.major && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: theme.colors.secondary[100],
                          borderRadius: theme.radius.full,
                          paddingLeft: theme.spacing[3],
                          paddingRight: theme.spacing[2],
                          paddingVertical: theme.spacing[2],
                          borderWidth: 1.5,
                          borderColor: theme.colors.secondary[300],
                        }}
                      >
                        <Text
                          variant="bodySmall"
                          color="info"
                          style={{ fontWeight: '500' as const }}
                        >
                          📚 {localFilters.major}
                        </Text>
                        <Pressable
                          onPress={() => setLocalFilters({ ...localFilters, major: undefined })}
                          style={{
                            marginLeft: theme.spacing[2],
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: theme.colors.secondary[500],
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <X size={12} color={theme.colors.surface} />
                        </Pressable>
                      </View>
                    )}
                    {/* Subjects */}
                    {localFilters.subjects?.map((subject) => (
                      <View
                        key={subject}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: theme.colors.semantic.success + '20',
                          borderRadius: theme.radius.full,
                          paddingLeft: theme.spacing[3],
                          paddingRight: theme.spacing[2],
                          paddingVertical: theme.spacing[2],
                          borderWidth: 1.5,
                          borderColor: theme.colors.semantic.success + '40',
                        }}
                      >
                        <Text
                          variant="bodySmall"
                          color="success"
                          style={{ fontWeight: '500' as const }}
                        >
                          📖 {subject}
                        </Text>
                        <Pressable
                          onPress={() =>
                            setLocalFilters({
                              ...localFilters,
                              subjects: localFilters.subjects?.filter((s) => s !== subject),
                            })
                          }
                          style={{
                            marginLeft: theme.spacing[2],
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: theme.colors.semantic.success,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <X size={12} color={theme.colors.surface} />
                        </Pressable>
                      </View>
                    ))}
                    {/* Projects */}
                    {localFilters.projects?.map((project) => (
                      <View
                        key={project}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: theme.colors.semantic.warning + '20',
                          borderRadius: theme.radius.full,
                          paddingLeft: theme.spacing[3],
                          paddingRight: theme.spacing[2],
                          paddingVertical: theme.spacing[2],
                          borderWidth: 1.5,
                          borderColor: theme.colors.semantic.warning + '40',
                        }}
                      >
                        <Text
                          variant="bodySmall"
                          color="warning"
                          style={{ fontWeight: '500' as const }}
                        >
                          💼 {project}
                        </Text>
                        <Pressable
                          onPress={() =>
                            setLocalFilters({
                              ...localFilters,
                              projects: localFilters.projects?.filter((p) => p !== project),
                            })
                          }
                          style={{
                            marginLeft: theme.spacing[2],
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: theme.colors.semantic.warning,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <X size={12} color={theme.colors.surface} />
                        </Pressable>
                      </View>
                    ))}
                    {/* Learning Goals */}
                    {localFilters.learningGoals?.map((goal) => (
                      <View
                        key={goal}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: theme.colors.primary[100],
                          borderRadius: theme.radius.full,
                          paddingLeft: theme.spacing[3],
                          paddingRight: theme.spacing[2],
                          paddingVertical: theme.spacing[2],
                          borderWidth: 1.5,
                          borderColor: theme.colors.primary[300],
                        }}
                      >
                        <Text
                          variant="bodySmall"
                          color="primary"
                          style={{ fontWeight: '500' as const }}
                        >
                          {goal}
                        </Text>
                        <Pressable
                          onPress={() => toggleLearningGoal(goal)}
                          style={{
                            marginLeft: theme.spacing[2],
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: theme.colors.primary[500],
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <X size={12} color={theme.colors.surface} />
                        </Pressable>
                      </View>
                    ))}
                    {/* Available Times */}
                    {localFilters.availableTimes?.map((time) => (
                      <View
                        key={time}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: theme.colors.secondary[100],
                          borderRadius: theme.radius.full,
                          paddingLeft: theme.spacing[3],
                          paddingRight: theme.spacing[2],
                          paddingVertical: theme.spacing[2],
                          borderWidth: 1.5,
                          borderColor: theme.colors.secondary[300],
                        }}
                      >
                        <Text
                          variant="bodySmall"
                          color="info"
                          style={{ fontWeight: '500' as const }}
                        >
                          {t(`filter.availableTime.${time}`)}
                        </Text>
                        <Pressable
                          onPress={() => toggleAvailableTime(time)}
                          style={{
                            marginLeft: theme.spacing[2],
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: theme.colors.secondary[500],
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <X size={12} color={theme.colors.surface} />
                        </Pressable>
                      </View>
                    ))}
                    {/* Learning Style */}
                    {localFilters.learningStyle && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: theme.colors.semantic.warning + '20',
                          borderRadius: theme.radius.full,
                          paddingLeft: theme.spacing[3],
                          paddingRight: theme.spacing[2],
                          paddingVertical: theme.spacing[2],
                          borderWidth: 1.5,
                          borderColor: theme.colors.semantic.warning + '40',
                        }}
                      >
                        <Text
                          variant="bodySmall"
                          color="warning"
                          style={{ fontWeight: '500' as const }}
                        >
                          {t(`filter.learningStyleOptions.${localFilters.learningStyle}`)}
                        </Text>
                        <Pressable
                          onPress={() =>
                            setLocalFilters({ ...localFilters, learningStyle: undefined })
                          }
                          style={{
                            marginLeft: theme.spacing[2],
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: theme.colors.semantic.warning,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <X size={12} color={theme.colors.surface} />
                        </Pressable>
                      </View>
                    )}
                    {/* Level */}
                    {localFilters.level && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: theme.colors.semantic.success + '20',
                          borderRadius: theme.radius.full,
                          paddingLeft: theme.spacing[3],
                          paddingRight: theme.spacing[2],
                          paddingVertical: theme.spacing[2],
                          borderWidth: 1.5,
                          borderColor: theme.colors.semantic.success + '40',
                        }}
                      >
                        <Text
                          variant="bodySmall"
                          color="success"
                          style={{ fontWeight: '500' as const }}
                        >
                          {t(`filter.levelOptions.${localFilters.level}`)}
                        </Text>
                        <Pressable
                          onPress={() => setLocalFilters({ ...localFilters, level: undefined })}
                          style={{
                            marginLeft: theme.spacing[2],
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: theme.colors.semantic.success,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <X size={12} color={theme.colors.surface} />
                        </Pressable>
                      </View>
                    )}
                    {/* Advanced Options */}
                    {localFilters.onlyOnline && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: theme.colors.secondary[100],
                          borderRadius: theme.radius.full,
                          paddingLeft: theme.spacing[3],
                          paddingRight: theme.spacing[2],
                          paddingVertical: theme.spacing[2],
                          borderWidth: 1.5,
                          borderColor: theme.colors.secondary[300],
                        }}
                      >
                        <Text
                          variant="bodySmall"
                          color="info"
                          style={{ fontWeight: '500' as const }}
                        >
                          {t('filter.onlyOnline')}
                        </Text>
                        <Pressable
                          onPress={() => setLocalFilters({ ...localFilters, onlyOnline: false })}
                          style={{
                            marginLeft: theme.spacing[2],
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: theme.colors.secondary[500],
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <X size={12} color={theme.colors.surface} />
                        </Pressable>
                      </View>
                    )}
                    {localFilters.onlyVerified && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: theme.colors.secondary[100],
                          borderRadius: theme.radius.full,
                          paddingLeft: theme.spacing[3],
                          paddingRight: theme.spacing[2],
                          paddingVertical: theme.spacing[2],
                          borderWidth: 1.5,
                          borderColor: theme.colors.secondary[300],
                        }}
                      >
                        <Text
                          variant="bodySmall"
                          color="info"
                          style={{ fontWeight: '500' as const }}
                        >
                          {t('filter.onlyVerified')}
                        </Text>
                        <Pressable
                          onPress={() => setLocalFilters({ ...localFilters, onlyVerified: false })}
                          style={{
                            marginLeft: theme.spacing[2],
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: theme.colors.secondary[500],
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <X size={12} color={theme.colors.surface} />
                        </Pressable>
                      </View>
                    )}
                    {localFilters.onlySaved && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: theme.colors.primary[100],
                          borderRadius: theme.radius.full,
                          paddingLeft: theme.spacing[3],
                          paddingRight: theme.spacing[2],
                          paddingVertical: theme.spacing[2],
                          borderWidth: 1.5,
                          borderColor: theme.colors.primary[300],
                        }}
                      >
                        <Text
                          variant="bodySmall"
                          color="primary"
                          style={{ fontWeight: '500' as const }}
                        >
                          {t('filter.onlySaved')}
                        </Text>
                        <Pressable
                          onPress={() => setLocalFilters({ ...localFilters, onlySaved: false })}
                          style={{
                            marginLeft: theme.spacing[2],
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: theme.colors.primary[500],
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <X size={12} color={theme.colors.surface} />
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Academic Filters (NEW - HIGHEST PRIORITY) */}
              <View style={{ marginBottom: theme.spacing[8] }}>
                <Text
                  variant="h5"
                  color="primary"
                  style={{ marginBottom: theme.spacing[4], fontWeight: '700' as const }}
                >
                  {t('filter.academicFilters')}
                </Text>
                <AcademicFilters
                  university={localFilters.university}
                  major={localFilters.major}
                  subjects={localFilters.subjects}
                  projects={localFilters.projects}
                  onUniversityChange={(value) =>
                    setLocalFilters({ ...localFilters, university: value })
                  }
                  onMajorChange={(value) => setLocalFilters({ ...localFilters, major: value })}
                  onSubjectsChange={(value) =>
                    setLocalFilters({ ...localFilters, subjects: value })
                  }
                  onProjectsChange={(value) =>
                    setLocalFilters({ ...localFilters, projects: value })
                  }
                />
              </View>

              {/* Learning Goals */}
              <View style={{ marginBottom: theme.spacing[8] }}>
                <Text variant="h6" color="primary" style={{ marginBottom: theme.spacing[3] }}>
                  {t('filter.learningGoals')}
                </Text>
                <Input
                  placeholder={t('filter.searchGoalPlaceholder')}
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
                  {filteredGoals.map((goal) => {
                    const isSelected = (localFilters.learningGoals || []).includes(goal);
                    return (
                      <Chip
                        key={`goal-${goal}`}
                        label={goal}
                        selected={isSelected}
                        onPress={() => toggleLearningGoal(goal)}
                        icon={isSelected ? <Text>✓</Text> : undefined}
                      />
                    );
                  })}
                </View>
              </View>

              {/* Available Times */}
              <View style={{ marginBottom: theme.spacing[8] }}>
                <Text variant="h6" color="primary" style={{ marginBottom: theme.spacing[3] }}>
                  {t('filter.availableTimes')}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: theme.spacing[3],
                  }}
                >
                  {AVAILABLE_TIMES_CONFIG.map((time) => {
                    const TimeIcon = getAvailableTimeLucideIcon(time.value);
                    return (
                      <View key={time.value} style={{ width: '47%' }}>
                        <Checkbox
                          checked={(localFilters.availableTimes || []).includes(time.value)}
                          onPress={() => toggleAvailableTime(time.value)}
                          label={t(time.translationKey)}
                          leftIcon={
                            <TimeIcon
                              size={18}
                              color={
                                (localFilters.availableTimes || []).includes(time.value)
                                  ? theme.colors.primary[500]
                                  : theme.colors.text.secondary
                              }
                            />
                          }
                        />
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Learning Style */}
              <View style={{ marginBottom: theme.spacing[8] }}>
                <Text variant="h6" color="primary" style={{ marginBottom: theme.spacing[3] }}>
                  {t('filter.learningStyle')}
                </Text>
                <View style={{ gap: theme.spacing[3] }}>
                  {LEARNING_STYLES_CONFIG.map((style) => {
                    const StyleIcon = getLearningStyleLucideIcon(style.value);
                    return (
                      <RadioButton
                        key={style.value}
                        selected={localFilters.learningStyle === style.value}
                        onPress={() =>
                          setLocalFilters({ ...localFilters, learningStyle: style.value })
                        }
                        label={t(style.translationKey)}
                        leftIcon={
                          <StyleIcon
                            size={18}
                            color={
                              localFilters.learningStyle === style.value
                                ? theme.colors.primary[500]
                                : theme.colors.text.secondary
                            }
                          />
                        }
                      />
                    );
                  })}
                </View>
              </View>

              {/* Online Status */}
              <View style={{ marginBottom: theme.spacing[8] }}>
                <Text variant="h6" color="primary" style={{ marginBottom: theme.spacing[3] }}>
                  {t('filter.onlineStatus')}
                </Text>
                <ToggleSwitch
                  value={localFilters.onlyOnline || false}
                  onValueChange={(value) => setLocalFilters({ ...localFilters, onlyOnline: value })}
                  label={t('filter.onlyOnline')}
                />
              </View>

              {/* Level */}
              <View style={{ marginBottom: theme.spacing[8] }}>
                <Text variant="h6" color="primary" style={{ marginBottom: theme.spacing[3] }}>
                  {t('filter.level')}
                </Text>
                <SegmentedControl
                  segments={LEVELS_CONFIG.map((l) => t(l.translationKey))}
                  selectedIndex={
                    localFilters.level
                      ? LEVELS_CONFIG.findIndex((l) => l.value === localFilters.level)
                      : -1
                  }
                  onChange={(index) =>
                    setLocalFilters({ ...localFilters, level: LEVELS_CONFIG[index].value })
                  }
                />
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
                    {t('filter.advancedOptions')}
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
                      value={localFilters.prioritizeSameUniversity || false}
                      onValueChange={(value) =>
                        setLocalFilters({ ...localFilters, prioritizeSameUniversity: value })
                      }
                      label={t('filter.prioritizeSameUniversity')}
                    />
                    <ToggleSwitch
                      value={localFilters.prioritizeSameMajor || false}
                      onValueChange={(value) =>
                        setLocalFilters({ ...localFilters, prioritizeSameMajor: value })
                      }
                      label={t('filter.prioritizeSameMajor')}
                    />
                    <ToggleSwitch
                      value={localFilters.onlyVerified || false}
                      onValueChange={(value) =>
                        setLocalFilters({ ...localFilters, onlyVerified: value })
                      }
                      label={t('filter.onlyVerified')}
                    />
                    <ToggleSwitch
                      value={localFilters.hideRejected || false}
                      onValueChange={(value) =>
                        setLocalFilters({ ...localFilters, hideRejected: value })
                      }
                      label={t('filter.hideRejected')}
                    />
                    <ToggleSwitch
                      value={localFilters.prioritizeFreeSchedule || false}
                      onValueChange={(value) =>
                        setLocalFilters({ ...localFilters, prioritizeFreeSchedule: value })
                      }
                      label={t('filter.prioritizeFreeSchedule')}
                    />
                    <ToggleSwitch
                      value={localFilters.onlySaved || false}
                      onValueChange={(value) =>
                        setLocalFilters({ ...localFilters, onlySaved: value })
                      }
                      label={t('filter.onlySaved')}
                    />
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
