import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, RefreshControl, Pressable, ActivityIndicator } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react-native';
import { ScreenContainer, Text, Spacer, EmptyState } from '../../components/ui';
import { useTheme } from '../../styles';
import { BOTTOM_NAVIGATION_HEIGHT } from '../../constants/layout';
import { useAppSelector } from '../../store/hooks';
import { getMyGroups, getJoinedGroups, getPublicGroups } from '../../services/groups';
import { GroupCard } from '../../components/groups/GroupCard';
import type { StudyGroup } from '../../services/groups/types';
import type { NavigationProp } from '@react-navigation/native';
import type { MainTabParamList } from '../../navigation/MainTabsNavigator';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { logger } from '../../utils/logger';

export const CommunityScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('groups');
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const { userId } = useAppSelector((state) => state.auth);

  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<StudyGroup[]>([]);
  const [publicGroups, setPublicGroups] = useState<StudyGroup[]>([]);
  const [loadingMyGroups, setLoadingMyGroups] = useState(false);
  const [loadingJoinedGroups, setLoadingJoinedGroups] = useState(false);
  const [loadingPublicGroups, setLoadingPublicGroups] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadGroups = async () => {
    if (!userId) return;

    try {
      // Load all groups in parallel
      const [myGroupsResult, joinedGroupsResult, publicGroupsResult] = await Promise.all([
        getMyGroups(userId),
        getJoinedGroups(userId),
        getPublicGroups({ limit: 10 }),
      ]);

      // Set my groups (only groups user created)
      const myGroupsData = myGroupsResult.data || [];
      setMyGroups(myGroupsData);

      // Set joined groups (all groups user is a member of, including ones they created)
      const joinedGroupsData = joinedGroupsResult.data || [];
      setJoinedGroups(joinedGroupsData);

      // Set public groups (all public groups, no filtering)
      const publicGroupsData = publicGroupsResult.data || [];
      setPublicGroups(publicGroupsData);
    } catch (error: any) {
      logger.error('CommunityScreen', 'Error loading groups', error);
    } finally {
      setLoadingMyGroups(false);
      setLoadingJoinedGroups(false);
      setLoadingPublicGroups(false);
    }
  };

  useEffect(() => {
    if (userId) {
      setLoadingMyGroups(true);
      setLoadingJoinedGroups(true);
      setLoadingPublicGroups(true);
      loadGroups();
    }
  }, [userId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const handleCreateGroup = () => {
    // Navigate to CreateGroupType screen using CommonActions for type-safe navigation
    navigation.dispatch(
      CommonActions.navigate({
        name: 'CreateGroupType' as never,
        params: undefined,
      }),
    );
  };

  const handleGroupPress = (group: StudyGroup) => {
    // Navigate to GroupDetail screen using CommonActions for type-safe navigation
    navigation.dispatch(
      CommonActions.navigate({
        name: 'GroupDetail' as never,
        params: { groupId: group.id } as never,
      }),
    );
  };

  // Get user role for a group
  const getUserRole = (
    group: StudyGroup,
  ): 'owner' | 'admin' | 'moderator' | 'member' | undefined => {
    if (group.creator_id === userId) {
      return 'owner';
    }
    // TODO: Check if user is admin/moderator from group_members table
    return 'member';
  };

  const renderSection = (
    title: string,
    groups: StudyGroup[],
    loading: boolean,
    emptyMessage?: string,
    emptyDescription?: string,
    showViewAll?: boolean,
  ) => {
    return (
      <View style={{ marginBottom: theme.spacing[6] }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: theme.spacing[3],
          }}
        >
          <Text variant="h5" style={{ fontWeight: '700' as const }}>
            {title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
            {!loading && groups.length > 0 && (
              <Text variant="bodySmall" color="secondary">
                {groups.length} {t('community.groupCount', { count: groups.length })}
              </Text>
            )}
            {showViewAll && groups.length > 0 && (
              <Pressable onPress={() => {}}>
                <Text variant="bodySmall" color="primary" style={{ fontWeight: '600' as const }}>
                  {t('community.viewAll')}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
        {loading ? (
          <View style={{ padding: theme.spacing[4], alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          </View>
        ) : groups.length === 0 ? (
          <EmptyState
            title={emptyMessage || t('community.noGroups')}
            description={emptyDescription || t('community.noGroupsDescription')}
          />
        ) : (
          groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              userRole={getUserRole(group)}
              onPress={() => handleGroupPress(group)}
            />
          ))
        )}
      </View>
    );
  };

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View
          style={{
            marginBottom: theme.spacing[4],
          }}
        >
          <Text variant="h4" style={{ fontWeight: '700' as const }}>
            {t('navigation.community', { ns: 'common' })}
          </Text>
        </View>

        {/* My Groups Section */}
        {renderSection(
          t('community.myGroups'),
          myGroups,
          loadingMyGroups,
          t('community.noGroups'),
          t('community.noGroupsDescription'),
          true,
        )}

        {/* Joined Groups Section */}
        {renderSection(
          t('community.joinedGroups'),
          joinedGroups,
          loadingJoinedGroups,
          t('community.noJoinedGroups'),
          t('community.noJoinedGroupsDescription'),
          true,
        )}

        {/* Public Groups Section */}
        {renderSection(
          t('community.publicGroups'),
          publicGroups,
          loadingPublicGroups,
          t('community.noPublicGroups'),
          t('community.noPublicGroupsDescription'),
          true,
        )}

        <Spacer size={4} />
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable
        onPress={handleCreateGroup}
        style={({ pressed }) => [
          {
            position: 'absolute',
            right: theme.spacing[4],
            bottom: BOTTOM_NAVIGATION_HEIGHT + theme.spacing[5], // Above bottom navigation
            width: 56,
            height: 56,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.semantic.success,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Plus size={24} color={theme.colors.surface} />
      </Pressable>
    </ScreenContainer>
  );
};
