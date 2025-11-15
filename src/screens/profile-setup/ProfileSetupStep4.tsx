import React from 'react';
import { ScreenContainer, Text } from '../../components/ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileSetupStackParamList } from '../../navigation/ProfileSetupNavigator';

type ProfileSetupStep4Props = NativeStackScreenProps<
  ProfileSetupStackParamList,
  'ProfileSetupStep4'
>;

export const ProfileSetupStep4: React.FC<ProfileSetupStep4Props> = () => {
  return (
    <ScreenContainer>
      <Text variant="h3">Step 4 - Coming Soon</Text>
    </ScreenContainer>
  );
};
