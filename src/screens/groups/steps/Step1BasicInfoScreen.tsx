import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { Camera, X } from 'lucide-react-native';
import { ScreenContainer, Text, Spacer, Input, Button } from '../../../components/ui';
import { ImagePickerModal } from '../../../components/ui/ImagePickerModal/ImagePickerModal';
import { BackButton } from '../../../components/navigation';
import { useTheme } from '../../../styles';
import { groupStep1Schema } from '../../../utils/validation';
import { GroupIconPicker } from '../../../components/groups';

export type Step1BasicInfoData = {
  name: string;
  description: string;
  cover_image_url?: string | null;
  icon_emoji?: string | null;
};

export type Step1BasicInfoScreenProps = {
  initialData?: Partial<Step1BasicInfoData>;
  onNext: (data: Step1BasicInfoData) => void;
  onBack?: () => void;
};

export const Step1BasicInfoScreen: React.FC<Step1BasicInfoScreenProps> = ({
  initialData,
  onNext,
  onBack,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation('groups');
  const [coverImageUri, setCoverImageUri] = useState<string | null>(
    initialData?.cover_image_url || null,
  );
  const [selectedIcon, setSelectedIcon] = useState<string | null>(initialData?.icon_emoji || null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [uploading, setUploading] = useState(false);

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
        width: '25%',
        backgroundColor: theme.colors.primary[500],
        borderRadius: 2,
      },
      content: {
        paddingVertical: theme.spacing[3],
      },
      coverImageContainer: {
        width: '100%',
        height: 180,
        borderRadius: theme.radius.md,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        borderStyle: 'dashed' as const,
        backgroundColor: theme.colors.surface,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginBottom: theme.spacing[4],
      },
      coverImage: {
        width: '100%',
        height: '100%',
        borderRadius: theme.radius.md,
      },
    };
  }, [theme]);

  const handleCoverImageSelected = async (uri: string) => {
    try {
      setUploading(true);
      // TODO: Upload to storage when storage service is ready
      // For now, just use local URI
      setCoverImageUri(uri);
    } catch (error) {
      Alert.alert(t('errors.uploadCoverFailed'), t('errors.uploadCoverFailedDescription'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScreenContainer scroll={false} contentContainerStyle={{ paddingTop: 0 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <BackButton onPress={onBack || (() => {})} />
            <Text variant="h4" style={styles.headerTitle}>
              {t('createPublicGroup')}
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
              {t('stepIndicator1')}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar} />
          </View>

          <Spacer size={4} />

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Cover Photo Section */}
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: theme.spacing[2],
                }}
              >
                <Text variant="body" style={{ fontWeight: '600' as const }}>
                  {t('step1.coverPhoto')}
                </Text>
                <Spacer size={5} horizontal />
                <Text variant="bodySmall" color="tertiary">
                  {t('optional')}
                </Text>
              </View>

              <Pressable
                onPress={() => setShowImagePicker(true)}
                disabled={uploading}
                style={styles.coverImageContainer}
              >
                {coverImageUri ? (
                  <View style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <Image source={{ uri: coverImageUri }} style={styles.coverImage} />
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setCoverImageUri(null);
                      }}
                      style={{
                        position: 'absolute',
                        top: theme.spacing[2],
                        right: theme.spacing[2],
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        borderRadius: theme.radius.full,
                        padding: theme.spacing[1],
                      }}
                    >
                      <X size={16} color="white" />
                    </Pressable>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <Camera size={32} color={theme.colors.text.tertiary} />
                    <Spacer size={2} />
                    <Text variant="bodySmall" color="tertiary">
                      {t('step1.addCoverPhoto')}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Form */}
            <Formik
              initialValues={{
                name: initialData?.name || '',
                description: initialData?.description || '',
              }}
              validationSchema={groupStep1Schema}
              onSubmit={(values) => {
                onNext({
                  name: values.name,
                  description: values.description,
                  cover_image_url: coverImageUri,
                  icon_emoji: selectedIcon,
                });
              }}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <>
                  {/* Group Name */}
                  <View style={{ marginBottom: theme.spacing[4] }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: theme.spacing[2],
                      }}
                    >
                      <Text variant="body" style={{ fontWeight: '600' as const }}>
                        {t('step1.groupName')}
                      </Text>
                      <Text variant="body" color="error" style={{ marginLeft: theme.spacing[1] }}>
                        *
                      </Text>
                      <View style={{ flex: 1 }} />
                      <Text variant="bodySmall" color="tertiary">
                        {values.name.length}/100
                      </Text>
                    </View>
                    <Input
                      placeholder={t('step1.groupNamePlaceholder')}
                      value={values.name}
                      onChangeText={handleChange('name')}
                      onBlur={handleBlur('name')}
                      maxLength={100}
                      errorText={
                        touched.name && errors.name
                          ? typeof errors.name === 'string'
                            ? t(errors.name)
                            : String(errors.name)
                          : undefined
                      }
                    />
                    <Text
                      variant="caption"
                      color="tertiary"
                      style={{ marginTop: theme.spacing[1] }}
                    >
                      {t('step1.groupNameHelper')}
                    </Text>
                  </View>

                  {/* Group Description */}
                  <View style={{ marginBottom: theme.spacing[4] }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: theme.spacing[2],
                      }}
                    >
                      <Text variant="body" style={{ fontWeight: '600' as const }}>
                        {t('step1.groupDescription')}
                      </Text>
                      <Text variant="body" color="error" style={{ marginLeft: theme.spacing[1] }}>
                        *
                      </Text>
                      <View style={{ flex: 1 }} />
                      <Text variant="bodySmall" color="tertiary">
                        {values.description.length}/500
                      </Text>
                    </View>
                    <Input
                      placeholder={t('step1.groupDescriptionPlaceholder')}
                      value={values.description}
                      onChangeText={handleChange('description')}
                      onBlur={handleBlur('description')}
                      multiline
                      numberOfLines={4}
                      maxLength={500}
                      style={{
                        minHeight: 100,
                        textAlignVertical: 'top',
                        paddingTop: theme.spacing[3],
                      }}
                      errorText={
                        touched.description && errors.description
                          ? typeof errors.description === 'string'
                            ? t(errors.description)
                            : String(errors.description)
                          : undefined
                      }
                    />
                    <Text
                      variant="caption"
                      color="tertiary"
                      style={{ marginTop: theme.spacing[1] }}
                    >
                      {t('step1.groupDescriptionHelper')}
                    </Text>
                  </View>

                  {/* Group Icon */}
                  <Spacer size={6} />
                  <View style={{ marginBottom: theme.spacing[6] }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: theme.spacing[2],
                      }}
                    >
                      <Text variant="body" style={{ fontWeight: '600' as const }}>
                        {t('step1.groupIcon')}
                      </Text>
                      <Spacer size={5} horizontal />
                      <Text variant="bodySmall" color="tertiary">
                        {t('optional')}
                      </Text>
                    </View>
                    <GroupIconPicker selectedIcon={selectedIcon} onIconSelect={setSelectedIcon} />
                  </View>

                  {/* Continue Button */}
                  <Button
                    label={t('continue')}
                    onPress={() => handleSubmit()}
                    disabled={
                      !values.name.trim() ||
                      !values.description.trim() ||
                      values.name.length < 3 ||
                      values.description.length < 10
                    }
                    style={{ marginBottom: theme.spacing[4] }}
                  />
                </>
              )}
            </Formik>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Image Picker Modal */}
      <ImagePickerModal
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelectImage={handleCoverImageSelected}
      />
    </ScreenContainer>
  );
};
