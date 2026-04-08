# Draft Project - Claude Code 가이드

## 프로젝트 구조
- `main/`: Next.js 메인 앱 (포트 3000)
- `archive/`: 레거시 프로젝트 (idea-snap, idea-validator, draft-documentation, prd)
- `.claude/skills/`: 설치된 스킬들 (symlink)
- `.agents/skills/`: 스킬 원본 파일

## 설치된 Skills

### 프로젝트 스킬 (`.claude/skills/`)
| 스킬 | 용도 |
|------|------|
| `pdf` | 서버사이드 PDF 생성 (Puppeteer) |
| `vercel-react-best-practices` | React 성능 최적화 패턴 |
| `vercel-composition-patterns` | 컴포넌트 구조 패턴 |
| `browser-use` | 브라우저 자동화/테스트 |
| `frontend-design` | UI 디자인 가이드 |
| `web-design-guidelines` | 웹 디자인 표준 |
| `find-skills` | 스킬 검색 |

### 글로벌 스킬 (`~/.claude/skills/`)
| 스킬 | 용도 |
|------|------|
| `supabase-postgres-best-practices` | Supabase 공식 — DB 쿼리, RLS, 인덱싱 |
| `nextjs-supabase-auth` | Next.js + Supabase Auth 통합 패턴 |
| `nextjs-react-typescript` | Next.js + React + TS 종합 가이드 |
| `on-page-seo-auditor` | SEO 감사/최적화 |
| `deployment-pipeline-design` | 배포 파이프라인 설계 |
| `qa-testing-strategy` | QA 테스트 전략 |
| `tailwindcss` | Tailwind CSS 패턴 가이드 |
| `secure` | 보안 감사 |
| `sprint-planning` | Anthropic 공식 스프린트 플래닝 |
| `sprint-planner` | 스프린트 플래너 |

## 서버 관리 (필수 규칙)

### CRITICAL: Node 프로세스 종료 시 반드시 지켜야 할 규칙

> **절대 사용 금지**: `taskkill //IM node.exe //F` 또는 `pkill node`
> - Claude Code도 node.js로 실행되므로 모든 node를 죽이면 Claude Code도 종료됨

> **반드시 사용**: 포트 기반 종료 스크립트
> - 개발 서버(localhost)만 종료하고 Claude Code는 유지됨

### 개발 서버 종료 시 사용할 명령어

```bash
# 포트 3000-3010 정리 (이 스크립트를 사용할 것)
for port in 3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010; do
  pid=$(netstat -ano 2>/dev/null | grep ":$port " | grep LISTENING | awk '{print $5}' | head -1)
  if [ -n "$pid" ]; then
    echo "Killing process on port $port (PID: $pid)"
    taskkill //PID $pid //F 2>/dev/null || true
  fi
done
```

### 특정 포트 하나만 종료
```bash
pid=$(netstat -ano | grep ":3000 " | grep LISTENING | awk '{print $5}' | head -1)
taskkill //PID $pid //F
```

### 포트 사용 확인
```bash
netstat -ano | grep -E ":(300[0-9]|3010) " | grep LISTENING
```

## 주요 API 엔드포인트
- `/api/business-plan/export` - PDF/DOCX 내보내기 (Puppeteer 서버사이드)
- `/api/opportunities/recommend` - 추천 기회 (병렬 fetch 최적화됨)

## 성능 최적화 적용 현황
- `Dashboard.tsx`: useMemo, useCallback, lazy loading 적용
- `recommend API`: Promise.all 병렬 fetch

## 바이브코딩 지원 규칙

사용자는 비개발자(스타트업 창업자)임. 코드/디버깅 시 다음 자동 수행:

1. **비자명한 결정에는 의도+트레이드오프 주석 필수**
   - 예: 락/타임아웃/race 가드/RLS 관련 코드
   - "왜 이렇게 짰는지 + 안 했을 때 뭐가 문제인지" 2~3줄
2. **새 전문용어 등장 시 → `~/.claude/projects/C--project-Draft/memory/vibe_glossary.md`에 추가**
   - 사용자 메타포(앵커, 됬다안됬다 등) ↔ 개발자 정식 용어 매핑
3. **비자명한 버그 원인 발견 시 → `~/.claude/projects/C--project-Draft/memory/vibe_lessons.md`에 4줄 기록**
   - 증상 / 원인 / 해결 / 교훈
   - 다음에 비슷한 증상 보이면 이 파일 먼저 참조
