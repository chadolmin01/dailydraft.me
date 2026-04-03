import Image from 'next/image'
import { X, ExternalLink, ChevronRight } from 'lucide-react'

export function ProfileSidePanel({
  sidePanel,
  userProjects,
  portfolioItems,
  setSidePanel,
  onClose,
  onSelectProject,
}: {
  sidePanel: 'projects' | 'portfolio'
  userProjects: Array<{ id: string; title: string; type: string; status: string | null; interest_tags: string[] | null; needed_roles: string[] | null; applications_count: number | null; created_at: string | null }>
  portfolioItems: Array<{ id: string; title: string; description: string | null; image_url: string | null; link_url: string | null }>
  setSidePanel: (v: null | 'projects' | 'portfolio') => void
  onClose: () => void
  onSelectProject?: (projectId: string) => void
}) {
  return (
    <div className="hidden md:flex w-2/5 modal-glass rounded-2xl flex-col overflow-hidden">
      {/* Side panel header */}
      <div className="modal-bar border-b border-border/40 px-4 h-10 flex items-center justify-between shrink-0">
        <h3 className="text-[10px] font-medium text-txt-tertiary">
          {sidePanel === 'projects' ? `프로젝트 (${userProjects.length})` : `포트폴리오 (${portfolioItems.length})`}
        </h3>
        <button
          onClick={() => setSidePanel(null)}
          className="p-1.5 hover:bg-surface-sunken transition-colors"
        >
          <X size={14} className="text-txt-disabled" />
        </button>
      </div>

      {/* Side panel content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sidePanel === 'projects' && userProjects.map((project) => {
          const typeLabel = project.type === 'startup' || project.type === 'team_building' ? '스타트업' : project.type === 'study' ? '스터디' : '사이드'
          return (
            <button
              key={project.id}
              onClick={() => {
                if (onSelectProject) {
                  onClose()
                  onSelectProject(project.id)
                }
              }}
              className="w-full text-left px-3 py-3 bg-surface-card rounded-xl border border-border hover:shadow-md hover:border-brand/40 hover-spring group/proj"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-txt-primary truncate group-hover/proj:text-brand transition-colors">{project.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-mono text-brand bg-brand-bg px-1.5 py-0.5 border border-brand-border">{typeLabel}</span>
                    {(project.needed_roles || []).slice(0, 2).map((role: string) => (
                      <span key={role} className="text-[10px] font-mono text-txt-tertiary">{role}</span>
                    ))}
                  </div>
                </div>
                <ChevronRight size={14} className="text-txt-disabled group-hover/proj:text-brand transition-colors shrink-0 mt-1" />
              </div>
              {(project.interest_tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(project.interest_tags as string[]).slice(0, 3).map((tag: string) => (
                    <span key={tag} className="text-[10px] font-mono bg-white text-txt-tertiary px-1.5 py-0.5 border border-border">{tag}</span>
                  ))}
                </div>
              )}
              {(project.applications_count ?? 0) > 0 && (
                <p className="text-[10px] font-mono text-txt-tertiary mt-2">{project.applications_count}명 지원</p>
              )}
            </button>
          )
        })}

        {sidePanel === 'portfolio' && portfolioItems.map((item) => (
          <a
            key={item.id}
            href={item.link_url || '#'}
            target={item.link_url ? '_blank' : undefined}
            rel={item.link_url ? 'noopener noreferrer' : undefined}
            className="block bg-surface-card rounded-xl border border-border overflow-hidden hover:shadow-md hover-spring"
          >
            {item.image_url && (
              <div className="relative h-32 bg-surface-sunken">
                <Image src={item.image_url} alt={item.title} fill className="object-cover" />
              </div>
            )}
            <div className="p-3">
              <p className="text-sm font-bold text-txt-primary truncate">{item.title}</p>
              {item.description && <p className="text-xs text-txt-tertiary mt-1 line-clamp-2">{item.description}</p>}
              {item.link_url && (
                <p className="flex items-center gap-1 text-[10px] font-mono text-txt-tertiary mt-2">
                  <ExternalLink size={10} /> Link
                </p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
