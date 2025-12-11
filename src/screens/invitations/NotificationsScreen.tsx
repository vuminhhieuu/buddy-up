import React from 'react';
import { View, StyleSheet } from 'react-native';
import { InvitationsList } from '../../components/invitations/InvitationsList/InvitationsList';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../styles';
import { Text } from '../../components/ui/Text/Text';
import { BackButton } from '../../components/navigation/BackButton';
import { useTranslation } from 'react-i18next';

const NotificationsScreen: React.FC = () => {
  const { t } = useTranslation('common');
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const themedStyles = styles(theme);

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={themedStyles.container}>
      <View style={[themedStyles.header, { paddingTop: insets.top + 8 }]}>
        <BackButton
          onPress={handleBack}
          accessibilityLabel={t('common.back')}
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            backgroundColor: theme.colors.background,
            borderWidth: 1,
            borderColor: theme.colors.border,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 0,
            shadowOpacity: 0,
          }}
        />
        <Text variant="h5" style={{ fontWeight: '700', flex: 1, textAlign: 'center' }}>
          {t('common.notifications')}
        </Text>
        {/* Right spacer to keep title centered */}
        <View style={{ width: 40, height: 40 }} />
      </View>
      <InvitationsList />
    </View>
  );
};

const styles = (theme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      shadowColor: theme.colors.text.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 3,
    },
  });

export default NotificationsScreen;
