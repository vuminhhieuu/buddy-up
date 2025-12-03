import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { InvitationsList } from '../../components/invitations/InvitationsList/InvitationsList';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../styles';
import { Text } from '../../components/ui/Text/Text';
import { ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const NotificationsScreen: React.FC = () => {
  const { t } = useTranslation('invitations');
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
        <Pressable
          accessibilityRole="button"
          onPress={handleBack}
          style={{
            width: 35,
            height: 35,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.background,
            borderWidth: 1,
            borderColor: theme.colors.border,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          hitSlop={8}
        >
          <ArrowLeft size={18} color={theme.colors.text.primary} />
        </Pressable>
        <Text variant="h5" style={{ fontWeight: '700', flex: 1, textAlign: 'center' }}>
          {t('title')}
        </Text>
        {/* Right spacer to keep title centered */}
        <View style={{ width: 35, height: 35 }} />
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
