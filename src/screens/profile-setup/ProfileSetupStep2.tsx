import React from 'react';
import { ScreenContainer, Text } from '../../components/ui';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileSetupStackParamList } from '../../navigation/ProfileSetupNavigator';

type ProfileSetupStep2Props = NativeStackScreenProps<
  ProfileSetupStackParamList,
  'ProfileSetupStep2'
>;

export const ProfileSetupStep2: React.FC<ProfileSetupStep2Props> = () => {
  return (
    <ScreenContainer>
      <Text variant="h3">Step 2 - Coming Soon</Text>
    </ScreenContainer>
  );
};
