/**
 * Group Members Service
 * Functions for managing group members and invitations
 */

import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';
import type { GroupInvitation, GroupMember, InviteFriendsToGroupResponse } from './types';

/**
 * Invite friends to join a group
 */
export async function inviteFriendsToGroup(
  groupId: string,
  friendIds: string[],
  inviterId: string,
): Promise<InviteFriendsToGroupResponse> {
  try {
    if (!friendIds || friendIds.length === 0) {
      return {
        success: true,
        invitations: [],
      };
    }

    // Validate: cannot invite yourself
    const validFriendIds = friendIds.filter((id) => id !== inviterId);
    if (validFriendIds.length === 0) {
      return {
        success: false,
        error: 'Cannot invite yourself',
        errorCode: 'INVALID_USERS',
      };
    }

    // Check if friends are already members
    const { data: existingMembers, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .in('user_id', validFriendIds);

    if (membersError) {
      logger.error('inviteFriendsToGroup.checkMembers', membersError.message, membersError);
    }

    const existingMemberIds = new Set((existingMembers || []).map((m: any) => m.user_id));
    const newFriendIds = validFriendIds.filter((id) => !existingMemberIds.has(id));

    if (newFriendIds.length === 0) {
      return {
        success: false,
        error: 'All selected friends are already members',
        errorCode: 'INVALID_USERS',
      };
    }

    // Check for existing pending invitations
    const { data: existingInvitations, error: invitationsError } = await supabase
      .from('group_invitations')
      .select('invitee_id')
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .in('invitee_id', newFriendIds);

    if (invitationsError) {
      logger.error(
        'inviteFriendsToGroup.checkInvitations',
        invitationsError.message,
        invitationsError,
      );
    }

    const existingInviteeIds = new Set(
      (existingInvitations || []).map((inv: any) => inv.invitee_id),
    );
    const finalFriendIds = newFriendIds.filter((id) => !existingInviteeIds.has(id));

    if (finalFriendIds.length === 0) {
      return {
        success: false,
        error: 'All selected friends already have pending invitations',
        errorCode: 'INVALID_USERS',
      };
    }

    // Create invitations
    const invitationsData = finalFriendIds.map((friendId) => ({
      group_id: groupId,
      inviter_id: inviterId,
      invitee_id: friendId,
      status: 'pending',
    }));

    const { data, error } = await supabase
      .from('group_invitations')
      .insert(invitationsData)
      .select('*');

    if (error) {
      logger.error('inviteFriendsToGroup', error.message, error);
      return {
        success: false,
        error: error.message,
        errorCode: 'NETWORK_ERROR',
      };
    }

    return {
      success: true,
      invitations: (data as GroupInvitation[]) || [],
    };
  } catch (err: any) {
    logger.error('inviteFriendsToGroup', 'Unexpected error', err);
    return {
      success: false,
      error: err.message || 'Failed to invite friends',
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * Get all members of a group
 */
export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true });

    if (error) {
      logger.error('getGroupMembers', error.message, error);
      return [];
    }

    return (data as GroupMember[]) || [];
  } catch (err: any) {
    logger.error('getGroupMembers', 'Unexpected error', err);
    return [];
  }
}

/**
 * Get group members with their profile information (avatars, names)
 */
export interface GroupMemberWithProfile extends GroupMember {
  profile?: {
    avatar_url?: string | null;
    display_name?: string | null;
  };
}

export async function getGroupMembersWithProfiles(
  groupId: string,
  limit?: number,
): Promise<GroupMemberWithProfile[]> {
  try {
    // First, get group members
    let membersQuery = supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true });

    if (limit) {
      membersQuery = membersQuery.limit(limit);
    }

    const { data: members, error: membersError } = await membersQuery;

    if (membersError) {
      logger.error('getGroupMembersWithProfiles', membersError.message, membersError);
      return [];
    }

    if (!members || members.length === 0) {
      return [];
    }

    // Get user IDs from members
    const userIds = members.map((m: any) => m.user_id);

    // Fetch profiles separately, filtering out deleted profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, avatar_url, display_name')
      .in('user_id', userIds)
      .is('deleted_at', null);

    if (profilesError) {
      logger.error('getGroupMembersWithProfiles.profiles', profilesError.message, profilesError);
      // Return members without profiles if profile fetch fails
      return members.map((member: any) => ({
        ...member,
        profile: null,
      })) as GroupMemberWithProfile[];
    }

    // Create a map of user_id to profile
    const profileMap = new Map(
      (profiles || []).map((p: any) => [
        p.user_id,
        {
          avatar_url: p.avatar_url,
          display_name: p.display_name,
        },
      ]),
    );

    // Filter out members whose profiles have been deleted (soft delete)
    // Only return members with valid profiles to avoid displaying deleted users
    const validUserIds = new Set(profiles?.map((p: any) => p.user_id) || []);

    // Map members to include their profiles, filtering out deleted profiles
    return members
      .filter((member: any) => validUserIds.has(member.user_id))
      .map((member: any) => {
        const profile = profileMap.get(member.user_id);
        return {
          ...member,
          profile: profile || null,
        };
      }) as GroupMemberWithProfile[];
  } catch (err: any) {
    logger.error('getGroupMembersWithProfiles', 'Unexpected error', err);
    return [];
  }
}

/**
 * Check if user is a member of a group
 */
