import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useInvitations } from '../../../hooks/useInvitations';
import Toast from 'react-native-toast-message';
import { useTranslation, Trans } from 'react-i18next';
import { useTheme } from '../../../styles';

export const InvitationsList: React.FC = () => {
  const { t } = useTranslation('invitations');
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const themedStyles = styles(theme);
  const { invitations, loading, acceptInvitation, declineInvitation, loadInvitations } =
    useInvitations();

  const handlePress = (invitation: any) => {
    navigation.navigate('SessionDetail', {
      sessionId: invitation.session_id,
      readOnly: true,
      fromNotification: true,
    });
  };

  const handleAccept = async (invitation: any) => {
    const ok = await acceptInvitation(invitation.session_id);
    if (ok) {
      Toast.show({ type: 'success', text1: t('accepted') });
      loadInvitations();
    }
  };

  const handleDecline = async (invitation: any) => {
    const ok = await declineInvitation(invitation.session_id);
    if (ok) {
      Toast.show({ type: 'info', text1: t('declined') });
      loadInvitations();
    }
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: theme.spacing[8] }} />;
  }

  if (!invitations.length) {
    return (
      <View style={themedStyles.emptyContainer}>
        <Text style={themedStyles.emptyText}>{t('noInvitations')}</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: theme.spacing[4] }}>
      {invitations.map((invitation) => (
        <Pressable
          key={invitation.session_id}
          style={themedStyles.card}
          onPress={() => handlePress(invitation)}
        >
          <View style={themedStyles.row}>
            <View style={themedStyles.avatarCircle}>
              {invitation.creator_avatar ? (
                <Image
                  source={{ uri: invitation.creator_avatar }}
                  style={themedStyles.avatarImg}
                  resizeMode="cover"
                />
              ) : (
                <Text style={themedStyles.avatarText}>
                  {invitation.creator_name?.charAt(0) || 'U'}
                </Text>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={themedStyles.inviteText} numberOfLines={2} ellipsizeMode="tail">
                <Trans
                  i18nKey="invitationText"
                  ns="invitations"
                  values={{ title: invitation.title, creatorName: invitation.creator_name }}
                  components={{
                    1: <Text style={themedStyles.bold} />,
                    3: <Text style={themedStyles.bold} />,
                  }}
                />
              </Text>
            </View>
          </View>
          <View style={themedStyles.actionsRow}>
            <Pressable style={themedStyles.acceptBtn} onPress={() => handleAccept(invitation)}>
              <Text style={themedStyles.acceptText}>{t('accept')}</Text>
            </Pressable>
            <Pressable style={themedStyles.declineBtn} onPress={() => handleDecline(invitation)}>
              <Text style={themedStyles.declineText}>{t('decline')}</Text>
            </Pressable>
          </View>
        </Pressable>
      ))}
    </View>
  );
};

const styles = (theme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    avatarImg: {
      width: theme.sizes.avatar.md,
      height: theme.sizes.avatar.md,
      borderRadius: theme.sizes.avatar.md / 2,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      marginBottom: theme.spacing[4],
      padding: theme.spacing[4],
      ...theme.shadows.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing[2],
    },
    avatarCircle: {
      width: theme.sizes.avatar.md,
      height: theme.sizes.avatar.md,
      borderRadius: theme.sizes.avatar.md / 2,
      backgroundColor: theme.colors.primary[500],
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing[3],
    },
    avatarText: {
      color: theme.colors.text.inverse,
      fontWeight: theme.typography.weights.bold,
      fontSize: theme.typography.scale.lg,
    },
    inviteText: {
      fontSize: theme.typography.scale.base,
      color: theme.colors.text.primary,
      flexShrink: 1,
      flexWrap: 'wrap',
    },
    bold: {
      fontWeight: theme.typography.weights.bold,
      color: theme.colors.text.primary,
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: theme.spacing[2],
    },
    acceptBtn: {
      backgroundColor: theme.colors.primary[500],
      borderRadius: theme.radius.sm,
      paddingVertical: theme.spacing[1] + 2,
      paddingHorizontal: theme.spacing[4],
      marginRight: theme.spacing[2],
    },
    acceptText: {
      color: theme.colors.text.inverse,
      fontWeight: theme.typography.weights.bold,
    },
    declineBtn: {
      backgroundColor: theme.colors.semantic.error,
      borderRadius: theme.radius.sm,
      paddingVertical: theme.spacing[1] + 2,
      paddingHorizontal: theme.spacing[4],
    },
    declineText: {
      color: theme.colors.text.inverse,
      fontWeight: theme.typography.weights.bold,
    },
    emptyContainer: {
      alignItems: 'center',
      marginTop: theme.spacing[12],
    },
    emptyText: {
      color: theme.colors.text.tertiary,
      fontSize: theme.typography.scale.lg,
    },
  });
