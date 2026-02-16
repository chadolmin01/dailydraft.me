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
    <div className="flex-1 p-8 lg:p-12 overflow-y-auto h-screen bg-[#FAFAFA] bg-grid-engineering relative">

      {/* Pro Tip */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg transition-all duration-500 ${showProTip ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-[#222] text-white p-4 rounded-sm shadow-xl flex items-start gap-4 mx-4 border border-black">
            <div className="mt-0.5"><Lightbulb size={16} className="text-yellow-400" /></div>
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold font-mono uppercase mb-1 text-gray-200">Pro Tip</h4>
                    <button onClick={() => setShowProTip(false)} className="text-gray-500 hover:text-white"><X size={14} /></button>
                </div>
                <p className="text-xs text-gray-400 mb-3 break-keep leading-relaxed">
                    투자 심사역은 사업계획서의 <strong>'문제 정의'</strong>를 가장 먼저 봅니다. AI에게 페르소나 정의를 요청해보세요.
                </p>
                <button className="text-[10px] font-bold font-mono bg-white text-black px-3 py-1.5 rounded-sm hover:bg-gray-200 transition-colors uppercase">
                    Try Prompt
                </button>
            </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-gray-200 pb-6">
          <div>
            <div className="text-xs font-mono text-gray-500 mb-2 flex items-center gap-2">
               <span className="w-2 h-2 bg-black rounded-sm"></span>
               WORKSPACE / DOCS
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Documents</h1>
          </div>

          <div className="flex gap-2">
             <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input
                   type="text"
                   placeholder="Search..."
                   className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-black transition-colors w-64"
                />
             </div>
             <button className="bg-black text-white px-4 py-2 text-sm font-medium rounded-sm hover:bg-gray-800 transition-colors flex items-center gap-2">
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
              <div key={i} className={`group p-6 border rounded-sm transition-all cursor-pointer flex flex-col h-full
                 ${item.theme === 'blue'
                    ? 'bg-blue-50/30 border-blue-100 hover:border-blue-300'
                    : 'bg-white border-gray-200 hover:border-black hover:shadow-sm'}
              `}>
                 <div className={`w-10 h-10 rounded-sm flex items-center justify-center mb-4 border
                    ${item.theme === 'blue' ? 'bg-white text-draft-blue border-blue-100' : 'bg-gray-50 text-gray-700 border-gray-100 group-hover:bg-black group-hover:text-white group-hover:border-black transition-colors'}
                 `}>
                    <item.icon size={20} />
                 </div>
                 <div className="mt-auto">
                     <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2 text-sm">
                        {item.title}
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                     </h3>
                     <p className="text-xs text-gray-500 font-light">{item.desc}</p>
                 </div>
              </div>
           ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

           {/* Document List Table */}
           <div className="lg:col-span-8 space-y-4">
              <h2 className="text-sm font-bold font-mono text-gray-900 uppercase">Recent Files</h2>

              <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                 <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-[10px] font-mono font-bold text-gray-500 uppercase">
                    <div className="col-span-6">Name</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Tag</div>
                    <div className="col-span-2 text-right">Updated</div>
                 </div>

                 <div className="divide-y divide-gray-100">
                    {recentDocs.map((doc) => (
                       <div key={doc.id} className="grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-gray-50 transition-colors group cursor-pointer">
                          <div className="col-span-6 flex items-center gap-3">
                             <FileText size={16} className="text-gray-400 group-hover:text-black transition-colors" />
                             <span className="text-sm font-medium text-gray-900 truncate">{doc.title}</span>
                          </div>
                          <div className="col-span-2">
                             <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border ${
                                doc.status === 'Final' ? 'bg-green-50 text-green-700 border-green-200' :
                                doc.status === 'Review' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                'bg-gray-100 text-gray-600 border-gray-200'
                             }`}>
                                {doc.status}
                             </span>
                          </div>
                          <div className="col-span-2">
                             <span className="text-[10px] text-gray-500 font-mono">#{doc.tag}</span>
                          </div>
                          <div className="col-span-2 text-right text-[10px] text-gray-400 font-mono flex items-center justify-end gap-2">
                             {doc.updated}
                             <MoreHorizontal size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                       </div>
                    ))}

                    <button className="w-full py-3 text-xs text-gray-400 hover:text-black hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-mono uppercase">
                       <Plus size={14} /> View All Documents
                    </button>
                 </div>
              </div>
           </div>

           {/* Templates */}
           <div className="lg:col-span-4 space-y-4">
              <h2 className="text-sm font-bold font-mono text-gray-900 uppercase">Templates</h2>

              <div className="space-y-3">
                 {templates.map((tpl, idx) => (
                    <Card key={idx} padding="p-4" className="hover:border-black cursor-pointer group">
                       <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-gray-50 rounded-sm border border-gray-100 flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white group-hover:border-black transition-colors">
                             <Folder size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-start">
                                <h4 className="font-bold text-sm text-gray-900 truncate">{tpl.title}</h4>
                                <Download size={14} className="text-gray-300 group-hover:text-black" />
                             </div>
                             <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{tpl.desc}</p>
                          </div>
                       </div>
                    </Card>
                 ))}

                 <button className="w-full py-3 border border-dashed border-gray-300 rounded-sm text-xs font-bold text-gray-400 hover:text-black hover:border-gray-400 hover:bg-gray-50 transition-all font-mono uppercase">
                    Browse Library
                 </button>
              </div>
           </div>

        </div>
      </div>
    </div>
  )
}
