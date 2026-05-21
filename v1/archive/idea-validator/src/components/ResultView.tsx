import React, { useEffect, useState } from 'react';
import { Download, Share2, Briefcase, FileText, Layout, Cpu, Paintbrush, DollarSign, Shield, MapPin, Clock, Globe, Copy, Check, Target, Server, Zap, BarChart, Users, Star, Award } from 'lucide-react';
import { Artifacts, PrdStructure, JdStructure } from '../types';
import { generateFinalArtifacts } from '../services/geminiService';

interface ResultViewProps {
  conversationHistory: string;
  originalIdea: string;
  reflectedAdvice?: string[];
}

const ResultView: React.FC<ResultViewProps> = ({ conversationHistory, originalIdea, reflectedAdvice = [] }) => {
  const [artifacts, setArtifacts] = useState<Artifacts | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'prd' | 'jd'>('overview');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchArtifacts = async () => {
      try {
        const data = await generateFinalArtifacts(originalIdea, conversationHistory, reflectedAdvice);
        setArtifacts(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchArtifacts();
  }, [conversationHistory, originalIdea, reflectedAdvice]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-gray-100 border-t-draft-black rounded-full animate-spin"></div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-draft-black mb-2 tracking-tight">문서 생성 및 정리 중...</h2>
          <p className="text-gray-500 max-w-md mx-auto text-sm">
             전문가들의 피드백을 구조화된 데이터로 변환하고 있습니다.<br/>
             PRD v1.0과 채용 공고(JD), 그리고 실행 계획이 곧 준비됩니다.
          </p>
        </div>
      </div>
    );
  }

  // Fallback scores in case API misses them
  const scores = artifacts?.personaScores || { developer: 0, designer: 0, vc: 0 };
  const actionPlan = artifacts?.actionPlan || { developer: [], designer: [], vc: [] };

  const ScoreBar = ({ label, score, colorClass, icon }: { label: string, score: number, colorClass: string, icon: React.ReactNode }) => (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          {icon}
          {label}
        </div>
        <span className="text-sm font-bold text-gray-900">{score}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ease-out ${colorClass}`} 
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  );

  const ActionCard = ({ title, items, color, icon }: { title: string, items: string[], color: string, icon: React.ReactNode }) => (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${color}`}>
                {icon}
            </div>
            <h3 className="font-bold text-gray-900">{title}</h3>
        </div>
        <ul className="space-y-3">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                </li>
            ))}
            {items.length === 0 && <li className="text-sm text-gray-400 italic">할 일이 없습니다.</li>}
        </ul>
    </div>
  );

  // --- NEW RENDERERS using Structured Data ---

  const PrdView = ({ prd }: { prd: PrdStructure }) => (
    <div className="bg-white shadow-lg rounded-2xl border border-gray-200 overflow-hidden mx-auto max-w-5xl">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 px-8 py-8 md:px-12 md:py-10">
         <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
               <div className="flex items-center gap-2 mb-2 text-blue-600 font-bold text-xs uppercase tracking-widest">
                  <FileText size={14} /> Product Requirements Document
               </div>
               <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">{prd.projectName}</h1>
               <p className="text-lg text-gray-500 font-medium">{prd.tagline}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
               <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">Ver {prd.version}</span>
               <span className="text-xs text-gray-400 font-mono">Last Updated: {new Date().toLocaleDateString()}</span>
            </div>
         </div>
      </div>

      <div className="p-8 md:p-12 space-y-12">
         {/* Overview */}
         <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
               <Target size={20} className="text-gray-400" /> Executive Overview
            </h2>
            <p className="text-gray-600 leading-relaxed text-lg border-l-4 border-gray-200 pl-4 bg-gray-50 py-4 pr-4 rounded-r-lg">
               {prd.overview}
            </p>
         </section>

         {/* Two Column Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Target Audience */}
            <section>
               <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users size={20} className="text-pink-500" /> Target Audience
               </h2>
               <div className="space-y-3">
                  {prd.targetAudience.map((target, i) => (
                     <div key={i} className="flex items-center gap-3 p-3 bg-pink-50/50 rounded-xl border border-pink-100">
                        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs shrink-0">
                           {i + 1}
                        </div>
                        <span className="text-gray-700 font-medium text-sm">{target}</span>
                     </div>
                  ))}
               </div>
            </section>

            {/* Success Metrics */}
            <section>
               <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart size={20} className="text-emerald-500" /> Success Metrics
               </h2>
               <div className="space-y-3">
                  {prd.successMetrics.map((metric, i) => (
                     <div key={i} className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                        <Check size={16} className="text-emerald-600 shrink-0" />
                        <span className="text-gray-700 font-medium text-sm">{metric}</span>
                     </div>
                  ))}
               </div>
            </section>
         </div>

         {/* Features Grid */}
         <section>
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
               <Zap size={20} className="text-yellow-500" /> Core Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {prd.coreFeatures.map((feature, i) => (
                  <div key={i} className="bg-white border border-gray-200 p-5 rounded-2xl hover:shadow-md transition-shadow">
                     <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900">{feature.name}</h3>
                        <div className="flex gap-2">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              feature.priority === 'High' ? 'bg-red-100 text-red-700' :
                              feature.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                           }`}>
                              {feature.priority}
                           </span>
                        </div>
                     </div>
                     <p className="text-sm text-gray-600 leading-relaxed mb-4">{feature.description}</p>
                     <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                         <span className="text-xs text-gray-400 font-mono">Dev Effort:</span>
                         <div className="flex gap-1">
                            {[1,2,3].map(bar => (
                               <div key={bar} className={`w-2 h-2 rounded-full ${
                                  (feature.effort === 'High' && bar <= 3) || 
                                  (feature.effort === 'Medium' && bar <= 2) || 
                                  (feature.effort === 'Low' && bar <= 1)
                                  ? 'bg-blue-500' : 'bg-gray-200'
                               }`} />
                            ))}
                         </div>
                     </div>
                  </div>
               ))}
            </div>
         </section>

         {/* Tech Stack */}
         <section>
             <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
               <Server size={20} className="text-indigo-500" /> Recommended Stack
            </h2>
            <div className="flex flex-wrap gap-2">
               {prd.techStack.map((tech, i) => (
                  <span key={i} className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg">
                     {tech}
                  </span>
               ))}
            </div>
         </section>
         
         {/* Footer Note */}
         <div className="text-center text-xs text-gray-400 pt-8 border-t border-gray-100">
            Generated by Draft. AI Validator
         </div>
      </div>
    </div>
  );

  const JdView = ({ jd }: { jd: JdStructure }) => (
    <div className="bg-white shadow-lg rounded-2xl border border-gray-200 overflow-hidden mx-auto max-w-5xl relative">
       {/* Decorative Header */}
       <div className="h-40 bg-gray-900 relative pattern-grid-lg">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-90"></div>
          <div className="absolute -bottom-10 left-8 md:left-12 p-1.5 bg-white rounded-2xl shadow-lg">
             <div className="w-20 h-20 bg-black rounded-xl flex items-center justify-center text-white font-black text-3xl tracking-tighter">
                D.
             </div>
          </div>
       </div>
       
       <div className="pt-16 px-8 md:px-12 pb-8 border-b border-gray-100">
           <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                 <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold uppercase rounded">{jd.department}</span>
                    <span className="text-xs text-gray-400">Full-time</span>
                 </div>
                 <h1 className="text-3xl font-bold text-gray-900 mb-4">{jd.roleTitle}</h1>
                 <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-500">
                    <span className="flex items-center gap-1.5"><MapPin size={16} className="text-gray-400"/> Remote / Seoul, KR</span>
                    <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full"><DollarSign size={16}/> Significant Equity Offered</span>
                 </div>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                 <button className="px-8 py-3 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-colors shadow-xl shadow-gray-200 transform hover:-translate-y-0.5">
                    Apply Now
                 </button>
                 <button 
                    onClick={() => handleCopy(JSON.stringify(jd))} 
                    className="p-3 border border-gray-200 rounded-full hover:bg-gray-50 text-gray-600 transition-colors"
                 >
                    {copied ? <Check size={20} className="text-green-500" /> : <Share2 size={20} />}
                 </button>
              </div>
           </div>
       </div>

       <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-12">
           {/* Main Content */}
           <div className="md:col-span-2 space-y-10">
              <section>
                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">About the Team</h3>
                 <p className="text-gray-700 leading-relaxed text-lg">
                    {jd.companyIntro}
                 </p>
              </section>
              
              <section>
                 <h3 className="text-lg font-bold text-gray-900 mb-4">Responsibilities</h3>
                 <ul className="space-y-3">
                    {jd.responsibilities.map((item, i) => (
                       <li key={i} className="flex items-start gap-3 text-gray-600 leading-relaxed">
                          <Check size={18} className="text-blue-500 mt-1 shrink-0" />
                          <span>{item}</span>
                       </li>
                    ))}
                 </ul>
              </section>

              <section>
                 <h3 className="text-lg font-bold text-gray-900 mb-4">Requirements</h3>
                 <ul className="space-y-3">
                    {jd.qualifications.map((item, i) => (
                       <li key={i} className="flex items-start gap-3 text-gray-600 leading-relaxed">
                          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mt-2.5 shrink-0" />
                          <span>{item}</span>
                       </li>
                    ))}
                 </ul>
              </section>
           </div>
           
           {/* Sidebar */}
           <div className="space-y-8">
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                 <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
                    <Award size={18} className="text-yellow-500" /> Preferred Skills
                 </h3>
                 <div className="flex flex-wrap gap-2">
                    {jd.preferred.map((skill, i) => (
                       <span key={i} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 shadow-sm">
                          {skill}
                       </span>
                    ))}
                 </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                 <h3 className="flex items-center gap-2 font-bold text-blue-900 mb-4">
                    <Star size={18} className="text-blue-500" /> Benefits
                 </h3>
                 <ul className="space-y-3">
                    {jd.benefits.map((benefit, i) => (
                       <li key={i} className="text-sm text-blue-800 font-medium flex items-center gap-2">
                          <span className="w-1 h-1 bg-blue-400 rounded-full" /> {benefit}
                       </li>
                    ))}
                 </ul>
              </div>
           </div>
       </div>
    </div>
  );

  return (
    <div className="w-full py-4 px-3 md:px-4">
      {/* Clean Success Banner */}
      <div className="mb-8 bg-white border border-gray-200 rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between shadow-sm">
          <div className="flex items-center gap-6">
            <div className="bg-black text-white p-3 rounded-full shrink-0">
              <Shield size={24} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                 <h2 className="text-xl md:text-2xl font-bold text-draft-black tracking-tight">프로젝트 검증 완료</h2>
                 <span className="px-2 py-0.5 rounded-md bg-black text-white text-[10px] md:text-xs font-bold tracking-widest uppercase">
                    AI Verified
                 </span>
              </div>
              <p className="text-gray-500 text-sm md:text-base">
                Draft 시스템 검증을 통과했습니다. 이제 실행 단계로 넘어갈 준비가 되었습니다.
              </p>
            </div>
          </div>
          <div className="mt-6 md:mt-0 text-right hidden md:block border-l border-gray-100 pl-8">
             <div className="text-xs text-gray-400 uppercase tracking-widest font-mono mb-1">Total Score</div>
             <div className="flex items-baseline justify-end gap-1">
                 <span className="text-4xl font-black text-draft-black tracking-tighter">{artifacts?.score}</span>
                 <span className="text-lg text-gray-400 font-medium">/100</span>
             </div>
          </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-12 gap-3 sm:gap-4 lg:gap-8 items-start">

        {/* Left Column: Navigation */}
        <div className="col-span-2">
            <div className="sticky top-6 space-y-1">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-white border border-gray-200 shadow-sm text-draft-black' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <Layout size={18} />
                    <span className="font-semibold text-sm">Overview</span>
                  </div>
                  {activeTab === 'overview' && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                </button>

                <button 
                  onClick={() => setActiveTab('prd')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'prd' ? 'bg-white border border-gray-200 shadow-sm text-draft-black' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <FileText size={18} />
                    <span className="font-semibold text-sm">PRD v1.0</span>
                  </div>
                  {activeTab === 'prd' && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                </button>

                <button 
                  onClick={() => setActiveTab('jd')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === 'jd' ? 'bg-white border border-gray-200 shadow-sm text-draft-black' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <Briefcase size={18} />
                    <span className="font-semibold text-sm">구인 공고</span>
                  </div>
                  {activeTab === 'jd' && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                </button>
            
                <div className="pt-6 mt-2 border-t border-gray-100 space-y-2 px-1">
                   <button className="w-full py-2 px-3 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-bold hover:border-gray-400 hover:shadow-sm flex items-center justify-center gap-2 transition-all">
                      <Download size={14} /> PDF
                   </button>
                   <button className="w-full py-2 px-3 rounded-lg bg-black text-white text-xs font-bold hover:bg-gray-800 hover:shadow-md flex items-center justify-center gap-2 transition-all">
                      <Share2 size={14} /> Share
                   </button>
                </div>
            </div>
        </div>

        {/* Center Column: Content */}
        <div className="col-span-7">
           <div className="relative">

               {activeTab === 'overview' && (
                   <div className="animate-in fade-in duration-300 space-y-8 bg-white border border-gray-200 rounded-3xl p-8 md:p-12 shadow-sm min-h-[800px]">
                       <div>
                           <h2 className="text-2xl font-bold text-draft-black mb-4">실행 계획 (Action Plan)</h2>
                           <p className="text-gray-500 mb-6">
                               성공적인 프로젝트 런칭을 위해 각 팀이 즉시 착수해야 할 핵심 과제입니다.
                           </p>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <ActionCard 
                                   title="Development" 
                                   items={actionPlan.developer} 
                                   color="bg-indigo-100 text-indigo-700" 
                                   icon={<Cpu size={20} />} 
                               />
                               <ActionCard 
                                   title="Design & UX" 
                                   items={actionPlan.designer} 
                                   color="bg-pink-100 text-pink-700" 
                                   icon={<Paintbrush size={20} />} 
                               />
                               <div className="md:col-span-2">
                                   <ActionCard 
                                       title="Business & VC" 
                                       items={actionPlan.vc} 
                                       color="bg-emerald-100 text-emerald-700" 
                                       icon={<DollarSign size={20} />} 
                                   />
                               </div>
                           </div>
                       </div>
                   </div>
               )}

               {activeTab === 'prd' && artifacts?.prd && (
                  <div className="animate-in fade-in duration-300">
                     <PrdView prd={artifacts.prd} />
                  </div>
               )}

               {activeTab === 'jd' && artifacts?.jd && (
                  <div className="animate-in fade-in duration-300">
                     <JdView jd={artifacts.jd} />
                  </div>
               )}
           </div>
        </div>

        {/* Right Column: Summary & Scores */}
        <div className="col-span-3 space-y-3 sm:space-y-4">
           
           {/* Idea Summary Card */}
           <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Project Summary</h3>
              <p className="text-gray-800 text-sm leading-relaxed font-medium">
                {artifacts?.ideaSummary || "요약 정보를 불러오는 중입니다..."}
              </p>
           </div>

           {/* Persona Scores Card */}
           <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Validation Scores</h3>
              
              <ScoreBar 
                label="Tech Feasibility" 
                score={scores.developer} 
                colorClass="bg-indigo-500" 
                icon={<Cpu size={16} className="text-indigo-500" />}
              />
              
              <ScoreBar 
                label="UX & Design" 
                score={scores.designer} 
                colorClass="bg-pink-500" 
                icon={<Paintbrush size={16} className="text-pink-500" />}
              />
              
              <ScoreBar 
                label="Business Model" 
                score={scores.vc} 
                colorClass="bg-emerald-500" 
                icon={<DollarSign size={16} className="text-emerald-500" />}
              />
           </div>
        </div>

      </div>
    </div>
  );
};

export default ResultView;
