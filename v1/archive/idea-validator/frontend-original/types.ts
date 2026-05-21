export type PersonaRole = 'Developer' | 'Designer' | 'VC' | 'System';

export interface PersonaResponse {
  role: PersonaRole;
  name: string;
  avatar: string;
  content: string;
  tone: 'Critical' | 'Skeptical' | 'Analytical' | 'Neutral' | 'Supportive'; // Added Supportive for Level 1
  suggestedActions?: string[]; // AI provided actionable options
  isReflected?: boolean; // Tracks if user accepted this advice
  reflectedText?: string; // The actual text the user decided to reflect (editable)
}

export interface AnalysisMetrics {
  score: number; // 0-100 overall
  developerScore: number;
  designerScore: number;
  vcScore: number;
  keyRisks: string[]; // List of accumulated risks
  keyStrengths: string[]; // List of validated strengths
  summary: string; // Brief status summary
}

export interface AnalysisResult {
  responses: PersonaResponse[];
  metrics: AnalysisMetrics;
}

export interface ChatMessage {
  id: string;
  isUser: boolean;
  text?: string;
  responses?: PersonaResponse[]; // AI responses come as a set of persona comments
  timestamp: number;
}

export interface PersonaScores {
  developer: number;
  designer: number;
  vc: number;
}

export interface ActionItems {
  developer: string[];
  designer: string[];
  vc: string[];
}

// New Structured Data Types for Rich UI
export interface PrdFeature {
  name: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  effort: 'Low' | 'Medium' | 'High';
}

export interface PrdStructure {
  projectName: string;
  version: string;
  tagline: string;
  overview: string;
  targetAudience: string[];
  coreFeatures: PrdFeature[];
  techStack: string[];
  successMetrics: string[];
  userFlow: string; // Keep as simple text or steps
}

export interface JdStructure {
  roleTitle: string;
  department: string; // e.g., Engineering, Design
  companyIntro: string;
  responsibilities: string[];
  qualifications: string[];
  preferred: string[];
  benefits: string[];
}

export interface Artifacts {
  prd: PrdStructure; // Changed from string to object
  jd: JdStructure;   // Changed from string to object
  score: number;
  ideaSummary: string; // Summary of the idea
  personaScores: PersonaScores; // Breakdown of scores
  actionPlan: ActionItems; // Concrete to-do list
}

export enum AppState {
  SELECTION = 'SELECTION',
  CHAT = 'CHAT',
  RESULT = 'RESULT',
}

export enum ValidationLevel {
  SKETCH = 'SKETCH',   // Level 1: Idea Sketch (Fast/Beginner)
  MVP = 'MVP',         // Level 2: MVP Building (Standard)
  DEFENSE = 'DEFENSE', // Level 3: Investor Defense (Pro/Hardcore)
}
