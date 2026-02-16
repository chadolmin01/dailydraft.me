'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from './ui/Card'
import {
  Inbox,
  Plus,
  FolderOpen,
  MoreHorizontal,
  Users,
  Clock,
  Eye,
  MessageSquare,
  AlertCircle,
  Calendar,
  ChevronRight,
  Folder,
  Lightbulb,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { NewProjectModal } from './NewProjectModal'
import { BuildModal } from './BuildModal'
import { validationResultsStore, ValidationResult } from '@/src/lib/validationResultsStore'
import type { PRDResult } from '@/src/lib/api/prd'

export const Projects: React.FC = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'opportunities' | 'applications'>('opportunities')
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [isBuildModalOpen, setIsBuildModalOpen] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [validatedIdeas, setValidatedIdeas] = useState<ValidationResult[]>([])
  const [currentPrdData, setCurrentPrdData] = useState<PRDResult | null>(null)
  const [importedIdea, setImportedIdea] = useState<string>('')

  // Load validated ideas on mount
  useEffect(() => {
    setValidatedIdeas(validationResultsStore.getAll())
  }, [])

  const handleNewProject = () => {
    const hasValidatedIdeas = validationResultsStore.getAll().length > 0
    if (hasValidatedIdeas) {
      setShowImportModal(true)
    } else {
      // Navigate to messages with validator mode
      router.push('/messages?mode=validator')
    }
  }

  const handleImportIdea = (idea: ValidationResult) => {
    setShowImportModal(false)
    // Open new project modal with pre-filled idea
    const formattedIdea = `${idea.projectIdea}\n\n### AI 검증 인사이트\n${idea.reflectedAdvice.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
    setImportedIdea(formattedIdea)
    setIsNewProjectModalOpen(true)
  }

  const myOpportunities = [
    {
      id: 'o1',
      title: 'Project Alpha: AI Legal Assistant',
      status: 'ACTIVE',
      daysLeft: 5,
      stats: { views: 1240, applicants: 18, new: 3 },
      tags: ['AI/ML', 'LegalTech', 'SaaS'],
      createdAt: '2024.02.01',
      candidates: [
        { id: 1, initial: 'JD', bg: 'bg-blue-100 text-blue-600' },
        { id: 2, initial: 'SK', bg: 'bg-green-100 text-green-600' },
        { id: 3, initial: 'MP', bg: 'bg-purple-100 text-purple-600' },
      ]
    },
    {
      id: 'o2',
      title: 'Pet Care Platform MVP',
      status: 'DRAFT',
      daysLeft: 0,
      stats: { views: 0, applicants: 0, new: 0 },
      tags: ['Pet', 'Mobile App', 'React Native'],
      createdAt: '2024.02.12',
      candidates: []
    }
  ]

  const myApplications = [
    {
      id: 'a1',
      company: 'Toss Bank',
      role: 'Product Designer',
      appliedDate: '2024.02.10',
      status: 'INTERVIEW',
      step: 3,
      nextAction: 'Interview on Feb 16, 2:00 PM',
      messages: 2
    },
    {
      id: 'a2',
      company: 'Danggeun Market',
      role: 'Growth Marketer',
      appliedDate: '2024.02.12',
      status: 'REVIEW',
      step: 2,
      nextAction: 'Waiting for document review',
      messages: 0
    },
    {
      id: 'a3',
      company: 'Stealth Startup (AI)',
      role: 'Co-founder (CMO)',
      appliedDate: '2024.02.01',
      status: 'OFFER',
      step: 4,
      nextAction: 'Review contract by Feb 14',
      messages: 5
    }
  ]

  const getStatusColor = (status: string) => {
     switch(status) {
        case 'ACTIVE': return 'bg-green-50 text-green-600 border-green-100'
        case 'DRAFT': return 'bg-gray-50 text-gray-500 border-gray-200'
        case 'CLOSED': return 'bg-red-50 text-red-500 border-red-100'
        default: return 'bg-gray-50 text-gray-500'
     }
  }

  const getStepStatus = (currentStep: number, stepIndex: number) => {
     if (currentStep > stepIndex) return 'completed'
     if (currentStep === stepIndex) return 'current'
     return 'pending'
  }

  return (
    <div className="flex-1 p-8 lg:p-12 overflow-y-auto h-screen bg-[#FAFAFA] bg-grid-engineering">
      <div className="max-w-[1600px] mx-auto space-y-8">

         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-6">
            <div>
               <div className="text-xs font-mono text-gray-500 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-black rounded-sm"></span>
                  WORKSPACE / MANAGE
               </div>
               <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Projects</h1>
            </div>

            <div className="bg-gray-100 p-1 rounded-sm flex gap-1">
               <button
                  onClick={() => setActiveTab('opportunities')}
                  className={`px-4 py-2 text-xs font-bold font-mono rounded-sm transition-all flex items-center gap-2
                     ${activeTab === 'opportunities'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'}
                  `}
               >
                  <Folder size={14} /> MY POSTS
               </button>
               <button
                  onClick={() => setActiveTab('applications')}
                  className={`px-4 py-2 text-xs font-bold font-mono rounded-sm transition-all flex items-center gap-2
                     ${activeTab === 'applications'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'}
                  `}
               >
                  <Inbox size={14} /> APPLICATIONS
               </button>
            </div>
         </div>

         {activeTab === 'opportunities' ? (
            <div className="space-y-6">
               {/* Summary Stats */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-sm border border-gray-200">
                     <div className="text-[10px] text-gray-400 font-mono uppercase mb-1">Total Views</div>
                     <div className="text-2xl font-bold">1,240</div>
                  </div>
                  <div className="bg-white p-4 rounded-sm border border-gray-200">
                     <div className="text-[10px] text-gray-400 font-mono uppercase mb-1">Total Applicants</div>
                     <div className="text-2xl font-bold">18</div>
                  </div>
                  <div className="bg-white p-4 rounded-sm border border-gray-200">
                     <div className="text-[10px] text-gray-400 font-mono uppercase mb-1">Interviews</div>
                     <div className="text-2xl font-bold text-draft-blue">4</div>
                  </div>
                  <button
                     onClick={handleNewProject}
                     className="bg-black text-white p-4 rounded-sm flex flex-col items-center justify-center hover:bg-gray-800 transition-colors group"
                  >
                     <Plus size={24} className="mb-2 group-hover:scale-110 transition-transform"/>
                     <span className="text-xs font-bold font-mono">NEW PROJECT</span>
                  </button>
               </div>

               {/* Opportunities Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myOpportunities.map((opp) => (
                     <Card key={opp.id} className="group hover:border-black transition-all h-full" padding="p-0">
                        <div className="p-6 flex flex-col h-full">
                           <div className="flex justify-between items-start mb-3">
                              <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border font-mono ${getStatusColor(opp.status)}`}>
                                 {opp.status}
                              </span>
                              <button className="text-gray-300 hover:text-black">
                                 <MoreHorizontal size={16} />
                              </button>
                           </div>

                           <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{opp.title}</h3>

                           <div className="flex flex-wrap gap-1 mb-4">
                              {opp.tags.map(tag => (
                                 <span key={tag} className="px-1.5 py-0.5 bg-gray-50 border border-gray-100 rounded-sm text-[10px] text-gray-500 font-mono">
                                    #{tag}
                                 </span>
                              ))}
                           </div>

                           <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-100 border-b mb-5 bg-gray-50/30 rounded-sm">
                              <div className="text-center border-r border-gray-100 last:border-0">
                                 <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                                    <Eye size={12} />
                                 </div>
                                 <span className="text-sm font-bold text-gray-900">{opp.stats.views}</span>
                              </div>
                              <div className="text-center border-r border-gray-100 last:border-0">
                                 <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                                    <Users size={12} />
                                 </div>
                                 <span className="text-sm font-bold text-gray-900">{opp.stats.applicants}</span>
                              </div>
                              <div className="text-center">
                                 <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                                    <Clock size={12} />
                                 </div>
                                 <span className="text-sm font-bold text-gray-900">D-{opp.daysLeft}</span>
                              </div>
                           </div>

                           <div className="mt-auto flex justify-between items-end">
                              <div className="space-y-2">
                                 {opp.candidates.length > 0 ? (
                                    <div className="flex -space-x-2">
                                       {opp.candidates.map((c) => (
                                          <div key={c.id} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold ${c.bg}`}>
                                             {c.initial}
                                          </div>
                                       ))}
                                       {opp.stats.new > 0 && (
                                          <div className="w-8 h-8 rounded-full border-2 border-white bg-red-50 text-red-500 flex items-center justify-center text-[10px] font-bold">
                                             +{opp.stats.new}
                                          </div>
                                       )}
                                    </div>
                                 ) : (
                                    <div className="h-8 flex items-center text-xs text-gray-400 font-mono">
                                       No applicants yet
                                    </div>
                                 )}

                                 <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                                    <Calendar size={10} /> Created {opp.createdAt}
                                 </div>
                              </div>

                              <button
                                 onClick={() => setIsNewProjectModalOpen(true)}
                                 className="text-xs font-bold text-black border border-gray-200 hover:bg-black hover:text-white px-3 py-1.5 rounded-sm transition-colors flex items-center gap-1 shadow-sm"
                              >
                                 Manage <ChevronRight size={12} />
                              </button>
                           </div>
                        </div>
                     </Card>
                  ))}

                  <div
                     onClick={handleNewProject}
                     className="border border-dashed border-gray-300 rounded-sm p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer min-h-[280px] group"
                  >
                     <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-white group-hover:text-black transition-all text-gray-400">
                        <FolderOpen size={20} className="text-gray-400 group-hover:text-black" />
                     </div>
                     <h3 className="text-sm font-bold text-gray-900 mb-1">Create Draft</h3>
                     <p className="text-xs text-gray-500 max-w-[150px]">
                        AI와 함께 새로운 프로젝트 공고를 작성해보세요.
                     </p>
                  </div>
               </div>
            </div>
         ) : (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-900">Application Pipeline</h2>
                  <div className="text-xs font-mono text-gray-500">
                     ACTIVE APPLICATIONS: <span className="font-bold text-black">3</span>
                  </div>
               </div>

               <div className="space-y-4">
                  {myApplications.map((app) => (
                     <Card key={app.id} padding="p-0" className="overflow-hidden group hover:border-black transition-all">
                        <div className="flex flex-col md:flex-row">
                           <div className="p-6 flex-1">
                              <div className="flex justify-between items-start mb-4">
                                 <div>
                                    <h3 className="font-bold text-lg text-gray-900">{app.company}</h3>
                                    <p className="text-sm text-gray-500 font-mono mt-0.5">{app.role}</p>
                                 </div>
                                 <span className="text-[10px] font-mono text-gray-400">
                                    Applied on {app.appliedDate}
                                 </span>
                              </div>

                              <div className="flex items-center gap-4 mt-6">
                                 {app.nextAction && (
                                    <div className="flex items-center gap-2 bg-yellow-50 text-yellow-800 px-3 py-1.5 rounded-sm text-xs font-bold border border-yellow-100">
                                       <AlertCircle size={12} /> {app.nextAction}
                                    </div>
                                 )}
                                 {app.messages > 0 && (
                                    <div className="flex items-center gap-1 text-xs font-bold text-draft-blue">
                                       <MessageSquare size={12} /> {app.messages} New Messages
                                    </div>
                                 )}
                              </div>
                           </div>

                           <div className="bg-gray-50 border-t md:border-t-0 md:border-l border-gray-100 p-6 md:w-[400px] flex flex-col justify-center">
                              <div className="flex justify-between items-center mb-4">
                                 <span className="text-xs font-bold font-mono text-gray-500 uppercase">Status</span>
                                 <span className={`text-xs font-bold px-2 py-1 rounded-sm ${
                                    app.status === 'OFFER' ? 'bg-green-100 text-green-700' :
                                    app.status === 'INTERVIEW' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                                 }`}>
                                    {app.status}
                                 </span>
                              </div>

                              <div className="relative">
                                 <div className="flex justify-between mb-2 relative z-10">
                                    {['Applied', 'Review', 'Interview', 'Offer'].map((label, idx) => {
                                       const stepStatus = getStepStatus(app.step, idx + 1)
                                       return (
                                          <div key={label} className="flex flex-col items-center">
                                             <div className={`w-3 h-3 rounded-full border-2 mb-1 transition-colors ${
                                                stepStatus === 'completed' ? 'bg-black border-black' :
                                                stepStatus === 'current' ? 'bg-white border-black' :
                                                'bg-white border-gray-300'
                                             }`}></div>
                                             <span className={`text-[10px] font-mono ${
                                                stepStatus === 'pending' ? 'text-gray-300' : 'text-gray-900 font-bold'
                                             }`}>{label}</span>
                                          </div>
                                       )
                                    })}
                                 </div>
                                 <div className="absolute top-1.5 left-2 right-2 h-0.5 bg-gray-200 -z-0">
                                    <div
                                       className="h-full bg-black transition-all duration-500"
                                       style={{ width: `${((app.step - 1) / 3) * 100}%` }}
                                    ></div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </Card>
                  ))}

                  <div className="text-center py-8">
                     <button className="text-xs font-bold text-gray-400 hover:text-black uppercase font-mono border-b border-transparent hover:border-black transition-all pb-0.5">
                        View Archived Applications
                     </button>
                  </div>
               </div>
            </div>
         )}

      </div>

      {/* New Project Modal (Phase 2) */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => {
          setIsNewProjectModalOpen(false)
          setImportedIdea('')
        }}
        onProceedToBuild={(prdData) => {
          setCurrentPrdData(prdData);
          setIsBuildModalOpen(true);
        }}
        initialIdea={importedIdea}
      />

      {/* Build Modal (Phase 3) */}
      <BuildModal
        isOpen={isBuildModalOpen}
        onClose={() => {
          setIsBuildModalOpen(false);
          setCurrentPrdData(null);
        }}
        prdData={currentPrdData}
      />

      {/* Import Validated Idea Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowImportModal(false)}
          />
          <div className="relative bg-white w-[90vw] max-w-[600px] rounded-lg shadow-2xl p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Lightbulb size={20} className="text-blue-600" />
              새 프로젝트 시작하기
            </h2>

            <div className="space-y-3 mb-6">
              {/* Validated Ideas */}
              {validatedIdeas.length > 0 && (
                <>
                  <div className="text-xs font-mono text-gray-400 uppercase">검증된 아이디어 가져오기</div>
                  {validatedIdeas.slice(0, 3).map((idea) => (
                    <button
                      key={idea.id}
                      onClick={() => handleImportIdea(idea)}
                      className="w-full text-left p-4 border border-blue-100 bg-blue-50/50 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {idea.projectIdea.slice(0, 60)}...
                          </div>
                          <div className="text-xs text-blue-600 mt-1 font-mono">
                            {new Date(idea.timestamp).toLocaleDateString()} · {idea.reflectedAdvice.length} insights
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-blue-400 group-hover:translate-x-1 transition-transform mt-1" />
                      </div>
                    </button>
                  ))}
                </>
              )}

              <div className="text-xs font-mono text-gray-400 uppercase mt-4">또는</div>

              {/* New Idea Validation */}
              <button
                onClick={() => {
                  setShowImportModal(false)
                  router.push('/messages?mode=validator')
                }}
                className="w-full text-left p-4 border border-gray-200 rounded-md hover:border-black hover:bg-gray-50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black rounded-md flex items-center justify-center">
                      <Sparkles size={18} className="text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">새 아이디어 검증하기</div>
                      <div className="text-xs text-gray-500">AI Co-founder와 함께 아이디어를 검증합니다</div>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Direct Create */}
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setIsNewProjectModalOpen(true)
                }}
                className="w-full text-left p-4 border border-gray-200 rounded-md hover:border-gray-400 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                      <Plus size={18} className="text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">바로 프로젝트 만들기</div>
                      <div className="text-xs text-gray-500">검증 없이 바로 프로젝트를 생성합니다</div>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowImportModal(false)}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
