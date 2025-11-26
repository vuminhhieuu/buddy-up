declare module 'react-native-confetti-cannon' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';

  export interface ConfettiCannonProps extends ViewProps {
    count?: number;
    origin?: { x: number; y: number };
    autoStart?: boolean;
    fadeOut?: boolean;
    explosionSpeed?: number;
    fallSpeed?: number;
    colors?: string[];
    onAnimationEnd?: () => void;
  }

  export default class ConfettiCannon extends Component<ConfettiCannonProps> {}
}

declare module 'expo-haptics';
