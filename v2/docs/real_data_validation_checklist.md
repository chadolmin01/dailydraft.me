# 실데이터 운영 검증 체크리스트

API 비용 0 (LLM 검증 X). 매니저 시뮬레이션 + DB 집계만.

## 1. 사전 준비 (10분)

- [ ] `.env.local` 점검 — `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `SUPABASE_*`, Google OAuth 키 있음 확인
- [ ] (선택) Vercel 배포 — 로컬만 돌릴 거면 `pnpm dev` 로도 충분
- [ ] Drive 폴더 준비 — 최소 10개 파일, 다양한 mime_type
  - PDF (텍스트 추출 가능) 3개 이상
  - PDF (스캔본 / 이미지) 1개 — empty 케이스 검증
  - DOCX 2개
  - XLSX (표/명단) 1개 — 정형 데이터
  - HWP (한국 공문) 1개 — hwp.js 안정성
  - text/markdown 1개
- [ ] (선택) sentry.io DSN 등록 — production 만. 로컬은 불필요

## 2. 시나리오 실행 (30분)

### S1. 정상 흐름 — 10 파일 일괄 처리
- [ ] 폴더 진입 → 우측 "일괄 처리" 버튼 클릭 (`runBulkProcess`)
- [ ] 진행률 토스트 확인 (`총 N개 중 i 처리 중`)
- [ ] 완료 후 각 행의 ProcessCell 확인:
  - "Atom N" (녹색) — 정상
  - "항목 없음" (회색) — empty
  - "실패 · 재시도" (경고) — error
  - "처리 중" (스피너) — 아직

**기록**: 10개 중 각 상태 몇 개?
```
success: ___ / 10
empty:   ___ / 10
failed:  ___ / 10
```

### S2. 재처리 흐름
- [ ] 실패 또는 empty 행의 ProcessCell 클릭 → 재처리 트리거
- [ ] 30초 폴링 후 상태 변화 확인
- [ ] 결과: 같은 상태 / 개선 / 악화?

**기록**: 재처리로 status 변경된 비율?

### S3. Atom 정확도 (수동)
- [ ] success 파일 3개 선택 → 클릭 → AtomDetail 모달/페이지
- [ ] 각 atom 의 content 와 원문 비교
  - 명백한 hallucination (원문에 없는 내용) 개수?
  - 누락 (당연히 추출됐어야 할 내용 빠짐) 개수?
  - 잘못된 type 분류 개수?

**기록 (정성적)**: 
- 가장 잘 나온 파일 1개:
- 가장 못 나온 파일 1개:
- 매니저로서 신뢰 가능한가? (Y/N + 이유)

### S4. Drive 동기화
- [ ] Drive 에서 파일 1개 삭제 (또는 이름 변경)
- [ ] 15분 후 (cron 주기) 또는 수동 sync 트리거
- [ ] `processed_files` 에 좀비 행 남아있는지 확인 (DB 직접)

**기록**: 좀비 행 있음 / 없음 + 처리됐다면 어디서?

## 3. DB 집계 도구 실행 (2분)

처리 끝나면:

```bash
cd v2
pnpm exec tsx scripts/audit_processing.ts
```

또는 특정 워크스페이스만:
```bash
pnpm exec tsx scripts/audit_processing.ts --workspace <uuid>
```

또는 최근 N일만:
```bash
pnpm exec tsx scripts/audit_processing.ts --days 1
```

**출력 확인**:
1. 전체 통계 (success/failed/empty/pending 비율)
2. mime_type 별 성공률 — 어떤 포맷이 약한가?
3. parsing_error 메시지 Top 10 — 진짜 실패 모드는?
4. Atom 수 분포 — mime_type 별 평균/중앙값/min/max
5. 처리 시간 — 60초 한계 근접 파일 수
6. 자동 권고 — 실패율/empty 비율 임계 초과 시

## 4. 결과 해석 — 다음 작업 결정

도구 출력 보고 분류:

| 발견 | 다음 작업 |
|---|---|
| 실패율 < 5% | 안정. 다음 트랙 진행 (atom 수정/검수 UI 등) |
| 실패율 > 10% + 특정 메시지 다수 | 그 메시지 → 핀포인트 fix (extractor 영역) |
| empty 비율 > 20% | 이미지 PDF 다수 — OCR 필요 여부 결정 |
| 60s 초과 파일 > 0개 | maxDuration 증액 또는 chunking 도입 |
| HWP 만 실패율 높음 | hwp.js fallback (libreoffice 등) 우선 |
| 정형 데이터 atom 평균 < 5 | prompt 추가 강화 (정형 데이터 추출) |
| 처리 시간 변동 큼 (max > avg×3) | LLM variance 또는 cold start 영향 — 별도 측정 |

## 5. 정성적 평가 (매니저 관점)

도구 못 잡는 부분 — 직접 사용 소감:

- [ ] 처리 결과를 보는 데 클릭이 몇 번 필요한가? (이상: 1~2번)
- [ ] 실패 메시지가 한국어로 이해되는가? (지금은 영문 원본 그대로)
- [ ] 결과가 잘못됐을 때 "수정" 할 수 있는가? (현재: 재처리만 가능, 직접 수정 X)
- [ ] 30초 폴링 주기가 답답한가?

## 6. 결과 정리 형식 (다음 세션 시작 시 공유)

```
검증 일시: YYYY-MM-DD
파일 수: N
워크스페이스: <uuid 앞 8자>

전체:
  success: N (X%)
  failed:  N (X%)
  empty:   N (X%)

주요 실패 패턴:
  1. <메시지> × N
  2. ...

매니저 정성 평가:
  - 신뢰 (1~5):
  - 가장 큰 답답함:
  - 진짜 필요한 다음 기능:
```

이 형식으로 알려주시면 다음 세션에서 데이터 기반으로 우선순위 결정.
