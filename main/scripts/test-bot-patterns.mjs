/**
 * 봇 패턴 감지 테스트
 * 10가지 시나리오의 가상 대화 → pre-filter + AI 분류 결과 확인
 *
 * 사용법: node scripts/test-bot-patterns.mjs
 * 환경변수: GEMINI_API_KEY 또는 GOOGLE_API_KEY
 */

// Pre-filter 로직을 직접 포팅 (ESM 호환)
const URL_REGEX = /https?:\/\/[^\s<>)"]+/g;
const DECISION_KEYWORDS = /뭘로|어떡|어떻게\s*할|어느\s*게|1안|2안|A안|B안|vs|ㅋㅋ.*둘다|고민|결정.*못|안\s*정한/;
const TASK_KEYWORDS = /할게|해놓을게|해줘|해주면|맡을게|담당|이번\s*주\s*까지|내일\s*까지|ㅇㅋ/;
const SCHEDULE_KEYWORDS = /모이자|만나자|가능|안\s*돼|수업|알바|몇\s*시|몇\s*요일|월요일|화요일|수요일|목요일|금요일|토요일|일요일/;
const BLOCKER_KEYWORDS = /삽질|안\s*됨|안\s*돼|에러|왜\s*이런|계속|시간째|모르겠|막힘|해결.*안/;
const SCOPE_KEYWORDS = /도\s*넣으면|도\s*하면|도\s*해야|추가.*하면|기능.*더/;
const RETRO_KEYWORDS = /다음에는|이번에.*힘|빡셌|아쉬|잘\s*했|개선|반성|뭐가.*문제/;
const END_KEYWORDS = /수고|ㄱㅅ|고생|바이|다음에\s*봐|여기까지|끝|이만|잘\s*자|ㅂㅂ|빠이|그럼.*각자|이렇게\s*하자|정리.*됐/;
const HANDOFF_KEYWORDS = /다\s*했어|완성|끝났|완료|확인.*해줘|봐줘|작업\s*시작/;
const UNOWNED_KEYWORDS = /누가\s*하|누가\s*할|담당자|맡을\s*사람/;

function makeMsg(authorName, content, minutesAgo = 0) {
  return {
    id: Math.random().toString(36).slice(2),
    content,
    authorId: authorName,
    authorName,
    isBot: false,
    timestamp: new Date(Date.now() - minutesAgo * 60000),
    urls: content.match(URL_REGEX) ?? [],
    channelId: 'test-channel',
    guildId: 'test-guild',
  };
}

function prefilter(messages) {
  if (messages.length < 2) return [];
  const combined = messages.map(m => m.content).join(' ');
  const results = [];

  const lastMsg = messages[messages.length - 1].content;
  if (END_KEYWORDS.test(lastMsg)) results.push({ type: 'conversation-end', confidence: 0.7 });
  if (messages.some(m => m.urls.length > 0)) results.push({ type: 'resource-shared', confidence: 0.8 });
  if (messages.length >= 3 && DECISION_KEYWORDS.test(combined)) results.push({ type: 'decision-deadlock', confidence: 0.6 });
  if (TASK_KEYWORDS.test(combined)) results.push({ type: 'task-assignment', confidence: 0.65 });
  if (SCHEDULE_KEYWORDS.test(combined) && messages.length >= 3) results.push({ type: 'schedule-coordination', confidence: 0.7 });

  const authorCounts = new Map();
  messages.forEach(m => {
    if (BLOCKER_KEYWORDS.test(m.content)) authorCounts.set(m.authorName, (authorCounts.get(m.authorName) ?? 0) + 1);
  });
  for (const [, count] of authorCounts) {
    if (count >= 2) { results.push({ type: 'blocker-frustration', confidence: 0.5 }); break; }
  }

  if (SCOPE_KEYWORDS.test(combined)) results.push({ type: 'scope-creep', confidence: 0.4 });
  if (RETRO_KEYWORDS.test(combined) && messages.length >= 3) results.push({ type: 'retrospective', confidence: 0.5 });
  if (HANDOFF_KEYWORDS.test(combined)) results.push({ type: 'handoff-pending', confidence: 0.5 });
  if (UNOWNED_KEYWORDS.test(combined)) results.push({ type: 'unowned-task', confidence: 0.7 });

  return results;
}

// ── 테스트 시나리오 ──

