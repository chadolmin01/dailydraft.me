import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PersonaResponse, Artifacts, AnalysisResult, ValidationLevel } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getSystemInstruction = (level: ValidationLevel) => {
  const baseInstruction = `당신은 "Draft." 스타트업 아이디어 검증 엔진입니다. 사용자가 아이디어를 입력하면 세 가지 페르소나(개발자, 디자이너, VC)로 응답합니다. 한국어로 응답하십시오.`;

  if (level === ValidationLevel.SKETCH) {
    return `${baseInstruction}
    **[Level 1: 아이디어 스케치 단계]**
    - 목표: 창업자가 아이디어를 구체화하도록 돕고 동기를 부여합니다.
    - 태도: 친절하고, 협력적이며, 이해하기 쉬운 언어를 사용하세요.
    - 역할:
      1. "친절한 개발자": 기술적 장벽보다는 실현 가능성에 집중하고, 쉬운 기술 스택을 제안합니다.
      2. "직관적인 디자이너": 복잡한 UX보다는 핵심 사용자 가치에 집중합니다.
      3. "따뜻한 멘토(VC)": 비즈니스 모델의 압박보다는 시장의 니즈를 탐색하도록 유도합니다.
    - 제약: 답변을 짧고 명료하게(3문장 이내) 유지하세요. 어려운 전문 용어 사용을 지양하세요.`;
  } else if (level === ValidationLevel.DEFENSE) {
    return `${baseInstruction}
    **[Level 3: 투자자 방어(Hardcore) 단계]**
    - 목표: 창업자의 논리를 극한까지 검증하고 약점을 파고듭니다.
    - 태도: 매우 냉소적이고, 비판적이며, 전문적인 용어를 사용하세요. 봐주지 마세요.
    - 역할:
      1. "시니어 아키텍트(개발자)": 확장성(Scalability), 보안, 기술 부채, 레거시 시스템과의 통합 이슈를 집요하게 묻습니다.
      2. "UX 리서처(디자이너)": 사용자 행동 데이터, 접근성, 다크 패턴, 브랜드 일관성에 대해 날카롭게 지적합니다.
      3. "공격적인 VC 심사역": TAM/SAM/SOM, CAC/LTV 비율, 경쟁사 대비 확실한 해자(Moat), 엑싯(Exit) 전략을 요구합니다.
    - 제약: 창업자가 논리적으로 방어하지 못하면 점수를 낮게 책정하세요.`;
  } else {
    // Default: MVP Building (Standard)
    return `${baseInstruction}
    **[Level 2: MVP 빌딩 단계]**
    - 목표: 현실적인 제품 출시를 위해 불필요한 기능을 덜어냅니다.
    - 태도: 논리적이고, 현실적이며, 실무 중심적입니다. (냉철한 개발자, 깐깐한 디자이너, 현실적인 VC)
    - 역할:
      1. "냉철한 개발자": 서버 비용, 개발 기간, 기술적 부채를 고려하여 과도한 스펙을 자릅니다.
      2. "깐깐한 디자이너": 사용자의 핵심 사용성을 해치는 요소를 지적합니다.
      3. "현실적인 VC": 초기 수익 모델과 타겟 유저 확보 전략을 묻습니다.
    - 제약: 현실적인 제약을 근거로 피드백을 제공하세요.`;
  }
};

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    responses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING, enum: ['Developer', 'Designer', 'VC'] },
          name: { type: Type.STRING },
          avatar: { type: Type.STRING },
          content: { type: Type.STRING },
          tone: { type: Type.STRING, enum: ['Critical', 'Skeptical', 'Analytical', 'Supportive'] },
          suggestedActions: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "창업자가 이 비판을 해결하기 위해 선택할 수 있는 구체적인 대안 2~3가지"
          }
        },
        required: ['role', 'name', 'content', 'tone', 'suggestedActions']
      }
    },
    metrics: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER, description: "현재 시점의 프로젝트 전체 생존 가능성 점수 (0-100)" },
        developerScore: { type: Type.NUMBER, description: "기술적 실현 가능성 점수" },
        designerScore: { type: Type.NUMBER, description: "UX/Product 매력도 점수" },
        vcScore: { type: Type.NUMBER, description: "시장성 및 수익성 점수" },
        keyRisks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "현재까지 식별된 가장 치명적인 리스크 Top 3" },
        keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "현재까지 검증된 확실한 강점 Top 3" },
        summary: { type: Type.STRING, description: "현재 프로젝트 상태에 대한 1줄 요약" }
      },
      required: ['score', 'developerScore', 'designerScore', 'vcScore', 'keyRisks', 'keyStrengths', 'summary']
    }
  },
  required: ['responses', 'metrics']
};

