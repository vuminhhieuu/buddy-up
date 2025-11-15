import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Step1Data {
  displayName: string;
  avatarUri: string | null;
  primaryGoal: string;
}

export interface ProfileSetupState {
  step1Data: Step1Data | null;
  profile_setup_completed: boolean;
  isSubmitting: boolean;
  error: string | null;
}

const initialState: ProfileSetupState = {
  step1Data: null,
  profile_setup_completed: false,
  isSubmitting: false,
  error: null,
};

const profileSetupSlice = createSlice({
  name: 'profileSetup',
  initialState,
  reducers: {
    initializeStep1(state, action: PayloadAction<{ displayName: string | null }>) {
      state.step1Data = {
        displayName: action.payload.displayName || '',
        avatarUri: null,
        primaryGoal: '',
      };
    },
    updateStep1(state, action: PayloadAction<Partial<Step1Data>>) {
      if (state.step1Data) {
        state.step1Data = { ...state.step1Data, ...action.payload };
      }
    },
    setProfileSetupCompleted(state, action: PayloadAction<boolean>) {
      state.profile_setup_completed = action.payload;
    },
    setSubmitting(state, action: PayloadAction<boolean>) {
      state.isSubmitting = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    resetProfileSetup(state) {
      state.step1Data = null;
      state.profile_setup_completed = false;
      state.isSubmitting = false;
      state.error = null;
    },
  },
});

export const {
  initializeStep1,
  updateStep1,
  setProfileSetupCompleted,
  setSubmitting,
  setError,
  resetProfileSetup,
} = profileSetupSlice.actions;

export default profileSetupSlice.reducer;
