import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

const SessionListView: React.FC = () => {
  const { t } = useTranslation('session');
  return (
    <View>
      <Text>{t('listTitle')}</Text>
    </View>
  );
};

export default SessionListView;
