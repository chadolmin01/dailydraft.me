# Draft Project - Claude Code 가이드

## 프로젝트 구조
- `main/`: Next.js 메인 앱 (포트 3000)
- `archive/`: 레거시 프로젝트 (idea-snap, idea-validator, draft-documentation, prd)
- `.claude/skills/`: 설치된 스킬들 (symlink)
- `.agents/skills/`: 스킬 원본 파일

## 설치된 Skills

| 스킬 | 용도 | 우선순위 |
|------|------|----------|
| `pdf` | 서버사이드 PDF 생성 (Puppeteer) | 1 |
| `vercel-react-best-practices` | React 성능 최적화 패턴 | 2 |
| `vercel-composition-patterns` | 컴포넌트 구조 패턴 | 3 |
| `browser-use` | 브라우저 자동화/테스트 | 4 |
| `frontend-design` | UI 디자인 가이드 | 5 |
| `web-design-guidelines` | 웹 디자인 표준 | - |
| `find-skills` | 스킬 검색 | - |

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
