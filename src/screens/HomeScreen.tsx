import React from 'react';
import { ScreenContainer, Text, Spacer } from '../components/ui';

export const HomeScreen: React.FC = () => {
  return (
    <ScreenContainer>
      <Text variant="h3">Home (Mock)</Text>
      <Spacer size={4} />
      <Text variant="body">This is a temporary screen to test navigation.</Text>
      <Spacer size={6} />
    </ScreenContainer>
  );
};
