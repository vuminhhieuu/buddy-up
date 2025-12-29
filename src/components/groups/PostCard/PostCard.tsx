import React from 'react';
import { View, Pressable, Image, ScrollView, Alert, Linking } from 'react-native';
import {
  Heart,
  MessageCircle,
  MoreVertical,
  Trash2,
  FileText,
  Download,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../styles';
import { Text, Card, Avatar } from '../../ui';
import { formatRelativeTime } from '../../../utils/date';
import type { GroupPost } from '../../../services/groups/types';

export type PostCardProps = {
  post: GroupPost;
  currentUserId?: string;
  onDelete?: (postId: string) => void;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
};

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onDelete,
  onLike,
  onComment,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('groups');

  const isAuthor = post.author_id === currentUserId;
  const timeAgo = formatRelativeTime(post.created_at, 'full');

  const handleDelete = () => {
    Alert.alert(
      t('posts.deletePost', { defaultValue: 'Xóa bài đăng' }),
      t('posts.deleteConfirm', { defaultValue: 'Bạn có chắc chắn muốn xóa bài đăng này?' }),
      [
        {
          text: t('common.cancel', { ns: 'common', defaultValue: 'Hủy' }),
          style: 'cancel',
        },
        {
          text: t('posts.delete', { defaultValue: 'Xóa' }),
          style: 'destructive',
          onPress: () => onDelete?.(post.id),
        },
      ],
    );
  };

  return (
    <Card padding={4} elevation="sm" style={{ marginBottom: theme.spacing[3] }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: theme.spacing[3],
        }}
      >
        {/* Avatar */}
        <Avatar
          size={40}
          uri={post.author?.avatar_url || undefined}
          name={post.author?.display_name || undefined}
        />

        {/* Author Info */}
        <View style={{ flex: 1, marginLeft: theme.spacing[2] }}>
          <Text variant="body" style={{ fontWeight: '600' as const }} numberOfLines={1}>
            {post.author?.display_name || t('posts.anonymous', { defaultValue: 'Người dùng' })}
          </Text>
          <Text variant="bodySmall" color="secondary">
            {timeAgo}
          </Text>
        </View>

        {/* Actions Menu */}
        {isAuthor && (
          <Pressable
            onPress={handleDelete}
            style={{
              padding: theme.spacing[1],
              borderRadius: theme.radius.full,
            }}
          >
            <Trash2 size={18} color={theme.colors.semantic.error} />
          </Pressable>
        )}
      </View>

      {/* Content */}
      <Text
        variant="body"
        style={{
          marginBottom:
            (post.image_urls && post.image_urls.length > 0) ||
            (post.file_urls && post.file_urls.length > 0)
              ? theme.spacing[3]
              : 0,
          lineHeight: 22,
        }}
      >
        {post.content}
      </Text>

      {/* Images */}
      {post.image_urls && post.image_urls.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: theme.spacing[3] }}
          contentContainerStyle={{ gap: theme.spacing[2] }}
        >
          {post.image_urls.map((imageUrl, index) => (
            <Image
              key={index}
              source={{ uri: imageUrl }}
              style={{
                width: 200,
                height: 200,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.neutral?.[100],
              }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}

      {/* Files */}
      {post.file_urls && post.file_urls.length > 0 && (
        <View style={{ marginBottom: theme.spacing[3], gap: theme.spacing[2] }}>
          {post.file_urls.map((fileUrl, index) => {
            // Extract filename from URL, decode URI and remove query parameters
            let fileName = fileUrl.split('/').pop() || `File ${index + 1}.pdf`;
            try {
              // Remove query parameters
              fileName = fileName.split('?')[0];
              // Decode URL-encoded characters
              fileName = decodeURIComponent(fileName);
            } catch {
              // If decoding fails, use the original filename
            }

            return (
              <Pressable
                key={index}
                onPress={() => Linking.openURL(fileUrl)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: theme.spacing[3],
                  borderRadius: theme.radius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  gap: theme.spacing[2],
                }}
              >
                <FileText size={24} color={theme.colors.semantic.error} />
                <View style={{ flex: 1 }}>
                  <Text variant="body" style={{ fontWeight: '500' as const }} numberOfLines={1}>
                    {fileName}
                  </Text>
                  <Text variant="bodySmall" color="secondary">
                    PDF
                  </Text>
                </View>
                <Download size={18} color={theme.colors.primary[500]} />
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Actions */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: theme.spacing[2],
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        }}
      >
        {/* Like Button */}
        <Pressable
          onPress={() => onLike?.(post.id)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing[1],
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <Heart
            size={20}
            color={theme.colors.text.secondary}
            fill={post.like_count > 0 ? theme.colors.semantic.error : 'transparent'}
          />
          <Text variant="bodySmall" color="secondary">
            {post.like_count > 0 ? post.like_count : t('posts.like', { defaultValue: 'Thích' })}
          </Text>
        </Pressable>

        {/* Comment Button */}
        <Pressable
          onPress={() => onComment?.(post.id)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing[1],
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <MessageCircle size={20} color={theme.colors.text.secondary} />
          <Text variant="bodySmall" color="secondary">
            {post.comment_count > 0
              ? post.comment_count
              : t('posts.comment', { defaultValue: 'Bình luận' })}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
};
