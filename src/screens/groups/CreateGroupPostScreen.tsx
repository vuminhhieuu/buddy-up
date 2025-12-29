import React, { useState } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { X, Image as ImageIcon, Send, FileText } from 'lucide-react-native';
import { ScreenContainer, Text, Input, Button, Spacer } from '../../components/ui';
import { ImagePickerModal } from '../../components/ui/ImagePickerModal/ImagePickerModal';
import { BackButton } from '../../components/navigation';
import { useTheme } from '../../styles';
import { useAppSelector } from '../../store/hooks';
import { createGroupPost } from '../../services/groups/posts';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { logger } from '../../utils/logger';
import { uploadPostImageToStorage, uploadPostFileToStorage } from '../../services/groups/storage';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type CreateGroupPostRouteProp = RouteProp<RootStackParamList, 'CreateGroupPost'>;

// Constants for UI layout
const BOTTOM_PADDING_EXTRA = 100; // Approximate height for keyboard/action bar

export const CreateGroupPostScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('groups');
  const route = useRoute<CreateGroupPostRouteProp>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { userId } = useAppSelector((state) => state.auth);
  const { groupId } = route.params;

  const [content, setContent] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [fileUris, setFileUris] = useState<Array<{ uri: string; name: string }>>([]);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const handleImageSelected = async (uri: string) => {
    if (imageUris.length >= 5) {
      Toast.show({
        type: 'error',
        text1: t('posts.maxImages', { defaultValue: 'Tối đa 5 hình ảnh' }),
        text2: t('posts.maxImagesDescription', {
          defaultValue: 'Bạn chỉ có thể tải lên tối đa 5 hình ảnh',
        }),
      });
      return;
    }

    setImageUris([...imageUris, uri]);
    setShowImagePicker(false);
  };

  const handleRemoveImage = (index: number) => {
    const newUris = imageUris.filter((_, i) => i !== index);
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUris(newUris);
    setImageUrls(newUrls);
  };

  const handlePickDocument = async () => {
    if (fileUris.length >= 5) {
      Toast.show({
        type: 'error',
        text1: t('posts.maxFiles', { defaultValue: 'Tối đa 5 file' }),
        text2: t('posts.maxFilesDescription', {
          defaultValue: 'Bạn chỉ có thể tải lên tối đa 5 file',
        }),
      });
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setFileUris([...fileUris, { uri: asset.uri, name: asset.name }]);
    } catch (error: any) {
      logger.error('CreateGroupPostScreen', 'Error picking document', error);
      Toast.show({
        type: 'error',
        text1: t('posts.pickFileError', { defaultValue: 'Lỗi chọn file' }),
        text2:
          error.message ||
          t('posts.pickFileErrorDescription', { defaultValue: 'Không thể chọn file' }),
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    const newUris = fileUris.filter((_, i) => i !== index);
    const newUrls = fileUrls.filter((_, i) => i !== index);
    setFileUris(newUris);
    setFileUrls(newUrls);
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageUris.length === 0) return [];

    setIsUploadingImages(true);
    try {
      // Upload all images in parallel for better performance
      const uploadPromises = imageUris.map((uri) => uploadPostImageToStorage(groupId, uri));
      const uploadedUrls = await Promise.all(uploadPromises);
      return uploadedUrls;
    } catch (error: any) {
      logger.error('CreateGroupPostScreen', 'Error uploading images', error);
      throw error;
    } finally {
      setIsUploadingImages(false);
    }
  };

  const uploadFiles = async (): Promise<string[]> => {
    if (fileUris.length === 0) return [];

    setIsUploadingFiles(true);
    try {
      // Upload all files in parallel for better performance
      const uploadPromises = fileUris.map((file) =>
        uploadPostFileToStorage(groupId, file.uri, file.name),
      );
      const uploadedUrls = await Promise.all(uploadPromises);
      return uploadedUrls;
    } catch (error: any) {
      logger.error('CreateGroupPostScreen', 'Error uploading files', error);
      throw error;
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Toast.show({
        type: 'error',
        text1: t('posts.contentRequired', { defaultValue: 'Nội dung không được để trống' }),
        text2: t('posts.contentRequiredDescription', {
          defaultValue: 'Vui lòng nhập nội dung bài đăng',
        }),
      });
      return;
    }

    if (!userId) {
      Toast.show({
        type: 'error',
        text1: t('common.error', { ns: 'common', defaultValue: 'Lỗi' }),
        text2: t('common.unauthorized', { ns: 'common', defaultValue: 'Bạn chưa đăng nhập' }),
      });
      return;
    }

    setIsSubmitting(true);

    let finalImageUrls: string[] = [];
    let finalFileUrls: string[] = [];

    try {
      // Upload images first
      if (imageUris.length > 0) {
        try {
          finalImageUrls = await uploadImages();
        } catch (uploadError: any) {
          Toast.show({
            type: 'error',
            text1: t('posts.uploadError', { defaultValue: 'Lỗi tải ảnh' }),
            text2:
              uploadError.message ||
              t('posts.uploadErrorDescription', { defaultValue: 'Không thể tải ảnh lên' }),
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Upload files
      if (fileUris.length > 0) {
        try {
          finalFileUrls = await uploadFiles();
        } catch (uploadError: any) {
          // Cleanup uploaded images if file upload fails
          if (finalImageUrls.length > 0) {
            const { deletePostFilesFromStorage } = await import('../../services/groups/storage');
            deletePostFilesFromStorage(finalImageUrls, []).catch((err) => {
              logger.error('CreateGroupPostScreen', 'Error cleaning up images', err);
            });
          }
          Toast.show({
            type: 'error',
            text1: t('posts.uploadFileError', { defaultValue: 'Lỗi tải file' }),
            text2:
              uploadError.message ||
              t('posts.uploadFileErrorDescription', { defaultValue: 'Không thể tải file lên' }),
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Create post
      const result = await createGroupPost(
        {
          group_id: groupId,
          content: content.trim(),
          image_urls: finalImageUrls,
          file_urls: finalFileUrls,
        },
        userId,
      );

      if (result.success && result.post) {
        Toast.show({
          type: 'success',
          text1: t('posts.createSuccess', { defaultValue: 'Đăng bài thành công' }),
          text2: t('posts.createSuccessDescription', {
            defaultValue: 'Bài đăng của bạn đã được đăng lên nhóm',
          }),
        });
        navigation.goBack();
      } else {
        // Cleanup uploaded files if post creation fails
        if (finalImageUrls.length > 0 || finalFileUrls.length > 0) {
          const { deletePostFilesFromStorage } = await import('../../services/groups/storage');
          deletePostFilesFromStorage(finalImageUrls, finalFileUrls).catch((err) => {
            logger.error('CreateGroupPostScreen', 'Error cleaning up files', err);
          });
        }
        Toast.show({
          type: 'error',
          text1: t('posts.createError', { defaultValue: 'Lỗi đăng bài' }),
          text2:
            result.error ||
            t('posts.createErrorDescription', { defaultValue: 'Không thể đăng bài' }),
        });
      }
    } catch (error: any) {
      // Cleanup uploaded files if unexpected error occurs
      if (finalImageUrls.length > 0 || finalFileUrls.length > 0) {
        const { deletePostFilesFromStorage } = await import('../../services/groups/storage');
        deletePostFilesFromStorage(finalImageUrls, finalFileUrls).catch((err) => {
          logger.error('CreateGroupPostScreen', 'Error cleaning up files', err);
        });
      }
      logger.error('CreateGroupPostScreen', 'Error creating post', error);
      Toast.show({
        type: 'error',
        text1: t('posts.createError', { defaultValue: 'Lỗi đăng bài' }),
        text2:
          error.message ||
          t('posts.createErrorDescription', { defaultValue: 'Không thể đăng bài' }),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    content.trim().length > 0 && !isSubmitting && !isUploadingImages && !isUploadingFiles;

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
            {t('posts.createPost', { defaultValue: 'Đăng bài' })}
          </Text>
          {/* Right action button */}
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={{
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: canSubmit ? 1 : 0.5,
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={theme.colors.primary[500]} />
            ) : (
              <Send
                size={20}
                color={canSubmit ? theme.colors.primary[500] : theme.colors.text.tertiary}
              />
            )}
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            marginTop: theme.spacing[6],
            gap: theme.spacing[4],
            paddingHorizontal: theme.spacing[5],
            // Bottom padding accounts for safe area + spacing + approximate keyboard/action bar height
            paddingBottom: (insets.bottom ?? 0) + theme.spacing[8] + BOTTOM_PADDING_EXTRA,
          }}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraScrollHeight={200}
          showsVerticalScrollIndicator={false}
        >
          {/* Content Input */}
          <Input
            label={t('posts.content', { defaultValue: 'Nội dung' })}
            labelBold
            placeholder={t('posts.contentPlaceholder', {
              defaultValue: 'Viết gì đó cho nhóm của bạn...',
            })}
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={8}
            style={{
              minHeight: 150,
              textAlignVertical: 'top',
            }}
            maxLength={5000}
          />

          {/* Image Upload Section */}
          <View>
            <Text
              variant="h6"
              style={{ marginBottom: theme.spacing[3], fontWeight: '700' as const }}
            >
              {t('posts.images', { defaultValue: 'Hình ảnh' })}
            </Text>
            <Text variant="bodySmall" color="secondary" style={{ marginBottom: theme.spacing[3] }}>
              {t('posts.imagesDescription', {
                defaultValue: 'Tối đa 5 hình ảnh (tùy chọn)',
              })}
            </Text>

            {/* Image Grid */}
            {imageUris.length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: theme.spacing[2],
                  marginBottom: theme.spacing[3],
                }}
              >
                {imageUris.map((uri, index) => (
                  <View
                    key={index}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: theme.radius.md,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <Image
                      source={{ uri }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                    <Pressable
                      onPress={() => handleRemoveImage(index)}
                      style={{
                        position: 'absolute',
                        top: theme.spacing[1],
                        right: theme.spacing[1],
                        width: 24,
                        height: 24,
                        borderRadius: theme.radius.full,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={14} color={theme.colors.surface} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Add Image Button */}
            {imageUris.length < 5 && (
              <Pressable
                onPress={() => setShowImagePicker(true)}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: theme.radius.md,
                  borderWidth: 2,
                  borderColor: theme.colors.border,
                  borderStyle: 'dashed',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.colors.neutral?.[50] || theme.colors.surface,
                }}
              >
                <ImageIcon size={24} color={theme.colors.text.secondary} />
                <Text variant="bodySmall" color="secondary" style={{ marginTop: theme.spacing[1] }}>
                  {t('posts.addImage', { defaultValue: 'Thêm ảnh' })}
                </Text>
              </Pressable>
            )}
          </View>

          {/* File Upload Section */}
          <View>
            <Text
              variant="h6"
              style={{ marginBottom: theme.spacing[3], fontWeight: '700' as const }}
            >
              {t('posts.files', { defaultValue: 'File đính kèm' })}
            </Text>
            <Text variant="bodySmall" color="secondary" style={{ marginBottom: theme.spacing[3] }}>
              {t('posts.filesDescription', {
                defaultValue: 'Tối đa 5 file PDF (tùy chọn)',
              })}
            </Text>

            {/* File List */}
            {fileUris.length > 0 && (
              <View
                style={{
                  gap: theme.spacing[2],
                  marginBottom: theme.spacing[3],
                }}
              >
                {fileUris.map((file, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: theme.spacing[3],
                      borderRadius: theme.radius.md,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                    }}
                  >
                    <FileText size={20} color={theme.colors.primary[500]} />
                    <View style={{ flex: 1, marginLeft: theme.spacing[2] }}>
                      <Text variant="body" style={{ fontWeight: '500' as const }} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Text variant="bodySmall" color="secondary">
                        PDF
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleRemoveFile(index)}
                      style={{
                        padding: theme.spacing[1],
                        borderRadius: theme.radius.full,
                      }}
                    >
                      <X size={18} color={theme.colors.semantic.error} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Add File Button */}
            {fileUris.length < 5 && (
              <Pressable
                onPress={handlePickDocument}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: theme.spacing[3],
                  borderRadius: theme.radius.md,
                  borderWidth: 2,
                  borderColor: theme.colors.border,
                  borderStyle: 'dashed',
                  backgroundColor: theme.colors.neutral?.[50] || theme.colors.surface,
                  gap: theme.spacing[2],
                }}
              >
                <FileText size={20} color={theme.colors.text.secondary} />
                <Text variant="body" color="secondary" style={{ fontWeight: '500' as const }}>
                  {t('posts.addFile', { defaultValue: 'Thêm file PDF' })}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Character Count */}
          <Text variant="bodySmall" color="secondary" style={{ textAlign: 'right' }}>
            {content.length}/5000
          </Text>
        </KeyboardAwareScrollView>

        {/* Image Picker Modal */}
        <ImagePickerModal
          visible={showImagePicker}
          onClose={() => setShowImagePicker(false)}
          onSelectImage={handleImageSelected}
        />
      </KeyboardAvoidingView>
    </View>
  );
};
