import React, { useState } from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import { Text } from '../Text/Text';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../../../store/hooks';
import { setProfileSetupInProgress } from '../../../store/slices/authSlice';

export type SkipButtonProps = {
  onSkip?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<any>;
};

export const SkipButton: React.FC<SkipButtonProps> = ({ onSkip, style, textStyle }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [pressed, setPressed] = useState(false);

  const handlePress = () => {
    dispatch(setProfileSetupInProgress(false));
    onSkip?.();
  };

  return (
    <Pressable
      style={[style, { opacity: pressed ? 0.7 : 1 }]}
      onPress={handlePress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
    >
      <Text variant="body" color="tertiary" style={textStyle}>
        {t('profileSetup.skipButton')}
      </Text>
    </Pressable>
  );
};

export default SkipButton;
