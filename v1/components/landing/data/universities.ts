export interface University {
  id: string;
  name: string;
  nameEng: string;
  lat: number;
  lng: number;
  clubs: ClubData[];
  color: string;
}

export interface ClubData {
  id: string;
  name: string;
  category: string;
  memberCount: number;
  projectCount: number;
  activityScore: number; // 0-100, 건물 높이 결정
  color: string;
}

// 대학 좌표 + 목업 동아리 데이터
export const UNIVERSITIES: University[] = [
  {
    id: 'hufs',
    name: '한국외국어대학교',
    nameEng: 'HUFS',
    lat: 37.3376,
    lng: 127.2656,
    color: '#3B82F6',
    clubs: [
      { id: 'flip', name: 'FLIP', category: '창업', memberCount: 42, projectCount: 8, activityScore: 92, color: '#3B82F6' },
      { id: 'hufs-dev', name: 'DevCrew', category: 'IT/개발', memberCount: 35, projectCount: 6, activityScore: 78, color: '#8B5CF6' },
      { id: 'hufs-ai', name: 'AI Lab', category: 'AI/ML', memberCount: 28, projectCount: 5, activityScore: 85, color: '#06B6D4' },
      { id: 'hufs-design', name: 'DesignX', category: '디자인', memberCount: 20, projectCount: 4, activityScore: 65, color: '#F59E0B' },
    ],
  },
  {
    id: 'khu',
    name: '경희대학교',
    nameEng: 'KHU',
    lat: 37.2430,
    lng: 127.0801,
    color: '#DC2626',
    clubs: [
      { id: 'khu-startup', name: 'LaunchPad', category: '창업', memberCount: 38, projectCount: 7, activityScore: 88, color: '#DC2626' },
      { id: 'khu-code', name: 'CodeSync', category: 'IT/개발', memberCount: 45, projectCount: 9, activityScore: 95, color: '#7C3AED' },
      { id: 'khu-data', name: 'DataDive', category: '데이터', memberCount: 22, projectCount: 3, activityScore: 60, color: '#10B981' },
    ],
  },
  {
    id: 'snu',
    name: '서울대학교',
    nameEng: 'SNU',
    lat: 37.4600,
    lng: 126.9500,
    color: '#1D4ED8',
    clubs: [
      { id: 'snu-waffl', name: 'WAFFLE', category: 'IT/개발', memberCount: 60, projectCount: 12, activityScore: 98, color: '#1D4ED8' },
      { id: 'snu-snulife', name: 'SnuLife', category: '창업', memberCount: 34, projectCount: 6, activityScore: 82, color: '#059669' },
      { id: 'snu-design', name: 'DesignSNU', category: '디자인', memberCount: 25, projectCount: 5, activityScore: 70, color: '#EC4899' },
      { id: 'snu-ai', name: 'DeepSNU', category: 'AI/ML', memberCount: 40, projectCount: 8, activityScore: 90, color: '#F97316' },
      { id: 'snu-biz', name: 'BizLab', category: '경영', memberCount: 30, projectCount: 4, activityScore: 55, color: '#6366F1' },
    ],
  },
  {
    id: 'yonsei',
    name: '연세대학교',
    nameEng: 'Yonsei',
    lat: 37.5664,
    lng: 126.9388,
    color: '#1E40AF',
    clubs: [
      { id: 'yon-pool', name: 'Pool', category: 'IT/개발', memberCount: 50, projectCount: 10, activityScore: 94, color: '#1E40AF' },
      { id: 'yon-ybig', name: 'YBIG', category: '데이터', memberCount: 38, projectCount: 7, activityScore: 86, color: '#0891B2' },
      { id: 'yon-entre', name: 'EntreY', category: '창업', memberCount: 30, projectCount: 5, activityScore: 75, color: '#D97706' },
    ],
  },
  {
    id: 'korea',
    name: '고려대학교',
    nameEng: 'Korea Univ',
    lat: 37.5868,
    lng: 127.0260,
    color: '#991B1B',
    clubs: [
      { id: 'ku-devkor', name: 'DevKor', category: 'IT/개발', memberCount: 55, projectCount: 11, activityScore: 96, color: '#991B1B' },
      { id: 'ku-kucc', name: 'KUCC', category: '컴퓨터', memberCount: 42, projectCount: 8, activityScore: 88, color: '#BE123C' },
      { id: 'ku-startup', name: 'KU Launch', category: '창업', memberCount: 28, projectCount: 5, activityScore: 72, color: '#9333EA' },
    ],
  },
  {
    id: 'kaist',
    name: 'KAIST',
    nameEng: 'KAIST',
    lat: 36.3720,
    lng: 127.3630,
    color: '#0EA5E9',
    clubs: [
      { id: 'kaist-sparcs', name: 'SPARCS', category: 'IT/개발', memberCount: 48, projectCount: 10, activityScore: 97, color: '#0EA5E9' },
      { id: 'kaist-madcamp', name: 'MadCamp', category: '해커톤', memberCount: 35, projectCount: 8, activityScore: 90, color: '#14B8A6' },
      { id: 'kaist-entre', name: 'E*5', category: '창업', memberCount: 32, projectCount: 6, activityScore: 80, color: '#F59E0B' },
    ],
  },
  {
    id: 'postech',
    name: '포항공과대학교',
    nameEng: 'POSTECH',
    lat: 36.0065,
    lng: 129.3203,
    color: '#DC2626',
    clubs: [
      { id: 'pos-popo', name: 'PoPoClub', category: 'IT/개발', memberCount: 30, projectCount: 6, activityScore: 85, color: '#DC2626' },
      { id: 'pos-startup', name: 'PoStart', category: '창업', memberCount: 22, projectCount: 4, activityScore: 68, color: '#7C3AED' },
    ],
  },
  {
    id: 'skku',
    name: '성균관대학교',
    nameEng: 'SKKU',
    lat: 37.2940,
    lng: 126.9747,
    color: '#059669',
    clubs: [
      { id: 'skku-dev', name: 'SKKUDING', category: 'IT/개발', memberCount: 40, projectCount: 8, activityScore: 91, color: '#059669' },
      { id: 'skku-ai', name: 'SKKU AI', category: 'AI/ML', memberCount: 32, projectCount: 5, activityScore: 78, color: '#2563EB' },
      { id: 'skku-biz', name: 'BizSKKU', category: '창업', memberCount: 25, projectCount: 4, activityScore: 62, color: '#EA580C' },
    ],
  },
];

// 카테고리별 색상
export const CATEGORY_COLORS: Record<string, string> = {
  '창업': '#F59E0B',
  'IT/개발': '#3B82F6',
  'AI/ML': '#8B5CF6',
  '디자인': '#EC4899',
  '데이터': '#10B981',
  '경영': '#6366F1',
  '컴퓨터': '#EF4444',
  '해커톤': '#14B8A6',
};
