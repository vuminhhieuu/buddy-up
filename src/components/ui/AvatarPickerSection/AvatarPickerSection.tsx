import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Camera, User } from 'lucide-react-native';
import { Avatar } from '../Avatar/Avatar';
import { Text } from '../Text/Text';
import { ImagePickerModal } from '../ImagePickerModal/ImagePickerModal';
import { useTheme } from '../../../styles';
import { useTranslation } from 'react-i18next';

export type AvatarPickerSectionProps = {
  avatarUri?: string;
  displayName?: string;
  onAvatarSelected: (uri: string) => void;
  loading?: boolean;
};

export const AvatarPickerSection: React.FC<AvatarPickerSectionProps> = ({
  avatarUri,
  displayName,
  onAvatarSelected,
  loading = false,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);
  const [cameraPressed, setCameraPressed] = useState(false);
  const [textPressed, setTextPressed] = useState(false);

  const handleOpenPicker = () => {
    setShowPicker(true);
    setCameraPressed(false);
    setTextPressed(false);
  };

  return (
    <>
      {/* Avatar Container */}
      <View
        style={{
          alignItems: 'center',
          paddingVertical: theme.spacing[5],
        }}
      >
        {/* Avatar with Badge */}
        <View style={{ position: 'relative' }}>
          <Pressable
            onPress={() => setShowPicker(true)}
            disabled={loading}
            style={{ opacity: loading ? 0.5 : 1 }}
          >
            {avatarUri ? (
              <Avatar uri={avatarUri} name={displayName} size="xxl" />
            ) : (
              <View
                style={{
                  width: theme.sizes.avatar.xxl,
                  height: theme.sizes.avatar.xxl,
                  borderRadius: theme.sizes.avatar.xxl / 2,
                  backgroundColor: theme.colors.primary[500],
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={40} color="white" strokeWidth={1.5} />
              </View>
            )}
          </Pressable>

          {/* Camera Badge */}
          <Pressable
            onPress={handleOpenPicker}
            disabled={loading}
            onPressIn={() => setCameraPressed(true)}
            onPressOut={() => setCameraPressed(false)}
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              backgroundColor: theme.colors.primary[500],
              borderRadius: 50,
              padding: theme.spacing[2],
              borderWidth: 2,
              borderColor: theme.colors.surface,
              opacity: cameraPressed ? 0.7 : 1,
            }}
          >
            <Camera size={18} color="white" />
          </Pressable>
        </View>

        {/* Select Avatar Button */}
        <Pressable
          onPress={handleOpenPicker}
          disabled={loading}
          onPressIn={() => setTextPressed(true)}
          onPressOut={() => setTextPressed(false)}
          style={{
            marginTop: theme.spacing[4],
            opacity: textPressed ? 0.7 : 1,
          }}
        >
          <Text
            variant="body"
            style={{ fontWeight: '600' as const, color: theme.colors.primary[500], fontSize: 16 }}
          >
            {t('profileSetup.selectAvatarButton')}
          </Text>
        </Pressable>
      </View>

      {/* Image Picker Modal */}
      <ImagePickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelectImage={onAvatarSelected}
      />
    </>
  );
};
