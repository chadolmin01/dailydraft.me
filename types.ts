export interface Opportunity {
  id: string;
  type: 'Team Building' | 'Startup Support' | 'Education' | 'Space' | 'Marketing' | 'Talent';
  title: string;
  organization: string;
  tags: string[];
  daysLeft?: number;
  matchPercent?: number;
  isSaved?: boolean;
  category: string;
  scope?: 'PROJECT' | 'PROGRAM' | 'TALENT';
}

export interface Program {
  id: string;
  dDay: string;
  title: string;
  organization: string;
  category: string;
  subCategory?: string;
  isSaved?: boolean;
}

export interface UserStats {
  views: number;
  matches: number;
  completeness: number;
}

export interface Skill {
  name: string;
  level?: string;
}

export interface Education {
  school: string;
  major: string;
  status: string;
}

export interface Activity {
  id: string;
  content: string;
  date: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'deadline' | 'meeting' | 'todo';
  time?: string;
  completed: boolean;
}