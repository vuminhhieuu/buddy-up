import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ProfileSetupData {
  displayName?: string;
  studyGoal?: string;
  avatarUrl?: string;
  // Step 2 fields
  availableTimes?: string[]; // e.g., ['morning','noon','evening','weekend','flexible']
  learningStyle?: 'serious' | 'relaxed' | 'balanced';
}

export interface AuthState {
  userId: string | null;
  email: string | null;
  displayName?: string;
  loading: boolean;
  authStartScreen: 'Register' | 'Login';
  isRegistering: boolean;
  profileSetupInProgress: boolean;
  currentProfileStep: number;
  profileData: ProfileSetupData;
}

const initialState: AuthState = {
  userId: null,
  email: null,
  displayName: undefined,
  loading: false,
  authStartScreen: 'Register',
  isRegistering: false,
  profileSetupInProgress: false,
  currentProfileStep: 1,
  profileData: {},
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<{ userId: string; email: string | null } | null>) {
      state.userId = action.payload?.userId ?? null;
      state.email = action.payload?.email ?? null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setAuthStartScreen(state, action: PayloadAction<'Register' | 'Login'>) {
      state.authStartScreen = action.payload;
    },
    signOutState(state) {
      state.userId = null;
      state.email = null;
      state.authStartScreen = 'Register';
    },
    setIsRegistering(state, action: PayloadAction<boolean>) {
      state.isRegistering = action.payload;
    },
    setProfileSetupInProgress(state, action: PayloadAction<boolean>) {
      state.profileSetupInProgress = action.payload;
    },
    setCurrentProfileStep(state, action: PayloadAction<number>) {
      state.currentProfileStep = action.payload;
    },
    setProfileData(state, action: PayloadAction<ProfileSetupData>) {
      state.profileData = { ...state.profileData, ...action.payload };
    },
    resetProfileSetup(state) {
      state.profileSetupInProgress = false;
      state.currentProfileStep = 1;
      state.profileData = {};
    },
  },
});

export const {
  setUser,
  setLoading,
  setAuthStartScreen,
  signOutState,
  setIsRegistering,
  setProfileSetupInProgress,
  setCurrentProfileStep,
  setProfileData,
  resetProfileSetup,
} = authSlice.actions;
export default authSlice.reducer;
