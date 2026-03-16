import { AnalysisResult, Artifacts, ValidationLevel } from "./types";

// 레벨 변환 (프론트엔드 enum -> 백엔드 string)
const convertLevel = (level: ValidationLevel): string => {
  switch (level) {
    case ValidationLevel.SKETCH:
      return 'sketch';
    case ValidationLevel.DEFENSE:
      return 'investor';
    case ValidationLevel.MVP:
    default:
      return 'mvp';
  }
};

export const analyzeIdea = async (
  idea: string,
  conversationHistory: string[] = [],
  level: ValidationLevel = ValidationLevel.MVP
): Promise<AnalysisResult> => {
  try {
    const backendLevel = convertLevel(level);

    const response = await fetch('/api/idea-validator/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idea,
        conversationHistory,
        level: backendLevel
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Analysis failed');
    }

    return data.result as AnalysisResult;

  } catch (error) {
    console.error("Analysis Error:", error);
    return {
      responses: [{
        role: 'System' as any,
        name: '시스템',
        avatar: '',
        content: '일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
        tone: 'Neutral' as any,
        suggestedActions: ['잠시 후 다시 시도해주세요']
      }],
      metrics: {
        score: 0,
        developerScore: 0,
        designerScore: 0,
        vcScore: 0,
        keyRisks: [],
        keyStrengths: [],
        summary: "일시적인 오류가 발생했습니다."
      }
    };
  }
};

export const generateFinalArtifacts = async (
  idea: string,
  fullConversation: string,
  reflectedAdvice: string[]
): Promise<Artifacts> => {
  try {
    const response = await fetch('/api/idea-validator/generate-artifacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idea,
        fullConversation,
        reflectedAdvice
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Artifact generation failed');
    }

    return data.result as Artifacts;

  } catch (error) {
    console.error("Artifact Generation Error:", error);
    const errorMsg = '일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.';
    return {
      prd: {
        projectName: "생성 실패",
        version: "-",
        tagline: errorMsg,
        overview: errorMsg,
        targetAudience: [],
        coreFeatures: [],
        techStack: [],
        successMetrics: [],
        userFlow: ""
      },
      jd: {
        roleTitle: "생성 실패",
        department: "-",
        companyIntro: errorMsg,
        responsibilities: [],
        qualifications: [],
        preferred: [],
        benefits: []
      },
      score: 0,
      ideaSummary: errorMsg,
      personaScores: { developer: 0, designer: 0, vc: 0 },
      actionPlan: { developer: [], designer: [], vc: [] }
    };
  }
};
