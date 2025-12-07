import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  Step1BasicInfoScreen,
  Step2TopicsScreen,
  Step3RulesScreen,
  Step4PreviewScreen,
} from './steps';
import type { Step1BasicInfoData, Step2TopicsData, Step3RulesData } from './steps';

export type CreatePublicGroupScreenProps = {
  step?: number;
};

export const CreatePublicGroupScreen: React.FC<CreatePublicGroupScreenProps> = ({ step = 1 }) => {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(step);
  const [step1Data, setStep1Data] = useState<Step1BasicInfoData | null>(null);
  const [step2Data, setStep2Data] = useState<Step2TopicsData | null>(null);
  const [step3Data, setStep3Data] = useState<Step3RulesData | null>(null);

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
  };

  const handleStep2Back = () => {
    setCurrentStep(1);
  };

  const handleStep3Next = (data: Step3RulesData) => {
    setStep3Data(data);
    setCurrentStep(4);
  };

  const handleStep3Back = () => {
    setCurrentStep(2);
  };

  const handleStep4Back = () => {
    setCurrentStep(3);
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
    case 3:
      return (
        <Step3RulesScreen
          initialData={step3Data || undefined}
          groupName={step1Data?.name}
          onNext={handleStep3Next}
          onBack={handleStep3Back}
        />
      );
    case 4:
      if (!step1Data || !step2Data || !step3Data) {
        // Fallback to step 1 if data is missing
        return (
          <Step1BasicInfoScreen
            initialData={step1Data || undefined}
            onNext={handleStep1Next}
            onBack={handleStep1Back}
          />
        );
      }
      return (
        <Step4PreviewScreen
          step1Data={step1Data}
          step2Data={step2Data}
          step3Data={step3Data}
          onBack={handleStep4Back}
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
