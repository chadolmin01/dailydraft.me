import { MiniLoader } from '@/components/ui/MiniLoader'

// 공개 프로젝트 상세 — 외부 공유 링크 첫인상.
// 기존 wireframe 스켈레톤을 미니 스피너로 대체. SSR fetch 가 대부분 <300ms 안에
// 끝나므로 wireframe 은 오히려 거슬림.
export default function ProjectDetailLoading() {
  return <MiniLoader heading="프로젝트를 불러오는 중" />
}
