import React, { useState } from 'react';
import { Pressable, StyleProp, ViewStyle, ActivityIndicator, View } from 'react-native';
import { Text } from '../Text/Text';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../../../store/hooks';
import { setProfileSetupInProgress } from '../../../store/slices/authSlice';

export type SkipButtonProps = {
  onSkip?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<any>;
  beforeSkip?: () => Promise<void> | void;
};

export const SkipButton: React.FC<SkipButtonProps> = ({ onSkip, style, textStyle, beforeSkip }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [pressed, setPressed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading) return;
    try {
      if (beforeSkip) {
        setLoading(true);
        await beforeSkip();
      }
      dispatch(setProfileSetupInProgress(false));
      onSkip?.();
    } catch (error) {
      console.error('Failed to save before skip:', error);
      // Optionally, show an error to the user here
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      style={[style, { opacity: pressed ? 0.7 : 1 }]}
      onPress={handlePress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityState={{ busy: loading }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {loading ? <ActivityIndicator size="small" style={{ marginRight: 8 }} /> : null}
        <Text variant="body" color="tertiary" style={textStyle}>
          {t('profileSetup.skipButton')}
        </Text>
      </View>
    </Pressable>
  );
};

export default SkipButton;