const scenarios = [
  {
    name: '1. 결정 교착',
    expected: 'decision-deadlock',
    messages: [
      makeMsg('민준', '근데 DB를 뭘로 할지 아직 안정한거 아님?', 5),
      makeMsg('서연', '나는 Supabase가 좋다고 했는데', 4),
      makeMsg('지호', 'Firebase도 괜찮지않나 실시간 되잖아', 3),
      makeMsg('서연', '근데 Firebase 쿼리 개불편함', 2),
      makeMsg('지호', 'ㅋㅋ 뭐 둘다 돼긴 하는데', 1),
      makeMsg('민준', '그럼 어떡함 ㅋㅋ', 0),
    ]
  },
  {
    name: '2. 할 일 배정',
    expected: 'task-assignment',
    messages: [
      makeMsg('하은', '아 그러면 API 명세서는 내가 이번주까지 만들어놓을게', 3),
      makeMsg('도윤', 'ㄱㄱ 나는 피그마 와이어프레임 이어서 할게', 2),
      makeMsg('하은', '수현이는 DB 설계 해주면 되는거지?', 1),
      makeMsg('수현', '응응 ㅇㅋ', 0),
    ]
  },
  {
    name: '3. 일정 조율',
    expected: 'schedule-coordination',
    messages: [
      makeMsg('예준', '이번주 중에 한번 모이자 오프라인으로', 5),
      makeMsg('소율', '나 수요일 저녁 가능~', 4),
      makeMsg('지민', '수요일 수업있어ㅠ 목요일은?', 3),
      makeMsg('예준', '목요일 저녁 ㄱㄴ', 2),
      makeMsg('소율', '목요일은 알바있는데.. 금요일은?', 1),
    ]
  },
  {
    name: '4. 링크 공유',
    expected: 'resource-shared',
    messages: [
      makeMsg('유진', '피그마 업데이트 했어 확인해봐', 3),
      makeMsg('유진', 'https://figma.com/file/abc123/test', 2),
      makeMsg('시우', '오 ㄷㄷ 많이 바뀌었네', 1),
      makeMsg('은서', '나도 볼게 그리고 이거 참고자료 https://dribbble.com/shots/xyz', 0),
    ]
  },
  {
    name: '5. 블로커',
    expected: 'blocker-frustration',
    messages: [
      makeMsg('현우', '아 나 이거 3시간째 삽질중인데 안됨 ㅋㅋ', 3),
      makeMsg('현우', 'CORS 에러 계속 나는데 왜 이런거지', 2),
      makeMsg('현우', '스택오버플로우 답변대로 해도 안돼', 1),
    ]
  },
  {
    name: '6. 스코프 크립',
    expected: 'scope-creep',
    messages: [
      makeMsg('태민', '아 근데 여기에 다크모드도 넣으면 좋겠다', 3),
      makeMsg('수아', '오 ㅋㅋ 맞아 요즘 다크모드 없으면 좀 그렇지', 2),
      makeMsg('태민', '그리고 다국어도 해야하나?', 1),
    ]
  },
  {
    name: '7. 핸드오프',
    expected: 'handoff-pending',
    messages: [
      makeMsg('서윤', '로그인 페이지 디자인 다 했어', 3),
      makeMsg('서윤', '확인하고 작업 시작해줘~', 2),
    ]
  },
  {
    name: '8. 회고',
    expected: 'retrospective',
    messages: [
      makeMsg('예지', '이번에 발표 준비 진짜 빡셌다..', 4),
      makeMsg('동혁', 'ㅇㅇ 다음에는 좀 더 일찍 시작하자', 3),
      makeMsg('예지', '맞아 그리고 ppt 만드는거 한명이 다 하지말고 나누자', 2),
      makeMsg('동혁', 'ㅇㅇ 역할분담을 좀 더 확실히 해야할듯', 1),
    ]
  },
  {
    name: '9. 담당자 미정',
    expected: 'unowned-task',
    messages: [
      makeMsg('유나', '발표자료 제출 마감이 금요일인데', 4),
      makeMsg('성민', '아 맞다 그거 해야하는데', 3),
      makeMsg('유나', 'ㅇㅇ 누가 하지?', 2),
      makeMsg('성민', '음..', 1),
    ]
  },
  {
    name: '10. 대화 종결',
    expected: 'conversation-end',
    messages: [
      makeMsg('민준', '그럼 이렇게 하자', 3),
      makeMsg('서연', 'ㅇㅇ 수고~', 2),
      makeMsg('지호', 'ㄱㅅ 다음에 봐', 0),
    ]
  },
];

// ── 실행 ──

console.log('=== Discord 봇 패턴 감지 테스트 ===\n');

let passed = 0;
let failed = 0;

for (const scenario of scenarios) {
  const results = prefilter(scenario.messages);
  const types = results.map(r => r.type);
  const detected = types.includes(scenario.expected);

  const status = detected ? '✅ PASS' : '❌ FAIL';
  if (detected) passed++; else failed++;

  console.log(`${status} | ${scenario.name}`);
  console.log(`  기대: ${scenario.expected}`);
  console.log(`  감지: ${results.map(r => `${r.type}(${r.confidence})`).join(', ') || '없음'}`);
  console.log();
}

console.log(`\n결과: ${passed}/${scenarios.length} 통과, ${failed} 실패`);

// AI 분류 테스트 (선택적, GEMINI_API_KEY 필요)
if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
  console.log('\n=== AI 분류 테스트 (시나리오 1: 결정 교착) ===\n');

  const { GoogleGenAI } = await import('@google/genai');
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  const conversation = scenarios[0].messages
    .map(m => `[${m.timestamp.toLocaleTimeString('ko-KR')}] ${m.authorName}: ${m.content}`)
    .join('\n');

  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: [{ role: 'user', parts: [{ text: `다음 Discord 대화를 분석하세요. 후보 패턴: decision-deadlock\n\n대화:\n${conversation}` }] }],
    config: {
      systemInstruction: '대학교 프로젝트 동아리 Discord 대화 분석기. JSON으로만 응답: { "patterns": [{ "type": "패턴", "confidence": 0.0~1.0, "data": { "type": "decision-deadlock", "topic": "주제", "options": ["A","B"], "participants": ["이름"] } }] }',
      temperature: 0.3,
      responseMimeType: 'application/json',
    },
  });

  console.log('AI 응답:');
  console.log(JSON.stringify(JSON.parse(result.text), null, 2));
} else {
  console.log('\n💡 AI 분류 테스트를 하려면 GEMINI_API_KEY를 설정하세요.');
}