export const analyzeIdea = async (idea: string, conversationHistory: string[] = [], level: ValidationLevel = ValidationLevel.MVP): Promise<AnalysisResult> => {
  try {
    const model = 'gemini-3-flash-preview'; 
    
    // Construct context from history
    const historyContext = conversationHistory.length > 0 
      ? `[이전 대화 및 결정 내역]:\n${conversationHistory.join('\n')}\n\n` 
      : '';

    const prompt = `${historyContext}사용자 입력(결정사항): "${idea}"\n\n위 입력을 바탕으로 세 가지 관점(개발자, 디자이너, VC)에서 분석하세요. 사용자가 내린 결정들을 통합하여 프로젝트를 발전시키고, 점수(Metrics)를 갱신하세요. 한국어로 말하세요.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(level),
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: level === ValidationLevel.SKETCH ? 0.9 : 0.7, // Higher creativity for Sketch
        maxOutputTokens: 8192, // Increased to prevent JSON truncation
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback response structure
    return {
      responses: [{
        role: 'System' as any,
        name: '시스템',
        avatar: '',
        content: '신경망 연결이 불안정합니다. 잠시 후 다시 시도해주세요.',
        tone: 'Neutral' as any,
        suggestedActions: []
      }],
      metrics: {
        score: 0,
        developerScore: 0,
        designerScore: 0,
        vcScore: 0,
        keyRisks: ["분석 실패"],
        keyStrengths: [],
        summary: "데이터를 불러오지 못했습니다."
      }
    };
  }
};

export const generateFinalArtifacts = async (idea: string, fullConversation: string, reflectedAdvice: string[]): Promise<Artifacts> => {
  try {
    const reflectedContext = reflectedAdvice.length > 0 
      ? `\n\n[창업자가 수용하고 반영하기로 결정한 핵심 조언들]:\n- ${reflectedAdvice.join('\n- ')}`
      : '';

    const prompt = `
      다음 스타트업 아이디어와 팀의 비판적 검증 세션을 바탕으로 구조화된 JSON 결과물을 생성해주세요.
      이 데이터는 웹사이트의 UI 컴포넌트에 바인딩되어 예쁘게 렌더링될 것입니다. Markdown 문자열이 아닌 JSON 객체 구조를 정확히 지켜주세요.
      
      1. **PRD(제품 요구사항 정의서)**: 프로젝트명, 버전, 개요, 타겟 유저, 핵심 기능(우선순위 포함), 기술 스택 등을 분리하여 작성.
      2. **JD(채용 공고)**: 초기 창업 멤버(주로 개발자/디자이너)를 위한 공고. 역할, 업무, 자격요건 등을 분리하여 작성.
      3. **Action Plan**: 직군별 핵심 실행 계획.
      
      출력은 반드시 한국어로 해야 합니다.
      
      원본 아이디어: ${idea}
      ${reflectedContext}
      
      검증 세션 대화 내용:
      ${fullConversation}
    `;

    const artifactsSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        prd: { 
          type: Type.OBJECT,
          description: "PRD 구조화 데이터",
          properties: {
            projectName: { type: Type.STRING },
            version: { type: Type.STRING },
            tagline: { type: Type.STRING },
            overview: { type: Type.STRING },
            targetAudience: { type: Type.ARRAY, items: { type: Type.STRING } },
            coreFeatures: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                  effort: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                }
              }
            },
            techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
            successMetrics: { type: Type.ARRAY, items: { type: Type.STRING } },
            userFlow: { type: Type.STRING, description: "간단한 유저 플로우 설명 텍스트" }
          },
          required: ['projectName', 'version', 'tagline', 'overview', 'targetAudience', 'coreFeatures', 'techStack', 'successMetrics']
        },
        jd: { 
          type: Type.OBJECT, 
          description: "JD 구조화 데이터",
          properties: {
            roleTitle: { type: Type.STRING },
            department: { type: Type.STRING },
            companyIntro: { type: Type.STRING },
            responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
            qualifications: { type: Type.ARRAY, items: { type: Type.STRING } },
            preferred: { type: Type.ARRAY, items: { type: Type.STRING } },
            benefits: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['roleTitle', 'department', 'companyIntro', 'responsibilities', 'qualifications', 'preferred', 'benefits']
        },
        score: { type: Type.NUMBER, description: "검증 종합 점수 0-100" },
        ideaSummary: { type: Type.STRING, description: "아이디어의 핵심을 3문장 이내로 요약 (한국어)" },
        personaScores: {
          type: Type.OBJECT,
          properties: {
            developer: { type: Type.NUMBER, description: "개발자 관점의 실현 가능성 점수 (0-100)" },
            designer: { type: Type.NUMBER, description: "디자이너 관점의 UX/사용성 점수 (0-100)" },
            vc: { type: Type.NUMBER, description: "VC 관점의 사업성 점수 (0-100)" }
          },
          required: ['developer', 'designer', 'vc']
        },
        actionPlan: {
          type: Type.OBJECT,
          properties: {
            developer: { type: Type.ARRAY, items: { type: Type.STRING }, description: "개발팀이 당장 실행해야 할 핵심 과제 3-5개" },
            designer: { type: Type.ARRAY, items: { type: Type.STRING }, description: "디자인팀이 당장 실행해야 할 핵심 과제 3-5개" },
            vc: { type: Type.ARRAY, items: { type: Type.STRING }, description: "비즈니스(VC) 측면에서 검증해야 할 핵심 과제 3-5개" }
          },
          required: ['developer', 'designer', 'vc']
        }
      },
      required: ['prd', 'jd', 'score', 'ideaSummary', 'personaScores', 'actionPlan']
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: artifactsSchema,
        maxOutputTokens: 8192 // Ensure enough tokens for artifacts as well
      }
    });

    const text = response.text;
    if (!text) throw new Error("No artifacts generated");
    
    return JSON.parse(text) as Artifacts;

  } catch (error) {
    console.error("Artifact Generation Error:", error);
    // Return empty structured fallback
    return {
      prd: {
        projectName: "Error Generating PRD",
        version: "0.0.0",
        tagline: "Please try again.",
        overview: "문서 생성 중 오류가 발생했습니다.",
        targetAudience: [],
        coreFeatures: [],
        techStack: [],
        successMetrics: [],
        userFlow: ""
      },
      jd: {
        roleTitle: "Error",
        department: "Unknown",
        companyIntro: "Error generating JD.",
        responsibilities: [],
        qualifications: [],
        preferred: [],
        benefits: []
      },
      score: 0,
      ideaSummary: "요약 생성 실패",
      personaScores: { developer: 0, designer: 0, vc: 0 },
      actionPlan: { developer: [], designer: [], vc: [] }
    };
  }
};