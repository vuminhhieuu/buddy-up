import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

const DayView: React.FC = () => {
  const { t } = useTranslation();
  return (
    <View>
      <Text>{t('day_calendar')}</Text>
    </View>
  );
};

export default DayView;
