import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './src/config/i18n';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { Provider } from 'react-redux';
import { ThemeProvider } from './src/styles';
import { AppNavigator } from './src/navigation/AppNavigator';
import { store } from './src/store';
import { useAuthSession } from './src/hooks/useAuthSession';

const AppContent = () => {
  const { initialized } = useAuthSession();

  if (!initialized) {
    return (
      <SafeAreaProvider>
        <ActivityIndicator />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <SafeAreaProvider>
        <ActivityIndicator />
      </SafeAreaProvider>
    );
  }

  return (
    <Provider store={store}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
}
