import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../config/i18n';

const LANGUAGE_STORAGE_KEY = '@buddy_up:language';

export type SupportedLanguage = 'vi' | 'en';

/**
 * Lấy ngôn ngữ đã lưu từ AsyncStorage
 * @returns Ngôn ngữ đã lưu hoặc null nếu chưa có
 */
export async function getStoredLanguage(): Promise<SupportedLanguage | null> {
  try {
    const language = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return language as SupportedLanguage | null;
  } catch (error) {
    console.error('Error getting stored language:', error);
    return null;
  }
}

/**
 * Lưu ngôn ngữ vào AsyncStorage và thay đổi ngôn ngữ trong i18n
 * @param language
 */
export async function saveLanguage(language: SupportedLanguage): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error('Error saving language:', error);
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
    console.error('Error initializing language:', error);
  }
}
