import React, { useState } from 'react';
import { ProfileSetupStep1Screen } from './ProfileSetup/ProfileSetupStep1Screen';
import { ProfileSetupStep2Screen } from './ProfileSetup/ProfileSetupStep2Screen';
import { ProfileSetupStep3Screen } from './ProfileSetup/ProfileSetupStep3Screen';
import ProfileSetupStep4Screen from './ProfileSetup/ProfileSetupStep4Screen';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setProfileSetupInProgress, setProfileData } from '../../store/slices/authSlice';
import { logger } from '../../utils/logger';

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

  const handleNextFromStep2 = () => {
    setStep(3);
  };

  const handleFinish = () => {
    logger.debug('ProfileSetupScreen', 'Finishing profile setup with data:', step1Data);
    dispatch(setProfileSetupInProgress(false));
  };

  switch (step) {
    case 1:
      return <ProfileSetupStep1Screen onNext={handleNextFromStep1} onSkip={handleFinish} />;
    case 2:
      return <ProfileSetupStep2Screen onBack={handleBackFromStep2} onNext={handleNextFromStep2} />;
    case 3:
      return (
        <ProfileSetupStep3Screen
          onBack={() => setStep(2)}
          onNext={(selectedOptions?: string[]) => {
            if (selectedOptions) {
              dispatch(
                setProfileData({
                  categories: selectedOptions,
                }),
              );
            }
            setStep(4);
          }}
        />
      );
    case 4:
      return <ProfileSetupStep4Screen onBack={() => setStep(3)} />;
    default:
      return <ProfileSetupStep1Screen onNext={handleNextFromStep1} onSkip={handleFinish} />;
  }
};
