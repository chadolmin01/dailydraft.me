'use client'

import React, { useState, useEffect } from 'react'
import { Card } from './ui/Card'
import {
  FileText,
  Plus,
  Sparkles,
  Folder,
  MoreHorizontal,
  Download,
  Search,
  FileCheck,
  FileCode,
  Megaphone,
  Lightbulb,
  X,
  ChevronRight
} from 'lucide-react'

interface DocItem {
  id: string
  title: string
  type: 'doc' | 'pdf' | 'sheet'
  tag: string
  updated: string
  status: 'Draft' | 'Final' | 'Review'
}

const recentDocs: DocItem[] = [
  { id: '1', title: '2026 예비창업패키지 사업계획서_v1.2', type: 'doc', tag: 'Funding', updated: '2 hours ago', status: 'Draft' },
  { id: '2', title: '초기 팀 빌딩 주주간 계약서 (초안)', type: 'pdf', tag: 'Legal', updated: 'Yesterday', status: 'Review' },
  { id: '3', title: '헬스케어 시장 SOM 분석 데이터', type: 'sheet', tag: 'Research', updated: 'Feb 10', status: 'Final' },
  { id: '4', title: '서비스 소개서 (Landing Page Copy)', type: 'doc', tag: 'Marketing', updated: 'Feb 08', status: 'Draft' },
]

const templates = [
  { title: 'PSST 표준 사업계획서', desc: '정부지원사업 합격 표준 양식', category: 'Funding' },
  { title: 'IR Pitch Deck (Seed)', desc: '초기 투자 유치를 위한 발표 자료', category: 'Investment' },
  { title: '공동창업자 계약서', desc: '지분 분배 및 역할 정의', category: 'Legal' },
  { title: '린 캔버스 (Lean Canvas)', desc: '비즈니스 모델 한 장 정리', category: 'Strategy' },
]

