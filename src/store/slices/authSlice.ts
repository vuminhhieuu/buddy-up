import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  userId: string | null;
  email: string | null;
  loading: boolean;
  authStartScreen: 'Register' | 'Login';
}

const initialState: AuthState = {
  userId: null,
  email: null,
  loading: false,
  authStartScreen: 'Register',
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
  },
});

export const { setUser, setLoading, setAuthStartScreen, signOutState } = authSlice.actions;
export default authSlice.reducer;
