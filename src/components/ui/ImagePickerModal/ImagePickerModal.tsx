import React, { useState } from 'react';
import { View, Modal, Pressable, Alert, ActivityIndicator, Platform } from 'react-native';
import {
  launchCameraAsync,
  launchImageLibraryAsync,
  useCameraPermissions,
  useMediaLibraryPermissions,
  MediaTypeOptions,
} from 'expo-image-picker';
import { Camera, ImageIcon, X } from 'lucide-react-native';
import { Text } from '../Text/Text';
import { useTheme } from '../../../styles';
import { useTranslation } from 'react-i18next';

const BACKDROP_COLOR = 'rgba(0, 0, 0, 0.5)';
export type ImagePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectImage: (uri: string) => void;
};

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  visible,
  onClose,
  onSelectImage,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [libraryPermission, requestLibraryPermission] = useMediaLibraryPermissions();

  const handleTakePhoto = async () => {
    try {
      setLoading(true);

      if (!cameraPermission?.granted) {
        const permission = await requestCameraPermission();
        if (!permission.granted) {
          Alert.alert(t('common.permissionDenied'), t('common.cameraPermissionRequired'));
          return;
        }
      }

      const result = await launchCameraAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onSelectImage(result.assets[0].uri);
        onClose();
      }
    } catch {
      Alert.alert(t('common.error'), t('profileSetup.cameraError'));
    } finally {
      setLoading(false);
    }
  };

  const handlePickFromLibrary = async () => {
    try {
      setLoading(true);

      if (!libraryPermission?.granted) {
        const permission = await requestLibraryPermission();
        if (!permission.granted) {
          Alert.alert(t('common.permissionDenied'), t('common.libraryPermissionRequired'));
          return;
        }
      }

      const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onSelectImage(result.assets[0].uri);
        onClose();
      }
    } catch {
      Alert.alert(t('common.error'), t('profileSetup.libraryError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable
        style={{
          flex: 1,
          backgroundColor: BACKDROP_COLOR,
          justifyContent: 'flex-end',
        }}
        onPress={onClose}
      >
        {/* Modal Content */}
        <Pressable
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radius.lg,
            borderTopRightRadius: theme.radius.lg,
            paddingBottom: Platform.OS === 'ios' ? 30 : theme.spacing[6],
            paddingHorizontal: theme.spacing[4],
            paddingTop: theme.spacing[4],
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: theme.spacing[4],
            }}
          >
            <Text variant="h6">{t('profileSetup.imagePickerTitle')}</Text>
          </View>

          {/* Loading indicator */}
          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: theme.spacing[6] }}>
              <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            </View>
          ) : (
            <View style={{ gap: theme.spacing[3] }}>
              {/* Take Photo Button */}
              <Pressable
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: theme.spacing[4],
                  paddingHorizontal: theme.spacing[3],
                  backgroundColor: theme.colors.background,
                  borderRadius: theme.radius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
                onPress={handleTakePhoto}
              >
                <Camera size={20} color={theme.colors.primary[500]} />
                <Text variant="body" style={{ marginLeft: theme.spacing[3], flex: 1 }}>
                  {t('profileSetup.takePhotoButton')}
                </Text>
              </Pressable>

              {/* Choose from Library Button */}
              <Pressable
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: theme.spacing[4],
                  paddingHorizontal: theme.spacing[3],
                  backgroundColor: theme.colors.background,
                  borderRadius: theme.radius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
                onPress={handlePickFromLibrary}
              >
                <ImageIcon size={20} color={theme.colors.primary[500]} />
                <Text variant="body" style={{ marginLeft: theme.spacing[3], flex: 1 }}>
                  {t('profileSetup.chooseFromLibraryButton')}
                </Text>
              </Pressable>

              {/* Cancel Button */}
              <Pressable
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: theme.spacing[4],
                  paddingHorizontal: theme.spacing[3],
                  backgroundColor: theme.colors.background,
                  borderRadius: theme.radius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
                onPress={onClose}
              >
                <X size={20} color={theme.colors.text.tertiary} />
                <Text variant="h6" style={{ marginLeft: theme.spacing[3], flex: 1 }}>
                  {t('profileSetup.cancelButton')}
                </Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};
