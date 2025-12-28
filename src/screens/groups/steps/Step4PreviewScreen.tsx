import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer, Text, Spacer, Button } from '../../../components/ui';
import { BackButton } from '../../../components/navigation';
import { useTheme } from '../../../styles';
import { GroupPreviewCard, FriendInviteList } from '../../../components/groups';
import { createPublicGroup } from '../../../services/groups/create';
import {
  uploadCoverImageToStorage,
  deleteCoverImageFromStorage,
} from '../../../services/groups/storage';
import { useAppSelector } from '../../../store/hooks';
import { logger } from '../../../utils/logger';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import type { Step1BasicInfoData } from './Step1BasicInfoScreen';
import type { Step2TopicsData } from './Step2TopicsScreen';
import type { Step3RulesData } from './Step3RulesScreen';
import type { BuddyProfile } from '../../../types/buddy';

export type Step4PreviewData = {
  invited_friend_ids: string[];
};

export type Step4PreviewScreenProps = {
  step1Data: Step1BasicInfoData;
  step2Data: Step2TopicsData;
  step3Data: Step3RulesData;
  initialData?: Partial<Step4PreviewData>;
  onBack: () => void;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreatePublicGroup'>;

export const Step4PreviewScreen: React.FC<Step4PreviewScreenProps> = ({
  step1Data,
  step2Data,
  step3Data,
  initialData,
  onBack,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('groups');
  const navigation = useNavigation<NavigationProp>();
  const { userId } = useAppSelector((state) => state.auth);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>(
    initialData?.invited_friend_ids || [],
  );
  const [friends, setFriends] = useState<BuddyProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const styles = useMemo(() => {
    return {
      header: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        marginBottom: 0,
      },
      headerTitle: {
        flex: 1,
        textAlign: 'center' as const,
        fontWeight: '700' as const,
      },
      progressBarContainer: {
        height: 4,
        backgroundColor: theme.colors.border,
        borderRadius: 2,
        marginTop: theme.spacing[1],
        overflow: 'hidden' as const,
      },
      progressBar: {
        height: 4,
        width: '100%',
        backgroundColor: theme.colors.primary[500],
        borderRadius: 2,
      },
      content: {
        paddingVertical: theme.spacing[3],
      },
    };
  }, [theme]);

  const handleCreateGroup = async () => {
    if (!userId) {
      Alert.alert(t('errors.createFailed'), t('errors.createFailedDescription'));
      return;
    }

    try {
      setCreating(true);

      // Upload cover image to storage if it's a local URI
      let coverImageUrl = step1Data.cover_image_url;
      let uploadedCoverImageUrl: string | null = null; // Track uploaded image for cleanup if needed

      if (
        coverImageUrl &&
        (coverImageUrl.startsWith('file://') || coverImageUrl.startsWith('content://'))
      ) {
        try {
          // Use userId as temporary identifier, will be associated with group after creation
          coverImageUrl = await uploadCoverImageToStorage(userId, coverImageUrl);
          uploadedCoverImageUrl = coverImageUrl; // Store for potential cleanup
        } catch (error: any) {
          Alert.alert(
            t('errors.uploadCoverFailed'),
            error.message || t('errors.uploadCoverFailedDescription'),
          );
          setCreating(false);
          // Cleanup: Delete uploaded image if upload failed after successful storage upload
          // (Note: uploadCoverImageToStorage throws before uploading if validation fails,
          // so cleanup is only needed if upload succeeds but group creation fails)
          return;
        }
      }

      const payload = {
        name: step1Data.name,
        description: step1Data.description,
        cover_image_url: coverImageUrl,
        icon_emoji: step1Data.icon_emoji,
        slug: step3Data.slug,
        topics: step2Data.topics,
        student_level: step2Data.student_level,
        main_language: step2Data.main_language,
        expected_activity_frequency: step2Data.expected_activity_frequency,
        requires_approval: step3Data.requires_approval,
        posting_permission: step3Data.posting_permission,
        rules: step3Data.rules,
        invited_friend_ids: selectedFriendIds.length > 0 ? selectedFriendIds : undefined,
      };

      const result = await createPublicGroup(payload, userId);

      if (result.error) {
        Alert.alert(
          t('errors.createFailed'),
          result.error.message || t('errors.createFailedDescription'),
        );
        // Cleanup: Delete uploaded cover image if group creation failed
        if (uploadedCoverImageUrl) {
          try {
            await deleteCoverImageFromStorage(uploadedCoverImageUrl);
          } catch (cleanupError) {
            // Log but don't show error to user - cleanup failure is not critical
            logger.warn(
              'Step4PreviewScreen',
              'Failed to cleanup uploaded cover image',
              cleanupError,
            );
          }
        }
        setCreating(false);
        return;
      }

      if (result.data) {
        // Navigate to success screen
        navigation.navigate('CreateGroupSuccess', {
          groupId: result.data.id,
          groupName: result.data.name,
        });
      }
    } catch (error: any) {
      Alert.alert(t('errors.createFailed'), error.message || t('errors.createFailedDescription'));
      // Cleanup: Delete uploaded cover image if group creation failed
      if (uploadedCoverImageUrl) {
        try {
          await deleteCoverImageFromStorage(uploadedCoverImageUrl);
        } catch (cleanupError) {
          // Log but don't show error to user - cleanup failure is not critical
          logger.warn('Step4PreviewScreen', 'Failed to cleanup uploaded cover image', cleanupError);
        }
      }
    } finally {
      setCreating(false);
    }
  };

  // Map activity frequency for display
  const getActivityFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return t('step2.daily');
      case 'few_times_week':
        return t('step2.fewTimesWeek');
      case 'weekly':
        return t('step2.weekly');
      case 'flexible':
        return t('step2.flexible');
      default:
        return frequency;
    }
  };

  return (
    <ScreenContainer scroll={false} contentContainerStyle={{ paddingTop: 0 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <BackButton onPress={onBack} />
            <Text variant="h4" style={styles.headerTitle}>
              {t('step4.title')}
            </Text>
            <Text
              variant="body"
              color="primary"
              numberOfLines={1}
              style={{
                fontWeight: '700' as const,
                fontSize: theme.typography.scale.sm,
                minWidth: 50,
                textAlign: 'right',
              }}
            >
              {t('stepIndicator4')}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar} />
          </View>

          <Spacer size={4} />

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Preview Section */}
            <View style={{ marginBottom: theme.spacing[6] }}>
              <Text
                variant="h6"
                style={{ fontWeight: '600' as const, marginBottom: theme.spacing[2] }}
              >
                {t('step4.previewTitle')}
              </Text>
              <Text
                variant="bodySmall"
                color="secondary"
                style={{ marginBottom: theme.spacing[4] }}
              >
                {t('step4.previewDescription')}
              </Text>
              <GroupPreviewCard
                name={step1Data.name}
                description={step1Data.description}
                coverImageUrl={step1Data.cover_image_url || undefined}
                iconEmoji={step1Data.icon_emoji || undefined}
                topics={step2Data.topics}
                memberCount={1} // Creator is the first member
                activityFrequency={getActivityFrequencyLabel(step2Data.expected_activity_frequency)}
                studentLevel={step2Data.student_level}
                privacyType="public"
              />
            </View>

            {/* Public Group Info */}
            <View
              style={{
                backgroundColor: theme.colors.primary[50],
                padding: theme.spacing[3],
                borderRadius: theme.radius.md,
                marginBottom: theme.spacing[6],
              }}
            >
              <Text variant="bodySmall" color="primary">
                ℹ️ {t('step4.publicGroupInfo')}
              </Text>
            </View>

            {/* Invite Friends Section */}
            {friends.length > 0 && (
              <View style={{ marginBottom: theme.spacing[6] }}>
                <Text
                  variant="h6"
                  style={{ fontWeight: '600' as const, marginBottom: theme.spacing[2] }}
                >
                  {t('step4.inviteFriends')}
                </Text>
                <Text
                  variant="bodySmall"
                  color="secondary"
                  style={{ marginBottom: theme.spacing[4] }}
                >
                  {t('step4.inviteFriendsDescription')}
                </Text>
                <FriendInviteList
                  friends={friends}
                  selectedFriendIds={selectedFriendIds}
                  onSelectionChange={setSelectedFriendIds}
                  searchPlaceholder={t('step4.searchFriends')}
                  emptyMessage={t('step4.noFriendsSelected')}
                />
              </View>
            )}

            {/* Navigation Buttons */}
            <View
              style={{
                flexDirection: 'row',
                gap: theme.spacing[3],
                marginBottom: theme.spacing[4],
              }}
            >
              <Button
                label={t('back')}
                variant="outline"
                onPress={onBack}
                disabled={creating}
                style={{ flex: 1 }}
              />
              <Button
                label={creating ? t('creating') : t('create')}
                onPress={handleCreateGroup}
                disabled={creating}
                style={{ flex: 1 }}
                icon={
                  creating ? (
                    <ActivityIndicator size="small" color={theme.colors.text.inverse} />
                  ) : undefined
                }
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};
