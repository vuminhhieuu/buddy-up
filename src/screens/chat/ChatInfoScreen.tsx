import React, { useMemo } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View, Switch, Pressable } from 'react-native';
import { ScreenContainer, Text, Avatar, Spacer, Icon, Button } from '../../components/ui';
import type { ChatStackParamList } from '../../navigation/ChatStackNavigator';
import { useTheme } from '../../styles';
import { useTranslation } from 'react-i18next';

type ChatInfoRoute = {
  key: string;
  name: 'ChatInfo';
  params: ChatStackParamList['ChatInfo'];
};

export const ChatInfoScreen: React.FC = () => {
  const route = useRoute<ChatInfoRoute>();
  const navigation = useNavigation<NativeStackNavigationProp<ChatStackParamList>>();
  const { theme } = useTheme();
  const { t } = useTranslation('chat');

  const participantName = route.params?.participantName || 'Buddy';
  const avatar = route.params?.avatar || undefined;
  const tags = route.params?.tags || ['React Native', 'Node.js', 'TypeScript'];

  const stats = useMemo(
    () => [
      { label: t('chatInfo.stats.sessions'), value: '24' },
      { label: t('chatInfo.stats.hours'), value: '18' },
      { label: t('chatInfo.stats.rating'), value: '4.9' },
    ],
    [t],
  );

  const quickActions = useMemo(
    () => [
      { icon: 'phone', label: t('chatInfo.quickActions.call') },
      { icon: 'video', label: t('chatInfo.quickActions.video') },
      { icon: 'calendar', label: t('chatInfo.quickActions.schedule') },
      { icon: 'profile', label: t('chatInfo.quickActions.profile') },
    ],
    [t],
  );

  const conversationMenu = useMemo(
    () => [
      t('chatInfo.conversation.pin'),
      t('chatInfo.conversation.archive'),
      t('chatInfo.conversation.deleteHistory'),
    ],
    [t],
  );

  const privacyMenu = useMemo(
    () => [t('chatInfo.privacy.block'), t('chatInfo.privacy.report')],
    [t],
  );

  return (
    <ScreenContainer
      scroll
      contentContainerStyle={{ paddingBottom: theme.spacing[16], gap: theme.spacing[5] }}
    >
      <Pressable onPress={() => navigation.goBack()} style={{ marginBottom: theme.spacing[4] }}>
        <Text variant="h5">
          {'←'} {t('chatInfo.back')}
        </Text>
      </Pressable>
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          padding: theme.spacing[5],
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Avatar size="xl" name={participantName} uri={avatar} />
          <Spacer size={3} />
          <Text variant="h4">{participantName}</Text>
          <Spacer size={1} />
          <Text variant="bodySmall" color="success">
            ● {t('statusOnline')}
          </Text>
          <Spacer size={3} />
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: theme.spacing[2],
              justifyContent: 'center',
            }}
          >
            {tags?.map((tag) => (
              <View
                key={tag}
                style={{
                  backgroundColor: theme.colors.primary[50],
                  borderRadius: theme.radius.full,
                  paddingHorizontal: theme.spacing[3],
                  paddingVertical: theme.spacing[1],
                }}
              >
                <Text variant="caption" color="secondary">
                  {tag}
                </Text>
              </View>
            ))}
          </View>
          <Spacer size={3} />
          <Text variant="bodySmall" color="warning">
            {t('chatInfo.streak', { days: 15 })}
          </Text>
        </View>
      </View>

      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing[3] }}
      >
        {stats.map((stat) => (
          <View
            key={stat.label}
            style={{
              flex: 1,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.lg,
              padding: theme.spacing[4],
              alignItems: 'center',
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Text variant="h4">{stat.value}</Text>
            <Text variant="bodySmall" color="secondary">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: theme.spacing[3],
        }}
      >
        {quickActions.map((action) => (
          <Pressable
            key={action.label}
            style={{
              flex: 1,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.lg,
              paddingVertical: theme.spacing[4],
              alignItems: 'center',
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Icon name={action.icon as any} color={theme.colors.primary[500]} />
            <Spacer size={2} />
            <Text variant="caption" color="secondary">
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          padding: theme.spacing[5],
          borderWidth: 1,
          borderColor: theme.colors.border,
          gap: theme.spacing[4],
        }}
      >
        <Text variant="h5">{t('chatInfo.notifications.title')}</Text>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text>{t('chatInfo.notifications.toggle')}</Text>
          <Switch value onValueChange={() => {}} />
        </View>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text>{t('chatInfo.notifications.sound')}</Text>
          <View
            style={{
              height: 4,
              backgroundColor: theme.colors.primary[200],
              flex: 1,
              marginHorizontal: theme.spacing[3],
              borderRadius: theme.radius.full,
            }}
          >
            <View
              style={{
                height: 4,
                width: '70%',
                backgroundColor: theme.colors.primary[500],
                borderRadius: theme.radius.full,
              }}
            />
          </View>
        </View>
      </View>

      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          padding: theme.spacing[5],
          borderWidth: 1,
          borderColor: theme.colors.border,
          gap: theme.spacing[4],
        }}
      >
        <Text variant="h5">{t('chatInfo.conversation.title')}</Text>
        {conversationMenu.map((item) => (
          <View
            key={item}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text>{item}</Text>
            <Icon name="chevronRight" />
          </View>
        ))}
      </View>

      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          padding: theme.spacing[5],
          borderWidth: 1,
          borderColor: theme.colors.border,
          gap: theme.spacing[4],
        }}
      >
        <Text variant="h5">{t('chatInfo.privacy.title')}</Text>
        {privacyMenu.map((item) => (
          <View
            key={item}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text color="error">{item}</Text>
            <Icon name="chevronRight" color={theme.colors.semantic.error} />
          </View>
        ))}
      </View>

      <Button label={t('chatInfo.leaveChat')} variant="secondary" onPress={() => {}} />
    </ScreenContainer>
  );
};
