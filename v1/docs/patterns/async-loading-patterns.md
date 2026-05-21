# Async Loading Patterns

Draft 프로덕트 전반에서 일관된 로딩 UX 를 유지하기 위한 3계층 패턴.

## 3 Layers of Loading

### Layer 1 — Route navigation (자동)

Next.js App Router 의 `loading.tsx` 파일 컨벤션. URL 이 바뀔 때 해당 세그먼트의 `loading.tsx` 가 렌더된다. 첫 280ms 는 opacity 0 (skeleton-delayed CSS) 로 짧은 전환은 안 보이게.

**새 라우트를 만들면 반드시** `loading.tsx` 하나 추가 (3줄):

```tsx
// app/<segment>/loading.tsx
import { MiniLoader } from '@/components/ui/MiniLoader'
export default function Loading() {
  return <MiniLoader heading="X 를 불러오는 중" />
}
```

heading 은 **맥락별로** 다르게. 일반 "불러오는 중" 금지 — 페이지 정체 명시가 심사·실사·UX 모두에 유리.

현재 커버된 라우트: `ls -R app/ | grep loading.tsx | wc -l` (2026-04-21 기준 **62개**).

### Layer 2 — 페이지 내부 비동기 섹션 (권장: `<AsyncBoundary>`)

React Query `useQuery` 결과를 `<AsyncBoundary>` 에 꽂으면 isLoading / isError / data / empty 분기를 한 번에 처리.

```tsx
import { AsyncBoundary } from '@/components/ui/AsyncBoundary'
import { SkeletonFeed, SkeletonList, SkeletonTable } from '@/components/ui/Skeleton'

const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: fetchProjects })

return (
  <AsyncBoundary
    query={projectsQuery}
    skeleton={<SkeletonFeed count={3} />}
    loadingHeading="프로젝트를 불러오는 중"
    emptyFallback={<EmptyState title="아직 프로젝트가 없습니다" />}
  >
    {(projects) => <ProjectList projects={projects} />}
  </AsyncBoundary>
)
```

**기존 패턴 (아직 유효, 신규 컴포넌트만 새 패턴 권장)**:

```tsx
if (isLoading) return <SkeletonFeed />
if (isError) return <ErrorState onRetry={refetch} />
return <ProjectList projects={data} />
```

**언제 retrofit?** 새 컴포넌트부터 적용. 기존 컴포넌트는 자체 skeleton 디자인에 맞춤화된 경우가 많아 retrofit 비용 > 이득. 신규 feature 에서만 `AsyncBoundary` 사용을 기본값으로.

### Layer 3 — 버튼/mutation 로딩 (인라인 스피너)

버튼 내부, 인풋 옆, 토스트 로드는 `<MiniLoader variant="tiny" />` 사용.

```tsx
<button disabled={mutation.isPending}>
  {mutation.isPending ? <MiniLoader variant="tiny" /> : null}
  저장
</button>
```

또는 기존 `<Loader2 className="animate-spin" size={14} />` 패턴도 유효. 추가 변형 필요 없음.

---

## Skeleton 라이브러리 (components/ui/Skeleton.tsx)

| 컴포넌트 | 용도 |
|---|---|
| `<Skeleton>` | primitive — 단독 div, className 자유 |
| `<SkeletonCard>` | 카드 한 장 (avatar + title + body + tags) |
| `<SkeletonGrid>` | 여러 카드 (col 1/2/3) — explore 목록 |
| `<SkeletonFeed>` | 피드형 (avatar + text + chips) — /feed, /notifications |
| `<SkeletonList>` | 짧은 row 목록 — 멤버·메시지 |
| `<SkeletonTable>` | 행/열 그리드 — 관리자 테이블 |
| `<SkeletonForm>` | label + input pair — 설정·편집 |
| `<SkeletonDetail>` | 상세 페이지 — 커버 + 메타 + 본문 |
| `<SkeletonProfile>` | 프로필 카드 |
| `<SkeletonSidebar>` | 왼쪽/오른쪽 보조 열 |
| `<SkeletonStats>` | 상단 KPI row |

모든 Skeleton 은 `skeleton-delayed` CSS 가 자동 적용되어 **첫 280ms 는 보이지 않음**. 짧은 로딩은 깜빡임 없음.

---

## MiniLoader variants

| variant | 용도 | 크기 |
|---|---|---|
| `page` (기본) | route-level `loading.tsx` | spinner 32px + 상하 96px 여백 |
| `inline` | 페이지 내부 비동기 섹션 | spinner 24px + 상하 40px 여백 |
| `tiny` | 버튼/토스트 인라인 | spinner 14px, 텍스트 없음 |

```tsx
<MiniLoader variant="page" heading="프로젝트를 불러오는 중" />   // loading.tsx
<MiniLoader variant="inline" heading="새로고침 중" />             // 섹션 내부
<MiniLoader variant="tiny" />                                    // 버튼
```

---

## 결정 트리

```
질문: 어디서 로딩이 발생하는가?
 ├─ URL 이 바뀜 (페이지 전환) → Layer 1, loading.tsx 추가
 ├─ 페이지 안에서 데이터 fetch → Layer 2, AsyncBoundary + Skeleton*
 └─ 버튼 클릭 후 mutation 대기 → Layer 3, MiniLoader variant="tiny"
```

---

## 안티패턴 (금지)

- **장식적 스피너**: 여러 개 spinner 동시 돌리기. 한 페이지에 하나만.
- **장기 로딩 텍스트 변화**: "거의 다 됐어요..." 같은 가짜 진행률 금지. 실제 진행률 없으면 그냥 heading 만.
- **Layout shift**: skeleton 크기가 실제 콘텐츠와 다르면 로딩 끝난 뒤 화면이 튐. Skeleton 사이즈를 실제 UI 와 맞춰야 함.
- **빈 화면**: loading.tsx 없는 라우트에서 SSR 지연 중 하얀 화면. 모든 data-fetching 라우트에 loading.tsx 필수.

---

**최종 개정**: 2026-04-21 Bundle N
**관련 파일**:
- `components/ui/MiniLoader.tsx` (3 variants)
- `components/ui/Skeleton.tsx` (11 variants)
- `components/ui/AsyncBoundary.tsx` (render-prop boundary)
