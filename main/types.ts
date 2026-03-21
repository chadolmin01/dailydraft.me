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

// PRD Generator Types
export interface PRDProblemAndTarget {
  persona: string;
  pain_point: string;
  current_alternative: string;
}

export interface PRDCoreFeature {
  feature_name: string;
  user_story: string;
  priority: 'P0' | 'P1' | 'P2';
}

export interface PRDRolePerspectives {
  business: { monetization: string; key_metrics: string };
  design: { mood_keywords: string[]; references: string[] };
  tech: { expected_stack: string[]; technical_risks: string };
}

export interface PRDOpenQuestion {
  issue: string;
  involved_roles: string[];
  ai_suggestion: string;
}

export interface PRDNextSteps {
  immediate_action: string;
  mvp_scope: string[];
  skip_for_now: string[];
  decision_needed: string;
}

export interface PRDResult {
  elevator_pitch: string;
  problem_and_target: PRDProblemAndTarget;
  core_features: PRDCoreFeature[];
  role_perspectives: PRDRolePerspectives;
  open_questions: PRDOpenQuestion[];
  next_steps: PRDNextSteps;
}

export interface PRDResponse {
  success: boolean;
  data?: PRDResult;
  error?: string;
}

export interface PRDInput {
  pm: string;
  designer: string;
  developer: string;
}

// === Team Alignment Types (from temp-analysis) ===

export enum Role {
  PM = 'Product Manager',
  DESIGNER = 'Designer',
  DEV = 'Developer'
}

export interface RoleInputData {
  role: Role;
  content: string;
  isSubmitted: boolean;
}

export interface LogEntry {
  id: number;
  role: Role;
  timestamp: Date;
  action: string;
  content: string;
}

export interface AnalysisResult {
  elevatorPitch: string;
  problemTarget: {
    problem: string;
    targetAudience: string;
    alternatives: string;
  };
  coreFeatures: {
    p0: string[];
    p1: string[];
    p2: string[];
  };
  rolePerspectives: {
    pmFocus: string;
    designFocus: string;
    devFocus: string;
  };
  openQuestions: string[];
  nextSteps: {
    immediateAction: string;
    mvpScope: string;
    nextMeetingTopic: string;
  };
}

// === Phase 3: Task Breakdown Types ===

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export type TaskType = 'PLANNING' | 'DESIGN' | 'ARCHITECTURE' | 'FRONTEND' | 'BACKEND' | 'DEVOPS' | 'MARKETING';

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  userInitials: string;
  content: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  type: TaskType;
  assignee?: string;
  estimate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  comments: TaskComment[];
  externalTicketId?: string;
  synced?: boolean;
}

export interface PRDData {
  title: string;
  summary: string;
  features: string[];
  techStack: string[];
}

export interface IntegrationState {
  jira: boolean;
  linear: boolean;
}