import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
  Pressable,
} from 'react-native';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react-native';
import {
  ScreenContainer,
  Text,
  Spacer,
  Button,
  RadioButton,
  ToggleSwitch,
  Input,
  Card,
} from '../../../components/ui';
import { BackButton } from '../../../components/navigation';
import { useTheme } from '../../../styles';
import { groupStep3Schema } from '../../../utils/validation';
import { GroupRuleItem } from '../../../components/groups';
import { generateSlugFromName } from '../../../services/groups/create';

export type Step3RulesData = {
  rules: string[];
  requires_approval: boolean;
  posting_permission: 'all_members' | 'admin_moderator_only';
  slug: string;
};

export type Step3RulesScreenProps = {
  initialData?: Partial<Step3RulesData>;
  groupName?: string; // For auto-generating slug
  onNext: (data: Step3RulesData) => void;
  onBack: () => void;
};

export const Step3RulesScreen: React.FC<Step3RulesScreenProps> = ({
  initialData,
  groupName,
  onNext,
  onBack,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('groups');
  const [showAddRuleInput, setShowAddRuleInput] = useState(false);
  const [newRuleText, setNewRuleText] = useState('');

  const styles = useMemo(() => {
    return {
      header: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        marginBottom: 0,
      },
      headerTitle: {
        flex: 1,
        textAlign: 'center' as const,
        fontWeight: '700' as const,
      },
      progressBarContainer: {
        height: 4,
        backgroundColor: theme.colors.border,
        borderRadius: 2,
        marginTop: theme.spacing[1],
        overflow: 'hidden' as const,
      },
      progressBar: {
        height: 4,
        width: '75%',
        backgroundColor: theme.colors.primary[500],
        borderRadius: 2,
      },
      content: {
        paddingVertical: theme.spacing[3],
      },
    };
  }, [theme]);

  const initialRules = initialData?.rules || [];
  const initialSlug = initialData?.slug || (groupName ? generateSlugFromName(groupName) : '');

  const handleAddRule = (rules: string[], setFieldValue: (field: string, value: any) => void) => {
    const trimmedRule = newRuleText.trim();
    if (!trimmedRule) {
      Alert.alert(t('errors.invalidRule'), t('validation.ruleRequired'));
      return;
    }

    if (trimmedRule.length < 5) {
      Alert.alert(t('errors.invalidRule'), t('validation.ruleMin'));
      return;
    }

    if (trimmedRule.length > 200) {
      Alert.alert(t('errors.invalidRule'), t('validation.ruleMax'));
      return;
    }

    if (rules.length >= 10) {
      Alert.alert(t('errors.invalidRule'), t('validation.rulesMax'));
      return;
    }

    setFieldValue('rules', [...rules, trimmedRule]);
    setNewRuleText('');
    setShowAddRuleInput(false);
  };

  const handleDeleteRule = (
    index: number,
    rules: string[],
    setFieldValue: (field: string, value: any) => void,
  ) => {
    setFieldValue(
      'rules',
      rules.filter((_, i) => i !== index),
    );
  };

  return (
    <ScreenContainer scroll={false} contentContainerStyle={{ paddingTop: 0 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <BackButton onPress={onBack} />
            <Text variant="h4" style={styles.headerTitle}>
              {t('step3.title')}
            </Text>
            <Text
              variant="body"
              color="primary"
              numberOfLines={1}
              style={{
                fontWeight: '700' as const,
                fontSize: theme.typography.scale.sm,
                minWidth: 50,
                textAlign: 'right',
              }}
            >
              {t('stepIndicator3')}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar} />
          </View>

          <Spacer size={4} />

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Formik
              initialValues={{
                rules: initialRules,
                requires_approval: initialData?.requires_approval ?? false,
                posting_permission: initialData?.posting_permission || 'all_members',
                slug: initialSlug,
              }}
              validationSchema={groupStep3Schema}
              onSubmit={(values) => {
                onNext({
                  rules: values.rules,
                  requires_approval: values.requires_approval,
                  posting_permission: values.posting_permission as any,
                  slug: values.slug,
                });
              }}
            >
              {({ handleSubmit, setFieldValue, values, errors, touched }) => (
                <>
                  {/* Group Rules Section */}
                  <View style={{ marginBottom: theme.spacing[6] }}>
                    <Text
                      variant="body"
                      style={{ fontWeight: '600' as const, marginBottom: theme.spacing[2] }}
                    >
                      {t('step3.groupRules')}
                    </Text>
                    <Text
                      variant="bodySmall"
                      color="secondary"
                      style={{ marginBottom: theme.spacing[3] }}
                    >
                      {t('step3.rulesDescription')}
                    </Text>

                    {/* Rules List */}
                    {values.rules.length === 0 ? (
                      <View
                        style={{
                          padding: theme.spacing[4],
                          backgroundColor: theme.colors.surface,
                          borderRadius: theme.radius.md,
                          borderWidth: 1.5,
                          borderColor: theme.colors.border,
                          borderStyle: 'dashed',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text variant="bodySmall" color="tertiary" style={{ textAlign: 'center' }}>
                          {t('step3.noRulesYet') ||
                            'Chưa có quy tắc nào. Hãy thêm quy tắc đầu tiên.'}
                        </Text>
                      </View>
                    ) : (
                      values.rules.map((rule, index) => (
                        <GroupRuleItem
                          key={index}
                          order={index + 1}
                          ruleText={rule}
                          canDelete={true}
                          onDelete={() => handleDeleteRule(index, values.rules, setFieldValue)}
                        />
                      ))
                    )}

                    {/* Add Rule Input */}
                    {showAddRuleInput && (
                      <View style={{ marginTop: theme.spacing[3] }}>
                        <TextInput
                          style={{
                            minHeight: 100,
                            borderWidth: 1.5,
                            borderColor: theme.colors.border,
                            borderRadius: theme.radius.md,
                            paddingHorizontal: theme.spacing[3],
                            paddingVertical: theme.spacing[3],
                            fontSize: theme.typography.scale.base,
                            color: theme.colors.text.primary,
                            textAlignVertical: 'top',
                          }}
                          placeholder={t('step3.addRule')}
                          placeholderTextColor={theme.colors.text.tertiary}
                          value={newRuleText}
                          onChangeText={setNewRuleText}
                          multiline
                          numberOfLines={4}
                          maxLength={200}
                        />
                        <Spacer size={2} />
                        <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
                          <Button
                            label={t('step2.cancel')}
                            variant="outline"
                            onPress={() => {
                              setShowAddRuleInput(false);
                              setNewRuleText('');
                            }}
                            style={{ flex: 1 }}
                          />
                          <Button
                            label={t('step2.add')}
                            onPress={() => handleAddRule(values.rules, setFieldValue)}
                            disabled={newRuleText.trim().length < 5}
                            style={{ flex: 1 }}
                          />
                        </View>
                      </View>
                    )}

                    {/* Add Rule Button */}
                    {!showAddRuleInput && values.rules.length < 10 && (
                      <Pressable
                        onPress={() => setShowAddRuleInput(true)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingVertical: theme.spacing[3],
                          paddingHorizontal: theme.spacing[4],
                          backgroundColor: theme.colors.surface,
                          borderWidth: 1.5,
                          borderColor: theme.colors.primary[500],
                          borderStyle: 'dashed',
                          borderRadius: theme.radius.md,
                          marginTop: theme.spacing[3],
                        }}
                      >
                        <Plus size={20} color={theme.colors.primary[500]} />
                        <Spacer size={2} horizontal />
                        <Text variant="body" color="primary" style={{ fontWeight: '600' as const }}>
                          {t('step3.addRule')}
                        </Text>
                      </Pressable>
                    )}

                    {/* Rules Max Info */}
                    {values.rules.length > 0 && (
                      <Text
                        variant="caption"
                        color="tertiary"
                        style={{ marginTop: theme.spacing[2] }}
                      >
                        {t('step3.rulesMaxInfo')}
                      </Text>
                    )}
                  </View>

                  {/* Approval Settings Section */}
                  <View style={{ marginBottom: theme.spacing[6] }}>
                    <Text
                      variant="body"
                      style={{ fontWeight: '600' as const, marginBottom: theme.spacing[2] }}
                    >
                      {t('step3.approvalSettings')}
                    </Text>
                    <Card padding={4} elevation="sm">
                      <ToggleSwitch
                        value={values.requires_approval}
                        onValueChange={(value) => setFieldValue('requires_approval', value)}
                        label={t('step3.newMemberApproval')}
                      />
                      <Spacer size={2} />
                      <Text variant="bodySmall" color="secondary">
                        {t('step3.approvalDescription')}
                      </Text>
                      <Spacer size={2} />
                      <View
                        style={{
                          backgroundColor: theme.colors.primary[50],
                          padding: theme.spacing[2],
                          borderRadius: theme.radius.md,
                        }}
                      >
                        <Text variant="caption" color="primary">
                          ℹ️ {t('step3.approvalInfo')}
                        </Text>
                      </View>
                    </Card>
                  </View>

                  {/* Posting Permissions Section */}
                  <View style={{ marginBottom: theme.spacing[6] }}>
                    <Text
                      variant="body"
                      style={{ fontWeight: '600' as const, marginBottom: theme.spacing[2] }}
                    >
                      {t('step3.postingPermissions')}
                    </Text>
                    <Text
                      variant="bodySmall"
                      color="secondary"
                      style={{ marginBottom: theme.spacing[3] }}
                    >
                      {t('step3.postingPermissionsQuestion')}
                    </Text>
                    <View style={{ gap: theme.spacing[2] }}>
                      <RadioButton
                        selected={values.posting_permission === 'all_members'}
                        onPress={() => setFieldValue('posting_permission', 'all_members')}
                        label={t('step3.allMembers')}
                      />
                      <View
                        style={{
                          paddingLeft: theme.spacing[3],
                          marginTop: -theme.spacing[1],
                          marginBottom: theme.spacing[2],
                        }}
                      >
                        <Text variant="bodySmall" color="secondary">
                          {t('step3.allMembersDescription')}
                        </Text>
                      </View>

                      <RadioButton
                        selected={values.posting_permission === 'admin_moderator_only'}
                        onPress={() => setFieldValue('posting_permission', 'admin_moderator_only')}
                        label={t('step3.adminModeratorOnly')}
                      />
                      <View
                        style={{
                          paddingLeft: theme.spacing[3],
                          marginTop: -theme.spacing[1],
                          marginBottom: theme.spacing[2],
                        }}
                      >
                        <Text variant="bodySmall" color="secondary">
                          {t('step3.adminModeratorOnlyDescription')}
                        </Text>
                      </View>
                    </View>
                    {touched.posting_permission && errors.posting_permission && (
                      <Text variant="caption" color="error" style={{ marginTop: theme.spacing[1] }}>
                        {typeof errors.posting_permission === 'string'
                          ? t(errors.posting_permission)
                          : String(errors.posting_permission)}
                      </Text>
                    )}
                  </View>

                  {/* Group Link Section */}
                  <View style={{ marginBottom: theme.spacing[6] }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: theme.spacing[2],
                      }}
                    >
                      <Text variant="body" style={{ fontWeight: '600' as const }}>
                        {t('step3.groupLink')}
                      </Text>
                      <Text variant="body" color="error" style={{ marginLeft: theme.spacing[1] }}>
                        *
                      </Text>
                    </View>
                    <Text
                      variant="bodySmall"
                      color="secondary"
                      style={{ marginBottom: theme.spacing[3] }}
                    >
                      {t('step3.groupLinkDescription')}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: theme.spacing[2],
                      }}
                    >
                      <Text variant="body" color="primary" style={{ fontWeight: '600' as const }}>
                        {t('step3.groupLinkPrefix')}
                      </Text>
                      <Input
                        placeholder="group-slug"
                        value={values.slug}
                        onChangeText={(text) => {
                          // Only allow lowercase, numbers, and hyphens
                          const sanitized = text.toLowerCase().replace(/[^a-z0-9-]/g, '');
                          setFieldValue('slug', sanitized);
                        }}
                        maxLength={50}
                        style={{ flex: 1, marginLeft: theme.spacing[2] }}
                        errorText={
                          touched.slug && errors.slug
                            ? typeof errors.slug === 'string'
                              ? t(errors.slug)
                              : String(errors.slug)
                            : undefined
                        }
                      />
                    </View>
                    {/* Preview Link */}
                    {values.slug && values.slug.trim().length > 0 && (
                      <View
                        style={{
                          backgroundColor: theme.colors.primary[50],
                          padding: theme.spacing[3],
                          borderRadius: theme.radius.md,
                          borderWidth: 1,
                          borderColor: theme.colors.primary[200],
                          marginBottom: theme.spacing[2],
                        }}
                      >
                        <Text
                          variant="caption"
                          color="secondary"
                          style={{ marginBottom: theme.spacing[1] }}
                        >
                          {t('step3.groupLinkPreview') || 'Link nhóm của bạn:'}
                        </Text>
                        <Text
                          variant="body"
                          color="primary"
                          style={{ fontWeight: '600' as const }}
                          selectable
                        >
                          {t('step3.groupLinkPrefix')}
                          {values.slug}
                        </Text>
                      </View>
                    )}
                    <Text variant="caption" color="tertiary">
                      {t('step3.groupLinkInfo')}
                    </Text>
                  </View>

                  {/* Navigation Buttons */}
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: theme.spacing[3],
                      marginBottom: theme.spacing[4],
                    }}
                  >
                    <Button
                      label={t('back')}
                      variant="outline"
                      onPress={onBack}
                      style={{ flex: 1 }}
                    />
                    <Button
                      label={t('continue')}
                      onPress={() => handleSubmit()}
                      disabled={!values.slug.trim() || values.slug.length < 3}
                      style={{ flex: 1 }}
                    />
                  </View>
                </>
              )}
            </Formik>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};
