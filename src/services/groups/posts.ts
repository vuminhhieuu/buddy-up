/**
 * Group Posts Service
 * Functions for managing posts in study groups
 */

import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';
import type {
  GroupPost,
  CreateGroupPostPayload,
  CreateGroupPostResponse,
  FetchGroupPostsResponse,
  DeleteGroupPostResponse,
} from './types';

/**
 * Create a post in a group
 */
export async function createGroupPost(
  payload: CreateGroupPostPayload,
  authorId: string,
): Promise<CreateGroupPostResponse> {
  try {
    // Validate content
    if (!payload.content || payload.content.trim().length === 0) {
      return {
        success: false,
        error: 'Post content cannot be empty',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    if (payload.content.length > 5000) {
      return {
        success: false,
        error: 'Post content cannot exceed 5000 characters',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    // Validate image URLs
    if (payload.image_urls && payload.image_urls.length > 5) {
      return {
        success: false,
        error: 'Cannot upload more than 5 images',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    // Validate file URLs
    if (payload.file_urls && payload.file_urls.length > 5) {
      return {
        success: false,
        error: 'Cannot upload more than 5 files',
        errorCode: 'VALIDATION_ERROR',
      };
    }

    // Check membership and group posting permission
    // Fetch both in parallel to optimize performance
    const [memberResult, groupResult] = await Promise.all([
      supabase
        .from('group_members')
        .select('role, status')
        .eq('group_id', payload.group_id)
        .eq('user_id', authorId)
        .eq('status', 'active')
        .single(),
      supabase
        .from('study_groups')
        .select('posting_permission')
        .eq('id', payload.group_id)
        .is('deleted_at', null)
        .single(),
    ]);

    const { data: memberData, error: memberError } = memberResult;
    const { data: groupData, error: groupError } = groupResult;

    if (memberError || !memberData) {
      return {
        success: false,
        error: 'You must be a member of the group to post',
        errorCode: 'PERMISSION_DENIED',
      };
    }

    if (groupError || !groupData) {
      return {
        success: false,
        error: 'Group not found',
        errorCode: 'PERMISSION_DENIED',
      };
    }

    // Check if user has permission to post
    if (
      groupData.posting_permission === 'admin_moderator_only' &&
      !['admin', 'moderator', 'owner'].includes(memberData.role)
    ) {
      return {
        success: false,
        error: 'Only admins and moderators can post in this group',
        errorCode: 'PERMISSION_DENIED',
      };
    }

    // Create the post
    const { data: postData, error: postError } = await supabase
      .from('group_posts')
      .insert({
        group_id: payload.group_id,
        author_id: authorId,
        content: payload.content.trim(),
        image_urls: payload.image_urls || [],
        file_urls: payload.file_urls || [],
      })
      .select('*')
      .single();

    if (postError) {
      logger.error('createGroupPost', 'Error creating post', postError);
      return {
        success: false,
        error: postError.message || 'Failed to create post',
        errorCode: 'NETWORK_ERROR',
      };
    }

    // Fetch post with author information
    const postWithAuthor = await getPostWithAuthor(postData.id);

    return {
      success: true,
      post: postWithAuthor || (postData as GroupPost),
    };
  } catch (error: any) {
    logger.error('createGroupPost', 'Unexpected error', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * Get posts for a group
 */
export async function getGroupPosts(
  groupId: string,
  limit: number = 20,
  offset: number = 0,
): Promise<FetchGroupPostsResponse> {
  try {
    // Fetch posts first
    const { data: postsData, error: postsError } = await supabase
      .from('group_posts')
      .select('*')
      .eq('group_id', groupId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (postsError) {
      logger.error('getGroupPosts', 'Error fetching posts', postsError);
      return {
        success: false,
        error: postsError.message || 'Failed to fetch posts',
        errorCode: 'NETWORK_ERROR',
      };
    }

    if (!postsData || postsData.length === 0) {
      return {
        success: true,
        posts: [],
      };
    }

    // Get unique author IDs
    const authorIds = Array.from(new Set(postsData.map((post) => post.author_id)));

    // Fetch all profiles in a single query
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', authorIds)
      .is('deleted_at', null);

    if (profilesError) {
      logger.warn('getGroupPosts', 'Error fetching profiles', profilesError);
      // Return posts without author info if profile fetch fails
      return {
        success: true,
        posts: postsData.map((post) => ({
          ...post,
          author: undefined,
        })) as GroupPost[],
      };
    }

    // Create a map of user_id to profile
    const profileMap = new Map(
      (profilesData || []).map((profile) => [
        profile.user_id,
        {
          id: profile.user_id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
        },
      ]),
    );

    // Map posts with author information
    const posts: GroupPost[] = postsData.map((post) => ({
      ...post,
      author: profileMap.get(post.author_id),
    }));

    return {
      success: true,
      posts,
    };
  } catch (error: any) {
    logger.error('getGroupPosts', 'Unexpected error', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * Delete a group post
 */
export async function deleteGroupPost(
  postId: string,
  userId: string,
): Promise<DeleteGroupPostResponse> {
  try {
    // Get post to check permissions
    const { data: postData, error: postError } = await supabase
      .from('group_posts')
      .select('author_id, group_id')
      .eq('id', postId)
      .is('deleted_at', null)
      .single();

    if (postError || !postData) {
      return {
        success: false,
        error: 'Post not found',
        errorCode: 'NOT_FOUND',
      };
    }

    // Check if user is the author
    const isAuthor = postData.author_id === userId;

    // If not author, check if user is admin/moderator
    if (!isAuthor) {
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', postData.group_id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (memberError || !memberData) {
        return {
          success: false,
          error: 'You do not have permission to delete this post',
          errorCode: 'PERMISSION_DENIED',
        };
      }

      if (!['admin', 'moderator', 'owner'].includes(memberData.role)) {
        return {
          success: false,
          error: 'You do not have permission to delete this post',
          errorCode: 'PERMISSION_DENIED',
        };
      }
    }

    // Get post files before soft delete
    const { data: postFilesData } = await supabase
      .from('group_posts')
      .select('image_urls, file_urls')
      .eq('id', postId)
      .single();

    // Soft delete the post
    const { error: deleteError } = await supabase
      .from('group_posts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', postId);

    if (deleteError) {
      logger.error('deleteGroupPost', 'Error deleting post', deleteError);
      return {
        success: false,
        error: deleteError.message || 'Failed to delete post',
        errorCode: 'NETWORK_ERROR',
      };
    }

    // Cleanup associated files from storage (non-blocking)
    if (postFilesData) {
      const { deletePostFilesFromStorage } = await import('./storage');
      deletePostFilesFromStorage(
        postFilesData.image_urls || [],
        postFilesData.file_urls || [],
      ).catch((err) => {
        // Log but don't fail the deletion
        logger.error('deleteGroupPost', 'Error cleaning up post files', err);
      });
    }

    return {
      success: true,
    };
  } catch (error: any) {
    logger.error('deleteGroupPost', 'Unexpected error', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * Get post count for a group
 */
export async function getGroupPostCount(groupId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('group_posts')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .is('deleted_at', null);

    if (error) {
      logger.error('getGroupPostCount', 'Error counting posts', error);
      return 0;
    }

    return count || 0;
  } catch (error: any) {
    logger.error('getGroupPostCount', 'Unexpected error', error);
    return 0;
  }
}

/**
 * Helper function to get post with author information
 */
async function getPostWithAuthor(postId: string): Promise<GroupPost | null> {
  try {
    const { data: postData, error: postError } = await supabase
      .from('group_posts')
      .select('*')
      .eq('id', postId)
      .is('deleted_at', null)
      .single();

    if (postError || !postData) {
      return null;
    }

    // Fetch author profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .eq('user_id', postData.author_id)
      .is('deleted_at', null)
      .single();

    const post: GroupPost = {
      ...postData,
      author: profileError
        ? undefined
        : {
            id: profileData.user_id,
            display_name: profileData.display_name,
            avatar_url: profileData.avatar_url,
          },
    };

    return post;
  } catch (error: any) {
    logger.error('getPostWithAuthor', 'Error fetching post with author', error);
    return null;
  }
}
