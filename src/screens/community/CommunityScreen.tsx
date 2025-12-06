import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenContainer, Text, Spacer } from '../../components/ui';
import { useTheme } from '../../styles';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/ui/Icon/Icon';

export const CommunityScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('common');

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Spacer size={8} />
        <View style={styles.content}>
          <Icon name="globe" size={64} color={theme.colors.primary[500]} />
          <Spacer size={4} />
          <Text variant="h1" style={styles.title}>
            {t('navigation.community')}
          </Text>
          <Spacer size={2} />
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Trang cộng đồng đang được phát triển
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
});
