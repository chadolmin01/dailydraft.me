// 온보딩 전반에서 공유되는 chip(선택 버튼) 스타일 빌더.
// active/error/size 3축 조합. 메인 라우터·InfoContent·position·interests·affiliation 에서 사용.
export function chipClass(active: boolean, size: 'sm' | 'md' = 'md', error = false) {
  const base = 'font-medium border rounded-xl transition-all duration-150'
  const pad = size === 'sm' ? 'px-3 py-2 text-[13px]' : 'px-4 py-3 text-[14px]'
  const color = active
    ? 'bg-brand text-white border-brand'
    : error
      ? 'bg-surface-card text-txt-primary border-status-danger-text/50 active:scale-[0.97]'
      : 'bg-surface-card text-txt-primary border-border active:scale-[0.97]'
  return `${base} ${pad} ${color}`
}
