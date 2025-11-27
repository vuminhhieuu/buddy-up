import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../config/i18n';
import { logger } from '../utils/logger';
import { STORAGE_KEYS } from '../constants/storage';

export type SupportedLanguage = 'vi' | 'en';

/**
 * Lấy ngôn ngữ đã lưu từ AsyncStorage
 * @returns Ngôn ngữ đã lưu hoặc null nếu chưa có
 */
export async function getStoredLanguage(): Promise<SupportedLanguage | null> {
  try {
    const language = await AsyncStorage.getItem(STORAGE_KEYS.language);
    return language as SupportedLanguage | null;
  } catch (error) {
    logger.error('getStoredLanguage', 'Error getting stored language:', error);
    return null;
  }
}

/**
 * Lưu ngôn ngữ vào AsyncStorage và thay đổi ngôn ngữ trong i18n
 * @param language
 */
export async function saveLanguage(language: SupportedLanguage): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.language, language);
    await i18n.changeLanguage(language);
  } catch (error) {
    logger.error('saveLanguage', 'Error saving language:', error);
    throw error;
  }
}

/**
 * Khởi tạo ngôn ngữ từ AsyncStorage khi app khởi động
 */
export async function initializeLanguage(): Promise<void> {
  try {
    const storedLanguage = await getStoredLanguage();
    if (storedLanguage) {
      await i18n.changeLanguage(storedLanguage);
    }
  } catch (error) {
    logger.error('initializeLanguage', 'Error initializing language:', error);
  }
}
