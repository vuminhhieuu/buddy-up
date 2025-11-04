import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  userId: string | null;
  email: string | null;
  loading: boolean;
}

const initialState: AuthState = {
  userId: null,
  email: null,
  loading: false,
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
    signOutState(state) {
      state.userId = null;
      state.email = null;
    },
  },
});

export const { setUser, setLoading, signOutState } = authSlice.actions;
export default authSlice.reducer;


