import React, { useState } from 'react';
import { Card } from './ui/Card';
import { 
  Search, 
  Filter, 
  UserPlus, 
  MoreHorizontal, 
  MessageSquare, 
  Sparkles,
  TrendingUp,
  Mail,
  Plus,
  Upload,
  Calendar,
  Star,
  Users
} from 'lucide-react';

const myContacts = [
  { id: 'n1', name: 'Alex Han', role: 'Product Owner', company: 'Kakao', lastContact: '2d ago', tags: ['MENTOR', 'PRODUCT'], email: 'alex@kakao.com', initial: 'AH', color: 'bg-gray-100 text-gray-600' },
  { id: 'n2', name: 'Emily Kim', role: 'VC Associate', company: 'Softbank', lastContact: '1mo ago', tags: ['INVESTOR', 'SERIES A'], email: 'emily@softbank.co.kr', initial: 'EK', color: 'bg-gray-100 text-gray-600' },
  { id: 'n3', name: 'Minsoo Park', role: 'Founder', company: 'Stealth', lastContact: '3w ago', tags: ['PEER', 'AI'], email: 'minsoo@startup.io', initial: 'MP', color: 'bg-gray-100 text-gray-600' },
  { id: 'n4', name: 'Chris Lee', role: 'Legal Counsel', company: 'Law Firm A', lastContact: '2mo ago', tags: ['LEGAL', 'ADVISOR'], email: 'chris@lawfirm.com', initial: 'CL', color: 'bg-gray-100 text-gray-600' },
  { id: 'n5', name: 'Sarah Jung', role: 'Marketing Lead', company: 'Toss', lastContact: '1d ago', tags: ['GROWTH', 'MKT'], email: 'sarah@toss.im', initial: 'SJ', color: 'bg-gray-100 text-gray-600' },
  { id: 'n6', name: 'David Kim', role: 'CTO', company: 'Dunamu', lastContact: '3mo ago', tags: ['BLOCKCHAIN', 'DEV'], email: 'david@dunamu.com', initial: 'DK', color: 'bg-gray-100 text-gray-600' },
];

const aiSuggestions = [
  { id: 'r1', name: 'Sarah Jin', role: 'Angel Investor', company: 'Primer Sazze', reason: '헬스케어 투자 관심', match: 94 },
  { id: 'r2', name: 'David Choi', role: 'Senior Backend', company: 'Ex-Toss', reason: '초기 팀 빌딩 경험', match: 88 }
];

