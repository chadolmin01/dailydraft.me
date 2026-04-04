'use client'

import React, { useState } from 'react'
import {
  Coffee, Clock,
  Briefcase, MapPin, Sparkles,
  Eye, Heart, ExternalLink, Edit3, Code,
  Palette, Megaphone, PenTool, BarChart3,
  Monitor, Camera, ArrowRight, Check, X as XIcon, Loader2,
  Users,
} from 'lucide-react'
import { ProjectSidebarProps, linkIcons } from './types'
import { positionLabel } from '@/src/constants/roles'

type SidebarTab = 'team' | 'info'

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
  hideCta = false,
}) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('team')

  const tabs: { id: SidebarTab; label: string }[] = [
    { id: 'team', label: '팀' },
    { id: 'info', label: '정보' },
  ]

  const chatStatus = existingChat?.status

  return (
    <div className="flex flex-col h-full gap-4">

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-border shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2 text-[12px] font-bold transition-colors ${
              activeTab === tab.id
                ? 'text-txt-primary'
                : 'text-txt-tertiary hover:text-txt-secondary'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-txt-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto min-h-0 animate-in fade-in duration-200">

        {/* ── 팀 탭 ── */}
        {activeTab === 'team' && (
          <div className="space-y-4 pr-1">
            {/* Creator */}
            {creator ? (
              <div className="flex items-center gap-3 p-3 bg-surface-card rounded-xl border border-border">
                <div className="w-10 h-10 bg-surface-inverse text-txt-inverse rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                  {creator.nickname.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-txt-primary text-sm">{creator.nickname}</p>
                  <p className="text-[11px] text-txt-disabled truncate">
                    {positionLabel(creator.desired_position || '') || '메이커'}
                    {creator.university && ` · ${creator.university}`}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-txt-disabled bg-surface-sunken px-2 py-0.5 rounded-full">
                  메이커
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-surface-card rounded-xl border border-border">
                <div className="w-10 h-10 bg-surface-sunken rounded-full flex items-center justify-center font-bold text-sm text-txt-disabled border border-border">?</div>
                <div>
                  <p className="font-bold text-txt-primary text-sm">익명 메이커</p>
                  <p className="text-[11px] text-txt-disabled">프로필 비공개</p>
                </div>
              </div>
            )}

            {/* Team members */}
            {teamMembers.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-txt-tertiary flex items-center gap-1">
                  <Users size={10} /> 멤버 {teamMembers.length}명
                </p>
                {teamMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-2.5 p-2.5 bg-surface-card rounded-xl border border-border">
                    <div className="w-8 h-8 bg-surface-inverse text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                      {member.nickname.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-txt-primary text-[13px] truncate">{member.nickname}</p>
                      {member.role && <p className="text-[11px] text-txt-disabled truncate">{member.role}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 모집 중인 포지션 */}
            <p className="text-[10px] font-medium text-txt-tertiary">모집 중인 포지션</p>

            {opportunity.needed_roles && opportunity.needed_roles.length > 0 ? (
              <div className="space-y-2">
                {opportunity.needed_roles.map((role) => {
                  const RoleIcon = getRoleIcon(role)

                  if (chatStatus === 'accepted') return (
                    <div key={role} className="flex items-center gap-3 py-3 px-3.5 bg-status-success-bg rounded-xl border border-indicator-online/20">
                      <div className="w-8 h-8 bg-status-success-bg border border-indicator-online/30 rounded-lg flex items-center justify-center shrink-0">
                        <Check size={14} className="text-status-success-text" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-status-success-text">{role}</span>
                        <p className="text-[10px] text-status-success-text/70">수락됨</p>
                      </div>
                    </div>
                  )

                  if (chatStatus === 'pending') return (
                    <div key={role} className="flex items-center gap-3 py-3 px-3.5 bg-surface-card rounded-xl border border-indicator-premium/30">
                      <div className="w-8 h-8 bg-surface-sunken border border-border rounded-lg flex items-center justify-center shrink-0">
                        <Loader2 size={14} className="text-indicator-premium animate-spin" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-txt-secondary">{role}</span>
                        <p className="text-[10px] text-indicator-premium">대기 중...</p>
                      </div>
                    </div>
                  )

                  if (chatStatus === 'declined') return (
                    <div key={role} className="flex items-center gap-3 py-3 px-3.5 bg-surface-card rounded-xl border border-border opacity-60">
                      <div className="w-8 h-8 bg-surface-sunken border border-border rounded-lg flex items-center justify-center shrink-0">
                        <XIcon size={14} className="text-txt-disabled" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-txt-tertiary">{role}</span>
                        <p className="text-[10px] text-txt-disabled">거절됨</p>
                      </div>
                    </div>
                  )

                  return (
                    <button
                      key={role}
                      onClick={() => handleAction(role)}
                      className="group w-full flex items-center gap-3 py-3 px-3.5 bg-surface-card rounded-xl border border-border hover:border-brand/40 hover:bg-brand-bg hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer text-left"
                    >
                      <div className="w-8 h-8 bg-surface-sunken border border-border rounded-lg flex items-center justify-center shrink-0 group-hover:bg-brand group-hover:border-brand transition-colors">
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
            ) : (
              <p className="text-[12px] text-txt-disabled py-1">모집 중인 포지션이 없습니다</p>
            )}

            {/* 커피챗 신청하기 — 포지션 바로 아래 */}
            {!hideCta && !isOwner && !existingChat && (
              <button
                onClick={() => handleAction()}
                className="w-full py-3 bg-surface-inverse text-txt-inverse rounded-full font-black text-sm hover:opacity-90 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
              >
                <Coffee size={14} />
                커피챗 신청하기
              </button>
            )}

            {/* 수락된 경우 연락처 */}
            {!hideCta && !isOwner && chatStatus === 'accepted' && existingChat?.contact_info && (
              <div className="bg-status-success-bg border border-indicator-online/20 rounded-xl p-3">
                <p className="text-[11px] font-bold text-status-success-text mb-1">커피챗 수락됨</p>
                <p className="text-[12px] text-status-success-text/80">연락처: {existingChat.contact_info}</p>
              </div>
            )}

            {/* Skills */}
            {Array.isArray(opportunity.needed_skills) && opportunity.needed_skills.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-txt-tertiary mb-2">필요 스킬</p>
                <div className="flex flex-wrap gap-1.5">
                  {(opportunity.needed_skills as Array<{ name: string }>).map((skill, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-surface-card rounded-full border border-border text-[11px] text-txt-secondary">
                      <Code size={9} className="text-txt-disabled" />
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 오너: 수정 버튼 */}
            {!hideCta && isOwner && (
              <button
                onClick={() => { onClose(); router.push(`/projects/${opportunity.id}/edit`) }}
                className="w-full py-3 border border-border rounded-full text-txt-secondary font-bold text-sm hover:bg-surface-inverse hover:text-txt-inverse hover:border-surface-inverse transition-all flex items-center justify-center gap-2"
              >
                <Edit3 size={14} />
                프로젝트 수정하기
              </button>
            )}
          </div>
        )}

        {/* ── 정보 탭 ── */}
        {activeTab === 'info' && (
          <div className="space-y-3 pr-1">

            {/* 조건 카드 그리드 */}
            <div className="grid grid-cols-2 gap-2">
              {opportunity.time_commitment && (
                <div className="bg-surface-card border border-border rounded-xl p-3 flex flex-col gap-1">
                  <Clock size={14} className="text-txt-disabled" />
                  <span className="text-[10px] text-txt-tertiary mt-0.5">시간 투자</span>
                  <span className="text-[13px] font-black text-txt-primary">
                    {opportunity.time_commitment === 'part_time' ? '파트타임' : '풀타임'}
                  </span>
                </div>
              )}
              {opportunity.location_type && (
                <div className="bg-surface-card border border-border rounded-xl p-3 flex flex-col gap-1">
                  <MapPin size={14} className="text-txt-disabled" />
                  <span className="text-[10px] text-txt-tertiary mt-0.5">활동 방식</span>
                  <span className="text-[13px] font-black text-txt-primary">
                    {opportunity.location_type === 'remote' ? '원격' :
                     opportunity.location_type === 'onsite' ? '오프라인' : '혼합'}
                  </span>
                </div>
              )}
              {opportunity.compensation_type && (
                <div className="bg-surface-card border border-border rounded-xl p-3 flex flex-col gap-1">
                  <Sparkles size={14} className="text-txt-disabled" />
                  <span className="text-[10px] text-txt-tertiary mt-0.5">보상</span>
                  <span className="text-[13px] font-black text-txt-primary">
                    {opportunity.compensation_type === 'equity' ? '지분' :
                     opportunity.compensation_type === 'salary' ? '유급' :
                     opportunity.compensation_type === 'hybrid' ? '혼합' : '무급'}
                  </span>
                </div>
              )}
              <div className="bg-surface-card border border-border rounded-xl p-3 flex flex-col gap-1">
                <Eye size={14} className="text-txt-disabled" />
                <span className="text-[10px] text-txt-tertiary mt-0.5">조회 · 관심</span>
                <span className="text-[13px] font-black text-txt-primary">
                  {opportunity.views_count ?? 0}
                  <span className="text-txt-tertiary font-medium text-[11px]"> · </span>
                  {(opportunity.interest_count ?? 0) + (hasInterested ? 1 : 0)}
                </span>
              </div>
            </div>

            {/* 보상 상세 */}
            {opportunity.compensation_details && (
              <div className="bg-surface-sunken rounded-xl p-3">
                <p className="text-[11px] text-txt-tertiary leading-relaxed break-keep">
                  {opportunity.compensation_details}
                </p>
              </div>
            )}

            {/* 링크 */}
            {Array.isArray(opportunity.project_links) && opportunity.project_links.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-txt-tertiary">링크</p>
                {(opportunity.project_links as Array<{ type: string; url: string; label?: string }>).map((link, i) => {
                  const LinkIcon = linkIcons[link.type] || ExternalLink
                  return (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 py-2 px-3 bg-surface-card rounded-xl border border-border hover:border-txt-primary transition-colors group"
                    >
                      <LinkIcon size={13} className="text-txt-disabled group-hover:text-txt-primary transition-colors shrink-0" />
                      <span className="text-[13px] text-txt-secondary group-hover:text-txt-primary transition-colors truncate">
                        {link.label || link.type}
                      </span>
                      <ExternalLink size={10} className="text-txt-disabled ml-auto shrink-0" />
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
