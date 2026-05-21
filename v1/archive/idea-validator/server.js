import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// Production: Vite 빌드 결과물 서빙
const distPath = join(__dirname, 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ============================================
// 난이도별 설정
// ============================================
const LEVEL_CONFIG = {
  // Level 1: 아이디어 스케치 (Fast/Beginner)
  sketch: {
    name: '아이디어 스케치',
    maxOutputTokens: 200,
    roles: {
      PM: {
        role: 'PM',
        title: '친절한 기획 멘토',
        systemPrompt: `너는 친절하고 동기부여를 해주는 스타트업 멘토야.
초보 창업자의 아이디어에서 좋은 점을 먼저 찾아주고, 부드럽게 기초적인 질문을 던져줘.
너무 어려운 질문은 하지 말고, "어떤 사람들을 위한 서비스인가요?" 같은 기본적인 질문만 해.
짧고 따뜻하게 답해줘.

JSON 형식:
{ "role": "PM", "score": 70, "feedback": "좋은 시작이에요! (1-2문장)", "key_question": "쉬운 질문 하나" }`
      },
      Developer: {
        role: 'Developer',
        title: '친절한 개발 멘토',
        systemPrompt: `너는 친절한 개발 멘토야.
기술적으로 어려운 질문은 하지 말고, "앱으로 만들고 싶으세요, 웹으로 만들고 싶으세요?" 같은 기초 질문만 해.
복잡한 기술 용어는 피하고 쉽게 설명해줘.

JSON 형식:
{ "role": "Developer", "score": 70, "feedback": "재밌는 아이디어네요! (1-2문장)", "key_question": "쉬운 질문 하나" }`
      },
      Designer: {
        role: 'Designer',
        title: '친절한 디자인 멘토',
        systemPrompt: `너는 친절한 UX 멘토야.
"사용자가 앱을 열면 가장 먼저 뭘 하게 되나요?" 같은 기초적인 질문만 해.
긍정적으로 격려하면서 간단한 피드백을 줘.

JSON 형식:
{ "role": "Designer", "score": 70, "feedback": "직관적인 아이디어예요! (1-2문장)", "key_question": "쉬운 질문 하나" }`
      },
      Investor: {
        role: 'Investor',
        title: '친절한 창업 멘토',
        systemPrompt: `너는 친절한 창업 선배야.
투자 용어나 어려운 비즈니스 개념은 피하고, "이 서비스로 어떻게 돈을 벌 수 있을까요?" 같은 기본 질문만 해.
꿈을 응원해주는 톤으로 답해줘.

JSON 형식:
{ "role": "Investor", "score": 70, "feedback": "가능성이 보여요! (1-2문장)", "key_question": "쉬운 질문 하나" }`
      }
    }
  },

  // Level 2: MVP 빌딩 (Standard) - 기본값
  mvp: {
    name: 'MVP 빌딩',
    maxOutputTokens: 400,
    roles: {
      PM: {
        role: 'PM',
        title: '수석 PM',
        systemPrompt: `너는 깐깐한 수석 PM이야. 유저의 아이디어에서 '명확한 타겟 유저'와 '현실적인 수익 모델(BM)'이 있는지 평가해. 무조건 칭찬하지 말고, 비즈니스적 맹점을 지적해.

예시:
{ "role": "PM", "score": 65, "feedback": "타겟 유저는 좋으나, 초기 수익 모델이 불명확합니다.", "key_question": "초기 100명의 유저에게 어떻게 돈을 받을 계획인가요?" }

JSON 형식으로만 답해. score는 0~100.`
      },
      Developer: {
        role: 'Developer',
        title: '시니어 개발자',
        systemPrompt: `너는 현실적인 시니어 개발자야. 유저의 아이디어가 '초기 MVP'로서 개발 기간과 서버 비용이 적절한지 평가해. 오버엔지니어링이 보이면 점수를 깎아.

예시:
{ "role": "Developer", "score": 60, "feedback": "실시간 화상 채팅은 초기 서버 비용이 감당 안 됩니다.", "key_question": "화상 채팅 대신 텍스트 채팅으로 먼저 검증하는 건 어떨까요?" }

JSON 형식으로만 답해. score는 0~100.`
      },
      Designer: {
        role: 'Designer',
        title: '수석 디자이너',
        systemPrompt: `너는 UX를 중시하는 수석 디자이너야. 아이디어가 직관적으로 이해하고 사용할 수 있는 형태인지 평가해. 복잡한 기능이 많으면 점수를 깎아.

예시:
{ "role": "Designer", "score": 75, "feedback": "기능이 심플해서 직관적인 UI 설계가 가능합니다.", "key_question": "사용자가 앱을 켜자마자 가장 먼저 눌러야 하는 버튼은 무엇인가요?" }

JSON 형식으로만 답해. score는 0~100.`
      },
      Investor: {
        role: 'Investor',
        title: '시드 투자자',
        systemPrompt: `너는 수십 개의 스타트업에 투자해본 시드 투자자야. 시장 규모, 경쟁 우위 관점에서 냉정하게 평가해.

예시:
{ "role": "Investor", "score": 60, "feedback": "시장은 크지만 기존 플레이어 대비 차별점이 약합니다.", "key_question": "네이버나 카카오가 똑같은 걸 만들면 어떻게 이길 건가요?" }

JSON 형식으로만 답해. score는 0~100.`
      }
    }
  },

  // Level 3: 투자자 방어 (Pro/Hardcore)
  investor: {
    name: '투자자 방어',
    maxOutputTokens: 600,
    roles: {
      PM: {
        role: 'PM',
        title: 'VC 파트너',
        systemPrompt: `너는 수백 개의 스타트업을 검토한 VC 파트너야. 극도로 까다롭게 평가해.
시장 규모(TAM/SAM/SOM), 경쟁사 분석, PMF 달성 전략, 고객 획득 비용(CAC) vs 생애가치(LTV) 등 투자 관점의 깊은 질문을 던져.
빈틈이 보이면 가차없이 지적하고, 점수를 낮게 줘.

JSON 형식:
{ "role": "PM", "score": 50, "feedback": "TAM은 크지만, SAM 정의가 모호합니다. GTM 전략도 불명확합니다.", "key_question": "첫 1000명의 유저를 어떤 채널로 획득하고, CAC는 얼마로 예상하시나요?" }`
      },
      Developer: {
        role: 'Developer',
        title: 'CTO급 아키텍트',
        systemPrompt: `너는 10년차 CTO급 아키텍트야. 기술 스택, 확장성, 보안, 성능 최적화 관점에서 깊이 있게 검토해.
"Flutter와 Next.js 연동 시 상태 관리는?", "동시 접속 10만 명일 때 DB 샤딩 전략은?" 같은 구체적인 기술 질문을 던져.
기술적 허점이 보이면 가차없이 지적해.

JSON 형식:
{ "role": "Developer", "score": 45, "feedback": "실시간 기능에 WebSocket을 쓴다면, 수평 확장 시 Redis Pub/Sub 또는 별도 메시지 브로커가 필요합니다.", "key_question": "DAU 10만 도달 시 예상 월 서버 비용과 아키텍처 확장 계획을 설명해주세요." }`
      },
      Designer: {
        role: 'Designer',
        title: '글로벌 UX 리드',
        systemPrompt: `너는 빅테크 출신 글로벌 UX 리드야. 사용자 여정, 전환율 최적화, A/B 테스트 전략, 접근성(a11y) 관점에서 깊이 있게 평가해.
"온보딩 퍼널의 예상 드롭률은?", "핵심 CTA까지의 클릭 뎁스는?" 같은 UX 메트릭 기반 질문을 던져.

JSON 형식:
{ "role": "Designer", "score": 55, "feedback": "온보딩 스텝이 5단계는 너무 깁니다. 첫 AHA moment까지 30초 내 도달해야 합니다.", "key_question": "사용자가 서비스의 핵심 가치를 느끼는 'AHA moment'는 무엇이고, 몇 초 만에 도달하나요?" }`
      },
      Investor: {
        role: 'Investor',
        title: '시리즈A VC 심사역',
        systemPrompt: `너는 시리즈A 전문 VC 심사역이야. IR 피칭을 검토하듯 냉정하게 평가해.
유닛 이코노믹스, 번 레이트, 런웨이, Exit 전략, 경쟁사 해자(Moat) 등 투자 심사 관점의 날카로운 질문을 던져.
"왜 지금인가?", "왜 당신 팀인가?"를 집요하게 물어봐.

JSON 형식:
{ "role": "Investor", "score": 40, "feedback": "해자(Moat)가 불명확합니다. 네트워크 효과도, 기술적 우위도, 규제 장벽도 보이지 않습니다.", "key_question": "3년 후 시장 1위가 되었을 때, 후발 주자가 당신을 따라잡지 못하는 이유는 무엇인가요?" }`
      }
    }
  }
};

// 재평가 전용 프롬프트 생성 (레벨별)
function getReEvaluatePrompt(roleConfig, level) {
  const levelConfig = LEVEL_CONFIG[level];
  const bonusRange = level === 'sketch' ? '+5~+15' : level === 'mvp' ? '+10~+25' : '+15~+35';

  return `너는 ${roleConfig.title}야. 지금은 **재평가** 상황이야.
이전에 네가 이 아이디어를 평가하고 질문을 던졌고, 유저가 그 질문에 답변을 가져왔어.

[재평가 및 가산점 지침]
1. 유저의 답변이 논리적이고 좋은 대안을 제시했다면:
   → 기존 점수에서 ${bonusRange}점 올려줘.
   → feedback에 긍정적 반응을 포함해.

2. 유저의 답변이 애매하거나 질문을 회피했다면:
   → 점수를 소폭만 올려줘 (+0~+5점).
   → 더 구체적인 꼬리 질문을 던져.

3. 유저의 답변이 비현실적이라면:
   → 점수를 유지하거나 깎아.
   → 왜 부족한지 지적해.

4. 점수가 80점 이상이면: key_question에 "축하합니다! 이 부분은 충분히 검증되었습니다."
5. 점수가 80점 미만이면: 더 구체적인 꼬리 질문을 던져.

JSON 형식: { "role": "${roleConfig.role}", "score": 85, "feedback": "평가", "key_question": "다음 질문" }`;
}

// 초기 평가 함수
async function evaluateWithRole(idea, roleConfig, level) {
  const levelConfig = LEVEL_CONFIG[level];

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: roleConfig.systemPrompt,
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: levelConfig.maxOutputTokens
    }
  });

  const result = await model.generateContent(
    `다음 스타트업 아이디어를 평가해줘:\n\n${idea}`
  );

  const text = result.response.text();
  return JSON.parse(text);
}

