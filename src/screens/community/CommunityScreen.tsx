import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer, Text, Spacer, Button } from '../../components/ui';
import { useTheme } from '../../styles';
import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/ui/Icon/Icon';
import type { NavigationProp } from '@react-navigation/native';
import type { MainTabParamList } from '../../navigation/MainTabsNavigator';
import { logger } from '../../utils/logger';

export const CommunityScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('common');
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();

  const handleCreateGroup = () => {
    const parent = (navigation as any).getParent?.();
    if (parent) {
      parent.navigate('CreateGroupType');
    } else {
      logger.debug('CommunityScreen', 'Create group pressed - no parent navigator');
    }
  };

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
            {t('community.underDevelopment', { ns: 'common' })}
          </Text>
          <Spacer size={6} />
          <Button
            label={t('groups:createGroup')}
            onPress={handleCreateGroup}
            style={{
              minWidth: 200,
            }}
          />
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
