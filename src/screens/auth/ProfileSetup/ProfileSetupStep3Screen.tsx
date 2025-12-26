import React, { useMemo, useState } from 'react';
import {
  View,
  Pressable,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import {
  ScreenContainer,
  Text,
  ProfileSetupNextButton,
  Input,
  Button,
  ProfileSetupHeader,
} from '../../../components/ui';
import { useTheme } from '../../../styles';
import { X } from 'lucide-react-native';
import { Globe, Laptop, Pencil, BookOpen, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { saveStepForUser } from '../../../lib/supabaseHelpers';
import { setProfileData } from '../../../store/slices/authSlice';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { MIN_CATEGORIES } from '../../../constants/profileSetup';
import { BASE_HORIZONTAL_PADDING } from '../../../constants/layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ProfileSetupStep3ScreenProps = {
  onNext?: (selectedOptions?: string[]) => void;
  onBack?: () => void;
  onSkip?: () => void;
};

/**
 * Extracts and formats display name from a custom subject key
 * @param customKey - The custom subject key (e.g., 'custom_data_science')
 * @returns Formatted display name (e.g., 'Data Science')
 */
const formatCustomSubjectDisplayName = (customKey: string): string => {
  return customKey
    .replace(/^custom_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

/**
 * Normalizes a subject name to a key format
 * @param subjectName - The subject name to normalize
 * @returns Normalized key (e.g., 'data_science')
 */
const normalizeSubjectNameToKey = (subjectName: string): string => {
  return subjectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_') // Replace all whitespace with underscore
    .replace(/[^\w_]/g, ''); // Remove special characters
};

export const CATEGORY_GROUPS = [
  {
    key: 'language',
    titleKey: 'profileSetup.groupLanguage',
    icon: () => <Globe size={18} color="#3B82F6" />,
    options: [
      { key: 'english', labelKey: 'profileSetup.categoryEnglish' },
      { key: 'japanese', labelKey: 'profileSetup.categoryJapanese' },
      { key: 'korean', labelKey: 'profileSetup.categoryKorean' },
      { key: 'chinese', labelKey: 'profileSetup.categoryChinese' },
    ],
  },
  {
    key: 'programming',
    titleKey: 'profileSetup.groupProgramming',
    icon: () => <Laptop size={18} color="#3B82F6" />,
    options: [
      { key: 'javascript', labelKey: 'profileSetup.categoryJavaScript' },
      { key: 'python', labelKey: 'profileSetup.categoryPython' },
      { key: 'react', labelKey: 'profileSetup.categoryReact' },
      { key: 'nodejs', labelKey: 'profileSetup.categoryNodejs' },
      { key: 'java', labelKey: 'profileSetup.categoryJava' },
    ],
  },
  {
    key: 'exam',
    titleKey: 'profileSetup.groupExam',
    icon: () => <Pencil size={18} color="#3B82F6" />,
    options: [
      { key: 'toeic', labelKey: 'profileSetup.categoryTOEIC' },
      { key: 'ielts', labelKey: 'profileSetup.categoryIELTS' },
      { key: 'jlpt', labelKey: 'profileSetup.categoryJLPT' },
      { key: 'sat', labelKey: 'profileSetup.categorySAT' },
      { key: 'gre', labelKey: 'profileSetup.categoryGRE' },
    ],
  },
  {
    key: 'other',
    titleKey: 'profileSetup.groupOther',
    icon: () => <BookOpen size={18} color="#3B82F6" />,
    options: [
      { key: 'datascience', labelKey: 'profileSetup.categoryDataScience' },
      { key: 'uiux', labelKey: 'profileSetup.categoryUIUX' },
      { key: 'marketing', labelKey: 'profileSetup.categoryMarketing' },
      { key: 'math', labelKey: 'profileSetup.categoryMath' },
      { key: 'physics', labelKey: 'profileSetup.categoryPhysics' },
    ],
  },
];

const profileStep3Schema = Yup.object().shape({
  categories: Yup.array().of(Yup.string()),
});

export const ProfileSetupStep3Screen: React.FC<ProfileSetupStep3ScreenProps> = (props) => {
  const minSelect = MIN_CATEGORIES;
  const { onNext, onBack } = props;
  const { onSkip } = props;
  const dispatch = useAppDispatch();
  const { profileData, userId } = useAppSelector((s: any) => s.auth);
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [submitting, setSubmitting] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customSubjectInput, setCustomSubjectInput] = useState('');

  // Memoize predefined keys to avoid recomputation on every render
  const allPredefinedKeys = useMemo(
    () => CATEGORY_GROUPS.flatMap((g) => g.options.map((o) => o.key)),
    [],
  );

  const styles = useMemo(() => {
    return {
      header: {
        paddingHorizontal: 0,
        paddingVertical: theme.spacing[2],
      },
      groupTitle: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        marginBottom: theme.spacing[2],
        justifyContent: 'space-between' as const,
      },
      groupLeft: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
      },
      groupIcon: {
        marginRight: theme.spacing[2],
      },
      selectedCount: {
        paddingHorizontal: theme.spacing[2],
        paddingVertical: theme.spacing[1],
        borderRadius: theme.radius.md,
        backgroundColor: '#F3F4F6',
        marginLeft: theme.spacing[2],
      },
      selectedCountText: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.scale.sm,
      },
      tile: {
        paddingVertical: theme.spacing[3],
        paddingHorizontal: theme.spacing[2],
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.surface,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginBottom: theme.spacing[2],
      },
      tileActive: {
        borderColor: theme.colors.primary[500],
        backgroundColor: theme.colors.primary[50],
      },
      footer: {
        marginTop: theme.spacing[4],
      },
    };
  }, [theme]);

  return (
    <ScreenContainer scroll>
      <View style={{ flex: 1 }}>
        <ProfileSetupHeader
          step={3}
          progress={0.75}
          rightText={t('profileSetup.progress75')}
          onBack={onBack}
          showSkipButton={true}
          containerStyle={styles.header}
        />
        <View
          style={{
            flex: 1,
            paddingVertical: theme.spacing[4],
          }}
        >
          <Text variant="h5" style={{ fontWeight: '700', marginBottom: theme.spacing[2] }}>
            {t('profileSetup.step3Title')}
          </Text>
          <Text variant="body" color="tertiary" style={{ marginBottom: theme.spacing[4] }}>
            {t('profileSetup.step3Subtitle')}
          </Text>
          <Formik
            initialValues={{
              categories: Array.isArray(profileData.categories) ? profileData.categories : [],
            }}
            validationSchema={profileStep3Schema}
            onSubmit={async (values) => {
              setSubmitting(true);
              try {
                if (userId) {
                  await saveStepForUser(userId, { learning_interests: values.categories }, true);
                  dispatch(setProfileData({ categories: values.categories }));
                }
                onNext?.(values.categories);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ values, setFieldValue, handleSubmit, errors, touched }) => {
              const selectedCount = values.categories.length;
              // Separate custom subjects (those not in predefined options) from regular categories
              const customSubjects = values.categories.filter(
                (cat: string) => !allPredefinedKeys.includes(cat),
              );
              const regularCategories = values.categories.filter((cat: string) =>
                allPredefinedKeys.includes(cat),
              );

              const handleAddCustomSubject = () => {
                const trimmedInput = customSubjectInput.trim();
                if (!trimmedInput) return;

                // Validation: minimum length
                if (trimmedInput.length < 2) {
                  return;
                }

                // Validation: maximum length
                if (trimmedInput.length > 50) {
                  return;
                }

                // Normalize input to check for duplicates
                const normalizedKey = normalizeSubjectNameToKey(trimmedInput);
                const newCustomKey = `custom_${normalizedKey}`;

                // Validation: check for conflicts with predefined keys
                if (allPredefinedKeys.includes(normalizedKey)) {
                  return;
                }

                // Check for duplicate custom subjects by comparing normalized display names
                const existingCustomSubjects = customSubjects.map((key: string) =>
                  normalizeSubjectNameToKey(formatCustomSubjectDisplayName(key)),
                );
                if (existingCustomSubjects.includes(normalizedKey)) {
                  return;
                }

                // Check if exact key already exists
                if (!values.categories.includes(newCustomKey)) {
                  setFieldValue('categories', [...values.categories, newCustomKey]);
                }
                setCustomSubjectInput('');
                setShowCustomModal(false);
              };

              const handleRemoveCustomSubject = (customKey: string) => {
                setFieldValue(
                  'categories',
                  values.categories.filter((k: string) => k !== customKey),
                );
              };

              return (
                <>
                  {CATEGORY_GROUPS.map((group, groupIdx) => {
                    const chunkedOptions: Array<typeof group.options> = [];
                    let i = 0;
                    while (i < group.options.length) {
                      chunkedOptions.push(group.options.slice(i, i + 2));
                      i += 2;
                    }
                    const isOtherGroup = group.key === 'other';
                    return (
                      <View key={group.key} style={{ marginBottom: theme.spacing[4] }}>
                        <View style={styles.groupTitle}>
                          <View style={styles.groupLeft}>
                            <View style={styles.groupIcon}>{group.icon()}</View>
                            <Text variant="h6" style={{ fontWeight: '700' }}>
                              {t(group.titleKey)}
                            </Text>
                          </View>
                          {groupIdx === 0 && (
                            <View style={styles.selectedCount}>
                              <Text style={[styles.selectedCountText, { fontWeight: 'bold' }]}>
                                {t('profileSetup.selectedCountSimple', {
                                  count: selectedCount,
                                })}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={{ width: '100%', alignItems: 'stretch' }}>
                          {/* Display custom subjects first in "Other" group */}
                          {isOtherGroup && customSubjects.length > 0 && (
                            <View
                              style={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                gap: theme.spacing[2],
                                marginBottom: theme.spacing[2],
                              }}
                            >
                              {customSubjects.map((customKey: string) => {
                                const displayName = formatCustomSubjectDisplayName(customKey);
                                return (
                                  <View
                                    key={customKey}
                                    style={[
                                      styles.tile,
                                      styles.tileActive,
                                      {
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingRight: theme.spacing[2],
                                        flex: 1,
                                        minWidth: '48%',
                                        maxWidth: '48%',
                                      },
                                    ]}
                                  >
                                    <Text variant="body" style={{ fontWeight: '600', flex: 1 }}>
                                      {displayName}
                                    </Text>
                                    <Pressable
                                      accessibilityRole="button"
                                      accessibilityLabel={
                                        t('common.delete', { defaultValue: 'Delete' }) +
                                        ' ' +
                                        displayName
                                      }
                                      onPress={() => handleRemoveCustomSubject(customKey)}
                                      style={{
                                        padding: theme.spacing[1],
                                        marginLeft: theme.spacing[1],
                                      }}
                                    >
                                      <X size={16} color={theme.colors.text.primary} />
                                    </Pressable>
                                  </View>
                                );
                              })}
                            </View>
                          )}
                          {chunkedOptions.map((row, rowIdx) => (
                            <View
                              key={rowIdx}
                              style={{
                                flexDirection: 'row',
                                marginBottom: theme.spacing[2],
                                width: '100%',
                                justifyContent: row.length === 1 ? 'center' : 'flex-start',
                              }}
                            >
                              {row.length === 1 ? (
                                <Pressable
                                  key={row[0].key}
                                  onPress={() => {
                                    const opt = row[0];
                                    const active = values.categories.includes(opt.key);

                                    setFieldValue(
                                      'categories',
                                      active
                                        ? values.categories.filter((k: string) => k !== opt.key)
                                        : [...values.categories, opt.key],
                                    );
                                  }}
                                  style={[
                                    styles.tile,
                                    values.categories.includes(row[0].key) && styles.tileActive,
                                    { width: '50%' },
                                  ]}
                                >
                                  <Text variant="body" style={{ fontWeight: '600' }}>
                                    {t(row[0].labelKey)}
                                  </Text>
                                </Pressable>
                              ) : (
                                row.map((opt, colIdx) => {
                                  const active = values.categories.includes(opt.key);
                                  const tileStyle = [
                                    styles.tile,
                                    active && styles.tileActive,
                                    { flex: 1 },
                                    colIdx === 0 && row.length > 1
                                      ? { marginRight: theme.spacing[2] }
                                      : null,
                                  ];
                                  return (
                                    <Pressable
                                      key={opt.key}
                                      onPress={() => {
                                        const active = values.categories.includes(opt.key);
                                        setFieldValue(
                                          'categories',
                                          active
                                            ? values.categories.filter((k: string) => k !== opt.key)
                                            : [...values.categories, opt.key],
                                        );
                                      }}
                                      style={tileStyle}
                                    >
                                      <Text variant="body" style={{ fontWeight: '600' }}>
                                        {t(opt.labelKey)}
                                      </Text>
                                    </Pressable>
                                  );
                                })
                              )}
                            </View>
                          ))}
                          {/* Add custom subject button in "Other" group - always show at the end */}
                          {isOtherGroup && (
                            <View
                              style={{
                                flexDirection: 'row',
                                marginBottom: theme.spacing[2],
                                width: '100%',
                              }}
                            >
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={t('profileSetup.addCustomSubject')}
                                onPress={() => setShowCustomModal(true)}
                                style={[
                                  styles.tile,
                                  {
                                    flex: 1,
                                    borderStyle: 'dashed',
                                    borderWidth: 2,
                                    borderColor: theme.colors.primary[300],
                                    backgroundColor: theme.colors.primary[50],
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  },
                                ]}
                              >
                                <Plus size={18} color={theme.colors.primary[500]} />
                                <Text
                                  variant="body"
                                  style={{
                                    fontWeight: '600',
                                    marginLeft: theme.spacing[2],
                                    color: theme.colors.primary[600],
                                  }}
                                >
                                  {t('profileSetup.addCustomSubject')}
                                </Text>
                              </Pressable>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}

                  {touched.categories && errors.categories ? (
                    <Text variant="caption" color="error" style={{ marginTop: theme.spacing[1] }}>
                      {t(String(errors.categories))}
                    </Text>
                  ) : null}
                  <View style={styles.footer}>
                    <ProfileSetupNextButton
                      onPress={handleSubmit}
                      loading={submitting}
                      disabled={submitting || selectedCount < minSelect}
                      style={{
                        borderRadius: theme.radius.lg,
                      }}
                    />
                  </View>
                  {/* removed max-selected popup (no maximum) */}

                  {/* Custom Subject Modal */}
                  <Modal
                    visible={showCustomModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => {
                      setShowCustomModal(false);
                      setCustomSubjectInput('');
                    }}
                  >
                    <KeyboardAvoidingView
                      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                      style={{ flex: 1 }}
                      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom : 20}
                    >
                      <Pressable
                        style={{
                          flex: 1,
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          justifyContent: 'flex-end',
                        }}
                        onPress={() => {
                          setShowCustomModal(false);
                          setCustomSubjectInput('');
                        }}
                      >
                        <Pressable
                          style={{
                            backgroundColor: theme.colors.background,
                            borderTopLeftRadius: theme.radius.xl,
                            borderTopRightRadius: theme.radius.xl,
                            paddingTop: theme.spacing[3],
                            paddingBottom: Math.max(insets.bottom, theme.spacing[4]),
                            paddingHorizontal: BASE_HORIZONTAL_PADDING,
                            maxHeight: '90%',
                          }}
                          onPress={(e) => e.stopPropagation()}
                        >
                          {/* Pull Handle */}
                          <View
                            style={{
                              width: 40,
                              height: 4,
                              backgroundColor: theme.colors.border,
                              borderRadius: 2,
                              alignSelf: 'center',
                              marginBottom: theme.spacing[4],
                            }}
                          />

                          {/* Title */}
                          <Text
                            variant="h5"
                            style={{
                              fontWeight: '700',
                              marginBottom: theme.spacing[4],
                              textAlign: 'center',
                            }}
                          >
                            {t('profileSetup.addCustomSubject')}
                          </Text>

                          {/* Input */}
                          <View style={{ marginBottom: theme.spacing[4] }}>
                            <View
                              style={{
                                borderWidth: 1.5,
                                borderRadius: theme.radius.md,
                                backgroundColor: theme.colors.surface,
                                minHeight: 48,
                                borderColor: theme.colors.border,
                                paddingHorizontal: theme.spacing[4],
                                justifyContent: 'center',
                              }}
                            >
                              <TextInput
                                placeholder={t('profileSetup.customSubjectPlaceholder')}
                                value={customSubjectInput}
                                onChangeText={setCustomSubjectInput}
                                autoFocus
                                placeholderTextColor={theme.colors.text.tertiary}
                                style={{
                                  minHeight: 48,
                                  fontFamily: theme.typography.families.body,
                                  fontSize: theme.typography.scale.base,
                                  color: theme.colors.text.primary,
                                  paddingVertical: theme.spacing[2],
                                }}
                              />
                            </View>
                          </View>

                          {/* Buttons */}
                          <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
                            <Button
                              label={t('common.cancel')}
                              variant="outline"
                              onPress={() => {
                                setShowCustomModal(false);
                                setCustomSubjectInput('');
                              }}
                              style={{ flex: 1 }}
                            />
                            <Button
                              label={t('common.add')}
                              variant="primary"
                              onPress={handleAddCustomSubject}
                              disabled={!customSubjectInput.trim()}
                              style={{ flex: 1 }}
                            />
                          </View>
                        </Pressable>
                      </Pressable>
                    </KeyboardAvoidingView>
                  </Modal>
                </>
              );
            }}
          </Formik>
        </View>
      </View>
    </ScreenContainer>
  );
};

export default ProfileSetupStep3Screen;
