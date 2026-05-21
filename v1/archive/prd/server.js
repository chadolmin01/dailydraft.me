import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const ANALYSIS_PROMPT = `당신은 스타트업 아이디어 분석가입니다. 4명의 팀원이 제출한 텍스트에서 핵심 정보를 추출하세요.

[중요 원칙]
- 짧은 문장이라도 최대한 의미를 파악하여 추출하세요.
- 절대로 "불명확"이라고 하지 마세요. 짧더라도 있는 그대로 추출하세요.

JSON 형식:
{
  "domain": "제품 도메인",
  "product_type": "앱/웹/서비스",
  "founder_intent": { "core_idea": "핵심 아이디어", "keywords": ["키워드"] },
  "planner_intent": { "business_model": "수익 모델", "priority_features": ["기능"], "keywords": ["키워드"] },
  "designer_intent": { "mood": "분위기", "references": ["레퍼런스"], "keywords": ["키워드"] },
  "developer_intent": { "suggested_stack": ["기술스택"], "platforms": ["플랫폼"], "keywords": ["키워드"] },
  "conflicts": [{ "type": "충돌유형", "description": "내용", "roles": ["역할"] }],
  "missing_info": ["누락정보"]
}`;

const PRD_PROMPT = `당신은 IT 스타트업의 수석 PM입니다. 분석된 입력 데이터를 바탕으로 PRD 초안을 작성하세요.

[MVP 수렴 원칙 - 반드시 준수]

1. P0는 핵심 가설 검증 기능만:
   - MVP의 목적은 "유저가 이 서비스를 쓰는가?"를 검증하는 것
   - 결제/구독 시스템은 P1 이하로. PG사 연동은 MVP에서 제외하고 수동/폼 결제로 우회
   - P0는 최대 1-2개만. 나머지는 P1, P2로 내려라

2. 기술 스택은 하나로 수렴:
   - 웹(Next.js/React)과 앱(Flutter/RN)이 동시에 제안되면, 반드시 하나만 선택하라
   - 선택 기준: 타겟 유저 접근성. 결정을 내리고, 나머지는 skip_for_now에 넣어라
   - "검토 필요"라고 쓰지 말고 "X로 간다"고 결론 내려라

3. open_questions는 진짜 결정 못하는 것만:
   - 기술 스택 선택 같은 건 AI가 결정하라
   - open_questions에는 비즈니스 판단이 필요한 것만 (가격 정책, 파트너십 등)

4. 기능 추론 금지:
   - 사용자가 언급하지 않은 기능을 추가하지 마라

JSON 스키마:
{
  "elevator_pitch": "제품 한 줄 요약",
  "problem_and_target": {
    "persona": "타겟 유저",
    "pain_point": "해결하려는 불편함",
    "current_alternative": "현재 대안"
  },
  "core_features": [
    { "feature_name": "기능명", "user_story": "사용자는 ~을 위해 ~을 할 수 있다", "priority": "P0/P1/P2" }
  ],
  "role_perspectives": {
    "business": { "monetization": "수익 모델", "key_metrics": "핵심 지표" },
    "design": { "mood_keywords": ["키워드"], "references": ["레퍼런스"] },
    "tech": { "expected_stack": ["기술"], "technical_risks": "기술적 제약" }
  },
  "open_questions": [
    { "issue": "논의 필요 사항", "involved_roles": ["역할"], "ai_suggestion": "AI 중재안" }
  ],
  "next_steps": {
    "immediate_action": "MVP 개발 전 가장 먼저 해야 할 한 가지 (구체적으로)",
    "mvp_scope": ["MVP에 반드시 포함할 핵심 기능 2-3개만"],
    "skip_for_now": ["MVP에서 제외하고 나중에 할 것들"],
    "decision_needed": "이번 주 안에 팀이 결정해야 할 사항 한 가지"
  }
}`;

app.post('/api/generate', async (req, res) => {
  try {
    const { founder, planner, designer, developer } = req.body;

    const rawInput = `[창업자] ${founder || '(없음)'}\n[기획자] ${planner || '(없음)'}\n[디자이너] ${designer || '(없음)'}\n[개발자] ${developer || '(없음)'}`;

    // 1단계: 분석
    const analysisModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: ANALYSIS_PROMPT,
      generationConfig: { responseMimeType: 'application/json' }
    });
    const analysis = JSON.parse((await analysisModel.generateContent(rawInput)).response.text());

    // 2단계: PRD 생성
    const prdModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: PRD_PROMPT,
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prdPrompt = `도메인: ${analysis.domain}
창업자: ${analysis.founder_intent.core_idea}
기획자 BM: ${analysis.planner_intent.business_model} (결제 시스템은 MVP에서 P1 이하로)
디자이너: ${analysis.designer_intent.mood}, 레퍼런스: ${analysis.designer_intent.references.join(', ')}
개발자 제안 스택: ${analysis.developer_intent.suggested_stack.join(', ')} (2개 이상이면 하나만 선택하고 결론 내려라)
플랫폼: ${analysis.developer_intent.platforms.join(', ')}
충돌: ${analysis.conflicts.length > 0 ? analysis.conflicts.map(c => c.description).join(', ') : '없음'}`;

    const prd = JSON.parse((await prdModel.generateContent(prdPrompt)).response.text());

    res.json({ success: true, data: prd, analysis });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`PRD Generator: http://localhost:${PORT}`));
