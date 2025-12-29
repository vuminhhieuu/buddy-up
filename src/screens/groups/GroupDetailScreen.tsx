import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  Lock,
  Users,
  Calendar,
  BookOpen,
  LogOut,
  UserPlus,
  MessageCircle,
  FileText,
  Star,
  PenSquare,
  Crown,
  Camera,
  Clock3,
  BarChart3,
  Languages,
  ChevronRight,
} from 'lucide-react-native';
import {
  ScreenContainer,
  Text,
  Card,
  Chip,
  Avatar,
  Button,
  Spacer,
  Divider,
  Icon,
} from '../../components/ui';
import { ImagePickerModal } from '../../components/ui/ImagePickerModal/ImagePickerModal';
import { BackButton } from '../../components/navigation';
import { useTheme } from '../../styles';
import { useAppSelector } from '../../store/hooks';
import {
  getGroupMembersWithProfiles,
  joinPublicGroup,
  leaveGroup,
  isUserMemberOfGroup,
  getUserRoleInGroup,
  disbandGroup,
} from '../../services/groups/members';
import {
  uploadCoverImageToStorage,
  deleteCoverImageFromStorage,
} from '../../services/groups/storage';
import { getGroupRules } from '../../services/groups/rules';
import { getGroupPosts, deleteGroupPost, getGroupPostCount } from '../../services/groups/posts';
import { getTopicLabelsForGroup } from '../../utils/topicUtils';
import { logger } from '../../utils/logger';
import { supabase } from '../../config/supabase';
import { PostCard } from '../../components/groups';
import type { StudyGroup } from '../../services/groups/types';
import type { GroupMemberWithProfile } from '../../services/groups/members';
import type { GroupRule } from '../../services/groups/types';
import type { GroupPost } from '../../services/groups/types';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import Toast from 'react-native-toast-message';

type GroupDetailRouteProp = RouteProp<RootStackParamList, 'GroupDetail'>;

// Constants for UI layout
const BOTTOM_BAR_HEIGHT = 100; // Height of fixed bottom action bar (Invite Friends + Create Post buttons)
const BOTTOM_PADDING_DEFAULT = 20; // Default bottom padding for non-members

