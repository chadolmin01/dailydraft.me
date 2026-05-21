# Supabase 워크플로우

## 마이그레이션 · 타입 생성 표준 절차

DB 스키마 변경 시 반드시 따라야 할 순서. 이 순서가 깨지면 2026-04-18 persona 빌드 파괴와
같은 사고가 재발한다.

### 1. 마이그레이션 파일 작성

```bash
# 타임스탬프 네이밍: YYYYMMDDHHmmss_name.sql (14자리 + 이름)
# 예: 20260418120000_create_persona_engine_core.sql
```

규칙:
- **`IF NOT EXISTS` 필수** — 재실행 가능해야 rollback/diff 이슈 회피
- **`DROP ... IF EXISTS` 필수** — trigger/function 재정의 시
- **CHECK constraint는 후속 수정 가능하도록 이름 명시** — `CONSTRAINT xxx_check CHECK (...)`
- **RLS policy는 각 테이블마다 개별 파일 or 테이블 생성 파일에 포함**

### 2. 로컬 검증 (선택, 프로덕션 적용 전)

```bash
# 로컬 Supabase 띄워서 마이그레이션 적용 테스트
cd main
supabase start             # Docker로 로컬 Supabase 실행
supabase db reset           # migrations 전체 재적용
# 문제 없으면 stop
supabase stop
```

로컬 없이도 production 바로 가능. 단 rollback 가능한 마이그레이션만.

### 3. 프로덕션 적용

```bash
# main 브랜치 체크아웃 상태에서
cd main
supabase db push           # 원격 DB에 미적용 마이그레이션 push
```

**주의**: destructive 변경(DROP COLUMN, DROP TABLE)은 backup 먼저 + PITR 확인.

### 4. 타입 재생성 (⚠️ 중요)

```bash
cd main
supabase gen types typescript --linked 2>/dev/null \
  | grep -v "^Initialising login role\|^A new version of Supabase CLI\|^We recommend updating" \
  > src/types/database.generated.ts
```

**grep 제외 이유**: `supabase gen types` 가 stderr 대신 stdout에 CLI 안내 메시지를 섞어
출력하는 버그. 필터링 안 하면 파일 상단에 "Initialising login role..." 같은 문자열이
섞여 들어가 TS 파싱 에러. 2026-04-18 database.ts 손상 사고의 원인.

### 5. 커밋

```bash
git add main/supabase/migrations/ main/src/types/database.generated.ts
git commit -m "feat(schema): <변경 내용>"
git push origin main
```

마이그레이션과 타입을 **반드시 같은 커밋에 묶어야** 한다. 분리 커밋 시 중간에 Vercel 배포가
실행되면 타입 미반영 상태로 빌드 실패.

---

## 자동화 (2026-04-18 추가)

### GitHub Actions: `regen-db-types.yml`

마이그레이션 파일 (`main/supabase/migrations/**.sql`) 변경이 main에 push되면 자동으로:
1. Supabase CLI 설치
2. `supabase link --project-ref $SUPABASE_PROJECT_REF`
3. `supabase gen types typescript --linked` 실행
4. 변경 있으면 PR 자동 생성 (`auto/regen-db-types` 브랜치)

**필요 secrets**:
- `SUPABASE_ACCESS_TOKEN` — Supabase Dashboard → Account → Access Tokens 에서 발급
- `SUPABASE_PROJECT_REF` — `prxqjiuibfrmuwwmkhqb`
- `SUPABASE_DB_PASSWORD` — Supabase Dashboard → Project Settings → Database

### GitHub Actions: `build-check.yml`

main으로의 PR · push 에서 `tsc --noEmit` + `next build` 실행. 실패 시 merge 차단.

branch protection rule 설정 필요: Settings → Branches → main → Require status checks →
"TypeCheck + Next Build" 체크.

---

## Persona 테이블 타입 주의 (2026-04-18 일시적 이슈)

과거 persona 테이블이 CLI 재생성에서 빠졌을 때 `database.ts` 에 수동 override를 넣었으나,
이제 CLI에서 정상 반영되므로 override 블록은 제거됨.

일부 persona route에 `(supabase as any).from('...').insert({...} as any)` 패턴이 남아있는데,
이는 **jsonb 컬럼(event_metadata, extracted_diff, value 등)에 `Record<string, unknown>`이나
임의 객체를 직접 넣을 때** Supabase의 `Json` 타입이 허용 안 해서 생기는 우회. 런타임엔 정상.
장기적으로는 해당 jsonb 필드에 대한 구체 타입 인터페이스를 만들어 캐스트 없이 통과하도록 개선.

---

## 트러블슈팅

### `supabase db push` 가 "Remote database is up to date" 리턴하는데 타입엔 누락

원인: 이전에 누군가 SQL을 직접 실행해서 테이블은 있는데 `supabase_migrations.schema_migrations`
에는 기록 없음. 해결:

```bash
# 해당 마이그레이션 파일 타임스탬프로 수동 등록
supabase migration repair <timestamp> --status applied
# 다시 타입 재생성
supabase gen types typescript --linked > ...
```

### `from('X')` 호출이 TS 에러("Argument not assignable")

- X가 신규 테이블인데 `database.generated.ts` 미반영 → 타입 재생성 (4번 단계) 실행
- X가 jsonb 필드 insert/upsert 하는 경우 → 값에 `as any` 캐스트 (임시), 또는 구체 타입 정의

### "Type instantiation is excessively deep" 에러

일반적으로 알려지지 않은 테이블명을 문자열 리터럴로 사용했을 때 발생.
`database.generated.ts` 에 해당 테이블이 있는지 먼저 확인.
