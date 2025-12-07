import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

const WeekView: React.FC = () => {
  const { t } = useTranslation('common');
  return (
    <View>
      <Text>{t('week_schedule')}</Text>
    </View>
  );
};

export default WeekView;
