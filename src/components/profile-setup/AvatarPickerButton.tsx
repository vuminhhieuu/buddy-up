import React, { useState } from 'react';
// eslint-disable-next-line react-native/split-platform-components
import { View, Pressable, Alert, ActionSheetIOS, Platform, Linking, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, User } from 'lucide-react-native';
import { useTheme } from '../../styles';
import { Text } from '../ui/Text/Text';
import { Avatar } from '../ui/Avatar/Avatar';
import { useTranslation } from 'react-i18next';

export interface AvatarPickerButtonProps {
  currentUri: string | null;
  onSelectImage: (uri: string) => void;
  isLoading?: boolean;
}

export const AvatarPickerButton: React.FC<AvatarPickerButtonProps> = ({
  currentUri,
  onSelectImage,
  isLoading = false,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const requestPermissions = async () => {
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

    return cameraStatus.granted && libraryStatus.granted;
  };

  const pickFromGallery = async () => {
    try {
      setIsPickerLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onSelectImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert(t('profileSetup.errors.uploadFailed'));
    } finally {
      setIsPickerLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      setIsPickerLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onSelectImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert(t('profileSetup.errors.uploadFailed'));
    } finally {
      setIsPickerLoading(false);
    }
  };

  const handlePress = async () => {
    // Check current permission status
    const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
    const libraryStatus = await ImagePicker.getMediaLibraryPermissionsAsync();

    // If not granted, request permissions
    if (!cameraStatus.granted || !libraryStatus.granted) {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          t('profileSetup.errors.permissionDenied'),
          'Vui lòng cấp quyền trong Settings',
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: 'Mở Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
    }

    // Show picker after permission is granted
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            t('common.cancel'),
            t('profileSetup.avatarPicker.takePhoto'),
            t('profileSetup.avatarPicker.chooseFromLibrary'),
          ],
          cancelButtonIndex: 0,
          destructiveButtonIndex: undefined,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhoto();
          } else if (buttonIndex === 2) {
            pickFromGallery();
          }
        },
      );
    } else {
      setShowPicker(true);
    }
  };

  const handlePickerOption = (option: 'camera' | 'gallery') => {
    setShowPicker(false);
    if (option === 'camera') {
      takePhoto();
    } else {
      pickFromGallery();
    }
  };

  return (
    <View
      style={{
        alignItems: 'center',
        marginVertical: theme.spacing[6],
      }}
    >
      <View
        style={{
          position: 'relative',
          marginBottom: theme.spacing[3],
        }}
      >
        {currentUri ? (
          <Avatar uri={currentUri} size="xl" />
        ) : (
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: theme.colors.primary[100],
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <User size={40} color={theme.colors.primary[500]} />
          </View>
        )}
        <Pressable
          onPress={handlePress}
          disabled={isLoading || isPickerLoading}
          style={({ pressed }) => ({
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.colors.primary[500],
            justifyContent: 'center',
            alignItems: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Camera size={16} color={theme.colors.text.inverse} />
        </Pressable>
      </View>

      <Pressable
        onPress={handlePress}
        disabled={isLoading || isPickerLoading}
        style={({ pressed }) => ({
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Text
          variant="body"
          color="primary"
          style={{ fontWeight: '600' as const, color: theme.colors.primary[500] }}
        >
          {t('profileSetup.step1.selectAvatar')}
        </Text>
      </Pressable>

      <Modal visible={showPicker} transparent animationType="fade">
        {/* eslint-disable react-native/no-color-literals */}
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: theme.spacing[4],
          }}
        >
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: theme.radius.base,
              padding: theme.spacing[6],
              width: '100%',
              alignItems: 'center',
            }}
          >
            {/* eslint-enable react-native/no-color-literals */}
            <Text
              variant="h4"
              style={{
                marginBottom: theme.spacing[6],
                textAlign: 'center',
                color: theme.colors.primary[500],
                fontWeight: '700' as const,
              }}
            >
              {t('profileSetup.step1.selectAvatar')}
            </Text>

            <Pressable
              onPress={() => handlePickerOption('camera')}
              style={({ pressed }) => ({
                width: '100%',
                paddingVertical: theme.spacing[4],
                paddingHorizontal: theme.spacing[4],
                marginBottom: theme.spacing[3],
                borderWidth: 1.5,
                borderColor: theme.colors.primary[500],
                borderRadius: theme.radius.base,
                alignItems: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text
                variant="body"
                style={{
                  color: theme.colors.primary[500],
                  fontWeight: '600' as const,
                }}
              >
                {t('profileSetup.avatarPicker.takePhoto')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handlePickerOption('gallery')}
              style={({ pressed }) => ({
                width: '100%',
                paddingVertical: theme.spacing[4],
                paddingHorizontal: theme.spacing[4],
                marginBottom: theme.spacing[3],
                borderWidth: 1.5,
                borderColor: theme.colors.primary[500],
                borderRadius: theme.radius.base,
                alignItems: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text
                variant="body"
                style={{
                  color: theme.colors.primary[500],
                  fontWeight: '600' as const,
                }}
              >
                {t('profileSetup.avatarPicker.chooseFromLibrary')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowPicker(false)}
              style={({ pressed }) => ({
                width: '100%',
                paddingVertical: theme.spacing[4],
                paddingHorizontal: theme.spacing[4],
                borderWidth: 1.5,
                borderColor: theme.colors.text.secondary,
                borderRadius: theme.radius.base,
                alignItems: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text
                variant="body"
                style={{
                  color: theme.colors.text.secondary,
                  fontWeight: '600' as const,
                }}
              >
                {t('common.cancel')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};
