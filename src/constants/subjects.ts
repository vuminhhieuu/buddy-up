/**
 * Available subjects/topics for study sessions
 * Maps to profileSetup or other i18n keys
 */
export const AVAILABLE_SUBJECTS = [
  // Academic subjects
  { key: 'mathematics', label: 'profileSetup.mathematics' },
  { key: 'physics', label: 'profileSetup.physics' },
  { key: 'chemistry', label: 'profileSetup.chemistry' },
  { key: 'biology', label: 'profileSetup.biology' },
  { key: 'english', label: 'profileSetup.english' },
  { key: 'vietnamese', label: 'profileSetup.vietnamese' },
  { key: 'history', label: 'profileSetup.history' },
  { key: 'geography', label: 'profileSetup.geography' },
  { key: 'economics', label: 'profileSetup.economics' },
  { key: 'informatics', label: 'profileSetup.informatics' },
  { key: 'literature', label: 'profileSetup.literature' },
  { key: 'civics', label: 'profileSetup.civics' },
  { key: 'physical_education', label: 'profileSetup.physicalEducation' },
  { key: 'music', label: 'profileSetup.music' },
  { key: 'arts', label: 'profileSetup.arts' },

  // Languages from profileSetup (category*)
  { key: 'categoryEnglish', label: 'profileSetup.categoryEnglish' },
  { key: 'categoryJapanese', label: 'profileSetup.categoryJapanese' },
  { key: 'categoryKorean', label: 'profileSetup.categoryKorean' },
  { key: 'categoryChinese', label: 'profileSetup.categoryChinese' },

  // Languages from buddy namespace
  { key: 'japanese', label: 'quickFilters.japanese', namespace: 'buddy' },

  // Programming languages
  { key: 'categoryJavaScript', label: 'profileSetup.categoryJavaScript' },
  { key: 'categoryPython', label: 'profileSetup.categoryPython' },
  { key: 'categoryReact', label: 'profileSetup.categoryReact' },
  { key: 'categoryNodejs', label: 'profileSetup.categoryNodejs' },
  { key: 'categoryJava', label: 'profileSetup.categoryJava' },
  { key: 'programming', label: 'quickFilters.programming', namespace: 'buddy' },

  // Exams
  { key: 'categoryTOEIC', label: 'profileSetup.categoryTOEIC' },
  { key: 'categoryIELTS', label: 'profileSetup.categoryIELTS' },
  { key: 'categoryJLPT', label: 'profileSetup.categoryJLPT' },
  { key: 'categorySAT', label: 'profileSetup.categorySAT' },
  { key: 'categoryGRE', label: 'profileSetup.categoryGRE' },
  { key: 'toeic', label: 'quickFilters.toeic', namespace: 'buddy' },

  // Other
  { key: 'categoryDataScience', label: 'profileSetup.categoryDataScience' },
  { key: 'categoryUIUX', label: 'profileSetup.categoryUIUX' },
  { key: 'categoryMarketing', label: 'profileSetup.categoryMarketing' },
  { key: 'other', label: 'profileSetup.other' },
];

export type SubjectKey = (typeof AVAILABLE_SUBJECTS)[number]['key'];
