import React from 'react';
import type { ToastConfig, ToastConfigParams } from 'react-native-toast-message';
import { BuddyToast } from './BuddyToast';

const renderToast =
  (type: 'success' | 'error' | 'info') =>
  ({ text1, text2 }: ToastConfigParams<unknown>) => (
    <BuddyToast type={type} title={text1 ?? ''} description={text2} />
  );

export const buddyToastConfig: ToastConfig = {
  success: renderToast('success'),
  error: renderToast('error'),
  info: renderToast('info'),
};
