/**
 * MessageInput Component
 * Input field with send button for typing and sending messages
 *
 * Note: With multiline={true}, onSubmitEditing and returnKeyType="send" may not work
 * as expected on all platforms. On iOS, multiline TextInputs typically insert a newline
 * when pressing return rather than submitting. Users should tap the send button to submit.
 */

import React, { useState } from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../../styles';
import { Input } from '../../ui/Input/Input';
import { Button } from '../../ui/Button/Button';
import { Spacer } from '../../ui/Spacer/Spacer';

export type MessageInputProps = {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  sending?: boolean;
};

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Nhập tin nhắn...',
  sending = false,
}) => {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 0 && !disabled && !sending) {
      onSend(trimmedMessage);
      setMessage('');
    }
  };

  const isSendDisabled = disabled || sending || message.trim().length === 0;

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1.5,
    borderTopColor: theme.colors.border,
  };

  return (
    <View style={containerStyle}>
      <View style={{ flex: 1 }}>
        <Input
          value={message}
          onChangeText={setMessage}
          placeholder={placeholder}
          multiline
          maxLength={1000}
          editable={!disabled && !sending}
          style={{
            minHeight: 44,
            maxHeight: 100,
            paddingTop: theme.spacing[3],
            paddingBottom: theme.spacing[3],
          }}
          blurOnSubmit={false}
          returnKeyType="default"
        />
      </View>
      <Spacer size={2} horizontal />
      <Button
        label={sending ? '' : 'Gửi'}
        onPress={handleSend}
        disabled={isSendDisabled}
        loading={sending}
        size="md"
        variant="primary"
        style={{
          minWidth: 60,
          paddingHorizontal: theme.spacing[4],
        }}
        accessibilityLabel="Gửi tin nhắn"
      />
    </View>
  );
};
