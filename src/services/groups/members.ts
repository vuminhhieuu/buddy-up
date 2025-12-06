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

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingMember) {
      // Update status to active if not already
      const { error: updateError } = await supabase
        .from('group_members')
        .update({ status: 'active' })
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (updateError) {
        logger.error('joinPublicGroup.update', updateError.message, updateError);
        return {
          success: false,
          error: updateError.message,
        };
      }

      return { success: true };
    }

    // Add as member
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

    return { success: true };
  } catch (err: any) {
    logger.error('leaveGroup', 'Unexpected error', err);
    return {
      success: false,
      error: err.message || 'Failed to leave group',
    };
  }
}
