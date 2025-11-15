import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  userId: string | null;
  email: string | null;
  displayName: string | null;
  loading: boolean;
  authStartScreen: 'Register' | 'Login';
  isRegistering: boolean;
}

const initialState: AuthState = {
  userId: null,
  email: null,
  displayName: null,
  loading: false,
  authStartScreen: 'Register',
  isRegistering: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(
      state,
      action: PayloadAction<{
        userId: string;
        email: string | null;
        displayName?: string | null;
      } | null>,
    ) {
      state.userId = action.payload?.userId ?? null;
      state.email = action.payload?.email ?? null;
      state.displayName = action.payload?.displayName ?? null;
    },
    setUserDisplayName(state, action: PayloadAction<string | null>) {
      state.displayName = action.payload;
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
      state.displayName = null;
      state.authStartScreen = 'Register';
    },
    setIsRegistering(state, action: PayloadAction<boolean>) {
      state.isRegistering = action.payload;
    },
  },
});

export const {
  setUser,
  setLoading,
  setAuthStartScreen,
  signOutState,
  setIsRegistering,
  setUserDisplayName,
} = authSlice.actions;
export default authSlice.reducer;
