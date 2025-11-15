import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import profileSetupReducer from './slices/profileSetupSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profileSetup: profileSetupReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
