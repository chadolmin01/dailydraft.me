import React from 'react'
import {
  Heart, Coffee, Clock,
  Briefcase, MapPin, Sparkles,
  Eye, ExternalLink, Edit3, Code,
  Palette, Megaphone, PenTool, BarChart3,
  Monitor, Camera, ArrowRight, Check, X as XIcon, Loader2,
} from 'lucide-react'
import { ProjectSidebarProps, linkIcons } from './types'

const ROLE_ICON_MAP: Record<string, React.ElementType> = {
  '개발자': Code,
  '프론트엔드': Monitor,
  '백엔드': Code,
  '풀스택': Code,
  '디자이너': Palette,
  'UI/UX': PenTool,
  '기획자': BarChart3,
  '마케터': Megaphone,
  'PM': Briefcase,
  '영상': Camera,
}

function getRoleIcon(role: string) {
  for (const [keyword, Icon] of Object.entries(ROLE_ICON_MAP)) {
    if (role.includes(keyword)) return Icon
  }
  return Briefcase
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  opportunity,
  creator,
  isOwner,
  existingChat,
  hasInterested,
  handleAction,
  onClose,
  router,
  teamMembers = [],
}) => {
  return (
    <div className="md:col-span-2 space-y-7">
      {/* Team */}
      <div>
        <h3 className="text-[10px] font-medium text-txt-tertiary mb-3">
          팀 정보
        </h3>
        {creator ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-inverse text-txt-inverse flex items-center justify-center font-bold text-sm shrink-0">
              {creator.nickname.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-txt-primary text-sm">{creator.nickname}</p>
              <p className="text-xs text-txt-disabled truncate">
                {creator.desired_position || '메이커'}
                {creator.university && ` · ${creator.university}`}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-sunken flex items-center justify-center font-bold text-sm text-txt-disabled border border-border">?</div>
            <div>
              <p className="font-semibold text-txt-primary text-sm">익명 메이커</p>
              <p className="text-xs text-txt-disabled">프로필 비공개</p>
            </div>
          </div>
        )}

        {/* Team Members */}
        {teamMembers.length > 0 && (
          <div className="mt-3 space-y-2">
            <span className="text-[0.5rem] font-medium text-txt-disabled">
              멤버 ({teamMembers.length})
            </span>
            {teamMembers.map(member => (
              <div key={member.id} className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-surface-inverse text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {member.nickname.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-txt-primary text-sm truncate">{member.nickname}</p>
                  {member.role && (
                    <p className="text-xs text-txt-disabled truncate">{member.role}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Needed Roles */}
      {opportunity.needed_roles && opportunity.needed_roles.length > 0 && (
        <div>
          <h3 className="text-[10px] font-medium text-txt-tertiary mb-3">
            모집 중인 포지션
          </h3>
          <div className="space-y-2">
            {opportunity.needed_roles.map((role) => {
              const RoleIcon = getRoleIcon(role)
              const chatStatus = existingChat?.status

              if (chatStatus === 'accepted') {
                return (
                  <div
                    key={role}
                    className="flex items-center gap-3 py-3 px-3.5 bg-status-success-bg rounded-xl border border-indicator-online/20"
                  >
                    <div className="w-8 h-8 bg-status-success-bg border border-indicator-online/30 rounded-lg flex items-center justify-center shrink-0">
                      <Check size={14} className="text-status-success-text" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-status-success-text">{role}</span>
                      <p className="text-[10px] text-status-success-text/70">수락됨</p>
                    </div>
                  </div>
                )
              }

              if (chatStatus === 'pending') {
                return (
                  <div
                    key={role}
                    className="flex items-center gap-3 py-3 px-3.5 bg-surface-card rounded-xl border border-indicator-premium/30"
                  >
                    <div className="w-8 h-8 bg-surface-sunken border border-border rounded-lg flex items-center justify-center shrink-0">
                      <Loader2 size={14} className="text-indicator-premium animate-spin" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-txt-secondary">{role}</span>
                      <p className="text-[10px] text-indicator-premium">대기 중...</p>
                    </div>
                  </div>
                )
              }

              if (chatStatus === 'declined') {
                return (
                  <div
                    key={role}
                    className="flex items-center gap-3 py-3 px-3.5 bg-surface-card rounded-xl border border-border opacity-60"
                  >
                    <div className="w-8 h-8 bg-surface-sunken border border-border rounded-lg flex items-center justify-center shrink-0">
                      <XIcon size={14} className="text-txt-disabled" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-txt-tertiary">{role}</span>
                      <p className="text-[10px] text-txt-disabled">거절됨</p>
                    </div>
                  </div>
                )
              }

              return (
                <button
                  key={role}
                  onClick={() => handleAction(role)}
                  className="group w-full flex items-center gap-3 py-3 px-3.5 bg-surface-card rounded-xl border border-border hover:border-brand/40 hover:bg-brand-bg hover:shadow-sm active:scale-[0.98] active:shadow-none transition-all cursor-pointer text-left"
                >
                  <div className="w-8 h-8 bg-surface-sunken border border-border rounded-lg flex items-center justify-center shrink-0 group-hover:bg-brand group-hover:border-brand group-hover:text-white transition-colors">
                    <RoleIcon size={14} className="text-txt-disabled group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-txt-secondary group-hover:text-brand transition-colors">{role}</span>
                    <p className="text-[10px] text-txt-disabled group-hover:text-brand/60 transition-colors flex items-center gap-1">
                      <Coffee size={9} /> 커피챗 신청하기
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-txt-disabled group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Needed Skills */}
      {Array.isArray(opportunity.needed_skills) && opportunity.needed_skills.length > 0 && (
        <div>
          <h3 className="text-[10px] font-medium text-txt-tertiary mb-3">
            필요 스킬
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {(opportunity.needed_skills as Array<{ name: string }>).map((skill, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 bg-surface-card rounded-xl border border-border text-xs text-txt-secondary"
              >
                <Code size={10} className="text-txt-disabled" />
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Project Info */}
      <div>
        <h3 className="text-[10px] font-medium text-txt-tertiary mb-3">
          프로젝트 정보
        </h3>
        <div className="space-y-2.5 text-sm">
          {opportunity.time_commitment && (
            <div className="flex items-center gap-2.5">
              <Clock size={14} className="text-txt-disabled shrink-0" />
              <span className="text-txt-tertiary">시간 투자</span>
              <span className="text-txt-primary font-medium">
                {opportunity.time_commitment === 'part_time' ? '파트타임' : '풀타임'}
              </span>
            </div>
          )}
          {opportunity.location_type && (
            <div className="flex items-center gap-2.5">
              <MapPin size={14} className="text-txt-disabled shrink-0" />
              <span className="text-txt-tertiary">활동 방식</span>
              <span className="text-txt-primary font-medium">
                {opportunity.location_type === 'remote' ? '원격' :
                 opportunity.location_type === 'onsite' ? '오프라인' : '혼합'}
              </span>
            </div>
          )}
          {opportunity.compensation_type && (
            <div className="flex items-center gap-2.5">
              <Sparkles size={14} className="text-txt-disabled shrink-0" />
              <span className="text-txt-tertiary">보상</span>
              <span className="text-txt-primary font-medium">
                {opportunity.compensation_type === 'equity' ? '지분' :
                 opportunity.compensation_type === 'salary' ? '유급' :
                 opportunity.compensation_type === 'hybrid' ? '혼합' : '무급 (경험)'}
              </span>
            </div>
          )}
          {opportunity.compensation_details && (
            <div className="pl-6 text-xs text-txt-tertiary leading-relaxed break-keep">
              {opportunity.compensation_details}
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <Eye size={14} className="text-txt-disabled shrink-0" />
            <span className="text-txt-tertiary">조회</span>
            <span className="text-txt-primary font-medium">{opportunity.views_count ?? 0}회</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Heart size={14} className="text-txt-disabled shrink-0" />
            <span className="text-txt-tertiary">관심</span>
            <span className="text-txt-primary font-medium">{(opportunity.interest_count ?? 0) + (hasInterested ? 1 : 0)}명</span>
          </div>
        </div>
      </div>

      {/* Project Links */}
      {Array.isArray(opportunity.project_links) && opportunity.project_links.length > 0 && (
        <div>
          <h3 className="text-[10px] font-medium text-txt-tertiary mb-3">
            프로젝트 링크
          </h3>
          <div className="space-y-2">
            {(opportunity.project_links as Array<{ type: string; url: string; label?: string }>).map((link, i) => {
              const LinkIcon = linkIcons[link.type] || ExternalLink
              return (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 py-2 px-3 bg-surface-card rounded-xl border border-border hover:border-border transition-colors group"
                >
                  <LinkIcon size={14} className="text-txt-disabled group-hover:text-txt-primary transition-colors shrink-0" />
                  <span className="text-sm text-txt-secondary group-hover:text-txt-primary transition-colors truncate">
                    {link.label || link.type}
                  </span>
                  <ExternalLink size={10} className="text-txt-disabled ml-auto shrink-0" />
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Owner Edit Button */}
      {isOwner && (
        <button
          onClick={() => { onClose(); router.push(`/projects/${opportunity.id}/edit`) }}
          className="w-full py-2.5 border border-border text-txt-secondary font-medium text-sm hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          <Edit3 size={14} />
          프로젝트 수정하기
        </button>
      )}

      {/* CTA Card */}
      {!isOwner && (
      <div className="bg-surface-inverse p-5 text-white border border-surface-inverse shadow-md">
        {existingChat ? (
          <>
            <h3 className="font-bold text-sm mb-1">
              {existingChat.status === 'pending' ? '커피챗 대기 중' :
               existingChat.status === 'accepted' ? '커피챗이 수락되었습니다!' : '커피챗이 거절되었습니다'}
            </h3>
            <p className="text-txt-inverse/50 text-xs mb-4 break-keep">
              {existingChat.status === 'pending' ? '메이커가 요청을 확인 중입니다.' :
               existingChat.status === 'accepted' ? '메이커의 연락처를 확인하세요.' :
               '다른 프로젝트를 탐색해보세요.'}
            </p>
            {existingChat.status === 'accepted' && existingChat.contact_info && (
              <div className="bg-white/10 p-3 text-sm text-white border border-white/20">
                연락처: {existingChat.contact_info}
              </div>
            )}
          </>
        ) : (
          <>
            <h3 className="font-bold text-sm mb-1">프로젝트에 참여하고 싶나요?</h3>
            <p className="text-txt-inverse/50 text-xs mb-4 break-keep">
              커피챗으로 메이커와 직접 이야기해보세요.
            </p>
            <button
              onClick={() => handleAction()}
              className="w-full bg-white text-txt-primary py-2.5 font-bold text-sm hover:bg-surface-sunken transition-colors flex items-center justify-center gap-2 border border-white"
            >
              <Coffee size={14} />
              커피챗 신청하기
            </button>
          </>
        )}
      </div>
      )}
    </div>
  )
}