export const Network: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <div className="flex-1 overflow-y-auto h-screen bg-[#FAFAFA] bg-grid-engineering">
       <div className="max-w-[1600px] mx-auto p-8 lg:p-12 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-gray-200 pb-6">
             <div>
                <div className="text-xs font-mono text-gray-500 mb-2 flex items-center gap-2">
                   <span className="w-2 h-2 bg-black rounded-sm"></span>
                   CRM / CONTACTS
                </div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Network</h1>
             </div>
             
             <div className="flex gap-2">
                <button className="bg-white text-black border border-gray-200 px-4 py-2 text-sm font-medium rounded-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                   <Upload size={16} /> Import
                </button>
                <button className="bg-black text-white px-4 py-2 text-sm font-medium rounded-sm hover:bg-gray-800 transition-colors flex items-center gap-2">
                   <UserPlus size={16} /> Add Contact
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             
             {/* Left Column: CRM List */}
             <div className="lg:col-span-9 space-y-6">
                
                {/* Search Bar */}
                <div className="flex gap-4 bg-white p-2 rounded-sm border border-gray-200 shadow-sm items-center">
                   <Search size={16} className="text-gray-400 ml-3"/>
                   <input 
                      type="text" 
                      placeholder="Search contacts..." 
                      className="flex-1 py-2 bg-transparent text-sm focus:outline-none placeholder-gray-400"
                   />
                   <div className="h-6 w-px bg-gray-200 mx-2"></div>
                   <div className="flex gap-2 pr-2">
                      {['All', 'Investors', 'Devs', 'Founders'].map((filter) => (
                         <button 
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-3 py-1 text-xs font-mono rounded-sm transition-colors uppercase
                               ${activeFilter === filter 
                                  ? 'bg-black text-white' 
                                  : 'bg-gray-50 text-gray-500 hover:bg-gray-200 hover:text-black'}
                            `}
                         >
                            {filter}
                         </button>
                      ))}
                   </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                   {myContacts.map((person) => (
                      <Card key={person.id} padding="p-5" className="group hover:border-black hover:-translate-y-1 relative">
                         <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                               {/* Sharp Avatar */}
                               <div className={`w-12 h-12 rounded-sm flex items-center justify-center font-bold text-sm border border-gray-100 ${person.color} group-hover:bg-black group-hover:text-white group-hover:border-black transition-colors`}>
                                  {person.initial}
                               </div>
                               <div>
                                  <h4 className="font-bold text-gray-900 text-sm">{person.name}</h4>
                                  <p className="text-xs text-gray-500 mt-0.5">{person.role}</p>
                                  <p className="text-xs text-gray-400 font-mono mt-0.5">{person.company}</p>
                               </div>
                            </div>
                            <button className="text-gray-300 hover:text-black transition-colors">
                               <Star size={16} />
                            </button>
                         </div>

                         <div className="space-y-3 mb-5">
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono border-t border-gray-100 pt-3">
                               <Mail size={12} /> 
                               <span className="truncate">{person.email}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                               {person.tags.map(tag => (
                                  <span key={tag} className="text-[10px] font-mono text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-sm border border-gray-100">
                                     {tag}
                                  </span>
                               ))}
                            </div>
                         </div>

                         <div className="flex items-center justify-between pt-2">
                             <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                                <Calendar size={10} /> {person.lastContact}
                             </div>
                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 hover:bg-gray-100 rounded-sm transition-colors"><MessageSquare size={14}/></button>
                                <button className="p-1.5 hover:bg-gray-100 rounded-sm transition-colors"><MoreHorizontal size={14}/></button>
                             </div>
                         </div>
                      </Card>
                   ))}

                   {/* Add Contact Card - Dashed */}
                   <button className="border border-dashed border-gray-300 rounded-sm flex flex-col items-center justify-center text-gray-400 hover:text-black hover:border-black hover:bg-gray-50 transition-all min-h-[200px]">
                      <Plus size={24} className="mb-2 opacity-50" />
                      <span className="text-xs font-bold font-mono uppercase">Add Contact</span>
                   </button>
                </div>
             </div>

             {/* Right Column: AI & Stats */}
             <div className="lg:col-span-3 space-y-6">
                
                {/* AI Discovery - Dark Theme */}
                <div className="bg-black text-white rounded-sm p-6 shadow-md relative overflow-hidden group">
                   <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4 text-draft-blue">
                         <Sparkles size={16} fill="currentColor" />
                         <span className="text-xs font-bold font-mono uppercase">AI Analysis</span>
                      </div>
                      
                      <h3 className="font-bold text-lg mb-1 leading-snug">
                         New Opportunities
                      </h3>
                      <p className="text-gray-400 text-xs font-mono mb-6">2 HIGH MATCH FOUND</p>
                      
                      <div className="space-y-3">
                         {aiSuggestions.map((rec) => (
                            <div key={rec.id} className="bg-gray-900 border border-gray-800 rounded-sm p-3 hover:border-gray-600 transition-colors cursor-pointer">
                               <div className="flex justify-between items-start mb-1">
                                  <div className="font-bold text-sm text-gray-200">{rec.name}</div>
                                  <span className="text-[10px] font-mono text-draft-blue">{rec.match}% FIT</span>
                               </div>
                               <div className="text-[10px] text-gray-500 font-mono mb-2">{rec.role}</div>
                               <div className="text-[10px] text-gray-400">
                                  {rec.reason}
                               </div>
                            </div>
                         ))}
                      </div>

                      <button className="w-full mt-5 py-2 bg-white text-black text-xs font-bold font-mono rounded-sm hover:bg-gray-200 transition-colors uppercase">
                         View All
                      </button>
                   </div>
                </div>

                {/* Stats */}
                <Card padding="p-5">
                   <div className="flex items-center gap-2 mb-4">
                      <TrendingUp size={16} />
                      <h3 className="text-sm font-bold text-gray-900">Network Health</h3>
                   </div>
                   
                   <div className="space-y-4">
                      <div>
                         <div className="flex justify-between text-xs mb-1 font-mono">
                            <span className="text-gray-500">PROFILE</span>
                            <span className="font-bold">68%</span>
                         </div>
                         <div className="w-full bg-gray-100 h-1.5 rounded-sm overflow-hidden">
                            <div className="bg-black w-[68%] h-full"></div>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                         <div className="text-2xl font-bold font-mono text-draft-blue">+3</div>
                         <div className="text-xs text-gray-500 leading-tight">
                            Coffee Chats<br/>this month
                         </div>
                      </div>
                   </div>
                </Card>

             </div>
          </div>
       </div>
    </div>
  );
};