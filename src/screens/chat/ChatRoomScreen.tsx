import React from 'react';
import { ScreenContainer, Spacer, Text } from '../../components/ui';

export const ChatRoomScreen: React.FC = () => {
  return (
    <ScreenContainer>
      <Text variant="h3">Chat room</Text>
      <Spacer size={4} />
      <Text variant="body">Màn hình chi tiết chat sẽ được triển khai ở PR tiếp theo.</Text>
    </ScreenContainer>
  );
};