export async function isUserMemberOfGroup(groupId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, user_id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      logger.error('isUserMemberOfGroup', error.message, error);
      return false;
    }

    return !!data;
  } catch (err: any) {
    logger.error('isUserMemberOfGroup', 'Unexpected error', err);
    return false;
  }
}

/**
 * Get user's role in a group
 */
export async function getUserRoleInGroup(
  groupId: string,
  userId: string,
): Promise<'owner' | 'admin' | 'moderator' | 'member' | null> {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      logger.error('getUserRoleInGroup', error.message, error);
      return null;
    }

    if (!data) {
      return null;
    }

    return (data as any).role as 'owner' | 'admin' | 'moderator' | 'member';
  } catch (err: any) {
    logger.error('getUserRoleInGroup', 'Unexpected error', err);
    return null;
  }
}

/**
 * Join a public group
 */
export async function joinPublicGroup(
  groupId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if group exists and is public
    const { data: group, error: groupError } = await supabase
      .from('study_groups')
      .select('id, privacy_type, requires_approval')
      .eq('id', groupId)
      .is('deleted_at', null)
      .single();

    if (groupError || !group) {
      return {
        success: false,
        error: 'Group not found',
      };
    }

    if (group.privacy_type !== 'public') {
      return {
        success: false,
        error: 'Group is not public',
      };
    }

    // Check if already a member (including those who left)
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('group_id, user_id, status, role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingMember) {
      // Prepare update data
      const updateData: any = { status: 'active' };

      // Update joined_at if re-joining after leaving
      if (existingMember.status === 'left') {
        updateData.joined_at = new Date().toISOString();
      }

      // Update status to active (handles re-joining after leaving)
      const { error: updateError } = await supabase
        .from('group_members')
        .update(updateData)
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (updateError) {
        logger.error('joinPublicGroup.update', updateError.message, updateError);
        return {
          success: false,
          error: updateError.message,
        };
      }

      // Don't manually update member_count here
      // Database trigger should handle both INSERT and UPDATE status changes
      // If member_count is still wrong, the database trigger may need adjustment

      return { success: true };
    }

    // Add as new member
    // Note: member_count is likely auto-incremented by database trigger on insert
    const status = group.requires_approval ? 'pending' : 'active';
    const { error: insertError } = await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: userId,
      role: 'member',
      status,
    });

    if (insertError) {
      logger.error('joinPublicGroup', insertError.message, insertError);
      return {
        success: false,
        error: insertError.message,
      };
    }

    // Don't manually increment member_count here - database trigger handles it
    // Only manually update when re-joining (status change from 'left' to 'active')

    return { success: true };
  } catch (err: any) {
    logger.error('joinPublicGroup', 'Unexpected error', err);
    return {
      success: false,
      error: err.message || 'Failed to join group',
    };
  }
}

/**
 * Leave a group
 */
export async function leaveGroup(
  groupId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check current status before updating
    const { data: currentMember } = await supabase
      .from('group_members')
      .select('status')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!currentMember) {
      return {
        success: false,
        error: 'Member not found',
      };
    }

    // Update status to 'left'
    const { error } = await supabase
      .from('group_members')
      .update({ status: 'left' })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) {
      logger.error('leaveGroup', error.message, error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Don't manually update member_count here
    // Database trigger should handle UPDATE status changes
    // If member_count is still wrong, the database trigger may need adjustment

    return { success: true };
  } catch (err: any) {
    logger.error('leaveGroup', 'Unexpected error', err);
    return {
      success: false,
      error: err.message || 'Failed to leave group',
    };
  }
}

/**
 * Disband (delete) a group
 * Only owner or admin can disband a group
 */
export async function disbandGroup(
  groupId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if group exists
    const { data: group, error: groupError } = await supabase
      .from('study_groups')
      .select('id, creator_id')
      .eq('id', groupId)
      .is('deleted_at', null)
      .single();

    if (groupError || !group) {
      return {
        success: false,
        error: 'Group not found',
      };
    }

    // Check if user is owner or admin
    const userRole = await getUserRoleInGroup(groupId, userId);
    const isOwner = group.creator_id === userId;

    if (!isOwner && userRole !== 'admin') {
      return {
        success: false,
        error: 'Only owner or admin can disband the group',
      };
    }

    // Soft delete the group by setting deleted_at
    const { error: deleteError } = await supabase
      .from('study_groups')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', groupId);

    if (deleteError) {
      logger.error('disbandGroup', deleteError.message, deleteError);
      return {
        success: false,
        error: deleteError.message || 'Failed to disband group',
      };
    }

    // Update all members status to 'left'
    const { error: membersError } = await supabase
      .from('group_members')
      .update({ status: 'left' })
      .eq('group_id', groupId)
      .neq('status', 'left');

    if (membersError) {
      logger.error('disbandGroup.members', membersError.message, membersError);
      // Rollback group deletion if member update fails
      const { error: rollbackError } = await supabase
        .from('study_groups')
        .update({ deleted_at: null })
        .eq('id', groupId);

      if (rollbackError) {
        logger.error('disbandGroup.rollback', rollbackError.message, rollbackError);
      }

      return {
        success: false,
        error: `Failed to update member status: ${membersError.message}`,
      };
    }

    return {
      success: true,
    };
  } catch (err: any) {
    logger.error('disbandGroup', 'Unexpected error', err);
    return {
      success: false,
      error: err.message || 'Failed to disband group',
    };
  }
}
