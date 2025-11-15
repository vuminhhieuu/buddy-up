import React from 'react';
import { ScreenContainer, Text } from '../../components/ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileSetupStackParamList } from '../../navigation/ProfileSetupNavigator';

type ProfileSetupStep3Props = NativeStackScreenProps<
  ProfileSetupStackParamList,
  'ProfileSetupStep3'
>;

export const ProfileSetupStep3: React.FC<ProfileSetupStep3Props> = () => {
  return (
    <ScreenContainer>
      <Text variant="h3">Step 3 - Coming Soon</Text>
    </ScreenContainer>
  );
};
