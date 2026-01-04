/**
 * Academic constants for buddy matching
 * Universities, majors, subjects, and projects
 */

// ============================================================================
// Universities (Danh sách trường nổi bật tại Việt Nam)
// ============================================================================

/**
 * Popular universities in Vietnam
 * Users can also input custom university names
 */
export const POPULAR_UNIVERSITIES = [
  // TP. Hồ Chí Minh
  'Đại học Quốc gia TP.HCM',
  'Đại học Bách Khoa TP.HCM',
  'Đại học Công nghệ Thông tin (UIT)',
  'Đại học Khoa học Tự nhiên (HCMUS)',
  'Đại học Kinh tế TP.HCM',
  'Đại học Sư phạm TP.HCM',
  'Đại học Tôn Đức Thắng',
  'Đại học Công nghiệp TP.HCM',
  'Đại học Văn Lang',
  'Đại học Hutech',

  // Hà Nội
  'Đại học Quốc gia Hà Nội',
  'Đại học Bách Khoa Hà Nội',
  'Đại học Công nghệ (UET)',
  'Đại học Kinh tế Quốc dân',
  'Đại học Ngoại thương',
  'Đại học Sư phạm Hà Nội',

  // Các tỉnh thành khác
  'Đại học Đà Nẵng',
  'Đại học Huế',
  'Đại học Cần Thơ',
  'Đại học FPT',
  'Đại học RMIT Việt Nam',
  'Đại học Quốc tế (VNU-IS)',
] as const;

// ============================================================================
// Majors (Danh sách ngành học phổ biến)
// ============================================================================

/**
 * Popular majors/fields of study
 * Users can also input custom major names
 */
export const POPULAR_MAJORS = [
  // Công nghệ thông tin
  'Công nghệ thông tin',
  'Khoa học máy tính',
  'Kỹ thuật phần mềm',
  'Hệ thống thông tin',
  'Mạng máy tính và truyền thông',
  'An toàn thông tin',
  'Trí tuệ nhân tạo',
  'Khoa học dữ liệu',

  // Kỹ thuật
  'Kỹ thuật điện tử',
  'Kỹ thuật cơ khí',
  'Kỹ thuật xây dựng',
  'Kỹ thuật hóa học',
  'Kỹ thuật môi trường',

  // Kinh tế
  'Kinh tế',
  'Quản trị kinh doanh',
  'Kế toán',
  'Tài chính - Ngân hàng',
  'Marketing',
  'Thương mại điện tử',

  // Khác
  'Ngôn ngữ Anh',
  'Ngôn ngữ Nhật',
  'Thiết kế đồ họa',
  'Kiến trúc',
  'Y khoa',
  'Dược',
  'Luật',
] as const;

// ============================================================================
// Subjects (Danh sách môn học nổi bật - IT focused)
// ============================================================================

/**
 * Popular subjects/courses
 * Users can also input custom subject names
 */
export const POPULAR_SUBJECTS = [
  // Lập trình cơ bản
  'Nhập môn lập trình',
  'Lập trình hướng đối tượng',
  'Cấu trúc dữ liệu và giải thuật',
  'Lập trình C/C++',
  'Lập trình Java',
  'Lập trình Python',

  // Web & Mobile
  'Phát triển ứng dụng Web',
  'Phát triển ứng dụng di động',
  'React Native',
  'React.js',
  'Node.js',
  'Flutter',

  // Database & Backend
  'Cơ sở dữ liệu',
  'Hệ quản trị cơ sở dữ liệu',
  'SQL Server',
  'MongoDB',
  'PostgreSQL',

  // AI & Data Science
  'Trí tuệ nhân tạo',
  'Machine Learning',
  'Deep Learning',
  'Xử lý ngôn ngữ tự nhiên',
  'Computer Vision',
  'Data Science',
  'Big Data',

  // Networking & Security
  'Mạng máy tính',
  'An toàn và bảo mật thông tin',
  'Hệ điều hành',
  'Kiến trúc máy tính',

  // Software Engineering
  'Công nghệ phần mềm',
  'Phân tích thiết kế hệ thống',
  'Kiểm thử phần mềm',
  'Quản lý dự án phần mềm',

  // Ngôn ngữ
  'TOEIC',
  'IELTS',
  'JLPT N3',
  'JLPT N2',
  'JLPT N1',
  'Tiếng Anh chuyên ngành',
] as const;

// ============================================================================
// Project Types (Loại đồ án)
// ============================================================================

/**
 * Common project types
 */
export const PROJECT_TYPES = [
  'Đồ án môn học',
  'Đồ án cuối kỳ',
  'Đồ án chuyên ngành',
  'Đồ án tốt nghiệp',
  'Đồ án thực tập',
  'Dự án cá nhân',
  'Dự án nhóm',
  'Hackathon',
  'Nghiên cứu khoa học',
] as const;

// ============================================================================
// Type definitions
// ============================================================================

export type University = (typeof POPULAR_UNIVERSITIES)[number] | string;
export type Major = (typeof POPULAR_MAJORS)[number] | string;
export type Subject = (typeof POPULAR_SUBJECTS)[number] | string;
export type ProjectType = (typeof PROJECT_TYPES)[number] | string;

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Check if a university is in the popular list
 */
export function isPopularUniversity(university: string): boolean {
  return (POPULAR_UNIVERSITIES as readonly string[]).includes(university);
}

/**
 * Check if a major is in the popular list
 */
export function isPopularMajor(major: string): boolean {
  return (POPULAR_MAJORS as readonly string[]).includes(major);
}

/**
 * Check if a subject is in the popular list
 */
export function isPopularSubject(subject: string): boolean {
  return (POPULAR_SUBJECTS as readonly string[]).includes(subject);
}

/**
 * Filter universities by search query
 */
export function filterUniversities(query: string): string[] {
  if (!query.trim()) return [...POPULAR_UNIVERSITIES];
  const lowerQuery = query.toLowerCase();
  return POPULAR_UNIVERSITIES.filter((uni) => uni.toLowerCase().includes(lowerQuery));
}

/**
 * Filter majors by search query
 */
export function filterMajors(query: string): string[] {
  if (!query.trim()) return [...POPULAR_MAJORS];
  const lowerQuery = query.toLowerCase();
  return POPULAR_MAJORS.filter((major) => major.toLowerCase().includes(lowerQuery));
}

/**
 * Filter subjects by search query
 */
export function filterSubjects(query: string): string[] {
  if (!query.trim()) return [...POPULAR_SUBJECTS];
  const lowerQuery = query.toLowerCase();
  return POPULAR_SUBJECTS.filter((subject) => subject.toLowerCase().includes(lowerQuery));
}
