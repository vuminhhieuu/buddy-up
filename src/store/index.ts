import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import buddyReducer from './slices/buddySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    buddy: buddyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
