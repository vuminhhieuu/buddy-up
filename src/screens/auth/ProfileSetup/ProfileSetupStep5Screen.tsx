/**
 * Profile Setup Step 5: Academic Information
 * Collects university, major, subjects, and projects
 */

import React, { useState } from 'react';
import { View, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../styles';
import { Text } from '../../../components/ui/Text/Text';
import { ScreenContainer } from '../../../components/ui/ScreenContainer/ScreenContainer';
import { ProfileSetupHeader } from '../../../components/ui/ProfileSetupHeader/ProfileSetupHeader';
import { ProfileSetupNextButton } from '../../../components/ui/ProfileSetupNextButton/ProfileSetupNextButton';
import { Spacer } from '../../../components/ui/Spacer/Spacer';
import { Input } from '../../../components/ui/Input/Input';
import { Chip } from '../../../components/ui/Chip';
import { GraduationCap, BookOpen, Briefcase, Search, X } from 'lucide-react-native';
import type { AuthStackParamList } from '../../../navigation/AuthNavigator';
import {
  POPULAR_UNIVERSITIES,
  POPULAR_MAJORS,
  POPULAR_SUBJECTS,
  PROJECT_TYPES,
  filterUniversities,
  filterMajors,
  filterSubjects,
} from '../../../constants/academic';
import { supabase } from '../../../config/supabase';
import { showErrorToast, showSuccessToast } from '../../../utils/toast';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ProfileSetupStep5'>;

export type ProfileSetupStep5ScreenProps = {
  onBack?: () => void;
  onNext?: () => void;
};

export const ProfileSetupStep5Screen: React.FC<ProfileSetupStep5ScreenProps> = ({
  onBack,
  onNext,
}) => {
  const { t } = useTranslation(['profileSetup', 'buddy']);
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const [university, setUniversity] = useState<string>('');
  const [major, setMajor] = useState<string>('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [projects, setProjects] = useState<string[]>([]);

  const [universitySearch, setUniversitySearch] = useState('');
  const [majorSearch, setMajorSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [projectInput, setProjectInput] = useState('');

  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);
  const [showMajorDropdown, setShowMajorDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  const [loading, setLoading] = useState(false);

  const filteredUniversities = filterUniversities(universitySearch);
  const filteredMajors = filterMajors(majorSearch);
  const filteredSubjects = filterSubjects(subjectSearch);

  const handleSelectUniversity = (value: string) => {
    setUniversity(value);
    setUniversitySearch('');
    setShowUniversityDropdown(false);
  };

  const handleSelectMajor = (value: string) => {
    setMajor(value);
    setMajorSearch('');
    setShowMajorDropdown(false);
  };

  const handleToggleSubject = (subject: string) => {
    if (subjects.includes(subject)) {
      setSubjects(subjects.filter((s) => s !== subject));
    } else {
      setSubjects([...subjects, subject]);
    }
  };

  const handleRemoveProject = (project: string) => {
    setProjects(projects.filter((p) => p !== project));
  };

  const handleNext = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not found');
      }

      // Update profile with academic information
      const { error } = await supabase
        .from('profiles')
        .update({
          university: university || null,
          major: major || null,
          current_subjects: subjects,
          current_projects: projects,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      showSuccessToast(t('auth:profileSetup.step5.success'));

      // Navigate to next step (Step 4 - Completion screen)
      if (onNext) {
        onNext();
      }
    } catch (error) {
      console.error('Error saving academic info:', error);
      showErrorToast(t('auth:profileSetup.step5.error'));
    } finally {
      setLoading(false);
    }
  };

  const canProceed = university || major || subjects.length > 0 || projects.length > 0;

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ProfileSetupHeader currentStep={4} totalSteps={5} title="" subtitle="" onBack={onBack} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: theme.spacing[8] }}
        >
          <Spacer size={6} />

          {/* University */}
          <View style={{ marginBottom: theme.spacing[6] }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[3] }}
            >
              <GraduationCap size={20} color={theme.colors.primary[500]} />
              <Text
                variant="h6"
                color="primary"
                style={{ marginLeft: theme.spacing[2], fontWeight: '600' as const }}
              >
                {t('buddy:filter.university')}
              </Text>
            </View>

            {university ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.colors.primary[100],
                  borderRadius: theme.radius.lg,
                  padding: theme.spacing[3],
                  borderWidth: 1.5,
                  borderColor: theme.colors.primary[300],
                }}
              >
                <Text
                  variant="body"
                  color="primary"
                  style={{ flex: 1, fontWeight: '500' as const }}
                >
                  {university}
                </Text>
                <Pressable
                  onPress={() => setUniversity('')}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: theme.colors.primary[500],
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <X size={14} color={theme.colors.surface} />
                </Pressable>
              </View>
            ) : (
              <>
                <Input
                  placeholder={t('buddy:filter.universityPlaceholder')}
                  value={universitySearch}
                  onChangeText={(text) => {
                    setUniversitySearch(text);
                    setShowUniversityDropdown(true);
                  }}
                  onFocus={() => setShowUniversityDropdown(true)}
                  left={
                    <View style={{ marginRight: theme.spacing[2] }}>
                      <Search color={theme.colors.text.tertiary} size={16} />
                    </View>
                  }
                />
                {showUniversityDropdown && (
                  <>
                    <Spacer size={2} />
                    <ScrollView
                      style={{
                        maxHeight: 200,
                        backgroundColor: theme.colors.surface,
                        borderRadius: theme.radius.lg,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                      nestedScrollEnabled
                    >
                      {universitySearch.trim() && (
                        <Pressable
                          onPress={() => handleSelectUniversity(universitySearch.trim())}
                          style={{
                            padding: theme.spacing[3],
                            borderBottomWidth: 1,
                            borderBottomColor: theme.colors.border,
                            backgroundColor: theme.colors.primary[50],
                          }}
                        >
                          <Text
                            variant="body"
                            color="primary"
                            style={{ fontWeight: '500' as const }}
                          >
                            {t('buddy:filter.customUniversity', { query: universitySearch.trim() })}
                          </Text>
                        </Pressable>
                      )}
                      {filteredUniversities.map((uni) => (
                        <Pressable
                          key={uni}
                          onPress={() => handleSelectUniversity(uni)}
                          style={{
                            padding: theme.spacing[3],
                            borderBottomWidth: 1,
                            borderBottomColor: theme.colors.border,
                          }}
                        >
                          <Text variant="body" color="secondary">
                            {uni}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </>
                )}
              </>
            )}
          </View>

          {/* Major */}
          <View style={{ marginBottom: theme.spacing[6] }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[3] }}
            >
              <BookOpen size={20} color={theme.colors.secondary[500]} />
              <Text
                variant="h6"
                color="primary"
                style={{ marginLeft: theme.spacing[2], fontWeight: '600' as const }}
              >
                {t('buddy:filter.major')}
              </Text>
            </View>

            {major ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.colors.secondary[100],
                  borderRadius: theme.radius.lg,
                  padding: theme.spacing[3],
                  borderWidth: 1.5,
                  borderColor: theme.colors.secondary[300],
                }}
              >
                <Text variant="body" color="info" style={{ flex: 1, fontWeight: '500' as const }}>
                  {major}
                </Text>
                <Pressable
                  onPress={() => setMajor('')}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: theme.colors.secondary[500],
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <X size={14} color={theme.colors.surface} />
                </Pressable>
              </View>
            ) : (
              <>
                <Input
                  placeholder={t('buddy:filter.majorPlaceholder')}
                  value={majorSearch}
                  onChangeText={(text) => {
                    setMajorSearch(text);
                    setShowMajorDropdown(true);
                  }}
                  onFocus={() => setShowMajorDropdown(true)}
                  left={
                    <View style={{ marginRight: theme.spacing[2] }}>
                      <Search color={theme.colors.text.tertiary} size={16} />
                    </View>
                  }
                />
                {showMajorDropdown && (
                  <>
                    <Spacer size={2} />
                    <ScrollView
                      style={{
                        maxHeight: 200,
                        backgroundColor: theme.colors.surface,
                        borderRadius: theme.radius.lg,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                      nestedScrollEnabled
                    >
                      {majorSearch.trim() && (
                        <Pressable
                          onPress={() => handleSelectMajor(majorSearch.trim())}
                          style={{
                            padding: theme.spacing[3],
                            borderBottomWidth: 1,
                            borderBottomColor: theme.colors.border,
                            backgroundColor: theme.colors.secondary[50],
                          }}
                        >
                          <Text variant="body" color="info" style={{ fontWeight: '500' as const }}>
                            {t('buddy:filter.customMajor', { query: majorSearch.trim() })}
                          </Text>
                        </Pressable>
                      )}
                      {filteredMajors.map((maj) => (
                        <Pressable
                          key={maj}
                          onPress={() => handleSelectMajor(maj)}
                          style={{
                            padding: theme.spacing[3],
                            borderBottomWidth: 1,
                            borderBottomColor: theme.colors.border,
                          }}
                        >
                          <Text variant="body" color="secondary">
                            {maj}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </>
                )}
              </>
            )}
          </View>

          {/* Subjects */}
          <View style={{ marginBottom: theme.spacing[6] }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[3] }}
            >
              <BookOpen size={20} color={theme.colors.semantic.success} />
              <Text
                variant="h6"
                color="primary"
                style={{ marginLeft: theme.spacing[2], fontWeight: '600' as const }}
              >
                {t('buddy:filter.subjects')}
              </Text>
            </View>

            <Input
              placeholder={t('buddy:filter.subjectsPlaceholder')}
              value={subjectSearch}
              onChangeText={(text) => {
                setSubjectSearch(text);
                setShowSubjectDropdown(true);
              }}
              onFocus={() => setShowSubjectDropdown(true)}
              left={
                <View style={{ marginRight: theme.spacing[2] }}>
                  <Search color={theme.colors.text.tertiary} size={16} />
                </View>
              }
            />

            {showSubjectDropdown && subjectSearch.trim() && (
              <>
                <Spacer size={2} />
                <ScrollView
                  style={{
                    maxHeight: 150,
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.radius.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                  nestedScrollEnabled
                >
                  <Pressable
                    onPress={() => {
                      handleToggleSubject(subjectSearch.trim());
                      setSubjectSearch('');
                      setShowSubjectDropdown(false);
                    }}
                    style={{
                      padding: theme.spacing[3],
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                      backgroundColor: theme.colors.semantic.success + '20',
                    }}
                  >
                    <Text variant="body" color="success" style={{ fontWeight: '500' as const }}>
                      {t('buddy:filter.customSubject', { query: subjectSearch.trim() })}
                    </Text>
                  </Pressable>
                  {filteredSubjects.map((subj) => (
                    <Pressable
                      key={subj}
                      onPress={() => {
                        handleToggleSubject(subj);
                        setSubjectSearch('');
                        setShowSubjectDropdown(false);
                      }}
                      style={{
                        padding: theme.spacing[3],
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                      }}
                    >
                      <Text variant="body" color="secondary">
                        {subj}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            {subjects.length > 0 && (
              <>
                <Spacer size={3} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] }}>
                  {subjects.map((subject) => (
                    <Chip
                      key={subject}
                      label={subject}
                      selected
                      onPress={() => handleToggleSubject(subject)}
                      icon={<X size={12} color={theme.colors.surface} />}
                    />
                  ))}
                </View>
              </>
            )}
          </View>

          {/* Projects */}
          <View style={{ marginBottom: theme.spacing[6] }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[3] }}
            >
              <Briefcase size={20} color={theme.colors.semantic.warning} />
              <Text
                variant="h6"
                color="primary"
                style={{ marginLeft: theme.spacing[2], fontWeight: '600' as const }}
              >
                {t('buddy:filter.projects')}
              </Text>
            </View>

            <Input
              placeholder={t('buddy:filter.projectsPlaceholder')}
              value={projectInput}
              onChangeText={(text) => {
                setProjectInput(text);
                setShowProjectDropdown(true);
              }}
              onFocus={() => setShowProjectDropdown(true)}
              left={
                <View style={{ marginRight: theme.spacing[2] }}>
                  <Search color={theme.colors.text.tertiary} size={16} />
                </View>
              }
            />

            {showProjectDropdown && projectInput.trim() && (
              <>
                <Spacer size={2} />
                <ScrollView
                  style={{
                    maxHeight: 150,
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.radius.lg,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                  nestedScrollEnabled
                >
                  <Pressable
                    onPress={() => {
                      if (projectInput.trim() && !projects.includes(projectInput.trim())) {
                        setProjects([...projects, projectInput.trim()]);
                      }
                      setProjectInput('');
                      setShowProjectDropdown(false);
                    }}
                    style={{
                      padding: theme.spacing[3],
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                      backgroundColor: theme.colors.semantic.warning + '20',
                    }}
                  >
                    <Text variant="body" color="warning" style={{ fontWeight: '500' as const }}>
                      {t('buddy:filter.customProject', { query: projectInput.trim() })}
                    </Text>
                  </Pressable>
                  {PROJECT_TYPES.filter((type) =>
                    type.toLowerCase().includes(projectInput.toLowerCase()),
                  ).map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => {
                        if (!projects.includes(type)) {
                          setProjects([...projects, type]);
                        }
                        setProjectInput('');
                        setShowProjectDropdown(false);
                      }}
                      style={{
                        padding: theme.spacing[3],
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                      }}
                    >
                      <Text variant="body" color="secondary">
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            {projects.length > 0 && (
              <>
                <Spacer size={3} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] }}>
                  {projects.map((project) => (
                    <View
                      key={project}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.colors.semantic.warning + '20',
                        borderRadius: theme.radius.full,
                        paddingLeft: theme.spacing[3],
                        paddingRight: theme.spacing[2],
                        paddingVertical: theme.spacing[2],
                        borderWidth: 1.5,
                        borderColor: theme.colors.semantic.warning + '40',
                      }}
                    >
                      <Text
                        variant="bodySmall"
                        color="warning"
                        style={{ fontWeight: '500' as const }}
                      >
                        {project}
                      </Text>
                      <Pressable
                        onPress={() => handleRemoveProject(project)}
                        style={{
                          marginLeft: theme.spacing[2],
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: theme.colors.semantic.warning,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <X size={12} color={theme.colors.surface} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </ScrollView>

        <View
          style={{
            paddingVertical: theme.spacing[4],
            gap: theme.spacing[3],
          }}
        >
          <ProfileSetupNextButton
            onPress={handleNext}
            disabled={!canProceed || loading}
            loading={loading}
            label={t('profileSetup.startNowButton', { defaultValue: 'Bắt đầu ngay' })}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};
