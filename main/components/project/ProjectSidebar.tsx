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
import { positionLabel, projectRoleLabel } from '@/src/constants/roles'

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
      <div className="flex gap-0 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2.5 text-[15px] font-bold transition-colors ${
              activeTab === tab.id
                ? 'text-txt-primary'
                : 'text-txt-tertiary hover:text-txt-secondary'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#3182F6] rounded-full" />
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
              <div className="flex items-center gap-3 p-4 bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl">
                <div className="w-12 h-12 bg-[#3182F6] text-white rounded-full flex items-center justify-center font-bold text-base shrink-0">
                  {creator.nickname.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-txt-primary text-[15px]">{creator.nickname}</p>
                  <p className="text-[13px] text-txt-tertiary truncate">
                    {positionLabel(creator.desired_position || '') || '메이커'}
                    {creator.university && ` · ${creator.university}`}
                  </p>
                </div>
                <span className="shrink-0 text-[12px] font-semibold text-txt-disabled bg-[#E5E5EA] dark:bg-[#3A3A3C] px-2.5 py-1 rounded-full">
                  메이커
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl">
                <div className="w-12 h-12 bg-[#E5E5EA] dark:bg-[#3A3A3C] rounded-full flex items-center justify-center font-bold text-base text-txt-disabled">?</div>
                <div>
                  <p className="font-bold text-txt-primary text-[15px]">익명 메이커</p>
                  <p className="text-[13px] text-txt-tertiary">프로필 비공개</p>
                </div>
              </div>
            )}

            {/* Team members */}
            {teamMembers.length > 0 && (
              <div className="space-y-2">
                <p className="text-[15px] font-bold text-txt-primary flex items-center gap-1.5">
                  <Users size={14} /> 멤버 {teamMembers.length}명
                </p>
                {teamMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl">
                    <div className="w-9 h-9 bg-[#3182F6] text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                      {member.nickname.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-txt-primary text-[14px] truncate">{member.nickname}</p>
                      {member.role && <p className="text-[12px] text-txt-tertiary truncate">{member.role}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 모집 중인 포지션 */}
            <p className="text-[15px] font-bold text-txt-primary">모집 중인 포지션</p>

            {opportunity.needed_roles && opportunity.needed_roles.length > 0 ? (
              <div className="space-y-2">
                {opportunity.needed_roles.map((role) => {
                  const label = projectRoleLabel(role)
                  const RoleIcon = getRoleIcon(label)

                  if (chatStatus === 'accepted') return (
                    <div key={role} className="flex items-center gap-3 h-16 px-4 bg-[#E8F5E9] dark:bg-[#1B3A2D] rounded-2xl">
                      <div className="w-9 h-9 bg-[#E8F5E9] dark:bg-[#1B3A2D] rounded-xl flex items-center justify-center shrink-0">
                        <Check size={14} className="text-[#34C759]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[15px] font-medium text-[#34C759]">{label}</span>
                        <p className="text-[12px] text-[#34C759]/70">수락됨</p>
                      </div>
                    </div>
                  )

                  if (chatStatus === 'pending') return (
                    <div key={role} className="flex items-center gap-3 h-16 px-4 bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl">
                      <div className="w-9 h-9 bg-[#E5E5EA] dark:bg-[#3A3A3C] rounded-xl flex items-center justify-center shrink-0">
                        <Loader2 size={14} className="text-indicator-premium animate-spin" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[15px] font-medium text-txt-secondary">{label}</span>
                        <p className="text-[12px] text-indicator-premium">대기 중...</p>
                      </div>
                    </div>
                  )

                  if (chatStatus === 'declined') return (
                    <div key={role} className="flex items-center gap-3 h-16 px-4 bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl opacity-60">
                      <div className="w-9 h-9 bg-[#E5E5EA] dark:bg-[#3A3A3C] rounded-xl flex items-center justify-center shrink-0">
                        <XIcon size={14} className="text-txt-disabled" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[15px] font-medium text-txt-tertiary">{label}</span>
                        <p className="text-[12px] text-txt-disabled">거절됨</p>
                      </div>
                    </div>
                  )

                  return (
                    <button
                      key={role}
                      onClick={() => handleAction(role)}
                      className="group w-full flex items-center gap-3 h-16 px-4 bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl hover:bg-[#EDF0F3] dark:hover:bg-[#252527] active:scale-[0.98] transition-all cursor-pointer text-left"
                    >
                      <div className="w-9 h-9 bg-[#E5E5EA] dark:bg-[#3A3A3C] rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#3182F6] transition-colors">
                        <RoleIcon size={14} className="text-txt-disabled group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[15px] font-medium text-txt-secondary group-hover:text-[#3182F6] transition-colors">{label}</span>
                        <p className="text-[12px] text-txt-disabled group-hover:text-[#3182F6]/60 transition-colors flex items-center gap-1">
                          <Coffee size={10} /> 커피챗 신청하기
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-txt-disabled group-hover:text-[#3182F6] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-[13px] text-txt-disabled py-1">모집 중인 포지션이 없습니다</p>
            )}

            {/* 커피챗 신청하기 — 포지션 바로 아래 */}
            {!hideCta && !isOwner && !existingChat && (
              <button
                onClick={() => handleAction()}
                className="w-full h-14 bg-[#3182F6] text-white rounded-2xl font-semibold text-[16px] hover:bg-[#2272EB] active:scale-[0.97] transition-all flex items-center justify-center gap-2"
              >
                <Coffee size={16} />
                커피챗 신청하기
              </button>
            )}

            {/* 수락된 경우 연락처 */}
            {!hideCta && !isOwner && chatStatus === 'accepted' && existingChat?.contact_info && (
              <div className="bg-[#E8F5E9] dark:bg-[#1B3A2D] rounded-2xl p-4">
                <p className="text-[13px] font-bold text-[#34C759] mb-1">커피챗 수락됨</p>
                <p className="text-[14px] text-[#34C759]/80">연락처: {existingChat.contact_info}</p>
              </div>
            )}

            {/* Skills */}
            {Array.isArray(opportunity.needed_skills) && opportunity.needed_skills.length > 0 && (
              <div>
                <p className="text-[15px] font-bold text-txt-primary mb-2">필요 스킬</p>
                <div className="flex flex-wrap gap-1.5">
                  {(opportunity.needed_skills as Array<{ name: string }>).map((skill, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F2F3F5] dark:bg-[#2C2C2E] rounded-full text-[13px] text-txt-secondary">
                      <Code size={10} className="text-txt-disabled" />
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
                className="w-full h-14 bg-[#F2F3F5] dark:bg-[#2C2C2E] rounded-2xl text-txt-secondary font-semibold text-[16px] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] transition-all flex items-center justify-center gap-2"
              >
                <Edit3 size={15} />
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
                <div className="bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl p-4 flex flex-col gap-1">
                  <Clock size={16} className="text-[#3182F6]" />
                  <span className="text-[12px] text-txt-tertiary mt-0.5">시간 투자</span>
                  <span className="text-[15px] font-bold text-txt-primary">
                    {opportunity.time_commitment === 'part_time' ? '파트타임' : '풀타임'}
                  </span>
                </div>
              )}
              {opportunity.location_type && (
                <div className="bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl p-4 flex flex-col gap-1">
                  <MapPin size={16} className="text-[#3182F6]" />
                  <span className="text-[12px] text-txt-tertiary mt-0.5">활동 방식</span>
                  <span className="text-[15px] font-bold text-txt-primary">
                    {opportunity.location_type === 'remote' ? '원격' :
                     opportunity.location_type === 'onsite' ? '오프라인' : '혼합'}
                  </span>
                </div>
              )}
              {opportunity.compensation_type && (
                <div className="bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl p-4 flex flex-col gap-1">
                  <Sparkles size={16} className="text-[#3182F6]" />
                  <span className="text-[12px] text-txt-tertiary mt-0.5">보상</span>
                  <span className="text-[15px] font-bold text-txt-primary">
                    {opportunity.compensation_type === 'equity' ? '지분' :
                     opportunity.compensation_type === 'salary' ? '유급' :
                     opportunity.compensation_type === 'hybrid' ? '혼합' : '무급'}
                  </span>
                </div>
              )}
              <div className="bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl p-4 flex flex-col gap-1">
                <Eye size={16} className="text-[#3182F6]" />
                <span className="text-[12px] text-txt-tertiary mt-0.5">조회 · 관심</span>
                <span className="text-[15px] font-bold text-txt-primary">
                  {opportunity.views_count ?? 0}
                  <span className="text-txt-tertiary font-medium text-[13px]"> · </span>
                  {(opportunity.interest_count ?? 0) + (hasInterested ? 1 : 0)}
                </span>
              </div>
            </div>

            {/* 보상 상세 */}
            {opportunity.compensation_details && (
              <div className="bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl p-4">
                <p className="text-[13px] text-txt-tertiary leading-relaxed break-keep">
                  {opportunity.compensation_details}
                </p>
              </div>
            )}

            {/* 링크 */}
            {Array.isArray(opportunity.project_links) && opportunity.project_links.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[15px] font-bold text-txt-primary">링크</p>
                {(opportunity.project_links as Array<{ type: string; url: string; label?: string }>).map((link, i) => {
                  const LinkIcon = linkIcons[link.type] || ExternalLink
                  return (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 py-2.5 px-4 bg-[#F7F8F9] dark:bg-[#1C1C1E] rounded-2xl hover:bg-[#EDF0F3] dark:hover:bg-[#252527] transition-colors group"
                    >
                      <LinkIcon size={14} className="text-txt-disabled group-hover:text-txt-primary transition-colors shrink-0" />
                      <span className="text-[14px] text-txt-secondary group-hover:text-txt-primary transition-colors truncate">
                        {link.label || link.type}
                      </span>
                      <ExternalLink size={11} className="text-txt-disabled ml-auto shrink-0" />
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
