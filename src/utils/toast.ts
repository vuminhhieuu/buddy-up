import Toast from 'react-native-toast-message';
import { TOAST_POSITION, TOAST_BOTTOM_OFFSET, TOAST_VISIBILITY_TIME } from '../constants/toast';

type ToastType = 'success' | 'error' | 'info';

type ShowToastParams = {
  type?: ToastType;
  message: string;
  description?: string;
};

export const showToast = ({ type = 'info', message, description }: ShowToastParams) => {
  Toast.show({
    type,
    text1: message,
    text2: description,
    position: TOAST_POSITION,
    bottomOffset: TOAST_BOTTOM_OFFSET,
    visibilityTime: TOAST_VISIBILITY_TIME,
  });
};

export const showSuccessToast = (message: string, description?: string) =>
  showToast({ type: 'success', message, description });

export const showErrorToast = (message: string, description?: string) =>
  showToast({ type: 'error', message, description });

export const showInfoToast = (message: string, description?: string) =>
  showToast({ type: 'info', message, description });