// 재평가 함수
async function reEvaluateWithRole(data, roleConfig, level) {
  const levelConfig = LEVEL_CONFIG[level];

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: getReEvaluatePrompt(roleConfig, level),
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: levelConfig.maxOutputTokens
    }
  });

  const prompt = `[원본 아이디어]
${data.original_idea}

[이전 평가]
- 점수: ${data.history.previous_score}점
- 피드백: ${data.history.previous_feedback}
- 질문: ${data.history.previous_key_question}

[유저의 답변]
${data.user_answer}

위 답변을 평가해줘.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text);
}

// 초기 평가 API
app.post('/api/evaluate', async (req, res) => {
  try {
    const { idea, level = 'mvp' } = req.body;

    if (!idea || idea.trim().length === 0) {
      return res.status(400).json({ success: false, error: '아이디어를 입력해주세요.' });
    }

    const levelConfig = LEVEL_CONFIG[level];
    if (!levelConfig) {
      return res.status(400).json({ success: false, error: '잘못된 레벨입니다.' });
    }

    const roles = levelConfig.roles;
    const [pmResult, devResult, designerResult, investorResult] = await Promise.all([
      evaluateWithRole(idea, roles.PM, level),
      evaluateWithRole(idea, roles.Developer, level),
      evaluateWithRole(idea, roles.Designer, level),
      evaluateWithRole(idea, roles.Investor, level)
    ]);

    res.json({
      success: true,
      level: level,
      levelName: levelConfig.name,
      evaluations: [pmResult, devResult, designerResult, investorResult]
    });

  } catch (error) {
    console.error('Evaluation Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 재평가 API
app.post('/api/re-evaluate', async (req, res) => {
  try {
    const { original_idea, evaluations_with_answers, level = 'mvp' } = req.body;

    if (!original_idea || !evaluations_with_answers) {
      return res.status(400).json({ success: false, error: '필수 파라미터가 누락되었습니다.' });
    }

    const levelConfig = LEVEL_CONFIG[level];
    if (!levelConfig) {
      return res.status(400).json({ success: false, error: '잘못된 레벨입니다.' });
    }

    const roles = levelConfig.roles;

    const reEvalPromises = evaluations_with_answers.map(item => {
      const roleConfig = roles[item.role];
      if (!roleConfig) return Promise.resolve(item);

      if (item.user_answer) {
        return reEvaluateWithRole({
          original_idea,
          history: {
            previous_score: item.previous_score,
            previous_feedback: item.previous_feedback,
            previous_key_question: item.previous_key_question
          },
          user_answer: item.user_answer
        }, roleConfig, level);
      } else {
        return Promise.resolve({
          role: item.role,
          score: item.previous_score,
          feedback: item.previous_feedback,
          key_question: item.previous_key_question
        });
      }
    });

    const results = await Promise.all(reEvalPromises);

    res.json({
      success: true,
      level: level,
      evaluations: results
    });

  } catch (error) {
    console.error('Re-evaluation Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 답변 제안 API
app.post('/api/suggest-answers', async (req, res) => {
  try {
    const { idea, role, question, level = 'mvp' } = req.body;

    if (!idea || !role || !question) {
      return res.status(400).json({ success: false, error: '필수 파라미터가 누락되었습니다.' });
    }

    const levelConfig = LEVEL_CONFIG[level];
    const maxTokens = levelConfig ? levelConfig.maxOutputTokens : 400;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: `스타트업 창업자의 답변을 도와줘.
