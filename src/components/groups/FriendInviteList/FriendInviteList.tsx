import React, { useState, useMemo } from 'react';
import { View, TextInput, ScrollView, Pressable, ViewStyle } from 'react-native';
import { Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';
import { Avatar } from '../../ui/Avatar/Avatar';
import { Spacer } from '../../ui/Spacer/Spacer';
import { Card } from '../../ui/Card/Card';
import type { BuddyProfile } from '../../../types/buddy';

export type FriendInviteListProps = {
  friends: BuddyProfile[];
  selectedFriendIds: string[];
  onSelectionChange: (friendIds: string[]) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
};

export const FriendInviteList: React.FC<FriendInviteListProps> = ({
  friends,
  selectedFriendIds,
  onSelectionChange,
  searchPlaceholder,
  emptyMessage,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('groups');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const query = searchQuery.toLowerCase();
    return friends.filter(
      (friend) =>
        friend.display_name?.toLowerCase().includes(query) ||
        friend.bio?.toLowerCase().includes(query),
    );
  }, [friends, searchQuery]);

  const toggleFriend = (friendId: string) => {
    if (selectedFriendIds.includes(friendId)) {
      onSelectionChange(selectedFriendIds.filter((id) => id !== friendId));
    } else {
      onSelectionChange([...selectedFriendIds, friendId]);
    }
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

      {/* Friends List */}
      {filteredFriends.length === 0 ? (
        <View style={{ paddingVertical: theme.spacing[6], alignItems: 'center' }}>
          <Text variant="body" color="tertiary">
            {emptyMessage}
          </Text>
        </View>
      ) : (
        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={true}>
          {filteredFriends.map((friend) => {
            const isSelected = selectedFriendIds.includes(friend.user_id);
            const displayName = friend.display_name || 'Friend';
            const studySubject = friend.bio || t('step4.noFriendsSelected');

            return (
              <Pressable
                key={friend.user_id}
                onPress={() => toggleFriend(friend.user_id)}
                style={({ pressed }) => [
                  {
                    opacity: pressed ? 0.7 : 1,
                    marginBottom: theme.spacing[2],
                  },
                ]}
              >
                <Card
                  padding={4}
                  elevation="sm"
                  style={{
                    borderWidth: isSelected ? 2 : 1.5,
                    borderColor: isSelected ? theme.colors.primary[500] : theme.colors.border,
                    backgroundColor: isSelected ? theme.colors.primary[50] : theme.colors.surface,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: theme.spacing[3],
                    }}
                  >
                    {/* Avatar */}
                    <View
                      style={{
                        borderRadius: theme.radius.full,
                        borderWidth: isSelected ? 3 : 0,
                        borderColor: isSelected ? theme.colors.primary[500] : 'transparent',
                        padding: 2,
                      }}
                    >
                      <Avatar uri={friend.avatar_url || undefined} name={displayName} size="md" />
                    </View>

                    {/* Friend Info */}
                    <View style={{ flex: 1 }}>
                      <Text
                        variant="body"
                        style={{
                          fontWeight: isSelected ? ('600' as const) : ('500' as const),
                          color: isSelected ? theme.colors.primary[600] : theme.colors.text.primary,
                          marginBottom: theme.spacing[1],
                        }}
                      >
                        {displayName}
                      </Text>
                      <Text variant="bodySmall" color="secondary">
                        {studySubject}
                      </Text>
                    </View>

                    {/* Radio Button */}
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: theme.radius.full,
                        borderWidth: 2,
                        borderColor: isSelected ? theme.colors.primary[500] : theme.colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected ? theme.colors.primary[500] : 'transparent',
                      }}
                    >
                      {isSelected && (
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: theme.colors.surface,
                          }}
                        />
                      )}
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};
