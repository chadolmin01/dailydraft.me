# AI 매칭 시스템 개선 계획

## 현재 상태 진단

### 데이터는 있지만 연결이 안 되는 구조

```
AI 온보딩 ✅ ──→ 기회 탐색 ✅ ──→ 커피챗 ✅ ──→ 지원/수락 ✅ ──→ 팀관리 ✅
                    │
                    ╳  끊김
                    │
              팀원 추천 ❌     네트워크 ❌     다이렉트 매칭 ❌
```

### 수집되지만 활용 안 되는 AI 데이터

| 데이터 | 저장 위치 | 현재 활용 | 미활용 가능성 |
|--------|-----------|-----------|---------------|
| `vision_embedding` (2000D) | profiles | 기회 매칭만 | 유저 간 비전 유사도 |
| `extracted_profile` | profiles (JSONB) | 저장만 | 매칭 알고리즘 투입 |
| `founder_type` (4종) | profile_analysis | 표시용 | 상호보완 타입 매칭 |
| `personality` (speed, tech_depth 등) | profiles | 저장만 | 팀 호환성 계산 |
| `current_situation` | profiles | 저장만 | 수요-공급 매칭 |

### 파운더 타입 시너지 매트릭스

| | Blitz Builder | Market Sniper | Tech Pioneer | Community Builder |
|---|---|---|---|---|
| **Blitz Builder** | ⚠️ 충돌 위험 | ✅ 실행+시장 | ✅✅ 실행+기술 | ✅ 실행+네트워크 |
| **Market Sniper** | ✅ 시장+실행 | ⚠️ 기술 부족 | ✅✅ 시장+기술 | ✅ 시장+커뮤니티 |
| **Tech Pioneer** | ✅✅ 기술+실행 | ✅✅ 기술+시장 | ⚠️ 시장 부족 | ✅ 기술+네트워크 |
| **Community Builder** | ✅ 네트워크+실행 | ✅ 네트워크+시장 | ✅ 네트워크+기술 | ⚠️ 실행력 부족 |

---

## 작업 계획 (7단계)

### Phase 1: 유저 ↔ 유저 AI 매칭 API 🔴 Critical

**목표**: vision_embedding + founder_type + personality + skills를 활용한 사람 추천

**엔드포인트**: `GET /api/users/recommendations`

**매칭 알고리즘 (가중치)**:
- 비전 유사도 (embedding cosine): 30%
- 스킬 상호보완: 25% (내가 없는 스킬을 가진 사람 우선)
- 파운더 타입 시너지: 20% (상호보완 매트릭스 기반)
- 관심사 겹침: 15% (interest_tags Jaccard)
- 상황 매칭: 10% (팀원 구함 ↔ 합류 원함 부스트)

**필요 작업**:
- [ ] `src/lib/ai/user-matcher.ts` — 유저 매칭 알고리즘
- [ ] `app/api/users/recommendations/route.ts` — API 엔드포인트
- [ ] `src/hooks/useUserRecommendations.ts` — React Query 훅
- [ ] pgvector RPC `match_users` — 유저 임베딩 유사도 검색

**입력**: 현재 유저 프로필
**출력**: 추천 유저 목록 (score, reason, breakdown)

---

### Phase 2: 커피챗 opportunity 종속 해제 🔴 Critical

**목표**: 프로젝트 없이도 사람 간 직접 커피챗 가능

**DB 변경**:
```sql
ALTER TABLE coffee_chats
  ALTER COLUMN opportunity_id DROP NOT NULL;
  ADD COLUMN target_user_id UUID REFERENCES auth.users(id);
  ADD CONSTRAINT coffee_chat_target CHECK (
    opportunity_id IS NOT NULL OR target_user_id IS NOT NULL
  );
```

**필요 작업**:
- [ ] 마이그레이션 SQL
- [ ] `request_coffee_chat` RPC 수정 (target_user_id 지원)
- [ ] `useCoffeeChats` 훅 수정
- [ ] `CoffeeChatButton` — 유저 프로필에서도 사용 가능하게
- [ ] 이메일 템플릿 수정 (기회 없는 케이스 처리)
- [ ] 커피챗 리마인더 cron 수정

---

### Phase 3: 추천 → 커피챗 CTA 연결 🟠 High

**목표**: "이 사람이 잘 맞아요" → "커피챗 보내기" 원클릭

**필요 작업**:
- [ ] 추천 유저 카드 컴포넌트 (매칭 점수 + 이유 표시)
- [ ] 카드에 커피챗 버튼 내장
- [ ] Explore → People 탭에 "추천" 섹션 추가
- [ ] 매칭 이유를 커피챗 메시지 템플릿에 자동 반영

