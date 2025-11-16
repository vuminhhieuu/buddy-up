import React, { useState } from 'react';
import { ProfileSetupStep1Screen } from './ProfileSetup/ProfileSetupStep1Screen';
import { ProfileSetupStep2Screen } from './ProfileSetup/ProfileSetupStep2Screen';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setProfileSetupInProgress } from '../store/slices/authSlice';

export const ProfileSetupScreen: React.FC = () => {
  const { currentProfileStep } = useAppSelector((s) => s.auth);
  const [step, setStep] = useState(currentProfileStep);
  const [step1Data, setStep1Data] = useState<any>(null);
  const dispatch = useAppDispatch();

  const handleNextFromStep1 = (data: any) => {
    setStep1Data(data);
    setStep(2);
  };

  const handleBackFromStep2 = () => {
    setStep(1);
  };

  const handleFinish = () => {
    console.log('Finishing profile setup with data:', step1Data);
    dispatch(setProfileSetupInProgress(false));
  };

  switch (step) {
    case 1:
      return <ProfileSetupStep1Screen onNext={handleNextFromStep1} onSkip={handleFinish} />;
    case 2:
      return <ProfileSetupStep2Screen onBack={handleBackFromStep2} onNext={handleFinish} />;
    default:
      return <ProfileSetupStep1Screen onNext={handleNextFromStep1} onSkip={handleFinish} />;
  }
};
