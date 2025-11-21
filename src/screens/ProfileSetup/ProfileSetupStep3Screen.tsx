import React, { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { ScreenContainer, Text, Button } from '../../components/ui';
import { ProcessHeader } from '../../components/ui';
import { useTheme } from '../../styles';
import { ArrowLeft } from 'lucide-react-native';
import { Globe, Laptop, Pencil, BookOpen } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAppSelector } from '../../store/hooks';
import { MIN_CATEGORIES } from '../../constants/profileSetup';

export type ProfileSetupStep3ScreenProps = {
  onNext?: (selectedOptions?: string[]) => void;
  onBack?: () => void;
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
  categories: Yup.array()
    .of(Yup.string())
    .min(MIN_CATEGORIES, 'profileSetup.categoriesRequired')
    .required('profileSetup.categoriesRequired'),
});

export const ProfileSetupStep3Screen: React.FC<ProfileSetupStep3ScreenProps> = (props) => {
  const minSelect = MIN_CATEGORIES;
  const { onNext, onBack } = props;
  const profileData = useAppSelector((s) => s.auth.profileData);
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const styles = useMemo(() => {
    return {
      header: {
        paddingHorizontal: theme.spacing[4],
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
        paddingHorizontal: theme.spacing[4],
      },
    };
  }, [theme]);

  return (
    <ScreenContainer scroll>
      <View style={{ flex: 1 }}>
        <ProcessHeader
          leftText={t('profileSetup.step', { current: 3 })}
          rightText={t('profileSetup.progress75')}
          leftColor={theme.colors.primary[500]}
          rightColor={theme.colors.text.tertiary}
          leftFontSize={theme.typography.scale.sm}
          rightFontSize={theme.typography.scale.sm}
          leftFontWeight="700"
          rightFontWeight="normal"
          progress={0.75}
          progressBarColor={theme.colors.primary[500]}
          progressBarBgColor={theme.colors.border}
          containerStyle={styles.header}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back', { defaultValue: 'Back' })}
            onPress={onBack || (() => {})}
            style={{
              width: 35,
              height: 35,
              borderRadius: theme.radius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.background,
              borderWidth: 1,
              borderColor: theme.colors.border,
              marginBottom: theme.spacing[2],
              alignSelf: 'flex-start',
            }}
          >
            <ArrowLeft size={18} color={theme.colors.text.primary} />
          </Pressable>
        </ProcessHeader>
        <View
          style={{
            flex: 1,
            paddingHorizontal: theme.spacing[4],
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
              onNext?.(values.categories);
              setSubmitting(false);
            }}
          >
            {({ values, setFieldValue, handleSubmit, errors, touched }) => {
              const selectedCount = values.categories.length;
              return (
                <>
                  {CATEGORY_GROUPS.map((group, groupIdx) => {
                    const chunkedOptions: Array<typeof group.options> = [];
                    let i = 0;
                    while (i < group.options.length) {
                      chunkedOptions.push(group.options.slice(i, i + 2));
                      i += 2;
                    }
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
                                  defaultValue: 'Đã chọn {{count}} môn',
                                })}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={{ width: '100%', alignItems: 'stretch' }}>
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
                        </View>
                      </View>
                    );
                  })}
                  {touched.categories && errors.categories ? (
                    <Text variant="caption" color="error" style={{ marginTop: theme.spacing[1] }}>
                      {t(String(errors.categories))}
                    </Text>
                  ) : null}
                  <View style={{ marginTop: theme.spacing[4] }}>
                    <Button
                      label={t('profileSetup.nextButton')}
                      onPress={handleSubmit}
                      loading={submitting}
                      disabled={submitting || selectedCount < minSelect}
                      variant="primary"
                      size="md"
                      style={{
                        width: '100%',
                        borderRadius: theme.radius.lg,
                      }}
                    />
                  </View>
                  {/* removed max-selected popup (no maximum) */}
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
