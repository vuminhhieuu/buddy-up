import React from 'react';
import { ScreenContainer, Text, Spacer } from '../components/ui';

export const BuddyScreen: React.FC = () => {
  return (
    <ScreenContainer>
      <Text variant="h3">Buddy (Mock)</Text>
      <Spacer size={4} />
      <Text variant="body">This is a temporary screen to test buddy navigation.</Text>
      <Spacer size={6} />
    </ScreenContainer>
  );
};
