import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../styles';
import { Text, Spacer } from '../../components/ui';
import { Button } from '../../components/ui/Button/Button';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CheckCircle2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateGroupSuccess'>;
type RouteProp = {
  params: {
    groupId: string;
    groupName: string;
  };
};

export const CreateGroupSuccessScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('groups');
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { groupId, groupName } = route.params;

  const handleGoToGroup = () => {
    // TODO: Navigate to group detail screen when ready
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'Community' } }],
    });
  };

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <CheckCircle2 size={80} color={theme.colors.semantic.success} />
        <Spacer size={4} />
        <Text variant="h3" style={styles.title}>
          {t('success.groupCreated')}
        </Text>
        <Spacer size={2} />
        <Text variant="body" color="secondary" style={styles.description}>
          {t('success.groupCreatedDescription')}
        </Text>
        {groupName && (
          <>
            <Spacer size={4} />
            <View
              style={[
                styles.groupNameContainer,
                {
                  backgroundColor: theme.colors.primary[50],
                  borderColor: theme.colors.primary[200],
                },
              ]}
            >
              <Text
                variant="h6"
                style={{ fontWeight: '600' as const, color: theme.colors.primary[700] }}
              >
                {groupName}
              </Text>
            </View>
          </>
        )}
        <Spacer size={8} />
        <View style={styles.buttonContainer}>
          <Button label={t('viewGroup')} onPress={handleGoToGroup} style={styles.button} />
          <Spacer size={3} />
          <Button
            label={t('goHome')}
            variant="outline"
            onPress={handleGoHome}
            style={styles.button}
          />
        </View>
      </View>
    </View>
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
    fontWeight: '700',
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
  },
  groupNameContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    width: '100%',
  },
});
