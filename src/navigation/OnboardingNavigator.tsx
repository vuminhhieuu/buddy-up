import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { FeatureCarouselScreen } from '../screens/onboarding/FeatureCarouselScreen';

export type OnboardingStackParamList = {
  Welcome: undefined;
  FeatureCarousel: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

interface OnboardingNavigatorProps {
  onComplete: () => void;
}

export const OnboardingNavigator: React.FC<OnboardingNavigatorProps> = ({ onComplete }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="FeatureCarousel">
        {() => <FeatureCarouselScreen onComplete={onComplete} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
