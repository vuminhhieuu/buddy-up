import React, { useState } from 'react';
import { Pressable, StyleProp, ViewStyle, View } from 'react-native';
import { Text } from '../Text/Text';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../../../store/hooks';
import { setProfileSetupInProgress } from '../../../store/slices/authSlice';
// Navigation is driven by app state change below; no direct navigation needed here

export type SkipButtonProps = {
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<any>;
};

export const SkipButton: React.FC<SkipButtonProps> = ({ style, textStyle }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [pressed, setPressed] = useState(false);

  const handlePress = async () => {
    // Always navigate straight to Home by ending profile setup regardless of step
    // AppNavigator will render MainTabs when profileSetupInProgress is false
    dispatch(setProfileSetupInProgress(false));
  };

  return (
    <Pressable
      style={[style, { opacity: pressed ? 0.7 : 1 }]}
      onPress={handlePress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityState={{ busy: false }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text variant="body" color="tertiary" style={textStyle}>
          {t('profileSetup.skipButton')}
        </Text>
      </View>
    </Pressable>
  );
};

export default SkipButton;
