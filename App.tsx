import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
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
import { initializeLanguage } from './src/services/language';

const AppContent = () => {
  const { initialized } = useAuthSession();

  useEffect(() => {
    // Initialize language from storage when app starts
    initializeLanguage();
  }, []);

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
