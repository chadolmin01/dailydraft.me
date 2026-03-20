import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const url = 'https://prxqjiuibfrmuwwmkhqb.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByeHFqaXVpYmZybXV3d21raHFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ1ODc1MywiZXhwIjoyMDg2MDM0NzUzfQ.bBpowt9nqwDrhsuQpiHvqyTleykQSsV_gybzh_2PBqc'
const supabase = createClient(url, serviceKey)

function calculateSkillComplementarity(mySkills, theirSkills) {
  if (theirSkills.length === 0) return 30
  const myNames = new Set(mySkills.map(s => s.name))
  const lw = { '초급': 1, '중급': 2, '고급': 3 }
  let cs = 0, tw = 0
  for (const s of theirSkills) {
    const w = lw[s.level] || 1
    tw += w
    cs += w * (myNames.has(s.name) ? 0.3 : 1.0)
  }
  return tw === 0 ? 30 : Math.min(100, (cs / tw) * 100)
}

function calculateInterestOverlap(myTags, theirTags) {
  if (myTags.length === 0 && theirTags.length === 0) return 50
  if (myTags.length === 0 || theirTags.length === 0) return 20
  const mySet = new Set(myTags)
  let inter = 0
  for (const t of theirTags) { if (mySet.has(t)) inter++ }
  const union = new Set([...myTags, ...theirTags]).size
  return (inter / union) * 100
}

function calculateSituation(my, their) {
  if (!my || !their) return 50
  const scores = {
    'has_project+want_to_join': 100, 'want_to_join+has_project': 100,
    'solo+solo': 70, 'solo+want_to_join': 60, 'want_to_join+solo': 60,
    'has_project+has_project': 40,
  }
  return scores[`${my}+${their}`] || scores[`${their}+${my}`] || 50
}

async function main() {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, nickname, desired_position, skills, interest_tags, personality, current_situation, vision_summary, location, profile_analysis')
    .eq('profile_visibility', 'public')
    .eq('onboarding_completed', true)
    .limit(20)

  const me = profiles.find(p => p.nickname === '김민지')
  const others = profiles.filter(p => p.user_id !== me.user_id)

  console.log('=== 나: 김민지 ===')
  console.log('포지션:', me.desired_position)
  console.log('관심사:', (me.interest_tags || []).join(', '))
  console.log('상황:', me.current_situation)
  console.log()

  const results = others.map(c => {
    const skill = calculateSkillComplementarity(me.skills || [], c.skills || [])
    const interest = calculateInterestOverlap(me.interest_tags || [], c.interest_tags || [])
    const situation = calculateSituation(me.current_situation, c.current_situation)
    const score = skill * 0.5 + interest * 0.3 + situation * 0.2

    return {
      nickname: c.nickname,
      position: c.desired_position,
      score: Math.round(score),
      skill: Math.round(skill),
      interest: Math.round(interest),
      situation,
      tags: (c.interest_tags || []).join(', '),
    }
  }).sort((a, b) => b.score - a.score)

  console.log('=== 알고리즘 매칭 결과 ===')
  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.nickname} (${r.position}) → 총점: ${r.score} | 스킬보완: ${r.skill} | 관심겹침: ${r.interest} | 상황: ${r.situation}`)
  })

  // AI reason generation
  console.log('\n=== AI 이유 생성 중 (Gemini 2.0 Flash) ===')

  const genAI = new GoogleGenerativeAI('AIzaSyADS2uVhILU6ErV3ZNqiqBS7lizU3nD2Ig')
  const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

  const top5 = results.slice(0, 5)
  const candidateSummaries = top5.map((r, i) =>
    `[${i + 1}] ${r.nickname} (포지션: ${r.position}, 관심사: ${r.tags}, 매칭점수: ${r.score}점, 스킬보완: ${r.skill}, 관심겹침: ${r.interest})`
  ).join('\n')

  const prompt = `당신은 스타트업 팀빌딩 플랫폼 "Draft"의 AI 매칭 어드바이저입니다.
나(김민지, Frontend Developer, 관심사: React,TypeScript,UI/UX)와 추천 후보들을 보고 각 후보에 대해 한 줄 추천 이유를 작성하세요.

후보:
${candidateSummaries}

규칙: 각 닉네임을 키로, 25자 이내 추천 이유를 값으로 하는 JSON 객체. 자연스러운 한국어. JSON만 출력.`

  try {
    const result = await chatModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1000, responseMimeType: 'application/json' },
    })

    const text = result.response.text()
    const parsed = JSON.parse(text.trim())
    console.log('\nAI 생성 이유:')
    Object.entries(parsed).forEach(([name, reason]) => {
      console.log(`  ${name}: ${reason}`)
    })
  } catch (e) {
    console.log('AI Error:', e.message)
  }
}

main()
