/**
 * Academic Info Section Component
 * Reusable component for editing academic information in Edit Profile
 */

import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../styles';
import { Text } from '../../ui/Text/Text';
import { Input } from '../../ui/Input/Input';
import { Chip } from '../../ui/Chip';
import { Spacer } from '../../ui/Spacer/Spacer';
import { Search, GraduationCap, BookOpen, Briefcase, X } from 'lucide-react-native';
import {
  POPULAR_UNIVERSITIES,
  POPULAR_MAJORS,
  POPULAR_SUBJECTS,
  PROJECT_TYPES,
  filterUniversities,
  filterMajors,
  filterSubjects,
} from '../../../constants/academic';

interface AcademicInfoSectionProps {
  university?: string;
  major?: string;
  subjects?: string[];
  projects?: string[];
  onUniversityChange: (value: string | undefined) => void;
  onMajorChange: (value: string | undefined) => void;
  onSubjectsChange: (value: string[]) => void;
  onProjectsChange: (value: string[]) => void;
}

export const AcademicInfoSection: React.FC<AcademicInfoSectionProps> = ({
  university,
  major,
  subjects = [],
  projects = [],
  onUniversityChange,
  onMajorChange,
  onSubjectsChange,
  onProjectsChange,
}) => {
  const { t } = useTranslation(['profile', 'buddy']);
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [universitySearch, setUniversitySearch] = useState('');
  const [majorSearch, setMajorSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [projectInput, setProjectInput] = useState('');

  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);
  const [showMajorDropdown, setShowMajorDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  const filteredUniversities = filterUniversities(universitySearch);
  const filteredMajors = filterMajors(majorSearch);
  const filteredSubjects = filterSubjects(subjectSearch);

  const handleSelectUniversity = (value: string) => {
    onUniversityChange(value);
    setUniversitySearch('');
    setShowUniversityDropdown(false);
  };

  const handleSelectMajor = (value: string) => {
    onMajorChange(value);
    setMajorSearch('');
    setShowMajorDropdown(false);
  };

  const handleToggleSubject = (subject: string) => {
    const updated = subjects.includes(subject)
      ? subjects.filter((s) => s !== subject)
      : [...subjects, subject];
    onSubjectsChange(updated);
  };

  const handleRemoveProject = (project: string) => {
    onProjectsChange(projects.filter((p) => p !== project));
  };

  return (
    <View>
      {/* University */}
      <View style={styles.fieldContainer}>
        <View style={styles.labelRow}>
          <GraduationCap size={18} color={theme.colors.primary[500]} />
          <Text variant="body" style={styles.fieldLabel}>
            {t('buddy:filter.university')}
          </Text>
        </View>

        {university ? (
          <View style={styles.selectedItem}>
            <Text variant="body" color="primary" style={{ flex: 1, fontWeight: '500' as const }}>
              {university}
            </Text>
            <Pressable onPress={() => onUniversityChange(undefined)} style={styles.removeButton}>
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
                <ScrollView style={styles.dropdown} nestedScrollEnabled>
                  {universitySearch.trim() && (
                    <Pressable
                      onPress={() => handleSelectUniversity(universitySearch.trim())}
                      style={styles.dropdownItemCustom}
                    >
                      <Text variant="body" color="primary" style={{ fontWeight: '500' as const }}>
                        {t('buddy:filter.customUniversity', { query: universitySearch.trim() })}
                      </Text>
                    </Pressable>
                  )}
                  {filteredUniversities.map((uni) => (
                    <Pressable
                      key={uni}
                      onPress={() => handleSelectUniversity(uni)}
                      style={styles.dropdownItem}
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
      <View style={styles.fieldContainer}>
        <View style={styles.labelRow}>
          <BookOpen size={18} color={theme.colors.secondary[500]} />
          <Text variant="body" style={styles.fieldLabel}>
            {t('buddy:filter.major')}
          </Text>
        </View>

        {major ? (
          <View
            style={[
              styles.selectedItem,
              {
                backgroundColor: theme.colors.secondary[100],
                borderColor: theme.colors.secondary[300],
              },
            ]}
          >
            <Text variant="body" color="info" style={{ flex: 1, fontWeight: '500' as const }}>
              {major}
            </Text>
            <Pressable
              onPress={() => onMajorChange(undefined)}
              style={[styles.removeButton, { backgroundColor: theme.colors.secondary[500] }]}
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
                <ScrollView style={styles.dropdown} nestedScrollEnabled>
                  {majorSearch.trim() && (
                    <Pressable
                      onPress={() => handleSelectMajor(majorSearch.trim())}
                      style={[
                        styles.dropdownItemCustom,
                        { backgroundColor: theme.colors.secondary[50] },
                      ]}
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
                      style={styles.dropdownItem}
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
      <View style={styles.fieldContainer}>
        <View style={styles.labelRow}>
          <BookOpen size={18} color={theme.colors.semantic.success} />
          <Text variant="body" style={styles.fieldLabel}>
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
            <ScrollView style={[styles.dropdown, { maxHeight: 150 }]} nestedScrollEnabled>
              <Pressable
                onPress={() => {
                  handleToggleSubject(subjectSearch.trim());
                  setSubjectSearch('');
                  setShowSubjectDropdown(false);
                }}
                style={[
                  styles.dropdownItemCustom,
                  { backgroundColor: theme.colors.semantic.success + '20' },
                ]}
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
                  style={styles.dropdownItem}
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
            <View style={styles.chipContainer}>
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
      <View style={styles.fieldContainer}>
        <View style={styles.labelRow}>
          <Briefcase size={18} color={theme.colors.semantic.warning} />
          <Text variant="body" style={styles.fieldLabel}>
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
            <ScrollView style={[styles.dropdown, { maxHeight: 150 }]} nestedScrollEnabled>
              <Pressable
                onPress={() => {
                  if (projectInput.trim() && !projects.includes(projectInput.trim())) {
                    onProjectsChange([...projects, projectInput.trim()]);
                  }
                  setProjectInput('');
                  setShowProjectDropdown(false);
                }}
                style={[
                  styles.dropdownItemCustom,
                  { backgroundColor: theme.colors.semantic.warning + '20' },
                ]}
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
                      onProjectsChange([...projects, type]);
                    }
                    setProjectInput('');
                    setShowProjectDropdown(false);
                  }}
                  style={styles.dropdownItem}
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
            <View style={styles.chipContainer}>
              {projects.map((project) => (
                <View key={project} style={styles.projectChip}>
                  <Text variant="bodySmall" color="warning" style={{ fontWeight: '500' as const }}>
                    {project}
                  </Text>
                  <Pressable
                    onPress={() => handleRemoveProject(project)}
                    style={styles.projectRemoveButton}
                  >
                    <X size={12} color={theme.colors.surface} />
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    fieldContainer: {
      marginBottom: 20,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 6,
    },
    fieldLabel: {
      fontWeight: '600',
    },
    selectedItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary[100],
      borderRadius: theme.radius.lg,
      padding: theme.spacing[3],
      borderWidth: 1.5,
      borderColor: theme.colors.primary[300],
    },
    removeButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.primary[500],
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropdown: {
      maxHeight: 200,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    dropdownItem: {
      padding: theme.spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    dropdownItemCustom: {
      padding: theme.spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.primary[50],
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing[2],
    },
    projectChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.semantic.warning + '20',
      borderRadius: theme.radius.full,
      paddingLeft: theme.spacing[3],
      paddingRight: theme.spacing[2],
      paddingVertical: theme.spacing[2],
      borderWidth: 1.5,
      borderColor: theme.colors.semantic.warning + '40',
    },
    projectRemoveButton: {
      marginLeft: theme.spacing[2],
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.colors.semantic.warning,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
