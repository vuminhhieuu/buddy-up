import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Step1BasicInfoScreen, Step2TopicsScreen } from './steps';
import type { Step1BasicInfoData, Step2TopicsData } from './steps';

export type CreatePublicGroupScreenProps = {
  step?: number;
};

export const CreatePublicGroupScreen: React.FC<CreatePublicGroupScreenProps> = ({ step = 1 }) => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(step);
  const [step1Data, setStep1Data] = useState<Step1BasicInfoData | null>(null);
  const [step2Data, setStep2Data] = useState<Step2TopicsData | null>(null);

  const handleStep1Next = (data: Step1BasicInfoData) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  const handleStep1Back = () => {
    navigation.goBack();
  };

  const handleStep2Next = (data: Step2TopicsData) => {
    setStep2Data(data);
    setCurrentStep(3);
    // TODO: Navigate to Step 3 when ready
  };

  const handleStep2Back = () => {
    setCurrentStep(1);
  };

  switch (currentStep) {
    case 1:
      return (
        <Step1BasicInfoScreen
          initialData={step1Data || undefined}
          onNext={handleStep1Next}
          onBack={handleStep1Back}
        />
      );
    case 2:
      return (
        <Step2TopicsScreen
          initialData={step2Data || undefined}
          onNext={handleStep2Next}
          onBack={handleStep2Back}
        />
      );
    default:
      return (
        <Step1BasicInfoScreen
          initialData={step1Data || undefined}
          onNext={handleStep1Next}
          onBack={handleStep1Back}
        />
      );
  }
};
