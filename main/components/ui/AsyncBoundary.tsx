'use client'

import React from 'react'
import { MiniLoader } from './MiniLoader'
import { ErrorState } from './ErrorState'

/**
 * AsyncBoundary — React Query 류 isLoading/isError/data 패턴을 단일 컴포넌트로 감싸
 * 페이지 내부 비동기 영역에도 일관된 로딩·에러 UX 를 자동 적용.
 *
 * 기존 패턴:
 *   const { data, isLoading, isError, refetch } = useQuery(...)
 *   if (isLoading) return <Skeleton />
 *   if (isError) return <ErrorState onRetry={refetch} />
 *   return <List items={data} />
 *
 * 개선 패턴 (render-prop):
 *   <AsyncBoundary query={q} skeleton={<SkeletonList />}>
 *     {(data) => <List items={data} />}
 *   </AsyncBoundary>
 *
 * 또는 최소 스타일 (기본 MiniLoader inline):
 *   <AsyncBoundary query={q}>
 *     {(data) => <List items={data} />}
 *   </AsyncBoundary>
 *
 * 주의:
 *   - React Query v5 의 useQuery 반환 타입과 호환.
 *   - Suspense 모드가 아니라 전통적 isLoading 분기라서 대규모 리팩토링 불필요.
 *   - 에러 재시도 버튼은 query.refetch 자동 연결.
 */

// React Query v5 useQuery 반환값 중 이 컴포넌트가 요구하는 최소 interface
// 직접 의존하지 않고 duck-typing 하면 타 상태 라이브러리(SWR 등)와도 호환.
export interface AsyncQueryLike<TData> {
  data: TData | undefined
  isLoading: boolean
  isError: boolean
  error?: unknown
  refetch?: () => unknown
}

interface AsyncBoundaryProps<TData> {
  query: AsyncQueryLike<TData>
  /** 로딩 중 보여줄 요소. 기본: MiniLoader(variant='inline') */
  skeleton?: React.ReactNode
  /** 에러 시 보여줄 요소. 기본: ErrorState(retry=query.refetch) */
  errorFallback?: (error: unknown, retry: () => void) => React.ReactNode
  /** data 가 undefined 가 아닌 상태에서 children 에게 전달되는 render-prop */
  children: (data: TData) => React.ReactNode
  /** data 가 empty array 또는 null 일 때 보여줄 요소. undefined 와 구분. */
  emptyFallback?: React.ReactNode
  /** heading 을 기본 skeleton MiniLoader 에 주입할 때 사용 */
  loadingHeading?: string
}

/**
 * 사용 예:
 *   <AsyncBoundary
 *     query={projectQuery}
 *     skeleton={<SkeletonFeed count={3} />}
 *     loadingHeading="프로젝트를 불러오는 중"
 *     emptyFallback={<EmptyState title="아직 프로젝트가 없습니다" />}
 *   >
 *     {(projects) => <ProjectList projects={projects} />}
 *   </AsyncBoundary>
 */
export function AsyncBoundary<TData>({
  query,
  skeleton,
  errorFallback,
  children,
  emptyFallback,
  loadingHeading,
}: AsyncBoundaryProps<TData>) {
  if (query.isLoading) {
    return (
      <>{skeleton ?? <MiniLoader variant="inline" heading={loadingHeading} />}</>
    )
  }

  if (query.isError) {
    const retry = () => query.refetch?.()
    if (errorFallback) {
      return <>{errorFallback(query.error, retry)}</>
    }
    return (
      <ErrorState
        message="내용을 불러오지 못했습니다"
        onRetry={query.refetch ? retry : undefined}
      />
    )
  }

  // emptyFallback 은 사용자가 제공했을 때만 활성. 길이 0 배열·null 감지.
  if (emptyFallback !== undefined) {
    const data = query.data
    const isEmpty =
      data === null ||
      data === undefined ||
      (Array.isArray(data) && data.length === 0)
    if (isEmpty) return <>{emptyFallback}</>
  }

  if (query.data === undefined) {
    // Still fetching 이지만 isLoading 이 false 인 경우 (e.g. enabled:false 초기값).
    // 조용히 null 반환 — 호출자 책임.
    return null
  }

  return <>{children(query.data)}</>
}
