/**
 * Academic Filters Component
 * Filters for university, major, subjects, and projects
 */

import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
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

interface AcademicFiltersProps {
  university?: string;
  major?: string;
  subjects?: string[];
  projects?: string[];
  onUniversityChange: (value: string | undefined) => void;
  onMajorChange: (value: string | undefined) => void;
  onSubjectsChange: (value: string[]) => void;
  onProjectsChange: (value: string[]) => void;
}

export const AcademicFilters: React.FC<AcademicFiltersProps> = ({
  university,
  major,
  subjects = [],
  projects = [],
  onUniversityChange,
  onMajorChange,
  onSubjectsChange,
  onProjectsChange,
}) => {
  const { t } = useTranslation('buddy');
  const { theme } = useTheme();

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
      <View style={{ marginBottom: theme.spacing[6] }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[3] }}
        >
          <GraduationCap size={18} color={theme.colors.primary[500]} />
          <Text
            variant="h6"
            color="primary"
            style={{ marginLeft: theme.spacing[2], fontWeight: '600' as const }}
          >
            {t('filter.university')}
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
            <Text variant="body" color="primary" style={{ flex: 1, fontWeight: '500' as const }}>
              {university}
            </Text>
            <Pressable
              onPress={() => onUniversityChange(undefined)}
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
              placeholder={t('filter.universityPlaceholder')}
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
                      <Text variant="body" color="primary" style={{ fontWeight: '500' as const }}>
                        {t('filter.customUniversity', { query: universitySearch.trim() })}
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
                  {filteredUniversities.length === 0 && !universitySearch.trim() && (
                    <View style={{ padding: theme.spacing[4], alignItems: 'center' }}>
                      <Text variant="bodySmall" color="tertiary">
                        {t('filter.noUniversityResults')}
                      </Text>
                    </View>
                  )}
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
          <BookOpen size={18} color={theme.colors.secondary[500]} />
          <Text
            variant="h6"
            color="primary"
            style={{ marginLeft: theme.spacing[2], fontWeight: '600' as const }}
          >
            {t('filter.major')}
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
              onPress={() => onMajorChange(undefined)}
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
              placeholder={t('filter.majorPlaceholder')}
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
                        {t('filter.customMajor', { query: majorSearch.trim() })}
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
                  {filteredMajors.length === 0 && !majorSearch.trim() && (
                    <View style={{ padding: theme.spacing[4], alignItems: 'center' }}>
                      <Text variant="bodySmall" color="tertiary">
                        {t('filter.noMajorResults')}
                      </Text>
                    </View>
                  )}
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
          <BookOpen size={18} color={theme.colors.semantic.success} />
          <Text
            variant="h6"
            color="primary"
            style={{ marginLeft: theme.spacing[2], fontWeight: '600' as const }}
          >
            {t('filter.subjects')}
          </Text>
        </View>

        <Input
          placeholder={t('filter.subjectsPlaceholder')}
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
                  {t('filter.customSubject', { query: subjectSearch.trim() })}
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
          <Briefcase size={18} color={theme.colors.semantic.warning} />
          <Text
            variant="h6"
            color="primary"
            style={{ marginLeft: theme.spacing[2], fontWeight: '600' as const }}
          >
            {t('filter.projects')}
          </Text>
        </View>

        <Input
          placeholder={t('filter.projectsPlaceholder')}
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
                    onProjectsChange([...projects, projectInput.trim()]);
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
                  {t('filter.customProject', { query: projectInput.trim() })}
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
                  <Text variant="bodySmall" color="warning" style={{ fontWeight: '500' as const }}>
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
    </View>
  );
};
