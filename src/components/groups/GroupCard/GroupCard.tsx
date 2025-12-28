import React, { useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { Globe, Lock, Crown, Users, Calendar } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../styles';
import { Text, Card, Chip, Avatar } from '../../ui';
import { getTopicLabels } from '../../../utils/topicUtils';
import { getGroupMembersWithProfiles } from '../../../services/groups/members';
import type { StudyGroup } from '../../../services/groups/types';
import type { GroupMemberWithProfile } from '../../../services/groups/members';

export type GroupCardProps = {
  group: StudyGroup;
  userRole?: 'owner' | 'admin' | 'moderator' | 'member';
  onPress?: () => void;
};

export const GroupCard: React.FC<GroupCardProps> = ({ group, userRole, onPress }) => {
  const { theme } = useTheme();
  const { t } = useTranslation('groups');
  const [topicLabels, setTopicLabels] = useState<string[]>([]);
  const [memberAvatars, setMemberAvatars] = useState<GroupMemberWithProfile[]>([]);

  // Convert topic IDs to labels
  useEffect(() => {
    const loadTopicLabels = async () => {
      if (group.topics && group.topics.length > 0) {
        const labels = await getTopicLabels(group.topics);
        setTopicLabels(labels);
      }
    };
    loadTopicLabels();
  }, [group.topics]);

  // Load member avatars
  useEffect(() => {
    const loadMemberAvatars = async () => {
      const members = await getGroupMembersWithProfiles(group.id, 3);
      setMemberAvatars(members);
    };
    loadMemberAvatars();
  }, [group.id]);

  // Get icon background color based on privacy type
  const getIconBackgroundColor = () => {
    if (group.privacy_type === 'private') {
      return theme.colors.semantic.success; // Green for private
    }
    return theme.colors.primary[500]; // Blue for public
  };

  // Get role label
  const getRoleLabel = () => {
    if (userRole === 'owner' || userRole === 'admin') {
      return t('community.roleAdmin');
    }
    return null;
  };

  // Get activity frequency label
  const getActivityFrequencyLabel = () => {
    if (group.expected_activity_frequency) {
      switch (group.expected_activity_frequency) {
        case 'daily':
          return t('community.activityVeryActive');
        case 'few_times_week':
          return t('community.activityActive');
        case 'weekly':
          return t('step2.weekly');
        case 'flexible':
          return t('step2.flexible');
        default:
          return t('community.activityModerate');
      }
    }
    // Default to moderate if not set
    return t('community.activityModerate');
  };

  const iconBgColor = getIconBackgroundColor();
  const roleLabel = getRoleLabel();

  return (
    <Pressable onPress={onPress} style={{ marginBottom: theme.spacing[3] }}>
      <Card padding={4} elevation="sm" style={{ borderRadius: theme.radius.lg }}>
        <View style={{ flexDirection: 'row', gap: theme.spacing[3], alignItems: 'flex-start' }}>
          {/* Icon */}
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: theme.radius.md,
              backgroundColor: iconBgColor,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {group.icon_emoji ? (
              <Text style={{ fontSize: 28 }}>{group.icon_emoji}</Text>
            ) : group.privacy_type === 'private' ? (
              <Lock size={28} color={theme.colors.surface} />
            ) : (
              <Globe size={28} color={theme.colors.surface} />
            )}
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            {/* Name */}
            <Text
              variant="h6"
              style={{ fontWeight: '700' as const, marginBottom: theme.spacing[1] }}
            >
              {group.name}
            </Text>

            {/* Privacy and Role Tags */}
            <View
              style={{
                flexDirection: 'row',
                gap: theme.spacing[2],
                marginBottom: theme.spacing[2],
                flexWrap: 'wrap',
              }}
            >
              {/* Privacy Tag */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor:
                    group.privacy_type === 'public'
                      ? theme.colors.primary[100]
                      : theme.colors.semantic.success + '20',
                  paddingHorizontal: theme.spacing[2],
                  paddingVertical: theme.spacing[1],
                  borderRadius: theme.radius.full,
                  gap: theme.spacing[1],
                }}
              >
                {group.privacy_type === 'private' ? (
                  <Lock size={14} color={theme.colors.semantic.success} />
                ) : (
                  <Globe size={14} color={theme.colors.primary[500]} />
                )}
                <Text
                  variant="bodySmall"
                  style={{
                    color:
                      group.privacy_type === 'public'
                        ? theme.colors.primary[500]
                        : theme.colors.semantic.success,
                    fontWeight: '600' as const,
                  }}
                >
                  {group.privacy_type === 'public' ? t('step4.public') : t('step4.private')}
                </Text>
              </View>

              {/* Role Tag */}
              {roleLabel && (
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
                    {roleLabel}
                  </Text>
                </View>
              )}
            </View>

            {/* Topic Tags */}
            {topicLabels.length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: theme.spacing[2],
                  marginBottom: theme.spacing[2],
                }}
              >
                {topicLabels.slice(0, 3).map((label, index) => (
                  <Chip
                    key={index}
                    label={label}
                    variant="default"
                    disabled
                    style={{
                      borderColor: theme.colors.primary[500],
                      backgroundColor: theme.colors.surface,
                    }}
                    textStyle={{
                      color: theme.colors.primary[500],
                      fontWeight: '700' as const,
                    }}
                  />
                ))}
              </View>
            )}

            {/* Description */}
            <Text
              variant="bodySmall"
              color="secondary"
              style={{
                marginBottom: theme.spacing[2],
                lineHeight: 18,
                marginLeft: -(56 + theme.spacing[3]),
                paddingLeft: 56 + theme.spacing[3],
              }}
              numberOfLines={2}
            >
              {group.description}
            </Text>

            {/* Stats */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginLeft: -(56 + theme.spacing[3]),
                paddingLeft: 56 + theme.spacing[3],
              }}
            >
              {/* Left side: Members and Activity Frequency */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
                {/* Members */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] }}>
                  <Users size={16} color={theme.colors.text.secondary} />
                  <Text variant="bodySmall" color="secondary">
                    {group.member_count} {t('community.members')}
                  </Text>
                </View>

                {/* Activity Frequency */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] }}>
                  <Calendar size={16} color={theme.colors.text.secondary} />
                  <Text variant="bodySmall" color="secondary">
                    {getActivityFrequencyLabel()}
                  </Text>
                </View>
              </View>

              {/* Right side: Member Avatars */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {memberAvatars.length > 0 ? (
                  <>
                    {memberAvatars.slice(0, 3).map((member, index) => (
                      <View
                        key={member.user_id}
                        style={{
                          marginLeft: index > 0 ? -8 : 0,
                          borderWidth: 2,
                          borderColor: theme.colors.surface,
                          borderRadius: theme.radius.full,
                        }}
                      >
                        <Avatar
                          size={24}
                          uri={member.profile?.avatar_url || undefined}
                          name={member.profile?.display_name || undefined}
                        />
                      </View>
                    ))}
                    {group.member_count > memberAvatars.length && memberAvatars.length >= 3 && (
                      <View
                        style={{
                          marginLeft: -8,
                          width: 24,
                          height: 24,
                          borderRadius: theme.radius.full,
                          backgroundColor: theme.colors.primary[100],
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 2,
                          borderColor: theme.colors.surface,
                        }}
                      >
                        <Text variant="caption" color="primary" style={{ fontSize: 10 }}>
                          +{group.member_count - 3}
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  // Show placeholder avatars if members haven't loaded yet
                  group.member_count > 0 && (
                    <>
                      {[0, 1, 2].slice(0, Math.min(3, group.member_count)).map((index) => (
                        <View
                          key={index}
                          style={{
                            marginLeft: index > 0 ? -8 : 0,
                            borderWidth: 2,
                            borderColor: theme.colors.surface,
                            borderRadius: theme.radius.full,
                          }}
                        >
                          <Avatar size={24} />
                        </View>
                      ))}
                      {group.member_count > 3 && (
                        <View
                          style={{
                            marginLeft: -8,
                            width: 24,
                            height: 24,
                            borderRadius: theme.radius.full,
                            backgroundColor: theme.colors.primary[100],
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 2,
                            borderColor: theme.colors.surface,
                          }}
                        >
                          <Text variant="caption" color="primary" style={{ fontSize: 10 }}>
                            +{group.member_count - 3}
                          </Text>
                        </View>
                      )}
                    </>
                  )
                )}
              </View>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
};
