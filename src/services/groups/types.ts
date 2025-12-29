/**
 * Groups Service Types
 * Type definitions for group-related data structures
 */

/**
 * Study group data
 */
export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  cover_image_url: string | null;
  icon_emoji: string | null;
  slug: string;
  privacy_type: 'public' | 'private';
  creator_id: string;
  topics: string[];
  student_level: 'all' | 'beginner' | 'intermediate' | 'advanced' | null;
  main_language: string;
  expected_activity_frequency: 'daily' | 'few_times_week' | 'weekly' | 'flexible' | null;
  requires_approval: boolean;
  posting_permission: 'all_members' | 'admin_moderator_only';
  member_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Group rule data
 */
export interface GroupRule {
  id: string;
  group_id: string;
  rule_text: string;
  order_index: number;
  created_at: string;
}

/**
 * Group member data
 */
export interface GroupMember {
  group_id: string;
  user_id: string;
  role: 'member' | 'moderator' | 'admin' | 'owner';
  status: 'pending' | 'active' | 'banned' | 'left';
  joined_at: string;
  invited_by: string | null;
}

/**
 * Group invitation data
 */
export interface GroupInvitation {
  id: string;
  group_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  responded_at: string | null;
}

/**
 * Payload for creating a public group
 */
export type CreatePublicGroupPayload = {
  name: string;
  description: string;
  cover_image_url?: string | null;
  icon_emoji?: string | null;
  slug: string;
  topics: string[];
  student_level: 'all' | 'beginner' | 'intermediate' | 'advanced';
  main_language: string;
  expected_activity_frequency: 'daily' | 'few_times_week' | 'weekly' | 'flexible';
  requires_approval: boolean;
  posting_permission: 'all_members' | 'admin_moderator_only';
  rules: string[];
  invited_friend_ids?: string[];
};

/**
 * Result returned from createPublicGroup
 */
export type CreatePublicGroupResult = {
  data: StudyGroup | null;
  error: any | null;
  rulesError?: any | null;
  invitationsError?: any | null;
};

/**
 * Response from creating a group
 */
export interface CreateGroupResponse {
  success: boolean;
  group?: StudyGroup;
  error?: string;
  errorCode?: 'VALIDATION_ERROR' | 'SLUG_EXISTS' | 'NETWORK_ERROR' | 'PERMISSION_DENIED';
}

/**
 * Response from fetching groups
 */
export interface FetchGroupsResponse {
  success: boolean;
  groups?: StudyGroup[];
  error?: string;
  errorCode?: 'UNAUTHORIZED' | 'NETWORK_ERROR' | 'PERMISSION_DENIED';
}

/**
 * Response from adding a group rule
 */
export interface AddGroupRuleResponse {
  success: boolean;
  rule?: GroupRule;
  error?: string;
  errorCode?: 'MAX_RULES_REACHED' | 'NETWORK_ERROR' | 'PERMISSION_DENIED';
}

/**
 * Response from deleting a group rule
 */
export interface DeleteGroupRuleResponse {
  success: boolean;
  error?: string;
  errorCode?: 'CANNOT_DELETE_FIRST' | 'NETWORK_ERROR' | 'PERMISSION_DENIED';
}

/**
 * Response from inviting friends to group
 */
export interface InviteFriendsToGroupResponse {
  success: boolean;
  invitations?: GroupInvitation[];
  error?: string;
  errorCode?: 'INVALID_USERS' | 'NETWORK_ERROR' | 'PERMISSION_DENIED';
}

/**
 * Group post data
 */
export interface GroupPost {
  id: string;
  group_id: string;
  author_id: string;
  content: string;
  image_urls: string[];
  file_urls: string[];
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Joined data
  author?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

/**
 * Payload for creating a group post
 */
export type CreateGroupPostPayload = {
  group_id: string;
  content: string;
  image_urls?: string[];
  file_urls?: string[];
};

/**
 * Response from creating a group post
 */
export interface CreateGroupPostResponse {
  success: boolean;
  post?: GroupPost;
  error?: string;
  errorCode?: 'VALIDATION_ERROR' | 'PERMISSION_DENIED' | 'NETWORK_ERROR';
}

/**
 * Response from fetching group posts
 */
export interface FetchGroupPostsResponse {
  success: boolean;
  posts?: GroupPost[];
  error?: string;
  errorCode?: 'UNAUTHORIZED' | 'NETWORK_ERROR';
}

/**
 * Response from deleting a group post
 */
export interface DeleteGroupPostResponse {
  success: boolean;
  error?: string;
  errorCode?: 'PERMISSION_DENIED' | 'NETWORK_ERROR' | 'NOT_FOUND';
}
