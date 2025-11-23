import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
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
import { useBuddyRequests } from './src/hooks/useBuddyRequests';
import { initializeLanguage } from './src/services/language';
import { buddyToastConfig } from './src/components/ui/BuddyToast/config';
import { TOAST_POSITION, TOAST_BOTTOM_OFFSET, TOAST_VISIBILITY_TIME } from './src/constants/toast';
import { useAppSelector } from './src/store/hooks';

const AppContent = () => {
  const { initialized } = useAuthSession();
  const userId = useAppSelector((state) => state.auth.userId);
  
  // Listen for incoming connection requests via Realtime
  useBuddyRequests(userId);

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
      <Toast
        config={buddyToastConfig}
        position={TOAST_POSITION}
        bottomOffset={TOAST_BOTTOM_OFFSET}
        visibilityTime={TOAST_VISIBILITY_TIME}
      />
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