**UI 흐름**:
```
추천 카드: [프로필 요약] [매칭 85%] [이유: 스킬 상호보완]
          [커피챗 보내기 버튼]
```

---

### Phase 4: 커피챗 → 팀 초대 전환 🟠 High

**목표**: 커피챗 수락 후 "팀에 초대하기" 액션

**필요 작업**:
- [ ] 커피챗 수락 후 UI에 "팀에 초대" CTA 표시
- [ ] 초대 API: `POST /api/opportunities/[id]/team/invite`
- [ ] 초대 수락/거절 흐름
- [ ] 이메일 알림 (팀 초대)

**흐름**:
```
커피챗 수락 → 연락처 교환 → "팀에 초대하기" 버튼 노출
  → 내 프로젝트 선택 → 역할 지정 → 초대 발송
  → 상대방 수락 → accepted_connections에 추가
```

---

### Phase 5: 네트워크 페이지 구현 🟡 Medium

**목표**: 연결된 사람들 관리 + 관계 시각화

**필요 작업**:
- [ ] `network/page.tsx` 스켈레톤 → 실제 구현
- [ ] 연결 목록 (역할, 프로젝트, 연결일)
- [ ] 필터 (역할, 스킬, 프로젝트별)
- [ ] 퀵 액션 (메시지, 프로필 보기)
- [ ] 연결 통계 (총 연결 수, 역할 분포)

---

### Phase 6: 파운더타입 상호보완 매칭 🟡 Medium

**목표**: 4가지 파운더 타입 기반 시너지 추천

**필요 작업**:
- [ ] 시너지 매트릭스 로직 (`founder-type-synergy.ts`)
- [ ] Phase 1 매칭 알고리즘에 통합
- [ ] "왜 이 사람인가" 설명에 타입 시너지 반영
- [ ] 프로필 UI에 상호보완 타입 표시

**로직 예시**:
```
내 타입: Tech Pioneer
추천 이유: "Market Sniper 타입으로, 기술력과 시장감각의 시너지가 높습니다"
시너지 점수: 90/100
```

---

### Phase 7: personality 호환성 반영 🟡 Medium

**목표**: 성격/업무 스타일 호환성 매칭

**활용 데이터**:
- `personality.speed` — 실행 속도 선호
- `personality.tech_depth` — 기술 깊이 선호
- `personality.grit` — 끈기/집요함
- `personality.logic` — 논리적 의사결정
- `personality.culture` — 팀 문화 중시

**필요 작업**:
- [ ] 호환성 점수 계산 로직
- [ ] Phase 1 매칭 알고리즘에 통합
- [ ] "업무 스타일이 비슷해요" / "상호보완적이에요" 설명 생성

---

## 이상적인 완성 흐름

```
온보딩 완료
  ↓
AI 프로필 분석 (embedding + founder_type + personality)
  ↓
홈/Explore에 "추천 팀원" 피드
  ├─ embedding 유사도 + founder_type 시너지 + personality 호환
  ├─ 매칭 점수 + 이유 표시
  └─ "커피챗 보내기" 버튼
  ↓
커피챗 신청 (opportunity 없이도 가능)
  ↓
커피챗 수락 → 연락처 교환
  ├─ "팀에 초대하기" CTA
  └─ 내 프로젝트 선택 → 역할 지정 → 초대
  ↓
팀 결성 → 네트워크 페이지에서 관계 관리
```

---

## 기술 스택 참고

- **AI**: Gemini 2.0 Flash (매칭 이유 생성), Gemini embedding-001 (벡터)
- **벡터 검색**: pgvector + Supabase RPC
- **프론트**: React Query + Zustand
- **이메일**: React Email + Resend
- **Rate Limit**: 15 RPM 큐 기반

## 파일 구조 참고

```
main/src/lib/ai/
  ├── gemini-client.ts          # Gemini 클라이언트
  ├── embeddings.ts             # 임베딩 생성
  ├── opportunity-matcher.ts    # 기회 매칭 (참고용)
  ├── profile-analyzer.ts       # 프로필 분석
  ├── recommendation-explainer.ts # 추천 설명 생성
  └── user-matcher.ts           # [NEW] 유저 매칭 알고리즘

main/app/api/
  ├── users/recommendations/    # [NEW] 유저 추천 API
  ├── coffee-chat/notify/       # 커피챗 알림
  └── opportunities/[id]/team/  # 팀 관리

main/src/hooks/
  ├── useCoffeeChats.ts         # 커피챗 훅
  ├── useConnections.ts         # 연결 훅
  └── useUserRecommendations.ts # [NEW] 추천 훅
```
