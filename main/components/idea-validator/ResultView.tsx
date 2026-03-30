'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Share2, Briefcase, FileText, Layout, Cpu, Paintbrush, DollarSign, Shield, MapPin, Clock, Globe, Copy, Check, Target, Server, Zap, BarChart, Users, Star, Award, ArrowRight } from 'lucide-react';
import { Artifacts, PrdStructure, JdStructure, ValidationLevel } from './types';
import { generateFinalArtifacts } from './geminiService';
import { validationResultsStore } from '@/src/lib/validationResultsStore';
import { useUpdateValidatedIdeaFull } from '@/src/hooks/useValidatedIdeas';

interface ResultViewProps {
  conversationHistory: string;
  originalIdea: string;
  reflectedAdvice?: string[];
  onComplete?: () => void;
  validatedIdeaId?: string | null;
  validationLevel?: ValidationLevel;
}

const ResultView: React.FC<ResultViewProps> = ({
  conversationHistory,
  originalIdea,
  reflectedAdvice = [],
  onComplete,
  validatedIdeaId,
  validationLevel,
}) => {
  const router = useRouter();
  const [artifacts, setArtifacts] = useState<Artifacts | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'prd' | 'jd'>('overview');
  const [copied, setCopied] = useState(false);

  // DB 업데이트 훅
  const updateValidatedIdea = useUpdateValidatedIdeaFull();

  useEffect(() => {
    let isMounted = true;

    const fetchArtifacts = async () => {
      try {
        const data = await generateFinalArtifacts(originalIdea, conversationHistory, reflectedAdvice);

        // 언마운트 체크
        if (!isMounted) return;

        setArtifacts(data);

        // 1. localStorage 저장 (기존 - 백업)
        const latest = validationResultsStore.getLatest();
        if (latest && data.prd && data.jd) {
          validationResultsStore.updateArtifacts(latest.id, {
            prd: JSON.stringify(data.prd),
            jd: JSON.stringify(data.jd),
          });
        }

        // 2. DB 업데이트 (로그인 사용자)
        if (validatedIdeaId && isMounted) {
          try {
            await updateValidatedIdea.mutateAsync({
              id: validatedIdeaId,
              data: {
                artifacts: {
                  prd: JSON.stringify(data.prd),
                  jd: JSON.stringify(data.jd),
                },
                score: data.score,
                personaScores: data.personaScores,
                actionPlan: data.actionPlan,
                validationLevel: validationLevel,
              },
            });
          } catch (dbError) {
            console.error('[ResultView] Failed to update DB:', dbError);
          }
        }
      } catch (e) {
        if (!isMounted) return;
        console.error(e);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchArtifacts();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationHistory, originalIdea, validatedIdeaId, validationLevel]);

  // 사업계획서 작성 페이지로 이동
  const handleGoToBusinessPlan = () => {
    // artifacts가 없으면 이동하지 않음
    if (!artifacts) {
      console.warn('[ResultView] Artifacts not ready');
      return;
    }

    // sessionStorage에 검증 데이터 저장
    sessionStorage.setItem('ideaValidatorData', JSON.stringify({
      validationId: validatedIdeaId,
      projectIdea: originalIdea,
      artifacts: artifacts,
      reflectedAdvice: reflectedAdvice,
      personaScores: artifacts.personaScores,
      score: artifacts.score,
    }));

    router.push('/business-plan?from=idea-validator');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-border-subtle border-t-draft-black animate-spin"></div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-draft-black mb-2 tracking-tight">문서 생성 및 정리 중...</h2>
          <p className="text-txt-tertiary max-w-md mx-auto text-sm">
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
        <div className="flex items-center gap-2 text-sm font-semibold text-txt-secondary">
          {icon}
          {label}
        </div>
        <span className="text-sm font-bold text-txt-primary">{score}</span>
      </div>
      <div className="w-full bg-surface-sunken h-2 overflow-hidden">
        <div
          className={`h-2 transition-all duration-1000 ease-out ${colorClass}`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  );

  const ActionCard = ({ title, items, color, icon }: { title: string, items: string[], color: string, icon: React.ReactNode }) => (
    <div className="bg-surface-card rounded-xl border border-border p-6 shadow-md hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 ${color}`}>
                {icon}
            </div>
            <h3 className="font-bold text-txt-primary">{title}</h3>
        </div>
        <ul className="space-y-3">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-txt-secondary">
                    <div className="mt-1.5 w-1.5 h-1.5 bg-txt-disabled shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                </li>
            ))}
            {items.length === 0 && <li className="text-sm text-txt-tertiary italic">할 일이 없습니다.</li>}
        </ul>
    </div>
  );

  // --- NEW RENDERERS using Structured Data ---

  const PrdView = ({ prd }: { prd: PrdStructure }) => (
    <div className="bg-surface-card shadow-lg border border-border overflow-hidden mx-auto max-w-5xl">
      {/* Header */}
      <div className="bg-gradient-to-b from-surface-sunken to-surface-card border-b border-border px-8 py-8 md:px-12 md:py-10">
         <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
               <div className="flex items-center gap-2 mb-2 text-brand font-medium text-xs">
                  <FileText size={14} /> Product Requirements Document
               </div>
               <h1 className="text-3xl md:text-4xl font-black text-txt-primary tracking-tight mb-2">{prd.projectName}</h1>
               <p className="text-lg text-txt-tertiary font-medium">{prd.tagline}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
               <span className="px-3 py-1 bg-brand-bg text-brand text-xs font-bold">Ver {prd.version}</span>
               <span className="text-xs text-txt-tertiary font-mono">Last Updated: {new Date().toLocaleDateString()}</span>
            </div>
         </div>
      </div>

      <div className="p-8 md:p-12 space-y-12">
         {/* Overview */}
         <section>
            <h2 className="text-xl font-bold text-txt-primary mb-4 flex items-center gap-2">
               <Target size={20} className="text-txt-tertiary" /> Executive Overview
            </h2>
            <p className="text-txt-secondary leading-relaxed text-lg border-l-4 border-border pl-4 bg-surface-sunken py-4 pr-4">
               {prd.overview}
            </p>
         </section>

         {/* Two Column Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Target Audience */}
            <section>
               <h2 className="text-xl font-bold text-txt-primary mb-4 flex items-center gap-2">
                  <Users size={20} className="text-pink-500" /> Target Audience
               </h2>
               <div className="space-y-3">
                  {prd.targetAudience.map((target, i) => (
                     <div key={i} className="flex items-center gap-3 p-3 bg-pink-50/50 border border-pink-100">
                        <div className="w-8 h-8 bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs shrink-0">
                           {i + 1}
                        </div>
                        <span className="text-txt-secondary font-medium text-sm">{target}</span>
                     </div>
                  ))}
               </div>
            </section>

            {/* Success Metrics */}
            <section>
               <h2 className="text-xl font-bold text-txt-primary mb-4 flex items-center gap-2">
                  <BarChart size={20} className="text-emerald-500" /> Success Metrics
               </h2>
               <div className="space-y-3">
                  {prd.successMetrics.map((metric, i) => (
                     <div key={i} className="flex items-center gap-3 p-3 bg-emerald-50/50 border border-emerald-100">
                        <Check size={16} className="text-emerald-600 shrink-0" />
                        <span className="text-txt-secondary font-medium text-sm">{metric}</span>
                     </div>
                  ))}
               </div>
            </section>
         </div>

         {/* Features Grid */}
         <section>
            <h2 className="text-xl font-bold text-txt-primary mb-6 flex items-center gap-2">
               <Zap size={20} className="text-status-warning-text" /> Core Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {prd.coreFeatures.map((feature, i) => (
                  <div key={i} className="bg-surface-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                     <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-txt-primary">{feature.name}</h3>
                        <div className="flex gap-2">
                           <span className={`px-2 py-0.5 text-[0.625rem] font-medium ${
                              feature.priority === 'High' ? 'bg-status-danger-bg text-status-danger-text' :
                              feature.priority === 'Medium' ? 'bg-status-warning-bg text-status-warning-text' :
                              'bg-status-success-bg text-status-success-text'
                           }`}>
                              {feature.priority}
                           </span>
                        </div>
                     </div>
                     <p className="text-sm text-txt-secondary leading-relaxed mb-4">{feature.description}</p>
                     <div className="flex items-center gap-2 pt-4 border-t border-border">
                         <span className="text-xs text-txt-tertiary font-mono">Dev Effort:</span>
                         <div className="flex gap-1">
                            {[1,2,3].map(bar => (
                               <div key={bar} className={`w-2 h-2 ${
                                  (feature.effort === 'High' && bar <= 3) ||
                                  (feature.effort === 'Medium' && bar <= 2) ||
                                  (feature.effort === 'Low' && bar <= 1)
                                  ? 'bg-brand' : 'bg-surface-sunken'
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
             <h2 className="text-xl font-bold text-txt-primary mb-4 flex items-center gap-2">
               <Server size={20} className="text-brand" /> Recommended Stack
            </h2>
            <div className="flex flex-wrap gap-2">
               {prd.techStack.map((tech, i) => (
                  <span key={i} className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold">
                     {tech}
                  </span>
               ))}
            </div>
         </section>

         {/* Footer Note */}
         <div className="text-center text-xs text-txt-tertiary pt-8 border-t border-border">
            Generated by Draft. AI Validator
         </div>
      </div>
    </div>
  );

  const JdView = ({ jd }: { jd: JdStructure }) => (
    <div className="bg-surface-card shadow-lg border border-border overflow-hidden mx-auto max-w-5xl relative">
       {/* Decorative Header */}
       <div className="h-40 bg-surface-inverse relative pattern-grid-lg">
          <div className="absolute inset-0 bg-gradient-to-t from-surface-inverse via-transparent to-transparent opacity-90"></div>
          <div className="absolute -bottom-10 left-8 md:left-12 p-1.5 bg-surface-card shadow-md">
             <div className="w-20 h-20 bg-black flex items-center justify-center text-white font-black text-3xl tracking-tighter">
                D.
             </div>
          </div>
       </div>

       <div className="pt-16 px-8 md:px-12 pb-8 border-b border-border-subtle">
           <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                 <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-surface-sunken text-txt-secondary text-xs font-medium">{jd.department}</span>
                    <span className="text-xs text-txt-tertiary">Full-time</span>
                 </div>
                 <h1 className="text-3xl font-bold text-txt-primary mb-4">{jd.roleTitle}</h1>
                 <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-txt-tertiary">
                    <span className="flex items-center gap-1.5"><MapPin size={16} className="text-txt-tertiary"/> Remote / Seoul, KR</span>
                    <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1"><DollarSign size={16}/> Significant Equity Offered</span>
                 </div>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                 <button type="button" className="px-8 py-3 bg-surface-inverse text-txt-inverse font-bold hover:bg-surface-inverse/90 transition-colors hover:opacity-90 active:scale-[0.97]">
                    Apply Now
                 </button>
                 <button
                    type="button"
                    onClick={() => handleCopy(JSON.stringify(jd))}
                    className="p-3 border border-border hover:bg-black hover:text-white text-txt-secondary transition-colors"
                 >
                    {copied ? <Check size={20} className="text-status-success-text" /> : <Share2 size={20} />}
                 </button>
              </div>
           </div>
       </div>

       <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-12">
           {/* Main Content */}
           <div className="md:col-span-2 space-y-10">
              <section>
                 <h3 className="text-[0.625rem] font-medium text-txt-tertiary mb-4">About the Team</h3>
                 <p className="text-txt-secondary leading-relaxed text-lg">
                    {jd.companyIntro}
                 </p>
              </section>

              <section>
                 <h3 className="text-lg font-bold text-txt-primary mb-4">Responsibilities</h3>
                 <ul className="space-y-3">
                    {jd.responsibilities.map((item, i) => (
                       <li key={i} className="flex items-start gap-3 text-txt-secondary leading-relaxed">
                          <Check size={18} className="text-brand mt-1 shrink-0" />
                          <span>{item}</span>
                       </li>
                    ))}
                 </ul>
              </section>

              <section>
                 <h3 className="text-lg font-bold text-txt-primary mb-4">Requirements</h3>
                 <ul className="space-y-3">
                    {jd.qualifications.map((item, i) => (
                       <li key={i} className="flex items-start gap-3 text-txt-secondary leading-relaxed">
                          <div className="w-1.5 h-1.5 bg-txt-disabled mt-2.5 shrink-0" />
                          <span>{item}</span>
                       </li>
                    ))}
                 </ul>
              </section>
           </div>

           {/* Sidebar */}
           <div className="space-y-8">
              <div className="bg-surface-sunken p-6 border border-border">
                 <h3 className="flex items-center gap-2 font-bold text-txt-primary mb-4">
                    <Award size={18} className="text-status-warning-text" /> Preferred Skills
                 </h3>
                 <div className="flex flex-wrap gap-2">
                    {jd.preferred.map((skill, i) => (
                       <span key={i} className="px-3 py-1 bg-surface-card rounded-xl border border-border text-xs font-medium text-txt-secondary shadow-md">
                          {skill}
                       </span>
                    ))}
                 </div>
              </div>

              <div className="bg-gradient-to-br from-brand-bg to-indigo-50 p-6 border border-brand-border">
                 <h3 className="flex items-center gap-2 font-bold text-brand mb-4">
                    <Star size={18} className="text-brand" /> Benefits
                 </h3>
                 <ul className="space-y-3">
                    {jd.benefits.map((benefit, i) => (
                       <li key={i} className="text-sm text-brand font-medium flex items-center gap-2">
                          <span className="w-1 h-1 bg-brand" /> {benefit}
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
      <div className="mb-8 bg-surface-card rounded-xl border border-border p-6 md:p-8 flex flex-col md:flex-row items-center justify-between shadow-md">
          <div className="flex items-center gap-6">
            <div className="bg-surface-inverse text-txt-inverse p-3 shrink-0">
              <Shield size={24} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                 <h2 className="text-xl md:text-2xl font-bold text-draft-black tracking-tight">프로젝트 검증 완료</h2>
                 <span className="px-2 py-0.5 bg-surface-inverse text-txt-inverse text-[0.625rem] md:text-xs font-medium">
                    AI Verified
                 </span>
              </div>
              <p className="text-txt-tertiary text-sm md:text-base">
                Draft 시스템 검증을 통과했습니다. 이제 실행 단계로 넘어갈 준비가 되었습니다.
              </p>
            </div>
          </div>
          <div className="mt-6 md:mt-0 flex items-center gap-6">
             <div className="text-right hidden md:block border-l border-border pl-8">
               <div className="text-xs text-txt-tertiary mb-1">Total Score</div>
               <div className="flex items-baseline justify-end gap-1">
                   <span className="text-4xl font-black text-draft-black tracking-tighter">{artifacts?.score}</span>
                   <span className="text-lg text-txt-tertiary font-medium">/100</span>
               </div>
             </div>
             <div className="flex items-center gap-3">
               {onComplete && (
                 <button
                   type="button"
                   onClick={onComplete}
                   className="px-5 py-3 bg-surface-card text-txt-secondary font-bold border border-border hover:bg-black hover:text-white transition-colors flex items-center gap-2 text-sm"
                 >
                   완료
                 </button>
               )}
               <button
                 type="button"
                 onClick={handleGoToBusinessPlan}
                 className="px-6 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm hover:opacity-90 active:scale-[0.97]"
               >
                 <Briefcase size={16} />
                 사업계획서 작성하기
                 <ArrowRight size={16} />
               </button>
             </div>
          </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-12 gap-3 sm:gap-4 lg:gap-8 items-start">

        {/* Left Column: Navigation */}
        <div className="col-span-2">
            <div className="sticky top-6 space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-all ${activeTab === 'overview' ? 'bg-surface-card rounded-xl border border-border shadow-md text-draft-black' : 'text-txt-tertiary hover:bg-surface-sunken hover:text-txt-primary'}`}
                >
                  <div className="flex items-center gap-3">
                    <Layout size={18} />
                    <span className="font-semibold text-sm">Overview</span>
                  </div>
                  {activeTab === 'overview' && <div className="w-1.5 h-1.5 bg-black" />}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('prd')}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-all ${activeTab === 'prd' ? 'bg-surface-card rounded-xl border border-border shadow-md text-draft-black' : 'text-txt-tertiary hover:bg-surface-sunken hover:text-txt-primary'}`}
                >
                  <div className="flex items-center gap-3">
                    <FileText size={18} />
                    <span className="font-semibold text-sm">PRD v1.0</span>
                  </div>
                  {activeTab === 'prd' && <div className="w-1.5 h-1.5 bg-black" />}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('jd')}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-all ${activeTab === 'jd' ? 'bg-surface-card rounded-xl border border-border shadow-md text-draft-black' : 'text-txt-tertiary hover:bg-surface-sunken hover:text-txt-primary'}`}
                >
                  <div className="flex items-center gap-3">
                    <Briefcase size={18} />
                    <span className="font-semibold text-sm">구인 공고</span>
                  </div>
                  {activeTab === 'jd' && <div className="w-1.5 h-1.5 bg-black" />}
                </button>

                <div className="pt-6 mt-2 border-t border-border space-y-2 px-1">
                   <button type="button" className="w-full py-2 px-3 border border-border bg-surface-card rounded-lg text-txt-secondary text-xs font-bold hover:bg-black hover:text-white flex items-center justify-center gap-2 transition-all">
                      <Download size={14} /> PDF
                   </button>
                   <button type="button" className="w-full py-2 px-3 bg-surface-inverse text-txt-inverse text-xs font-bold hover:bg-surface-inverse/90 flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.97]">
                      <Share2 size={14} /> Share
                   </button>
                </div>
            </div>
        </div>

        {/* Center Column: Content */}
        <div className="col-span-7">
           <div className="relative">

               {activeTab === 'overview' && (
                   <div className="animate-in fade-in duration-300 space-y-8 bg-surface-card rounded-xl border border-border p-8 md:p-12 shadow-md min-h-[50rem]">
                       <div>
                           <h2 className="text-2xl font-bold text-draft-black mb-4">실행 계획 (Action Plan)</h2>
                           <p className="text-txt-tertiary mb-6">
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
           <div className="bg-surface-card rounded-xl border border-border p-6 shadow-md">
              <h3 className="text-[0.625rem] font-medium text-txt-tertiary mb-4">Project Summary</h3>
              <p className="text-txt-primary text-sm leading-relaxed font-medium">
                {artifacts?.ideaSummary || "요약 정보를 불러오는 중입니다..."}
              </p>
           </div>

           {/* Persona Scores Card */}
           <div className="bg-surface-card rounded-xl border border-border p-6 shadow-md sticky top-6">
              <h3 className="text-[0.625rem] font-medium text-txt-tertiary mb-6">Validation Scores</h3>

              <ScoreBar
                label="Tech Feasibility"
                score={scores.developer}
                colorClass="bg-indigo-500"
                icon={<Cpu size={16} className="text-brand" />}
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
