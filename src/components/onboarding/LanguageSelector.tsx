import React, { useState, useEffect, useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../styles';
import { saveLanguage, getStoredLanguage, type SupportedLanguage } from '../../services/language';
import { VietnamFlagIcon, UnitedStatesFlagIcon, type FlagIconProps } from '../icons/flags';
import { showErrorToast } from '../../utils/toast';
import { logger } from '../../utils/logger';

type FlagComponent = React.FC<FlagIconProps>;

const LANGUAGE_CONFIGS: Array<{
  code: SupportedLanguage;
  Flag: FlagComponent;
  labelKey: string;
}> = [
  { code: 'vi', Flag: VietnamFlagIcon, labelKey: 'languageScreen.languages.vi' },
  { code: 'en', Flag: UnitedStatesFlagIcon, labelKey: 'languageScreen.languages.en' },
];

export const LanguageSelector: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('vi');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const stored = await getStoredLanguage();
        const lang = (stored || i18n.language || 'vi') as SupportedLanguage;
        setCurrentLanguage(lang);
      } catch (err) {
        logger.error('LanguageSelector', 'Error loading stored language', err);
        showErrorToast(t('languageScreen.errors.loadLanguageFailed'));
      }
    };
    loadLanguage();
  }, [i18n.language, t]);

  const currentConfig = useMemo(
    () => LANGUAGE_CONFIGS.find((config) => config.code === currentLanguage) || LANGUAGE_CONFIGS[0],
    [currentLanguage],
  );

  const handleLanguageChange = async (language: SupportedLanguage) => {
    try {
      await saveLanguage(language);
      setCurrentLanguage(language);
      setModalVisible(false);
    } catch (err) {
      logger.error('LanguageSelector', 'Error changing language', err);
      showErrorToast(t('languageScreen.errors.languageChangeFailed'));
    }
  };

  const CurrentFlag = currentConfig.Flag;

  return (
    <>
      {/* Language Button */}
      <TouchableOpacity
        style={[styles.languageButton, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}
        onPress={() => setModalVisible(true)}
        accessibilityLabel={t('languageScreen.selectLanguage')}
        accessibilityRole="button"
        accessibilityHint={t('languageScreen.openSelectorHint', {
          defaultValue: 'Open language selector',
        })}
      >
        <CurrentFlag width={24} height={24} />
      </TouchableOpacity>

      {/* Language Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.background,
                shadowColor: theme.colors.text.primary,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <Text
              style={[
                styles.modalTitle,
                {
                  fontFamily: theme.typography.families.display,
                  color: theme.colors.text.primary,
                },
              ]}
            >
              {t('languageScreen.selectLanguage')}
            </Text>

            <FlatList
              data={LANGUAGE_CONFIGS}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => {
                const Flag = item.Flag;
                const isSelected = item.code === currentLanguage;

                return (
                  <TouchableOpacity
                    style={[
                      styles.languageOption,
                      {
                        backgroundColor: isSelected ? theme.colors.primary[50] : 'transparent',
                        borderColor: isSelected
                          ? theme.colors.primary[500]
                          : theme.colors.neutral[200],
                      },
                    ]}
                    onPress={() => handleLanguageChange(item.code)}
                    accessibilityRole="button"
                    accessibilityLabel={t('languageScreen.chooseLanguage', {
                      language: t(item.labelKey),
                    })}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Flag width={32} height={32} />
                    <Text
                      style={[
                        styles.languageLabel,
                        {
                          fontFamily: theme.typography.families.body,
                          color: theme.colors.text.primary,
                          fontWeight: isSelected ? '600' : '400',
                        },
                      ]}
                    >
                      {t(item.labelKey)}
                    </Text>
                    {isSelected && (
                      <Text style={[styles.checkmark, { color: theme.colors.primary[500] }]}>
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.colors.neutral[100] }]}
              onPress={() => setModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              accessibilityHint={t('languageScreen.closeSelectorHint', {
                defaultValue: 'Close language selector',
              })}
            >
              <Text
                style={[
                  styles.closeButtonText,
                  {
                    fontFamily: theme.typography.families.body,
                    color: theme.colors.text.primary,
                  },
                ]}
              >
                {t('common.back')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  languageButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  languageLabel: {
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
