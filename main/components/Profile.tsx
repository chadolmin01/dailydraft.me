'use client'

import React, { useState } from 'react'
import { Card } from './ui/Card'
import {
  MapPin,
  Download,
  CheckSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Edit3
} from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { useProfile } from '@/src/hooks/useProfile'

export const Profile: React.FC = () => {
  const [currentAnalysisIndex, setCurrentAnalysisIndex] = useState(0)
  const { user } = useAuth()
  const { data: profile, isLoading } = useProfile()

  const skills = profile?.skills as Array<{ name: string; level: string }> | null

  const analysisReports = [
    {
      id: 'hardware',
      title: 'Hardware Startup',
      score: 98,
      metrics: [
        { label: 'MARKET FIT', val: 98 },
        { label: 'EXPERIENCE', val: 75 }
      ],
      theme: 'bg-[#0052CC] border-blue-900',
      textColor: 'text-white',
      subColor: 'text-blue-200',
      barBg: 'bg-blue-900/40',
      barFill: 'bg-white',
      btnText: 'text-[#0052CC]'
    },
    {
      id: 'saas',
      title: 'B2B SaaS',
      score: 85,
      metrics: [
        { label: 'TECH STACK', val: 92 },
        { label: 'SCALABILITY', val: 60 }
      ],
      theme: 'bg-gray-900 border-black',
      textColor: 'text-white',
      subColor: 'text-gray-400',
      barBg: 'bg-gray-700',
      barFill: 'bg-white',
      btnText: 'text-black'
    },
    {
      id: 'impact',
      title: 'Social Impact',
      score: 90,
      metrics: [
        { label: 'MISSION FIT', val: 95 },
        { label: 'ESG SCORE', val: 82 }
      ],
      theme: 'bg-[#059669] border-green-800',
      textColor: 'text-white',
      subColor: 'text-green-200',
      barBg: 'bg-green-800/40',
      barFill: 'bg-white',
      btnText: 'text-[#059669]'
    }
  ]

  const nextReport = () => {
    setCurrentAnalysisIndex((prev) => (prev + 1) % analysisReports.length)
  }

  const prevReport = () => {
    setCurrentAnalysisIndex((prev) => (prev - 1 + analysisReports.length) % analysisReports.length)
  }

  const currentReport = analysisReports[currentAnalysisIndex]

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-[#FAFAFA]">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    )
  }

  const lastUpdated = profile?.updated_at
    ? new Date(profile.updated_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace('.', '')
    : '-'

  return (
    <div className="flex-1 p-8 lg:p-12 overflow-y-auto h-screen bg-[#FAFAFA] bg-grid-engineering">
      <div className="max-w-[1600px] mx-auto space-y-10">

        {/* Header */}
        <div className="flex justify-between items-end border-b border-gray-200 pb-6">
           <div>
              <div className="text-xs font-mono text-gray-500 mb-2">PERSONNEL FILE / ID: {profile?.id?.slice(0, 8).toUpperCase() || 'N/A'}</div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Profile</h1>
           </div>
           <div className="text-right flex items-center gap-4">
              <div className="font-mono text-xs text-gray-400">Last Updated: {lastUpdated}</div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-sm hover:bg-black hover:text-white hover:border-black transition-colors">
                <Edit3 size={12} /> Edit Profile
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

           {/* Left Column */}
           <div className="col-span-12 md:col-span-8 lg:col-span-9 space-y-8">

              {/* Profile Overview */}
              <div className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-8">
                 <div className="w-32 h-32 bg-gray-100 rounded-sm border border-gray-200 flex items-center justify-center shrink-0 text-3xl font-bold text-gray-400">
                    {profile?.nickname?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'U'}
                 </div>
                 <div className="flex-1 space-y-6">
                    <div>
                       <h2 className="text-xl font-bold text-gray-900">
                         {profile?.nickname || 'User'}
                         {profile?.university && (
                           <span className="text-sm font-normal text-gray-400 ml-2 font-mono">{profile.university}</span>
                         )}
                       </h2>
                       <p className="text-sm text-gray-500 mt-1">
                         {profile?.vision_summary || profile?.desired_position || 'Complete your profile to add a bio'}
                       </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2 border-t border-gray-100">
                       <div>
                          <label className="block text-[10px] font-mono font-bold text-gray-400 mb-1">POSITION</label>
                          <div className="font-bold text-sm text-gray-900">{profile?.desired_position || 'Not set'}</div>
                       </div>
                       <div>
                          <label className="block text-[10px] font-mono font-bold text-gray-400 mb-1">AFFILIATION</label>
                          <div className="font-bold text-sm text-gray-900">{profile?.university || 'Not set'}</div>
                       </div>
                       <div>
                          <label className="block text-[10px] font-mono font-bold text-gray-400 mb-1">LOCATION</label>
                          <div className="font-bold text-sm text-gray-900 flex items-center gap-1">
                            <MapPin size={12} className="text-gray-400"/> {profile?.location || 'Not set'}
                          </div>
                       </div>
                       <div>
                          <label className="block text-[10px] font-mono font-bold text-gray-400 mb-1">CONTACT</label>
                          <div className="font-bold text-sm text-gray-900 font-mono truncate">
                            {profile?.contact_email || user?.email || 'Not set'}
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                       {profile?.interest_tags?.map((tag, idx) => (
                         <span key={idx} className="px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-sm bg-gray-50">
                           {tag}
                         </span>
                       ))}
                       {(!profile?.interest_tags || profile.interest_tags.length === 0) && (
                         <span className="text-xs text-gray-400">No interests added yet</span>
                       )}
                    </div>
                 </div>
              </div>

              {/* Skills */}
              <div>
                 <h3 className="text-sm font-bold text-gray-900 mb-4 font-mono uppercase">Technical Specifications</h3>
                 {skills && skills.length > 0 ? (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Card variant="flat" padding="p-5" className="rounded-sm bg-white border-gray-200">
                         <h4 className="text-xs font-bold text-gray-500 mb-3 font-mono">SKILLS</h4>
                         <ul className="space-y-2 text-sm text-gray-700">
                            {skills.map((skill, idx) => (
                              <li key={idx} className="flex items-center justify-between gap-2">
                                <span className="flex items-center gap-2">
                                  <CheckSquare size={14} className="text-draft-blue"/>
                                  {skill.name}
                                </span>
                                <span className="text-[10px] font-mono text-gray-400 uppercase">{skill.level}</span>
                              </li>
                            ))}
                         </ul>
                      </Card>
                      {profile?.personality && (
                        <Card variant="flat" padding="p-5" className="rounded-sm bg-white border-gray-200">
                           <h4 className="text-xs font-bold text-gray-500 mb-3 font-mono">PERSONALITY</h4>
                           <ul className="space-y-2 text-sm text-gray-700">
                              {Object.entries(profile.personality as Record<string, number>).map(([key, value]) => (
                                <li key={key} className="flex items-center justify-between gap-2">
                                  <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-draft-blue rounded-full"
                                        style={{ width: `${value}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] font-mono text-gray-400">{value}%</span>
                                  </div>
                                </li>
                              ))}
                           </ul>
                        </Card>
                      )}
                   </div>
                 ) : (
                   <Card variant="flat" padding="p-5" className="rounded-sm bg-white border-gray-200">
                      <p className="text-sm text-gray-400 text-center py-4">
                        No skills added yet. Complete your profile to add skills.
                      </p>
                   </Card>
                 )}
              </div>

              {/* History */}
              <div>
                 <h3 className="text-sm font-bold text-gray-900 mb-4 font-mono uppercase">Project History</h3>
                 <div className="space-y-6 border-l border-gray-200 pl-6 ml-2">
                    <div className="relative">
                       <div className="absolute -left-[29px] top-1.5 w-3 h-3 bg-white border border-gray-400 rounded-sm"></div>
                       <div className="text-xs font-mono text-gray-400 mb-1">2023.01 - 2023.06</div>
                       <h4 className="font-bold text-gray-900">브랜드 리뉴얼 프로젝트</h4>
                       <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          전면적인 리브랜딩 전략을 수립하고 실행하여 MAU 200% 성장을 달성했습니다. 디자인, 개발, 마케팅 크로스펑셔널 팀을 리드했습니다.
                       </p>
                    </div>
                    <div className="relative">
                       <div className="absolute -left-[29px] top-1.5 w-3 h-3 bg-white border border-gray-400 rounded-sm"></div>
                       <div className="text-xs font-mono text-gray-400 mb-1">2022.05 - 2022.12</div>
                       <h4 className="font-bold text-gray-900">하드웨어 런칭 킥스타터 캠페인</h4>
                       <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          목표 금액의 500%를 초과 달성하며 성공적으로 런칭했습니다. 초기 유저 커뮤니티 5,000명을 확보했습니다.
                       </p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Right Column: Analysis */}
           <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-6">

              {/* Dynamic Analysis Card */}
              <div className={`p-6 rounded-sm shadow-lg border transition-all duration-500 relative overflow-hidden ${currentReport.theme}`}>
                 <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className={`text-xl font-bold mb-1 break-keep leading-tight ${currentReport.textColor}`}>
                            {currentReport.title}<br/>Fit Analysis
                        </h3>
                        <p className={`${currentReport.subColor} text-[10px] font-mono mt-1`}>AI MATCHING REPORT</p>
                    </div>
                    <div className="flex gap-1 z-10">
                        <button
                            onClick={prevReport}
                            className={`p-1 rounded hover:bg-white/20 transition-colors ${currentReport.textColor}`}
                        >
                            <ChevronLeft size={18}/>
                        </button>
                        <button
                            onClick={nextReport}
                            className={`p-1 rounded hover:bg-white/20 transition-colors ${currentReport.textColor}`}
                        >
                            <ChevronRight size={18}/>
                        </button>
                    </div>
                 </div>

                 <div className="space-y-5 text-sm relative z-10 min-h-[100px]">
                    {currentReport.metrics.map((metric, idx) => (
                        <div key={idx}>
                           <div className={`flex justify-between mb-1.5 text-xs font-mono ${currentReport.subColor}`}>
                              <span>{metric.label}</span>
                              <span className={currentReport.textColor + " font-bold"}>{metric.val}%</span>
                           </div>
                           <div className={`w-full h-1.5 rounded-sm overflow-hidden ${currentReport.barBg}`}>
                              <div
                                className={`h-full ${currentReport.barFill} transition-all duration-500`}
                                style={{ width: `${metric.val}%` }}
                              ></div>
                           </div>
                        </div>
                    ))}
                 </div>

                 <div className="flex justify-center gap-1.5 mt-8 mb-4">
                    {analysisReports.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                idx === currentAnalysisIndex ? 'bg-white scale-125' : 'bg-white/30'
                            }`}
                        />
                    ))}
                 </div>

                 <button className={`w-full py-3 bg-white ${currentReport.btnText} font-bold text-xs rounded-sm hover:bg-gray-100 transition-colors uppercase font-mono shadow-sm`}>
                    View Full Report
                 </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-sm p-5 shadow-sm">
                 <h4 className="font-bold text-xs text-gray-500 mb-4 font-mono uppercase flex items-center gap-2">
                    <FileText size={14}/> Attachments
                 </h4>
                 <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-sm border border-gray-100 hover:border-black transition-colors cursor-pointer group">
                       <span className="text-sm text-gray-700 truncate font-medium">Resume_2024.pdf</span>
                       <Download size={14} className="text-gray-400 group-hover:text-black"/>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-sm border border-gray-100 hover:border-black transition-colors cursor-pointer group">
                       <span className="text-sm text-gray-700 truncate font-medium">Portfolio.pdf</span>
                       <Download size={14} className="text-gray-400 group-hover:text-black"/>
                    </div>
                 </div>
              </div>

           </div>
        </div>
      </div>
    </div>
  )
}
