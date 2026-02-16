'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from './ui/Card'
import { DetailModal } from './ui/DetailModal'
import {
  ArrowUpRight,
  Plus,
  Building2,
  Clock,
  Rocket,
  Landmark,
  User,
  Eye,
  Users,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Command,
  CheckSquare,
  Square,
  CalendarDays,
  MoreHorizontal,
  Loader2
} from 'lucide-react'
import { Opportunity, CalendarEvent } from '@/types'
import { useAuth } from '@/src/context/AuthContext'
import { useRecommendedOpportunities, useMyOpportunities, calculateDaysLeft, OpportunityWithCreator } from '@/src/hooks/useOpportunities'
import { useProfile } from '@/src/hooks/useProfile'

// Mock Data
const opportunities: Opportunity[] = [
  {
    id: '1',
    scope: 'PROJECT',
    type: 'Team Building',
    title: 'AI 기반 펫 헬스케어 플랫폼 Co-founder 모집',
    organization: 'PetPulse (Seed)',
    tags: ['Co-founder', 'Marketing'],
    daysLeft: 5,
    matchPercent: 98,
    category: '팀원 모집'
  },
  {
    id: '2',
    scope: 'PROGRAM',
    type: 'Startup Support',
    title: '2026년 창업성공패키지 초기창업기업 모집',
    organization: '중소벤처기업진흥공단',
    tags: ['최대 1억', '사업화지원'],
    daysLeft: 1,
    matchPercent: 85,
    category: '정부지원'
  },
  {
    id: '3',
    scope: 'TALENT',
    type: 'Talent',
    title: '김민수 (Server Developer)',
    organization: 'Ex-Naver',
    tags: ['Node.js', 'AWS', 'Python'],
    daysLeft: 30,
    matchPercent: 92,
    category: '인재 추천'
  },
  {
    id: '4',
    scope: 'PROGRAM',
    type: 'Education',
    title: 'AI 프롬프트 엔지니어링 전문가 양성과정',
    organization: '서울산업진흥원(SBA)',
    tags: ['무료교육', '역량강화'],
    daysLeft: 3,
    category: '직무교육'
  }
]

const myProjects = [
  {
    id: 'p1',
    status: '진행중',
    statusColor: 'bg-green-500',
    title: 'Project Alpha:\nAI 법률 어시스턴트',
    stage: 'SEED STAGE',
    dDay: '런칭 D-14',
    stats: {
      views: '1,240',
      viewsTrend: '12%',
      applicants: '18',
      applicantsNew: '+3명',
      interviews: '4',
      interviewsMsg: '일정 조율'
    },
    team: [
        { id: 'jd', initial: 'JD', name: 'Jason', role: 'PO' },
        { id: 'al', initial: 'AL', name: 'Alex', role: 'Tech' },
        { id: 'ck', initial: 'CK', name: 'Chloe', role: 'UX' }
    ],
    hiring: { role: 'Dev', isOpen: true }
  },
  {
    id: 'p2',
    status: '작성중',
    statusColor: 'bg-gray-400',
    title: '펫 헬스케어\n플랫폼 MVP',
    stage: 'PLANNING',
    dDay: '임시저장',
    stats: {
      views: '-',
      viewsTrend: '',
      applicants: '0',
      applicantsNew: '-',
      interviews: '0',
      interviewsMsg: '등록 필요'
    },
    team: [],
    hiring: { role: 'All', isOpen: true }
  },
  {
    id: 'p3',
    status: '모집중',
    statusColor: 'bg-blue-500',
    title: '글로벌 SaaS\n마케팅 팀 빌딩',
    stage: 'PRE-A',
    dDay: '마감 D-5',
    stats: {
      views: '2,892',
      viewsTrend: '34%',
      applicants: '42',
      applicantsNew: '+12명',
      interviews: '8',
      interviewsMsg: '평가 중'
    },
    team: [
        { id: 'sk', initial: 'SK', name: 'Sarah', role: 'MKT' },
        { id: 'jy', initial: 'JY', name: 'Jin', role: 'Sales' },
        { id: 'mp', initial: 'MP', name: 'Min', role: 'Ops' }
    ],
    hiring: { role: 'Growth', isOpen: true }
  }
]

