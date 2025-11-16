import React from 'react';
import { View } from 'react-native';
import { ScreenContainer, Text, Button } from '../../components/ui';

export type ProfileSetupStep2ScreenProps = {
  onNext?: () => void;
  onBack?: () => void;
};

export const ProfileSetupStep2Screen: React.FC<ProfileSetupStep2ScreenProps> = ({
  onNext,
  onBack,
}) => {
  return (
    <ScreenContainer>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>step 2 đang được xử lí</Text>
        <View style={{ position: 'absolute', bottom: 20, width: '100%', paddingHorizontal: 20 }}>
          <Button label="Next" onPress={onNext || (() => {})} />
          <View style={{ marginTop: 10 }}>
            <Button label="Back" onPress={onBack || (() => {})} variant="outline" />
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
};
