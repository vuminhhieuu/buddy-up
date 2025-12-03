import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/ui';
import { Text } from '../../components/ui/Text/Text';
import { BackButton } from '../../components/navigation/BackButton';
import { InvitationsList } from '../../components/invitations/InvitationsList/InvitationsList';
import type { SessionInvitation } from '../../services/invitations';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../styles';
import { useInvitations } from '../../hooks/useInvitations';

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { loadInvitations } = useInvitations();

  useFocusEffect(
    React.useCallback(() => {
      void loadInvitations();
    }, [loadInvitations]),
  );

  const handleInvitationPress = (invitation: SessionInvitation) => {
    const parent = (navigation as any).getParent?.();
    if (parent) {
      parent.navigate('SessionDetail', { sessionId: invitation.session_id, readOnly: true });
      return;
    }
    (navigation as any).navigate('SessionDetail', {
      sessionId: invitation.session_id,
      readOnly: true,
    });
  };

  return (
    <ScreenContainer style={styles.container}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <BackButton
          onPress={() => navigation.goBack()}
          style={{
            width: 35,
            height: 35,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.background,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        />
        <Text variant="h5" style={styles.title}>
          Thông báo
        </Text>
        <View style={{ width: 35 }} />
      </View>
      <InvitationsList onInvitationPress={handleInvitationPress} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
});
