import React, { useState } from 'react';
import { View, TextInput, ViewStyle, ScrollView, Pressable, Alert } from 'react-native';
import { Search, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';
import { Chip } from '../../ui/Chip/Chip';
import { Spacer } from '../../ui/Spacer/Spacer';
import { Button } from '../../ui/Button/Button';

export type Topic = {
  id: string;
  label: string;
};

const AVAILABLE_TOPICS: Topic[] = [
  { id: 'ielts', label: 'IELTS' },
  { id: 'toeic', label: 'TOEIC' },
  { id: 'english-conversation', label: 'Tiếng Anh giao tiếp' },
  { id: 'programming', label: 'Lập trình' },
  { id: 'web-development', label: 'Web Development' },
  { id: 'mobile-app', label: 'Mobile App' },
  { id: 'data-science', label: 'Data Science' },
  { id: 'ai-ml', label: 'AI/ML' },
  { id: 'ui-ux-design', label: 'UI/UX Design' },
  { id: 'mathematics', label: 'Toán học' },
  { id: 'physics', label: 'Vật lý' },
  { id: 'accounting', label: 'Kế toán' },
  { id: 'finance', label: 'Tài chính' },
];

export type TopicSelectorProps = {
  selectedTopics: string[];
  onTopicsChange: (topics: string[]) => void;
  maxSelection?: number;
  searchPlaceholder?: string;
  selectedCountLabel?: string;
};

export const TopicSelector: React.FC<TopicSelectorProps> = ({
  selectedTopics,
  onTopicsChange,
  maxSelection = 3,
  searchPlaceholder,
  selectedCountLabel,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [customTopics, setCustomTopics] = useState<Topic[]>([]);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');

  // Combine available topics with custom topics
  const allTopics = [...AVAILABLE_TOPICS, ...customTopics];

  const filteredTopics = allTopics.filter((topic) =>
    topic.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleTopicToggle = (topicId: string) => {
    if (selectedTopics.includes(topicId)) {
      // Remove topic
      onTopicsChange(selectedTopics.filter((id) => id !== topicId));
    } else {
      // Add topic (if under max)
      if (selectedTopics.length < maxSelection) {
        onTopicsChange([...selectedTopics, topicId]);
      }
    }
  };

  const handleAddCustomTopic = () => {
    const trimmedName = newTopicName.trim();
    if (!trimmedName) {
      Alert.alert(t('errors.invalidTopic'), t('errors.topicRequired'));
      return;
    }

    if (trimmedName.length < 2) {
      Alert.alert(t('errors.invalidTopic'), t('errors.topicMinLength'));
      return;
    }

    if (selectedTopics.length >= maxSelection) {
      Alert.alert(
        t('errors.maxTopicsReached'),
        t('errors.maxTopicsReachedDescription', { max: maxSelection }),
      );
      return;
    }

    // Check if topic already exists
    const topicExists = allTopics.some(
      (topic) => topic.label.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (topicExists) {
      Alert.alert(t('errors.topicExists'), t('errors.topicExistsDescription'));
      return;
    }

    // Create new custom topic
    const newTopicId = `custom-${Date.now()}`;
    const newTopic: Topic = {
      id: newTopicId,
      label: trimmedName,
    };

    setCustomTopics([...customTopics, newTopic]);
    onTopicsChange([...selectedTopics, newTopicId]);
    setNewTopicName('');
    setShowAddInput(false);
  };

  return (
    <View>
      {/* Search Input */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.surface,
          borderWidth: 1.5,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing[3],
          marginBottom: theme.spacing[4],
        }}
      >
        <Search size={20} color={theme.colors.text.secondary} />
        <TextInput
          style={{
            flex: 1,
            paddingVertical: theme.spacing[3],
            paddingHorizontal: theme.spacing[2],
            fontSize: theme.typography.scale.base,
            color: theme.colors.text.primary,
          }}
          placeholder={searchPlaceholder}
          placeholderTextColor={theme.colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Selected Count */}
      {selectedCountLabel && typeof selectedCountLabel === 'string' && (
        <View style={{ marginBottom: theme.spacing[3] }}>
          <Text variant="bodySmall" color="secondary">
            {selectedCountLabel
              .replace('{{current}}', selectedTopics.length.toString())
              .replace('{{max}}', maxSelection.toString())}
          </Text>
        </View>
      )}

      {/* Add Custom Topic Input */}
      {showAddInput && (
        <View
          style={{
            flexDirection: 'row',
            gap: theme.spacing[2],
            marginBottom: theme.spacing[3],
          }}
        >
          <TextInput
            style={{
              flex: 1,
              paddingVertical: theme.spacing[2],
              paddingHorizontal: theme.spacing[3],
              fontSize: theme.typography.scale.base,
              color: theme.colors.text.primary,
              backgroundColor: theme.colors.surface,
              borderWidth: 1.5,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
            }}
            placeholder={t('step2.addCustomTopicPlaceholder')}
            placeholderTextColor={theme.colors.text.tertiary}
            value={newTopicName}
            onChangeText={setNewTopicName}
            autoFocus
            maxLength={50}
          />
          <Pressable
            onPress={handleAddCustomTopic}
            style={{
              paddingHorizontal: theme.spacing[3],
              paddingVertical: theme.spacing[2],
              backgroundColor: theme.colors.primary[500],
              borderRadius: theme.radius.md,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text variant="body" style={{ color: '#FFFFFF', fontWeight: '600' as const }}>
              {t('step2.add')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setShowAddInput(false);
              setNewTopicName('');
            }}
            style={{
              paddingHorizontal: theme.spacing[3],
              paddingVertical: theme.spacing[2],
              backgroundColor: theme.colors.surface,
              borderWidth: 1.5,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text variant="body" style={{ fontWeight: '600' as const }}>
              {t('step2.cancel')}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Add Custom Topic Button */}
      {!showAddInput && selectedTopics.length < maxSelection && (
        <Pressable
          onPress={() => setShowAddInput(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: theme.spacing[3],
            paddingHorizontal: theme.spacing[4],
            backgroundColor: theme.colors.surface,
            borderWidth: 1.5,
            borderColor: theme.colors.primary[500],
            borderStyle: 'dashed',
            borderRadius: theme.radius.md,
            marginBottom: theme.spacing[3],
          }}
        >
          <Plus size={20} color={theme.colors.primary[500]} />
          <Spacer size={2} horizontal />
          <Text variant="body" color="primary" style={{ fontWeight: '600' as const }}>
            {t('step2.addCustomTopic')}
          </Text>
        </Pressable>
      )}

      {/* Topics Grid */}
      <ScrollView
        style={{ maxHeight: 200 }}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.spacing[2],
          }}
        >
          {filteredTopics.map((topic) => {
            const isSelected = selectedTopics.includes(topic.id);
            const isDisabled = !isSelected && selectedTopics.length >= maxSelection;

            return (
              <Chip
                key={topic.id}
                label={topic.label}
                selected={isSelected}
                onPress={() => handleTopicToggle(topic.id)}
                disabled={isDisabled}
                variant={isSelected ? 'selected' : 'default'}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};
