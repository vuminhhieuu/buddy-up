import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import './src/config/i18n';
import { useTranslation } from 'react-i18next';

export default function App() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text>{t('welcome')}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
