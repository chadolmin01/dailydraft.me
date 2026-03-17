import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/src/lib/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function getAnalyzeSystemInstruction(level: string) {
  const baseInstruction = `당신은 "Draft." 스타트업 아이디어 검증 엔진입니다. 사용자가 아이디어를 입력하면 세 가지 페르소나(개발자, 디자이너, VC)로 응답합니다. 한국어로 응답하십시오.`;

  if (level === 'sketch') {
    return `${baseInstruction}
    **[Level 1: 아이디어 스케치 단계]**
    - 목표: 창업자가 아이디어를 구체화하도록 돕고 동기를 부여합니다.
    - 태도: 친절하고, 협력적이며, 이해하기 쉬운 언어를 사용하세요.
    - 역할:
      1. "친절한 개발자": 기술적 장벽보다는 실현 가능성에 집중하고, 쉬운 기술 스택을 제안합니다.
      2. "직관적인 디자이너": 복잡한 UX보다는 핵심 사용자 가치에 집중합니다.
      3. "따뜻한 멘토(VC)": 비즈니스 모델의 압박보다는 시장의 니즈를 탐색하도록 유도합니다.
    - 제약: 답변을 짧고 명료하게(3문장 이내) 유지하세요. 어려운 전문 용어 사용을 지양하세요.`;
  } else if (level === 'investor') {
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
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: 'AI 서비스를 사용할 수 없습니다.' }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { idea, conversationHistory = [], level = 'mvp' } = await request.json();

    if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '아이디어를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 입력 길이 제한
    const sanitizedIdea = idea.slice(0, 5000);

    // level 검증
    const validLevels = ['sketch', 'mvp', 'investor'];
    const sanitizedLevel = validLevels.includes(level) ? level : 'mvp';

    // conversationHistory 검증 + 제한
    const validHistory = Array.isArray(conversationHistory)
      ? conversationHistory.filter((h: unknown) => typeof h === 'string').slice(0, 20).map((h: string) => h.slice(0, 2000))
      : [];

    const historyContext = validHistory.length > 0
      ? `[이전 대화 및 결정 내역]:\n${validHistory.join('\n')}\n\n`
      : '';

    const prompt = `${historyContext}사용자 입력(결정사항): <USER_INPUT>${sanitizedIdea}</USER_INPUT>

위 입력을 바탕으로 세 가지 관점(개발자, 디자이너, VC)에서 분석하세요. 사용자가 내린 결정들을 통합하여 프로젝트를 발전시키고, 점수를 갱신하세요. 한국어로 말하세요.

반드시 다음 JSON 형식으로 응답하세요:
{
  "responses": [
    {
      "role": "Developer",
      "name": "개발자",
      "content": "개발자 관점의 피드백 (2-3문장)",
      "tone": "Analytical",
      "suggestedActions": ["구체적인 조언 1", "구체적인 조언 2"]
    },
    {
      "role": "Designer",
      "name": "디자이너",
      "content": "디자이너 관점의 피드백 (2-3문장)",
      "tone": "Creative",
      "suggestedActions": ["구체적인 조언 1", "구체적인 조언 2"]
    },
    {
      "role": "VC",
      "name": "투자자",
      "content": "VC 관점의 피드백 (2-3문장)",
      "tone": "Strategic",
      "suggestedActions": ["구체적인 조언 1", "구체적인 조언 2"]
    }
  ],
  "metrics": {
    "score": 75,
    "developerScore": 70,
    "designerScore": 80,
    "vcScore": 75,
    "keyRisks": ["주요 리스크 1", "주요 리스크 2"],
    "keyStrengths": ["강점 1", "강점 2"],
    "summary": "전체 요약 (1문장)"
  }
}`;

    const maxTokens = level === 'sketch' ? 1000 : 2500;
    const temperature = level === 'sketch' ? 0.9 : 0.7;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: getAnalyzeSystemInstruction(sanitizedLevel),
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: maxTokens,
        temperature: temperature,
      }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error('Analyze JSON parse failed. Raw:', text.slice(0, 200));
      return NextResponse.json(
        { success: false, error: 'AI 응답을 파싱하지 못했습니다. 다시 시도해주세요.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, result: parsed });
  } catch (error) {
    console.error('Analyze Error:', error);
    return NextResponse.json(
      { success: false, error: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