질문에 대해 현실적인 답변 3가지를 제안해. 각 답변은 서로 다른 방향성을 가져야 해.

JSON 형식:
{
  "suggestions": [
    { "label": "짧은 제목", "answer": "구체적인 답변 (2-3문장)" },
    { "label": "짧은 제목", "answer": "구체적인 답변" },
    { "label": "짧은 제목", "answer": "구체적인 답변" }
  ]
}`,
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: maxTokens
      }
    });

    const prompt = `[아이디어] ${idea}\n[질문] ${question}\n\n답변 3가지 제안해줘.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    res.json({ success: true, suggestions: parsed.suggestions });

  } catch (error) {
    console.error('Suggest Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 레벨 정보 API
app.get('/api/levels', (req, res) => {
  const levels = Object.entries(LEVEL_CONFIG).map(([key, config]) => ({
    id: key,
    name: config.name,
    maxOutputTokens: config.maxOutputTokens
  }));
  res.json({ success: true, levels });
});

// ============================================
// React 프론트엔드용 API (3개 페르소나: Developer, Designer, VC)
// ============================================

// 레벨별 시스템 프롬프트 (React 프론트엔드용)
function getAnalyzeSystemInstruction(level) {
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
}

// 아이디어 분석 API (React 프론트엔드용)
app.post('/api/analyze', async (req, res) => {
  try {
    const { idea, conversationHistory = [], level = 'mvp' } = req.body;

    if (!idea || idea.trim().length === 0) {
      return res.status(400).json({ success: false, error: '아이디어를 입력해주세요.' });
    }

    const historyContext = conversationHistory.length > 0
      ? `[이전 대화 및 결정 내역]:\n${conversationHistory.join('\n')}\n\n`
      : '';

    const prompt = `${historyContext}사용자 입력(결정사항): "${idea}"\n\n위 입력을 바탕으로 세 가지 관점(개발자, 디자이너, VC)에서 분석하세요. 사용자가 내린 결정들을 통합하여 프로젝트를 발전시키고, 점수(Metrics)를 갱신하세요. 한국어로 말하세요.`;

    const maxTokens = level === 'sketch' ? 1000 : 2500;
    const temperature = level === 'sketch' ? 0.9 : 0.7;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: getAnalyzeSystemInstruction(level),
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: maxTokens,
        temperature: temperature,
        responseSchema: {
          type: 'object',
          properties: {
            responses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string', enum: ['Developer', 'Designer', 'VC'] },
                  name: { type: 'string' },
                  avatar: { type: 'string' },
                  content: { type: 'string' },
                  tone: { type: 'string', enum: ['Critical', 'Skeptical', 'Analytical', 'Supportive'] },
                  suggestedActions: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                required: ['role', 'name', 'content', 'tone', 'suggestedActions']
              }
            },
            metrics: {
              type: 'object',
              properties: {
                score: { type: 'number' },
                developerScore: { type: 'number' },
                designerScore: { type: 'number' },
                vcScore: { type: 'number' },
                keyRisks: { type: 'array', items: { type: 'string' } },
                keyStrengths: { type: 'array', items: { type: 'string' } },
                summary: { type: 'string' }
              },
              required: ['score', 'developerScore', 'designerScore', 'vcScore', 'keyRisks', 'keyStrengths', 'summary']
            }
          },
          required: ['responses', 'metrics']
        }
      }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    res.json({ success: true, result: parsed });

  } catch (error) {
    console.error('Analyze Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 아티팩트 생성 API (구조화된 PRD/JD - React 프론트엔드용)
app.post('/api/generate-artifacts', async (req, res) => {
  try {
    const { idea, fullConversation, reflectedAdvice = [] } = req.body;

    if (!idea) {
      return res.status(400).json({ success: false, error: '아이디어가 필요합니다.' });
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
    `;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: 3000,
        responseSchema: {
          type: 'object',
          properties: {
            prd: {
              type: 'object',
              properties: {
                projectName: { type: 'string' },
                version: { type: 'string' },
                tagline: { type: 'string' },
                overview: { type: 'string' },
                targetAudience: { type: 'array', items: { type: 'string' } },
                coreFeatures: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      description: { type: 'string' },
                      priority: { type: 'string', enum: ['High', 'Medium', 'Low'] },
                      effort: { type: 'string', enum: ['High', 'Medium', 'Low'] }
                    }
                  }
                },
                techStack: { type: 'array', items: { type: 'string' } },
                successMetrics: { type: 'array', items: { type: 'string' } },
                userFlow: { type: 'string' }
              },
              required: ['projectName', 'version', 'tagline', 'overview', 'targetAudience', 'coreFeatures', 'techStack', 'successMetrics']
            },
            jd: {
              type: 'object',
              properties: {
                roleTitle: { type: 'string' },
                department: { type: 'string' },
                companyIntro: { type: 'string' },
                responsibilities: { type: 'array', items: { type: 'string' } },
                qualifications: { type: 'array', items: { type: 'string' } },
                preferred: { type: 'array', items: { type: 'string' } },
                benefits: { type: 'array', items: { type: 'string' } }
              },
              required: ['roleTitle', 'department', 'companyIntro', 'responsibilities', 'qualifications', 'preferred', 'benefits']
            },
            score: { type: 'number' },
            ideaSummary: { type: 'string' },
            personaScores: {
              type: 'object',
              properties: {
                developer: { type: 'number' },
                designer: { type: 'number' },
                vc: { type: 'number' }
              },
              required: ['developer', 'designer', 'vc']
            },
            actionPlan: {
              type: 'object',
              properties: {
                developer: { type: 'array', items: { type: 'string' } },
                designer: { type: 'array', items: { type: 'string' } },
                vc: { type: 'array', items: { type: 'string' } }
              },
              required: ['developer', 'designer', 'vc']
            }
          },
          required: ['prd', 'jd', 'score', 'ideaSummary', 'personaScores', 'actionPlan']
        }
      }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    res.json({ success: true, result: parsed });

  } catch (error) {
    console.error('Generate Artifacts Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 아티팩트 생성 API (PRD/JD)
app.post('/api/artifacts', async (req, res) => {
  try {
    const { idea, evaluations, conversationHistory, artifactType } = req.body;

    if (!idea || !artifactType) {
      return res.status(400).json({ success: false, error: '필수 파라미터가 누락되었습니다.' });
    }

    // 평가 요약 생성
    const evaluationSummary = evaluations
      ? evaluations.map(e => `- ${e.role}: ${e.score}점 - ${e.feedback}`).join('\n')
      : '평가 정보 없음';

    // 대화 요약 생성
    const conversationSummary = conversationHistory
      ? conversationHistory
          .filter(m => m.type === 'user')
          .map(m => m.content)
          .join('\n')
      : '';

    let systemPrompt, userPrompt;

    if (artifactType === 'prd') {
      systemPrompt = `너는 경험 많은 PM이야. 스타트업 아이디어를 바탕으로 PRD(Product Requirements Document)를 작성해줘.

PRD 형식:
1. 제품 개요
2. 문제 정의
3. 목표 사용자
4. 핵심 기능 (MVP 범위)
5. 성공 지표 (KPIs)
6. 타임라인 (대략적)
7. 리스크 및 가정

마크다운 형식 없이 깔끔한 텍스트로 작성해줘.`;

      userPrompt = `[아이디어]
${idea}

[평가 피드백]
${evaluationSummary}

[추가 컨텍스트]
${conversationSummary}

위 내용을 바탕으로 PRD를 작성해줘.`;
    } else {
      systemPrompt = `너는 경험 많은 HR 담당자야. 스타트업 아이디어를 바탕으로 JD(Job Description)를 작성해줘.

초기 스타트업에 필요한 핵심 포지션 2-3개에 대해 작성해:
- 포지션명
- 역할 및 책임
- 필수 자격요건
- 우대사항
- 예상 연봉 범위 (시장 기준)

마크다운 형식 없이 깔끔한 텍스트로 작성해줘.`;

      userPrompt = `[아이디어]
${idea}

[평가 피드백]
${evaluationSummary}

위 내용을 바탕으로 초기 스타트업에 필요한 핵심 포지션 JD를 작성해줘.`;
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: 1500
      }
    });

    const result = await model.generateContent(userPrompt);
    const content = result.response.text();

    res.json({ success: true, content });

  } catch (error) {
    console.error('Artifact Generation Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// SPA Fallback: 모든 non-API 라우트에서 index.html 서빙
if (existsSync(distPath)) {
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
