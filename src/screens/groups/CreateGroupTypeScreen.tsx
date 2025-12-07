import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { ScreenContainer, Text, Spacer, Button } from '../../components/ui';
import { BackButton } from '../../components/navigation';
import { useTheme } from '../../styles';
import { GroupTypeCard } from '../../components/groups/GroupTypeCard';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateGroupType'>;

export const CreateGroupTypeScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation('groups');
  const navigation = useNavigation<NavigationProp>();
  const [selectedType, setSelectedType] = useState<'public' | 'private' | null>(null);

  const styles = {
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 0,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center' as const,
      fontWeight: '700' as const,
    },
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleContinue = () => {
    if (selectedType === 'public') {
      navigation.navigate('CreatePublicGroup', { step: 1 });
    } else if (selectedType === 'private') {
      // TODO: Navigate to CreatePrivateGroupScreen when ready
    }
  };

  return (
    <ScreenContainer scroll={false} contentContainerStyle={{ paddingTop: 0 }}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={handleBack} />
          <Text variant="h4" style={styles.headerTitle}>
            {t('createGroup')}
          </Text>
          {/* Right spacer to keep title centered */}
          <View style={{ width: 44, height: 44 }} />
        </View>

        <Spacer size={4} />

        {/* Content */}
        <ScrollView
          style={{
            flex: 1,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Question */}
          <Text
            variant="h6"
            style={{
              fontWeight: '600' as const,
              textAlign: 'center',
              marginBottom: theme.spacing[2],
            }}
          >
            {t('chooseGroupTypeQuestion')}
          </Text>
          <Spacer size={4} />

          {/* Group Type Cards */}
          <View style={{ gap: theme.spacing[4], marginBottom: theme.spacing[6] }}>
            <GroupTypeCard
              type="public"
              selected={selectedType === 'public'}
              onPress={() => setSelectedType('public')}
              title={t('publicGroup') || 'Nhóm công khai'}
              description={t('publicGroupDescription') || ''}
              features={[
                t('publicGroupFeatures.appearsInSearch') || '',
                t('publicGroupFeatures.everyoneCanJoin') || '',
                t('publicGroupFeatures.buildCommunity') || '',
              ].filter(Boolean)}
            />

            <GroupTypeCard
              type="private"
              selected={selectedType === 'private'}
              onPress={() => setSelectedType('private')}
              title={t('privateGroup') || 'Nhóm riêng tư'}
              description={t('privateGroupDescription') || ''}
              features={[
                t('privateGroupFeatures.invitationOnly') || '',
                t('privateGroupFeatures.memberControl') || '',
                t('privateGroupFeatures.privacySecurity') || '',
              ].filter(Boolean)}
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View
          style={{
            paddingVertical: theme.spacing[4],
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}
        >
          <Button label={t('continue')} onPress={handleContinue} disabled={!selectedType} />
        </View>
      </View>
    </ScreenContainer>
  );
};
