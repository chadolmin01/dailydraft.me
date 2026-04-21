import { MiniLoader } from '@/components/ui/MiniLoader'

// 프로젝트 대시보드 route-level 로더 — wireframe 대신 미니 스피너.
// 실제 데이터 페이지가 훨씬 복잡한 레이아웃이라 wireframe 맞추기 어려웠고,
// 짧은 로딩에선 wireframe 이 오히려 인지 부담. #93 의 skeleton-delayed 와 조합해
// 1차 인지 신호 = RouteProgressBar 상단 라인, 2차 = MiniLoader, 3차 = 실제 내용.
export default function ProjectsLoading() {
  return <MiniLoader heading="프로젝트를 불러오는 중" />
}