const initialEvents: CalendarEvent[] = [
  { id: '1', title: '창업성공패키지 마감', date: '2026-02-14', type: 'deadline', completed: false },
  { id: '2', title: 'Project Alpha 미팅', date: '2026-02-16', type: 'meeting', time: '14:00', completed: false },
  { id: '3', title: 'IR 자료 준비', date: '2026-02-17', type: 'todo', completed: false },
]

export const Dashboard: React.FC = () => {
  const router = useRouter()
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0)
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)

  const { user } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: recommendedOpportunities, isLoading: oppLoading } = useRecommendedOpportunities(4)
  const { data: myOpportunitiesData, isLoading: myOppLoading } = useMyOpportunities()

  const transformOpportunity = (opp: OpportunityWithCreator): Opportunity => {
    const daysLeft = calculateDaysLeft(opp.created_at)
    let scope: 'PROJECT' | 'PROGRAM' | 'TALENT' = 'PROJECT'
    let uiType: Opportunity['type'] = 'Team Building'

    if (opp.type === 'team_building') {
      scope = 'PROJECT'
      uiType = 'Team Building'
    } else if (opp.type === 'project_join') {
      scope = 'PROJECT'
      uiType = 'Team Building'
    }

    return {
      id: opp.id,
      scope,
      type: uiType,
      title: opp.title,
      organization: opp.creator?.nickname || 'Unknown',
      tags: opp.needed_roles || [],
      daysLeft,
      matchPercent: 85,
      category: opp.type === 'team_building' ? '팀 빌딩' : '프로젝트 합류',
    }
  }

  const displayOpportunities = recommendedOpportunities?.map(transformOpportunity) || opportunities

  const handleOpenModal = (opp: Opportunity) => {
     setSelectedOpportunity(opp)
  }

  const handleCloseModal = () => {
     setSelectedOpportunity(null)
  }

  const nextProject = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentProjectIndex((prev) => (prev + 1) % myProjects.length)
  }

  const prevProject = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentProjectIndex((prev) => (prev - 1 + myProjects.length) % myProjects.length)
  }

  const onToggleEvent = (id: string) => {
    setEvents(prev => prev.map(e =>
      e.id === id ? { ...e, completed: !e.completed } : e
    ))
  }

  const currentProject = myProjects[currentProjectIndex]

  const getScopeStyles = (scope?: string) => {
    switch (scope) {
      case 'PROJECT':
        return {
          variant: 'solid' as const,
          cardClass: 'bg-[#222222] border border-[#333] hover:border-gray-500 text-white',
          badgeClass: 'bg-white text-black border-transparent shadow-sm',
          textClass: 'text-white',
          subTextClass: 'text-gray-400',
          organizationClass: 'text-gray-300',
          fitBadgeClass: 'bg-[#333] border-[#444] text-white',
          icon: <Rocket size={10} />,
          text: 'PROJECT'
        }
      case 'PROGRAM':
        return {
          variant: 'solid' as const,
          cardClass: 'bg-[#0052CC] border border-blue-600 hover:border-blue-400 text-white',
          badgeClass: 'bg-white text-[#0052CC] border-transparent shadow-sm',
          textClass: 'text-white',
          subTextClass: 'text-blue-200',
          organizationClass: 'text-blue-100',
          fitBadgeClass: 'bg-white text-[#0052CC] border-blue-200',
          icon: <Landmark size={10} />,
          text: 'PROGRAM'
        }
      case 'TALENT':
        return {
          variant: 'solid' as const,
          cardClass: 'bg-[#059669] border border-emerald-600 hover:border-emerald-400 text-white',
          badgeClass: 'bg-white text-[#059669] border-transparent shadow-sm',
          textClass: 'text-white',
          subTextClass: 'text-emerald-200',
          organizationClass: 'text-emerald-100',
          fitBadgeClass: 'bg-white text-[#059669] border-emerald-200',
          icon: <User size={10} />,
          text: 'TALENT'
        }
      default:
        return {
          variant: 'default' as const,
          cardClass: 'bg-white hover:border-black text-gray-900',
          badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
          textClass: 'text-gray-900',
          subTextClass: 'text-gray-400',
          organizationClass: 'text-gray-500',
          fitBadgeClass: 'bg-green-50 text-green-700 border-green-100',
          icon: <Building2 size={10} />,
          text: 'ETC'
        }
    }
  }

  const upcomingTasks = events
    .filter(e => !e.completed)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  return (
    <div className="flex-1 overflow-y-auto h-screen bg-[#FAFAFA] bg-grid-engineering relative flex flex-col">

      <DetailModal
         isOpen={!!selectedOpportunity}
         onClose={handleCloseModal}
         data={selectedOpportunity}
      />

      <div className="max-w-[1600px] mx-auto p-8 lg:p-12 space-y-6 flex-1 flex flex-col w-full">

        {/* Header */}
        <div className="flex justify-between items-end border-b border-gray-200 pb-6 shrink-0">
          <div>
            <div className="text-xs font-mono text-gray-500 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-black rounded-sm"></span>
              WORKSPACE / MAIN
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          </div>
          <button
            onClick={() => router.push('/projects')}
            className="bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 rounded-sm shadow-sm"
          >
             <Plus size={16} /> New Draft
          </button>
        </div>

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">

          {/* Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0">

            {/* Profile Card */}
            <div className="col-span-12 md:col-span-3 flex flex-col gap-3">
              <Card
                className="flex-1 flex flex-col group cursor-pointer hover:border-black transition-all relative overflow-hidden h-full"
                padding="p-0"
                onClick={() => router.push('/profile')}
              >
                 <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-full -mr-4 -mt-4 z-0 transition-colors group-hover:bg-gray-100"></div>

                <div className="p-5 flex flex-col h-full relative z-10">
                  <div className="flex justify-between items-start mb-5">
                    <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold border-4 border-white shadow-sm group-hover:scale-110 transition-transform duration-300">
                      {profile?.nickname?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                        <div className="px-2 py-0.5 bg-green-50 text-green-700 text-[9px] font-bold border border-green-200 rounded-full font-mono uppercase tracking-tight flex items-center gap-1.5 shadow-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            {profile?.profile_visibility === 'private' ? 'Private' : 'Open to Work'}
                        </div>
                    </div>
                  </div>

                  <div className="mb-6">
                      <h2 className="text-xl font-bold text-gray-900 leading-none mb-1.5">
                        {profile?.nickname || user?.email?.split('@')[0] || 'User'}
                      </h2>
                      <p className="text-xs text-gray-500 font-mono flex items-center gap-2">
                        {profile?.desired_position || 'Position not set'}
                      </p>
                  </div>

                  <div className="bg-gray-50 rounded-sm border border-gray-100 p-3 space-y-2.5 mb-6 group-hover:bg-white group-hover:border-gray-200 transition-colors shadow-inner flex-1">
                      <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-400 font-mono uppercase font-medium">Affiliation</span>
                          <span className="font-bold text-gray-700">{profile?.university || 'Not set'}</span>
                      </div>
                      <div className="w-full h-px bg-gray-200"></div>
                      <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-400 font-mono uppercase font-medium">Location</span>
                          <span className="font-bold text-gray-700">{profile?.location || 'Not set'}</span>
                      </div>
                      <div className="w-full h-px bg-gray-200"></div>
                      <div className="flex justify-between items-center text-[10px]">
                          <span className="text-gray-400 font-mono uppercase font-medium">Expertise</span>
                          <span className="font-bold text-gray-700">
                            {profile?.interest_tags?.slice(0, 2).join(', ') || 'Not set'}
                          </span>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-auto">
                      <div className="p-2.5 rounded-sm border border-gray-200 bg-white group-hover:border-gray-400 transition-all shadow-sm">
                        <div className="text-[9px] text-gray-400 font-mono uppercase mb-0.5 flex items-center gap-1">
                             <Eye size={10} /> Views
                        </div>
                        <div className="font-bold text-lg text-gray-900 leading-none">-</div>
                      </div>
                      <div className="p-2.5 rounded-sm border border-gray-200 bg-white group-hover:border-gray-400 transition-all shadow-sm">
                        <div className="text-[9px] text-gray-400 font-mono uppercase mb-0.5 flex items-center gap-1">
                             <Users size={10} /> Network
                        </div>
                        <div className="font-bold text-lg text-draft-blue leading-none">-</div>
                      </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Project Status Card */}
            <div className="col-span-12 md:col-span-6">
              <Card className="relative overflow-hidden group cursor-pointer hover:border-black transition-all h-full flex flex-col" padding="p-0">
                <div className="p-5 border-b border-gray-100 bg-gray-50/30">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${currentProject.statusColor} animate-pulse`}></div>
                        <span className="text-[10px] font-bold font-mono text-gray-500 uppercase">{currentProject.status}</span>
                      </div>

                      <div className="flex items-center gap-1">
                          <button
                            onClick={prevProject}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-black transition-colors"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <span className="text-[10px] font-mono font-bold text-gray-400 select-none min-w-[30px] text-center">
                            {currentProjectIndex + 1} / {myProjects.length}
                          </span>
                          <button
                            onClick={nextProject}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-black transition-colors"
                          >
                            <ChevronRight size={14} />
                          </button>
                      </div>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight whitespace-pre-wrap break-keep">
                      {currentProject.title}
                    </h2>

                    <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono">
                      <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-sm uppercase">{currentProject.stage}</span>
                      <span className="flex items-center gap-1"><Clock size={10}/> {currentProject.dDay}</span>
                    </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="text-center p-2 rounded-sm bg-gray-50 border border-gray-100">
                          <div className="text-[9px] text-gray-400 font-mono uppercase mb-1">Views</div>
                          <div className="text-lg font-bold text-gray-900">{currentProject.stats.views}</div>
                          <div className="text-[9px] text-green-600 font-bold">{currentProject.stats.viewsTrend}</div>
                      </div>
                      <div className="text-center p-2 rounded-sm bg-gray-50 border border-gray-100">
                          <div className="text-[9px] text-gray-400 font-mono uppercase mb-1">Apps</div>
                          <div className="text-lg font-bold text-gray-900">{currentProject.stats.applicants}</div>
                          <div className="text-[9px] text-green-600 font-bold">{currentProject.stats.applicantsNew}</div>
                      </div>
                      <div className="text-center p-2 rounded-sm bg-blue-50 border border-blue-100 text-draft-blue">
                          <div className="text-[9px] font-mono uppercase mb-1 opacity-70">Intv</div>
                          <div className="text-lg font-bold">{currentProject.stats.interviews}</div>
                          <div className="text-[9px] font-bold">{currentProject.stats.interviewsMsg}</div>
                      </div>
                    </div>

                    <div className="mt-auto">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                                <Users size={12} /> Project Team
                            </h3>
                            <button className="p-1 hover:bg-gray-100 rounded-sm text-gray-400 hover:text-black">
                                <MoreHorizontal size={14} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            {currentProject.team.map((member) => (
                                <div key={member.id} className="flex items-center gap-2 pl-1 pr-3 py-1 bg-white border border-gray-200 rounded-full hover:border-black transition-colors cursor-pointer shadow-sm">
                                    <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                                        {member.initial}
                                    </div>
                                    <div className="flex flex-col leading-none">
                                        <span className="text-[10px] font-bold text-gray-900">{member.name}</span>
                                        <span className="text-[9px] text-gray-500 font-mono">{member.role}</span>
                                    </div>
                                </div>
                            ))}

                            {currentProject.hiring.isOpen && (
                                <div className="ml-auto flex items-center gap-2 pl-1 pr-3 py-1 bg-gray-50 border border-dashed border-gray-300 rounded-full hover:bg-white hover:border-black transition-colors cursor-pointer group">
                                    <div className="w-6 h-6 bg-white border border-gray-200 text-gray-400 rounded-full flex items-center justify-center group-hover:text-black group-hover:border-black">
                                        <Plus size={12} />
                                    </div>
                                    <div className="flex flex-col leading-none">
                                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-black">Hiring</span>
                                        <span className="text-[9px] text-gray-400 font-mono group-hover:text-gray-600">{currentProject.hiring.role}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
              </Card>
            </div>

            {/* Deadline & Tasks */}
            <div className="col-span-12 md:col-span-3 flex flex-col gap-3">
              <Card
                className="relative bg-black text-white border-none cursor-pointer hover:bg-gray-800 transition-colors"
                padding="p-4"
                onClick={() => router.push('/calendar')}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-[9px] font-mono text-gray-400 border border-gray-700 px-1.5 py-0 rounded-full">DEADLINE</div>
                  <ArrowUpRight size={14} className="text-gray-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono mb-0.5">D-1</div>
                  <div className="text-[11px] text-gray-400 break-keep">3개의 관심 공고가<br/>곧 마감됩니다.</div>
                </div>
              </Card>

              <div className="flex-1 bg-white border border-gray-200 p-4 rounded-sm flex flex-col hover:border-black transition-colors shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                    <span className="text-[10px] font-bold text-gray-900 font-mono flex items-center gap-1.5">
                      <CalendarDays size={12} /> UPCOMING TASKS
                    </span>
                    <button onClick={() => router.push('/calendar')} className="text-gray-400 hover:text-black"><Plus size={12}/></button>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                    {upcomingTasks.length > 0 ? (
                      upcomingTasks.map(task => (
                        <div
                          key={task.id}
                          className="flex items-start gap-2.5 group cursor-pointer"
                          onClick={() => onToggleEvent(task.id)}
                        >
                            <div className="mt-0.5 text-gray-300 group-hover:text-black transition-colors">
                              {task.completed ? <CheckSquare size={14} /> : <Square size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`text-xs font-medium block truncate mb-0.5 ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                {task.title}
                              </span>
                              <div className="text-[9px] text-gray-400 font-mono flex items-center gap-1">
                                 {task.date.slice(5)} {task.time && `• ${task.time}`}
                                 {task.type === 'deadline' && <span className="text-red-500 font-bold">• D-DAY</span>}
                              </div>
                            </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-300 text-[10px] py-4">
                         <div className="mb-1">All Clear</div>
                         <div className="font-mono">No tasks pending</div>
                      </div>
                    )}
                </div>

                {upcomingTasks.length > 0 && (
                  <button
                    onClick={() => router.push('/calendar')}
                    className="mt-4 text-[9px] text-gray-400 hover:text-black text-center font-mono w-full pt-2 border-t border-dashed border-gray-100"
                  >
                    View All Schedule
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Opportunity Index */}
          <div className="flex flex-col gap-3">
             <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-gray-900">Recommended Opportunities</h3>
                <button
                   onClick={() => router.push('/explore')}
                   className="text-[10px] text-gray-500 hover:text-black font-medium"
                >
                   View All
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {oppLoading ? (
                  <div className="col-span-4 flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-gray-400" size={24} />
                  </div>
                ) : displayOpportunities.map((opp) => {
                  const styles = getScopeStyles(opp.scope)
                  return (
                    <Card
                       key={opp.id}
                       variant={styles.variant}
                       className={`group transition-all cursor-pointer relative ${styles.cardClass}`}
                       padding="p-4"
                       onClick={() => handleOpenModal(opp)}
                    >
                       <div className="flex flex-col h-[130px] justify-between">
                         <div>
                            <div className="flex justify-between items-start mb-2">
                                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-sm border text-[9px] font-bold font-mono ${styles.badgeClass}`}>
                                  {styles.icon}
                                  {styles.text}
                                </div>
                                {opp.matchPercent && opp.matchPercent > 80 && (
                                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${styles.fitBadgeClass}`}>
                                      {opp.matchPercent}% FIT
                                  </span>
                                )}
                            </div>

                            <div>
                              <span className={`text-[9px] font-mono uppercase block mb-0.5 ${styles.subTextClass}`}>
                                  {opp.category}
                              </span>
                              <h4 className={`font-bold text-sm leading-snug transition-colors break-keep line-clamp-2 group-hover:opacity-80 ${styles.textClass}`}>
                                  {opp.title}
                              </h4>
                            </div>
                         </div>

                         <div className={`flex items-center justify-between text-[9px] ${styles.organizationClass} pt-2 border-t border-white/10`}>
                            <div className="flex items-center gap-1 max-w-[70%]">
                                <Building2 size={8} />
                                <span className="truncate">{opp.organization}</span>
                            </div>
                            {opp.daysLeft && (
                                <div className="font-mono flex items-center gap-1">
                                    <Clock size={8} /> D-{opp.daysLeft}
                                </div>
                            )}
                         </div>
                      </div>
                    </Card>
                  )
                })}
             </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-8 border-t border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-2">
                      <Command size={16} className="text-gray-400" />
                      <span className="font-bold text-gray-900 text-sm tracking-tight">Draft Inc.</span>
                  </div>

                  <div className="flex gap-6 text-[10px] text-gray-500 font-mono">
                      <a href="#" className="hover:text-black transition-colors">Terms of Service</a>
                      <a href="#" className="hover:text-black transition-colors">Privacy Policy</a>
                      <a href="#" className="hover:text-black transition-colors">Business License: 820-81-00000</a>
                  </div>

                  <div className="text-[10px] text-gray-400 font-mono">
                      © 2026 Draft Inc. All rights reserved.
                  </div>
              </div>
          </div>

        </div>
      </div>
    </div>
  )
}
