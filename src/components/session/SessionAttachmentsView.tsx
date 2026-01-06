import React from 'react';
import { View, Pressable, ScrollView, Image as RNImage } from 'react-native';
import { Text } from '../ui/Text/Text';
import { useTheme } from '../../styles';
import { Image, FileText, StickyNote, X, ExternalLink } from 'lucide-react-native';
import { SessionAttachment } from '../../types/sessionAttachment';
import { Linking } from 'react-native';
import { useTranslation } from 'react-i18next';

interface SessionAttachmentsViewProps {
  attachments: SessionAttachment[];
  onDelete?: (attachmentId: string) => void;
  readOnly?: boolean;
}

export const SessionAttachmentsView: React.FC<SessionAttachmentsViewProps> = ({
  attachments,
  onDelete,
  readOnly = true,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('session');

  const images = attachments.filter((a) => a.type === 'image');
  const documents = attachments.filter((a) => a.type === 'document');
  const notes = attachments.filter((a) => a.type === 'note');

  if (attachments.length === 0) {
    return (
      <Text variant="caption" color="tertiary">
        {t('noAttachments')}
      </Text>
    );
  }

  return (
    <View style={{ gap: theme.spacing[4] }}>
      {/* Images */}
      {images.length > 0 && (
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {images.map((img) => (
              <View
                key={img.id}
                style={{
                  marginRight: theme.spacing[2],
                  position: 'relative',
                }}
              >
                <Pressable onPress={() => Linking.openURL(img.url)}>
                  <RNImage
                    source={{ uri: img.url }}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: theme.radius.md,
                    }}
                    resizeMode="cover"
                  />
                </Pressable>
                {!readOnly && onDelete && (
                  <Pressable
                    onPress={() => onDelete(img.id)}
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      backgroundColor: theme.colors.semantic.error,
                      borderRadius: 999,
                      padding: 4,
                    }}
                  >
                    <X size={16} color="#fff" />
                  </Pressable>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Documents */}
      {documents.length > 0 && (
        <View>
          <View style={{ gap: theme.spacing[2] }}>
            {documents.map((doc) => (
              <Pressable
                key={doc.id}
                onPress={() => Linking.openURL(doc.url)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.colors.background,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                  paddingHorizontal: theme.spacing[3],
                  paddingVertical: theme.spacing[3],
                  gap: theme.spacing[2],
                }}
              >
                <FileText size={20} color={theme.colors.primary[500]} />
                <View style={{ flex: 1 }}>
                  <Text variant="body" numberOfLines={1}>
                    {doc.name}
                  </Text>
                  {doc.size && (
                    <Text variant="caption" color="tertiary">
                      {(doc.size / 1024).toFixed(1)} KB
                    </Text>
                  )}
                </View>
                <ExternalLink size={16} color={theme.colors.text.tertiary} />
                {!readOnly && onDelete && (
                  <Pressable onPress={() => onDelete(doc.id)}>
                    <X size={18} color={theme.colors.semantic.error} />
                  </Pressable>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Notes */}
      {notes.length > 0 && (
        <View>
          <Text variant="body" style={{ fontWeight: '600', marginBottom: theme.spacing[2] }}>
            <StickyNote size={16} color={theme.colors.text.primary} /> {t('notes')} ({notes.length})
          </Text>
          <View style={{ gap: theme.spacing[2] }}>
            {notes.map((note) => (
              <View
                key={note.id}
                style={{
                  backgroundColor: theme.colors.semantic.warning + '20',
                  borderWidth: 1,
                  borderColor: theme.colors.semantic.warning + '80',
                  borderRadius: theme.radius.md,
                  paddingHorizontal: theme.spacing[3],
                  paddingVertical: theme.spacing[3],
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Text variant="body" style={{ flex: 1, paddingRight: theme.spacing[2] }}>
                    {note.note_content}
                  </Text>
                  {!readOnly && onDelete && (
                    <Pressable onPress={() => onDelete(note.id)}>
                      <X size={18} color={theme.colors.semantic.error} />
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};
