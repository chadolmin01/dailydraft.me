import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { idea, fullConversation, reflectedAdvice = [] } = await request.json();

    if (!idea) {
      return NextResponse.json(
        { success: false, error: '아이디어가 필요합니다.' },
        { status: 400 }
      );
    }

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
      ${fullConversation || '대화 내용 없음'}

      JSON Schema:
      {
        "prd": { "projectName": "string", "version": "string", "tagline": "string", "overview": "string", "targetAudience": ["string"], "coreFeatures": [{"name": "string", "description": "string", "priority": "High|Medium|Low", "effort": "High|Medium|Low"}], "techStack": ["string"], "successMetrics": ["string"], "userFlow": "string" },
        "jd": { "roleTitle": "string", "department": "string", "companyIntro": "string", "responsibilities": ["string"], "qualifications": ["string"], "preferred": ["string"], "benefits": ["string"] },
        "score": number,
        "ideaSummary": "string",
        "personaScores": { "developer": number, "designer": number, "vc": number },
        "actionPlan": { "developer": ["string"], "designer": ["string"], "vc": ["string"] }
      }
    `;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 8192,
        temperature: 0.7,
      }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    return NextResponse.json({ success: true, result: parsed });
  } catch (error) {
    console.error('Generate Artifacts Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Artifact generation failed' },
      { status: 500 }
    );
  }
}