export const GroupDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation('groups');
  const route = useRoute<GroupDetailRouteProp>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { userId } = useAppSelector((state) => state.auth);
  const { groupId } = route.params;

  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [members, setMembers] = useState<GroupMemberWithProfile[]>([]);
  const [rules, setRules] = useState<GroupRule[]>([]);
  const [topicLabels, setTopicLabels] = useState<string[]>([]);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'moderator' | 'member' | null>(null);
  const [isDisbanding, setIsDisbanding] = useState(false);
  const [showCoverImagePicker, setShowCoverImagePicker] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverImageError, setCoverImageError] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'posts' | 'members'>('about');

  const loadGroupData = async () => {
    if (!userId || !groupId) return;

    try {
      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from('study_groups')
        .select('*')
        .eq('id', groupId)
        .is('deleted_at', null)
        .single();

      if (groupError || !groupData) {
        logger.error('GroupDetailScreen', 'Error loading group', groupError);
        Toast.show({
          type: 'error',
          text1: t('detail.errorLoading'),
          text2: groupError?.message || t('detail.groupNotFound'),
        });
        navigation.goBack();
        return;
      }

      const groupInfo = groupData as StudyGroup;
      setGroup(groupInfo);
      setIsOwner(groupInfo.creator_id === userId);
      // Reset cover image error state when loading new group
      setCoverImageError(false);

      // Check if user is a member
      const memberStatus = await isUserMemberOfGroup(groupId, userId);
      setIsMember(memberStatus);

      // Get user role in group
      if (memberStatus) {
        const role = await getUserRoleInGroup(groupId, userId);
        setUserRole(role);
      } else {
        setUserRole(null);
      }

      // Load members
      const membersData = await getGroupMembersWithProfiles(groupId);
      setMembers(membersData);

      // Load rules
      const rulesData = await getGroupRules(groupId);
      setRules(rulesData);

      // Load topic labels
      if (groupInfo.topics && groupInfo.topics.length > 0) {
        const labels = await getTopicLabelsForGroup(groupInfo.topics, groupId);
        setTopicLabels(labels);
      }

      // Load posts if group is public or user is a member
      if (groupInfo.privacy_type === 'public' || memberStatus) {
        await loadPosts();
        const count = await getGroupPostCount(groupId);
        setPostCount(count);
      }
    } catch (error: any) {
      logger.error('GroupDetailScreen', 'Unexpected error', error);
      Toast.show({
        type: 'error',
        text1: t('detail.errorLoading'),
        text2: error.message || t('detail.unexpectedError'),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId && groupId) {
      setLoading(true);
      loadGroupData();
    }
  }, [userId, groupId]);

  // Reload posts when screen is focused (e.g., after creating a new post)
  useFocusEffect(
    useCallback(() => {
      if (groupId && group?.privacy_type && (group.privacy_type === 'public' || isMember)) {
        loadPosts();
        getGroupPostCount(groupId).then(setPostCount);
      }
    }, [isMember, groupId, group?.privacy_type]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGroupData();
    // Reload posts if group is public or user is a member
    if (group && (group.privacy_type === 'public' || isMember)) {
      await loadPosts();
      const count = await getGroupPostCount(groupId);
      setPostCount(count);
    }
  };

  const handleJoinGroup = async () => {
    if (!userId || !groupId) return;

    setIsJoining(true);
    try {
      const result = await joinPublicGroup(groupId, userId);

      if (result.success) {
        setIsMember(true);
        Toast.show({
          type: 'success',
          text1: t('detail.joinSuccess'),
          text2: t('detail.welcomeToGroup'),
        });
        // Reload data to update member count
        await loadGroupData();
      } else {
        Toast.show({
          type: 'error',
          text1: t('detail.joinError'),
          text2: result.error || t('detail.failedToJoin'),
        });
      }
    } catch (error: any) {
      logger.error('GroupDetailScreen', 'Error joining group', error);
      Toast.show({
        type: 'error',
        text1: t('detail.joinError'),
        text2: error.message || t('detail.failedToJoin'),
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveGroup = () => {
    if (!userId || !groupId) return;

    Alert.alert(t('detail.leaveGroup'), t('detail.leaveGroupConfirm'), [
      {
        text: t('common.cancel', { ns: 'common' }),
        style: 'cancel',
      },
      {
        text: t('detail.leave'),
        style: 'destructive',
        onPress: async () => {
          setIsLeaving(true);
          try {
            const result = await leaveGroup(groupId, userId);

            if (result.success) {
              setIsMember(false);
              Toast.show({
                type: 'success',
                text1: t('detail.leaveSuccess'),
              });
              // Reload data to update member count
              await loadGroupData();
            } else {
              Toast.show({
                type: 'error',
                text1: t('detail.leaveError'),
                text2: result.error || t('detail.failedToLeave'),
              });
            }
          } catch (error: any) {
            logger.error('GroupDetailScreen', 'Error leaving group', error);
            Toast.show({
              type: 'error',
              text1: t('detail.leaveError'),
              text2: error.message || t('detail.failedToLeave'),
            });
          } finally {
            setIsLeaving(false);
          }
        },
      },
    ]);
  };

  const handleDisbandGroup = () => {
    if (!userId || !groupId) return;

    Alert.alert(t('detail.disbandGroup'), t('detail.disbandGroupConfirm'), [
      {
        text: t('common.cancel', { ns: 'common' }),
        style: 'cancel',
      },
      {
        text: t('detail.disband'),
        style: 'destructive',
        onPress: async () => {
          setIsDisbanding(true);
          try {
            const result = await disbandGroup(groupId, userId);

            if (result.success) {
              Toast.show({
                type: 'success',
                text1: t('detail.disbandSuccess'),
              });
              // Navigate back to community screen
              navigation.goBack();
            } else {
              Toast.show({
                type: 'error',
                text1: t('detail.disbandError'),
                text2: result.error || t('detail.failedToDisband'),
              });
            }
          } catch (error: any) {
            logger.error('GroupDetailScreen', 'Error disbanding group', error);
            Toast.show({
              type: 'error',
              text1: t('detail.disbandError'),
              text2: error.message || t('detail.failedToDisband'),
            });
          } finally {
            setIsDisbanding(false);
          }
        },
      },
    ]);
  };

  const loadPosts = async () => {
    if (!groupId) return;

    setLoadingPosts(true);
    try {
      const result = await getGroupPosts(groupId, 20, 0);
      if (result.success && result.posts) {
        setPosts(result.posts);
      }
    } catch (error: any) {
      logger.error('GroupDetailScreen', 'Error loading posts', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!userId) return;

    try {
      const result = await deleteGroupPost(postId, userId);
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: t('posts.deleteSuccess', { defaultValue: 'Xóa bài đăng thành công' }),
        });
        // Reload posts
        await loadPosts();
        const count = await getGroupPostCount(groupId);
        setPostCount(count);
      } else {
        Toast.show({
          type: 'error',
          text1: t('posts.deleteError', { defaultValue: 'Lỗi xóa bài đăng' }),
          text2:
            result.error ||
            t('posts.deleteErrorDescription', { defaultValue: 'Không thể xóa bài đăng' }),
        });
      }
    } catch (error: any) {
      logger.error('GroupDetailScreen', 'Error deleting post', error);
      Toast.show({
        type: 'error',
        text1: t('posts.deleteError', { defaultValue: 'Lỗi xóa bài đăng' }),
        text2:
          error.message ||
          t('posts.deleteErrorDescription', { defaultValue: 'Không thể xóa bài đăng' }),
      });
    }
  };

  const handleCreatePost = () => {
    navigation.navigate('CreateGroupPost' as never, { groupId } as never);
  };

  // Helper functions for formatting
  const formatCreatedDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      // Use toLocaleDateString for proper internationalization
      return date.toLocaleDateString(i18n.language || 'vi-VN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const getActivityFrequencyLabel = (frequency: string | null | undefined): string => {
    if (!frequency) return '';
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

  const getStudentLevelLabel = (level: string | null | undefined): string => {
    if (!level || level === 'all') return t('step4.studentLevelAll');
    switch (level) {
      case 'beginner':
        return t('step4.studentLevelBeginner');
      case 'intermediate':
        return t('step4.studentLevelIntermediate');
      case 'advanced':
        return t('step4.studentLevelAdvanced');
      default:
        return level;
    }
  };

  const getLanguageLabel = (lang: string | null | undefined): string => {
    if (!lang) return '';
    // Use i18n translations for language labels
    switch (lang) {
      case 'vi':
        return t('detail.languageVietnamese', { defaultValue: 'Tiếng Việt' });
      case 'en':
        return t('detail.languageEnglish', { defaultValue: 'English' });
      default:
        return lang;
    }
  };

  const handleCoverImageSelected = async (uri: string) => {
    if (!userId || !groupId) return;

    try {
      setUploadingCover(true);

      // Store old cover image URL before uploading new one
      const oldCoverImageUrl = group?.cover_image_url;

      // Upload to storage
      const uploadedUrl = await uploadCoverImageToStorage(groupId, uri);

      // Update group cover image in database
      const { error: updateError } = await supabase
        .from('study_groups')
        .update({ cover_image_url: uploadedUrl, updated_at: new Date().toISOString() })
        .eq('id', groupId);

      if (updateError) {
        logger.error('GroupDetailScreen', 'Error updating cover image', updateError);
        Toast.show({
          type: 'error',
          text1: t('detail.updateCoverError'),
          text2: updateError.message || t('detail.failedToUpdateCover'),
        });
        return;
      }

      // Delete old cover image from storage if it exists
      if (oldCoverImageUrl) {
        try {
          await deleteCoverImageFromStorage(oldCoverImageUrl);
        } catch (deleteError) {
          // Log but don't fail - old image cleanup is not critical
          logger.warn('GroupDetailScreen', 'Failed to delete old cover image', deleteError);
        }
      }

      // Update local state
      if (group) {
        setGroup({ ...group, cover_image_url: uploadedUrl });
      }

      Toast.show({
        type: 'success',
        text1: t('detail.updateCoverSuccess'),
      });
    } catch (error: any) {
      logger.error('GroupDetailScreen', 'Error uploading cover image', error);
      Toast.show({
        type: 'error',
        text1: t('detail.updateCoverError'),
        text2: error.message || t('detail.failedToUpdateCover'),
      });
    } finally {
      setUploadingCover(false);
      setShowCoverImagePicker(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      </ScreenContainer>
    );
  }

  if (!group) {
    return (
      <ScreenContainer>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: theme.spacing[4],
          }}
        >
          <Text variant="h6" style={{ marginBottom: theme.spacing[2] }}>
            {t('detail.groupNotFound')}
          </Text>
          <Button onPress={() => navigation.goBack()} variant="primary">
            {t('common.back', { ns: 'common' })}
          </Button>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Fixed Header */}
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: theme.colors.background,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: theme.spacing[5],
            paddingVertical: theme.spacing[2],
          }}
        >
          <BackButton onPress={() => navigation.goBack()} accessibilityLabel={t('back')} />
          <Text
            variant="h5"
            style={{
              fontWeight: '700' as const,
              flex: 1,
              textAlign: 'center',
              marginHorizontal: theme.spacing[2],
            }}
            numberOfLines={1}
          >
            {t('detail.title')}
          </Text>
          {/* Placeholder for alignment */}
          <View style={{ width: 44, height: 44 }} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={{
          // Bottom padding: safe area + fixed bottom bar height for members, or just safe area + default padding for non-members
          paddingBottom: isMember
            ? insets.bottom + BOTTOM_BAR_HEIGHT
            : insets.bottom + BOTTOM_PADDING_DEFAULT,
        }}
      >
        {/* Cover Image */}
        <View
          style={{
            height: 200,
            backgroundColor:
              group.cover_image_url && !coverImageError
                ? 'transparent'
                : theme.colors.neutral?.[100] || '#F5F5F5',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {group.cover_image_url && group.cover_image_url.trim() !== '' && !coverImageError ? (
            <Image
              source={{ uri: group.cover_image_url }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              onError={(error) => {
                logger.warn('GroupDetailScreen', 'Error loading cover image', {
                  url: group.cover_image_url,
                  error,
                });
                setCoverImageError(true);
              }}
              onLoad={() => {
                setCoverImageError(false);
              }}
            />
          ) : (
            <Image
              source={require('../../../assets/buddyup-logo-128.png')}
              style={{ width: 128, height: 128, opacity: 0.6 }}
              resizeMode="contain"
            />
          )}

          {/* Camera Icon Button (only for owner/admin) */}
          {(isOwner || userRole === 'admin') && (
            <Pressable
              onPress={() => setShowCoverImagePicker(true)}
              disabled={uploadingCover}
              style={{
                position: 'absolute',
                bottom: theme.spacing[3],
                right: theme.spacing[3],
                width: 44,
                height: 44,
                borderRadius: theme.radius.full,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.3,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
                elevation: 4,
              }}
            >
              {uploadingCover ? (
                <ActivityIndicator color={theme.colors.surface} size="small" />
              ) : (
                <Camera size={20} color={theme.colors.surface} />
              )}
            </Pressable>
          )}
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: theme.spacing[5] }}>
          {/* Group Icon with Info */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              marginTop: theme.spacing[4],
              marginBottom: theme.spacing[4],
              gap: theme.spacing[3],
            }}
          >
            {/* Group Icon */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colors.surface,
                borderWidth: 3,
                borderColor: theme.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              {group?.icon_emoji ? (
                <Text style={{ fontSize: 32 }}>{group.icon_emoji}</Text>
              ) : group?.privacy_type === 'private' ? (
                <Lock size={32} color={theme.colors.primary[500]} />
              ) : (
                <Globe size={32} color={theme.colors.primary[500]} />
              )}
            </View>

            {/* Group Info */}
            <View style={{ flex: 1, marginTop: theme.spacing[1] }}>
              {/* Group Name */}
              <Text
                variant="h5"
                style={{
                  fontWeight: '700' as const,
                  marginBottom: theme.spacing[2],
                }}
                numberOfLines={2}
              >
                {group?.name}
              </Text>

              {/* Privacy Status Chips */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing[2],
                  flexWrap: 'wrap',
                }}
              >
                {/* Privacy Chip */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor:
                      group?.privacy_type === 'public'
                        ? theme.colors.primary[100]
                        : theme.colors.semantic.success + '20',
                    paddingHorizontal: theme.spacing[2],
                    paddingVertical: theme.spacing[1],
                    borderRadius: theme.radius.full,
                    gap: theme.spacing[1],
                  }}
                >
                  {group?.privacy_type === 'private' ? (
                    <Lock size={14} color={theme.colors.semantic.success} />
                  ) : (
                    <Globe size={14} color={theme.colors.primary[500]} />
                  )}
                  <Text
                    variant="bodySmall"
                    style={{
                      color:
                        group?.privacy_type === 'public'
                          ? theme.colors.primary[500]
                          : theme.colors.semantic.success,
                      fontWeight: '600' as const,
                    }}
                  >
                    {group?.privacy_type === 'public' ? t('step4.public') : t('step4.private')}
                  </Text>
                </View>

                {/* Owner/Admin Chip */}
                {(isOwner || userRole === 'admin') && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: theme.colors.semantic.warning + '20',
                      paddingHorizontal: theme.spacing[2],
                      paddingVertical: theme.spacing[1],
                      borderRadius: theme.radius.full,
                      gap: theme.spacing[1],
                    }}
                  >
                    <Crown size={14} color={theme.colors.semantic.warning} />
                    <Text
                      variant="bodySmall"
                      style={{
                        color: theme.colors.semantic.warning,
                        fontWeight: '600' as const,
                      }}
                    >
                      {t('community.roleAdmin')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Description */}
          {group?.description && group.description.trim() && (
            <Text
              variant="body"
              color="secondary"
              style={{
                lineHeight: 22,
                marginBottom: theme.spacing[3],
              }}
            >
              {group.description}
            </Text>
          )}

          {/* Topics */}
          {topicLabels.length > 0 && (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: theme.spacing[2],
                marginBottom: theme.spacing[4],
              }}
            >
              {topicLabels.map((label, index) => (
                <Chip
                  key={index}
                  label={label}
                  variant="default"
                  disabled
                  style={{
                    backgroundColor: theme.colors.neutral?.[100] || '#F5F5F5',
                    borderColor: theme.colors.border,
                  }}
                />
              ))}
            </View>
          )}

          {/* Stats Bar */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              paddingVertical: theme.spacing[3],
              marginBottom: theme.spacing[3],
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text
                variant="h5"
                style={{ fontWeight: '700' as const, marginBottom: theme.spacing[1] }}
              >
                {group?.member_count || 0}
              </Text>
              <Text variant="bodySmall" color="secondary">
                {t('step4.members')}
              </Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text
                variant="h5"
                style={{ fontWeight: '700' as const, marginBottom: theme.spacing[1] }}
              >
                {postCount >= 1000 ? `${(postCount / 1000).toFixed(1)}k` : postCount}
              </Text>
              <Text variant="bodySmall" color="secondary">
                {t('detail.posts')}
              </Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: theme.spacing[1],
                }}
              >
                <Star size={16} color={theme.colors.semantic.warning} />
                <Text
                  variant="h5"
                  style={{ fontWeight: '700' as const, marginLeft: theme.spacing[1] }}
                >
                  -
                </Text>
              </View>
              <Text variant="bodySmall" color="secondary">
                {t('detail.rating')}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View
            style={{
              flexDirection: 'row',
              gap: theme.spacing[3],
              marginBottom: theme.spacing[3],
            }}
          >
            {isMember ? (
              <Pressable
                onPress={() => {
                  // TODO: Navigate to chat
                  Alert.alert(
                    t('detail.comingSoon', { defaultValue: 'Coming Soon' }),
                    t('detail.chatFeatureComingSoon', {
                      defaultValue: 'Group chat will be available soon!',
                    }),
                  );
                }}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: theme.spacing[2],
                    paddingVertical: theme.spacing[3],
                    paddingHorizontal: theme.spacing[4],
                    borderRadius: theme.radius.base,
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderColor: theme.colors.primary[500],
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <MessageCircle size={20} color={theme.colors.primary[500]} />
                <Text color="primary" style={{ fontWeight: '600' as const }}>
                  {t('detail.message')}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleJoinGroup}
                disabled={isJoining}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: theme.spacing[2],
                    paddingVertical: theme.spacing[3],
                    paddingHorizontal: theme.spacing[4],
                    borderRadius: theme.radius.base,
                    backgroundColor: theme.colors.semantic.success,
                    opacity: pressed ? 0.9 : isJoining ? 0.5 : 1,
                  },
                ]}
              >
                {isJoining ? (
                  <ActivityIndicator color={theme.colors.surface} />
                ) : (
                  <UserPlus size={20} color={theme.colors.surface} />
                )}
                <Text color="surface" style={{ fontWeight: '600' as const }}>
                  {isJoining ? t('detail.joining') : t('detail.joinGroup')}
                </Text>
              </Pressable>
            )}
            {/* Leave/Disband Group Button */}
            {isMember && (
              <Pressable
                onPress={isOwner || userRole === 'admin' ? handleDisbandGroup : handleLeaveGroup}
                disabled={isLeaving || isDisbanding}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: theme.spacing[2],
                    paddingVertical: theme.spacing[3],
                    paddingHorizontal: theme.spacing[4],
                    borderRadius: theme.radius.base,
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderColor: theme.colors.semantic.error,
                    opacity: pressed ? 0.9 : isLeaving || isDisbanding ? 0.5 : 1,
                  },
                ]}
              >
                {isLeaving || isDisbanding ? (
                  <ActivityIndicator color={theme.colors.semantic.error} />
                ) : (
                  <LogOut size={20} color={theme.colors.semantic.error} />
                )}
                <Text color="error" style={{ fontWeight: '600' as const }}>
                  {isOwner || userRole === 'admin'
                    ? t('detail.disbandGroup')
                    : t('detail.leaveGroup')}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Tab Navigation */}
          <View
            style={{
              flexDirection: 'row',
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
              marginBottom: theme.spacing[3],
            }}
          >
            {(['about', 'posts', 'members'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const tabLabels: Record<typeof tab, string> = {
                about: t('detail.about'),
                posts: t('detail.posts'),
                members: t('detail.members'),
              };
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    paddingVertical: theme.spacing[3],
                    alignItems: 'center',
                    borderBottomWidth: isActive ? 2 : 0,
                    borderBottomColor: isActive ? theme.colors.primary[500] : 'transparent',
                  }}
                >
                  <Text
                    variant="body"
                    style={{
                      fontWeight: isActive ? ('600' as const) : ('400' as const),
                      color: isActive ? theme.colors.primary[500] : theme.colors.text.secondary,
                    }}
                  >
                    {tabLabels[tab]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Content based on active tab */}
          {activeTab === 'about' && (
            <>
              {/* Group Information Card */}
              {group && (
                <Card padding={4} style={{ marginBottom: theme.spacing[4] }}>
                  <Text
                    variant="h6"
                    style={{ fontWeight: '600' as const, marginBottom: theme.spacing[3] }}
                  >
                    {t('detail.groupInfo', { defaultValue: 'Thông tin nhóm' })}
                  </Text>
                  <View style={{ gap: theme.spacing[3] }}>
                    {/* Created Date */}
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}
                    >
                      <Calendar size={20} color={theme.colors.primary[500]} />
                      <Text variant="body" color="secondary">
                        {t('detail.createdDate', { defaultValue: 'Tạo ngày' })}:{' '}
                        {formatCreatedDate(group.created_at)}
                      </Text>
                    </View>
                    {/* Activity Frequency */}
                    {group.expected_activity_frequency && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: theme.spacing[2],
                        }}
                      >
                        <Clock3 size={20} color={theme.colors.primary[500]} />
                        <Text variant="body" color="secondary">
                          {t('step4.activity')}:{' '}
                          {getActivityFrequencyLabel(group.expected_activity_frequency)}
                        </Text>
                      </View>
                    )}
                    {/* Student Level */}
                    {group.student_level && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: theme.spacing[2],
                        }}
                      >
                        <BarChart3 size={20} color={theme.colors.primary[500]} />
                        <Text variant="body" color="secondary">
                          {t('step4.level')}: {getStudentLevelLabel(group.student_level)}
                        </Text>
                      </View>
                    )}
                    {/* Main Language */}
                    {group.main_language && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: theme.spacing[2],
                        }}
                      >
                        <Languages size={20} color={theme.colors.primary[500]} />
                        <Text variant="body" color="secondary">
                          {t('step2.mainLanguage')}: {getLanguageLabel(group.main_language)}
                        </Text>
                      </View>
                    )}
                  </View>
                </Card>
              )}

              {/* Members Preview */}
              {members.length > 0 && (
                <Card padding={4} style={{ marginBottom: theme.spacing[4] }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: theme.spacing[3],
                    }}
                  >
                    <Text variant="h6" style={{ fontWeight: '600' as const }}>
                      {t('detail.members')}
                    </Text>
                    <Pressable
                      onPress={() => setActiveTab('members')}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] }}
                    >
                      <Text variant="bodySmall" color="primary">
                        {t('detail.viewAll', { defaultValue: 'Xem tất cả' })} (
                        {group?.member_count || 0})
                      </Text>
                      <ChevronRight size={16} color={theme.colors.primary[500]} />
                    </Pressable>
                  </View>
                  {/* Members Grid */}
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: theme.spacing[3],
                    }}
                  >
                    {members.slice(0, 8).map((member) => (
                      <View key={member.user_id} style={{ alignItems: 'center', width: 70 }}>
                        <View style={{ position: 'relative' }}>
                          <Avatar
                            size={56}
                            uri={member.profile?.avatar_url || undefined}
                            name={member.profile?.display_name || undefined}
                          />
                          {member.role === 'owner' && (
                            <View
                              style={{
                                position: 'absolute',
                                top: -4,
                                right: -4,
                                backgroundColor: theme.colors.semantic.warning,
                                borderRadius: theme.radius.full,
                                padding: 2,
                              }}
                            >
                              <Crown size={16} color={theme.colors.surface} />
                            </View>
                          )}
                        </View>
                        <Text
                          variant="bodySmall"
                          style={{
                            marginTop: theme.spacing[1],
                            textAlign: 'center',
                            fontWeight: '500' as const,
                          }}
                          numberOfLines={1}
                        >
                          {member.profile?.display_name || t('detail.anonymous')}
                        </Text>
                      </View>
                    ))}
                    {group && group.member_count > 8 && (
                      <View style={{ alignItems: 'center', width: 70 }}>
                        <View
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: theme.radius.full,
                            backgroundColor: theme.colors.neutral?.[200] || '#E0E0E0',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text
                            variant="body"
                            style={{ fontWeight: '600' as const, color: theme.colors.surface }}
                          >
                            +{group.member_count - 8}
                          </Text>
                        </View>
                        <Text
                          variant="bodySmall"
                          style={{
                            marginTop: theme.spacing[1],
                            textAlign: 'center',
                            color: theme.colors.text.secondary,
                          }}
                        >
                          {t('detail.viewMore', { defaultValue: 'Xem thêm' })}
                        </Text>
                      </View>
                    )}
                  </View>
                </Card>
              )}

              {/* Rules */}
              {rules.length > 0 && (
                <Card padding={4} style={{ marginBottom: theme.spacing[4] }}>
                  <Text
                    variant="h6"
                    style={{ fontWeight: '600' as const, marginBottom: theme.spacing[3] }}
                  >
                    {t('step3.groupRules')}
                  </Text>
                  {rules.map((rule, index) => (
                    <View key={rule.id} style={{ marginBottom: theme.spacing[2] }}>
                      <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: theme.radius.full,
                            backgroundColor: theme.colors.primary[500],
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text
                            variant="bodySmall"
                            style={{ color: theme.colors.surface, fontWeight: '600' as const }}
                          >
                            {index + 1}
                          </Text>
                        </View>
                        <Text variant="body" style={{ flex: 1 }}>
                          {rule.rule_text}
                        </Text>
                      </View>
                      {index < rules.length - 1 && (
                        <Divider style={{ marginTop: theme.spacing[2] }} />
                      )}
                    </View>
                  ))}
                </Card>
              )}
            </>
          )}

          {activeTab === 'posts' && (
            <>
              {loadingPosts ? (
                <View style={{ padding: theme.spacing[4], alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                </View>
              ) : posts.length === 0 ? (
                <Card padding={4} style={{ marginTop: theme.spacing[4] }}>
                  <Text variant="body" color="secondary" style={{ textAlign: 'center' }}>
                    {t('posts.noPosts', {
                      defaultValue: 'Chưa có bài đăng nào. Hãy là người đầu tiên đăng bài!',
                    })}
                  </Text>
                </Card>
              ) : (
                <View style={{ marginTop: theme.spacing[4] }}>
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserId={userId}
                      onDelete={handleDeletePost}
                    />
                  ))}
                </View>
              )}
            </>
          )}

          {activeTab === 'members' && (
            <>
              {members.length > 0 ? (
                <Card padding={4} style={{ marginTop: theme.spacing[4] }}>
                  <Text
                    variant="h6"
                    style={{ fontWeight: '600' as const, marginBottom: theme.spacing[3] }}
                  >
                    {t('detail.members')} ({members.length})
                  </Text>
                  <View style={{ gap: theme.spacing[2] }}>
                    {members.map((member) => (
                      <View
                        key={member.user_id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: theme.spacing[2],
                        }}
                      >
                        <Avatar
                          size={40}
                          uri={member.profile?.avatar_url || undefined}
                          name={member.profile?.display_name || undefined}
                        />
                        <View style={{ flex: 1 }}>
                          <Text variant="body" style={{ fontWeight: '500' as const }}>
                            {member.profile?.display_name || t('detail.anonymous')}
                          </Text>
                          {member.role !== 'member' && (
                            <Text variant="bodySmall" color="primary">
                              {member.role === 'owner'
                                ? t('detail.owner')
                                : member.role === 'admin'
                                  ? t('detail.admin')
                                  : t('detail.moderator')}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                </Card>
              ) : (
                <Card padding={4} style={{ marginTop: theme.spacing[4] }}>
                  <Text variant="body" color="secondary" style={{ textAlign: 'center' }}>
                    {t('detail.noMembers', { defaultValue: 'Chưa có thành viên nào' })}
                  </Text>
                </Card>
              )}
            </>
          )}

          <Spacer size={4} />
        </View>
      </ScrollView>

      {/* Bottom Footer - Only show for members */}
      {isMember && (
        <View
          style={{
            flexDirection: 'row',
            gap: theme.spacing[3],
            paddingHorizontal: theme.spacing[5],
            paddingVertical: theme.spacing[3],
            paddingBottom: insets.bottom + theme.spacing[3],
            backgroundColor: theme.colors.background,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <Pressable
            onPress={() => {
              // TODO: Invite friends
              Alert.alert(
                t('detail.comingSoon', { defaultValue: 'Coming Soon' }),
                t('detail.inviteFeatureComingSoon', {
                  defaultValue: 'Invite friends feature will be available soon!',
                }),
              );
            }}
            style={({ pressed }) => [
              {
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: theme.spacing[2],
                paddingVertical: theme.spacing[3],
                paddingHorizontal: theme.spacing[4],
                borderRadius: theme.radius.base,
                backgroundColor: 'transparent',
                borderWidth: 1.5,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <UserPlus size={20} color={theme.colors.text.primary} />
            <Text style={{ fontWeight: '600' as const }}>{t('detail.inviteFriends')}</Text>
          </Pressable>
          <Pressable
            onPress={handleCreatePost}
            style={({ pressed }) => [
              {
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: theme.spacing[2],
                paddingVertical: theme.spacing[3],
                paddingHorizontal: theme.spacing[4],
                borderRadius: theme.radius.base,
                backgroundColor: theme.colors.primary[500],
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <PenSquare size={20} color={theme.colors.surface} />
            <Text color="surface" style={{ fontWeight: '600' as const }}>
              {t('detail.createPost')}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Cover Image Picker Modal */}
      <ImagePickerModal
        visible={showCoverImagePicker}
        onClose={() => setShowCoverImagePicker(false)}
        onSelectImage={handleCoverImageSelected}
      />
    </View>
  );
};