export const Documents: React.FC = () => {
  const [showProTip, setShowProTip] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowProTip(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex-1 p-8 lg:p-12 overflow-y-auto h-screen bg-surface-bg bg-grid-engineering relative">

      {/* Pro Tip */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg transition-all duration-500 ${showProTip ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-[#222] text-white p-4 shadow-brutal flex items-start gap-4 mx-4 border border-black">
            <div className="mt-0.5"><Lightbulb size={16} className="text-status-warning-text" /></div>
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <h4 className="text-[0.625rem] font-bold font-mono uppercase tracking-widest mb-1 text-white/80">Pro Tip</h4>
                    <button onClick={() => setShowProTip(false)} className="text-white/40 hover:text-white"><X size={14} /></button>
                </div>
                <p className="text-xs text-white/50 mb-3 break-keep leading-relaxed">
                    투자 심사역은 사업계획서의 <strong>'문제 정의'</strong>를 가장 먼저 봅니다. AI에게 페르소나 정의를 요청해보세요.
                </p>
                <button className="text-[0.625rem] font-bold font-mono bg-white text-black px-3 py-1.5 hover:bg-surface-sunken transition-colors uppercase">
                    Try Prompt
                </button>
            </div>
        </div>
      </div>

      <div className="max-w-[100rem] mx-auto space-y-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-dashed border-border pb-6">
          <div>
            <div className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-tertiary mb-2 flex items-center gap-2">
               <span className="w-2 h-2 bg-brand"></span>
               WORKSPACE / DOCS
            </div>
            <h1 className="text-3xl font-bold text-txt-primary tracking-tight">Documents</h1>
          </div>

          <div className="flex gap-2">
             <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-disabled"/>
                <input
                   type="text"
                   placeholder="Search..."
                   className="pl-9 pr-4 py-2 bg-surface-card border border-border-strong text-sm focus:outline-none focus:border-brand transition-colors w-64"
                />
             </div>
             <button className="bg-brand text-white border border-brand px-4 py-2 text-sm font-medium hover:bg-brand-hover shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2">
                <Plus size={16} /> New Doc
             </button>
          </div>
        </div>

        {/* AI Action Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { icon: FileCode, title: '사업계획서 작성', desc: 'PSST 표준 양식 자동 생성', theme: 'blue' },
             { icon: FileCheck, title: '계약서 검토', desc: '주주간 계약서 및 NDA 법률 검토', theme: 'gray' },
             { icon: Megaphone, title: 'IR 덱 스토리라인', desc: '투자 유치를 위한 스토리보드', theme: 'gray' }
           ].map((item, i) => (
              <div key={i} className={`group p-6 border transition-all cursor-pointer flex flex-col h-full
                 ${item.theme === 'blue'
                    ? 'bg-brand-bg border-brand-border hover:border-brand'
                    : 'bg-surface-card border-border-strong hover:border-border-strong hover:shadow-sharp'}
              `}>
                 <div className={`w-10 h-10 flex items-center justify-center mb-4 border
                    ${item.theme === 'blue' ? 'bg-surface-card text-brand border-brand-border' : 'bg-surface-sunken text-txt-secondary border-border group-hover:bg-black group-hover:text-white group-hover:border-border-strong transition-colors'}
                 `}>
                    <item.icon size={20} />
                 </div>
                 <div className="mt-auto">
                     <h3 className="font-bold text-txt-primary mb-1 flex items-center gap-2 text-sm">
                        {item.title}
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                     </h3>
                     <p className="text-xs text-txt-tertiary font-light">{item.desc}</p>
                 </div>
              </div>
           ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

           {/* Document List Table */}
           <div className="lg:col-span-8 space-y-4">
              <h2 className="text-[0.625rem] font-bold font-mono text-txt-tertiary uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-black"></span>
                Recent Files
              </h2>

              <div className="bg-surface-card border border-border-strong shadow-sharp overflow-hidden">
                 <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-surface-sunken border-b border-border-strong text-[0.625rem] font-mono font-bold text-txt-tertiary uppercase tracking-widest">
                    <div className="col-span-6">Name</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Tag</div>
                    <div className="col-span-2 text-right">Updated</div>
                 </div>

                 <div className="divide-y divide-border">
                    {recentDocs.map((doc) => (
                       <div key={doc.id} className="grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-surface-sunken transition-colors group cursor-pointer">
                          <div className="col-span-6 flex items-center gap-3">
                             <FileText size={16} className="text-txt-disabled group-hover:text-txt-primary transition-colors" />
                             <span className="text-sm font-medium text-txt-primary truncate">{doc.title}</span>
                          </div>
                          <div className="col-span-2">
                             <span className={`px-2 py-0.5 text-[0.625rem] font-mono font-bold border ${
                                doc.status === 'Final' ? 'bg-status-success-bg text-status-success-text border-status-success-text/20' :
                                doc.status === 'Review' ? 'bg-status-warning-bg text-status-warning-text border-status-warning-text/20' :
                                'bg-surface-sunken text-txt-secondary border-border'
                             }`}>
                                {doc.status}
                             </span>
                          </div>
                          <div className="col-span-2">
                             <span className="text-[0.625rem] text-txt-tertiary font-mono">#{doc.tag}</span>
                          </div>
                          <div className="col-span-2 text-right text-[0.625rem] text-txt-disabled font-mono flex items-center justify-end gap-2">
                             {doc.updated}
                             <MoreHorizontal size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                       </div>
                    ))}

                    <button className="w-full py-3 text-xs text-txt-disabled hover:text-txt-primary hover:bg-surface-sunken transition-colors flex items-center justify-center gap-2 font-mono uppercase">
                       <Plus size={14} /> View All Documents
                    </button>
                 </div>
              </div>
           </div>

           {/* Templates */}
           <div className="lg:col-span-4 space-y-4">
              <h2 className="text-[0.625rem] font-bold font-mono text-txt-tertiary uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-brand"></span>
                Templates
              </h2>

              <div className="space-y-3">
                 {templates.map((tpl, idx) => (
                    <Card key={idx} padding="p-4" className="hover:border-border-strong cursor-pointer group">
                       <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-surface-sunken border border-border flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white group-hover:border-border-strong transition-colors">
                             <Folder size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-start">
                                <h4 className="font-bold text-sm text-txt-primary truncate">{tpl.title}</h4>
                                <Download size={14} className="text-txt-disabled group-hover:text-txt-primary" />
                             </div>
                             <p className="text-xs text-txt-tertiary line-clamp-1 mt-0.5">{tpl.desc}</p>
                          </div>
                       </div>
                    </Card>
                 ))}

                 <button className="w-full py-3 border border-dashed border-border text-xs font-bold text-txt-disabled hover:text-txt-primary hover:border-border-strong hover:bg-surface-sunken transition-all font-mono uppercase">
                    Browse Library
                 </button>
              </div>
           </div>

        </div>
      </div>
    </div>
  )
}
