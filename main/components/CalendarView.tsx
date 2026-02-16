'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Bookmark, Building2, Calendar, Plus, X, Clock, CheckSquare } from 'lucide-react'
import { CalendarEvent } from '@/types'

const initialEvents: CalendarEvent[] = [
  { id: '1', title: '창업성공패키지 마감', date: '2026-02-14', type: 'deadline', completed: false },
  { id: '2', title: 'Project Alpha 미팅', date: '2026-02-16', type: 'meeting', time: '14:00', completed: false },
  { id: '3', title: 'IR 자료 준비', date: '2026-02-17', type: 'todo', completed: false },
  { id: '4', title: '예비창업패키지 서류 제출', date: '2026-02-20', type: 'deadline', completed: false },
]

export const CalendarView: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventDate, setNewEventDate] = useState('2026-02-13')
  const [newEventType, setNewEventType] = useState<'deadline' | 'meeting' | 'todo'>('deadline')
  const [newEventTime, setNewEventTime] = useState('')

  const days = Array.from({ length: 28 }, (_, i) => i + 1)
  const startDayOffset = 0

  const upcomingDeadlines = events
    .filter(e => e.type === 'deadline')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  const handleAddEvent = (event: CalendarEvent) => {
    setEvents(prev => [...prev, event])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEventTitle.trim()) return

    handleAddEvent({
      id: Date.now().toString(),
      title: newEventTitle,
      date: newEventDate,
      type: newEventType,
      time: newEventTime,
      completed: false
    })

    setNewEventTitle('')
    setNewEventTime('')
    setIsModalOpen(false)
  }

  return (
    <div className="flex-1 overflow-y-auto h-screen bg-[#FAFAFA] bg-grid-engineering relative">
      <div className="max-w-[1600px] mx-auto p-8 lg:p-12 space-y-8">

        {/* Header */}
        <div className="flex justify-between items-end border-b border-gray-200 pb-6">
           <div>
             <div className="text-xs font-mono text-gray-500 mb-2 flex items-center gap-2">
                 <span className="w-2 h-2 bg-black rounded-sm"></span>
                 WORKSPACE / SCHEDULE
             </div>
             <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Schedule</h1>
           </div>

           <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                 <button className="p-2 hover:bg-gray-100 rounded-sm transition-colors border border-transparent hover:border-gray-200"><ChevronLeft size={20}/></button>
                 <span className="text-xl font-bold font-mono">2026.02</span>
                 <button className="p-2 hover:bg-gray-100 rounded-sm transition-colors border border-transparent hover:border-gray-200"><ChevronRight size={20}/></button>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-black text-white text-sm font-bold rounded-sm hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2"
              >
                 <Plus size={16} /> Add Event
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">

          {/* Left: Main Calendar */}
          <div className="xl:col-span-3 space-y-6">
             <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
                <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/30">
                   {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, i) => (
                      <div key={day} className={`
                         py-3 text-center text-[10px] font-bold font-mono uppercase
                         ${i === 0 ? 'text-red-500' : (i === 6 ? 'text-blue-500' : 'text-gray-400')}
                      `}>
                         {day}
                      </div>
                   ))}
                </div>

                <div className="grid grid-cols-7">
                   {Array.from({ length: startDayOffset }).map((_, i) => (
                      <div key={`empty-${i}`} className="min-h-[160px] border-r border-b border-gray-100 bg-gray-50/10"></div>
                   ))}

                   {days.map((day) => {
                      const isToday = day === 13
                      const dateStr = `2026-02-${day.toString().padStart(2, '0')}`
                      const dayEvents = events.filter(e => e.date === dateStr)

                      return (
                         <div key={day} className={`
                            min-h-[160px] border-r border-b border-gray-100 p-2 relative group hover:bg-gray-50 transition-colors
                            ${(day + startDayOffset) % 7 === 0 ? 'border-r-0' : ''}
                            ${isToday ? 'bg-blue-50/20' : ''}
                         `}>
                            <div className="flex justify-between items-start">
                                <span className={`
                                   text-xs font-bold font-mono block mb-3 pl-1
                                   ${(day + startDayOffset - 1) % 7 === 0 ? 'text-red-500' : ((day + startDayOffset - 1) % 7 === 6 ? 'text-blue-500' : 'text-gray-700')}
                                   ${isToday ? 'text-draft-blue' : ''}
                                `}>
                                   {day} {isToday && <span className="ml-1 w-1.5 h-1.5 bg-draft-blue rounded-full inline-block mb-0.5"></span>}
                                </span>
                                <button
                                    onClick={() => {
                                        setNewEventDate(dateStr)
                                        setIsModalOpen(true)
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 rounded text-gray-400 hover:text-black transition-all"
                                >
                                    <Plus size={12}/>
                                </button>
                            </div>

                            <div className="space-y-1">
                                {dayEvents.map(event => (
                                    <div
                                        key={event.id}
                                        className={`px-2 py-1 text-[10px] font-bold rounded-sm border cursor-pointer hover:opacity-80 truncate flex items-center gap-1
                                            ${event.type === 'deadline' ? 'bg-red-50 text-red-600 border-red-100' :
                                              event.type === 'meeting' ? 'bg-blue-50 text-draft-blue border-blue-100' :
                                              'bg-gray-100 text-gray-700 border-gray-200'}
                                        `}
                                    >
                                        {event.type === 'meeting' && event.time && <span className="font-mono text-[9px] opacity-75">{event.time}</span>}
                                        {event.title}
                                    </div>
                                ))}
                            </div>
                         </div>
                      )
                   })}
                </div>
             </div>
          </div>

          {/* Right: Program List */}
          <div className="xl:col-span-1 space-y-6">
             <div className="bg-white border border-gray-200 rounded-sm p-6 h-full shadow-sm flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                   <Calendar size={18} className="text-gray-900" />
                   <h2 className="text-sm font-bold text-gray-900 font-mono uppercase">Upcoming Deadlines</h2>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                   {upcomingDeadlines.length > 0 ? upcomingDeadlines.map((prog) => {
                      const dDay = Math.ceil((new Date(prog.date).getTime() - new Date('2026-02-13').getTime()) / (1000 * 60 * 60 * 24))
                      const dDayStr = dDay === 0 ? 'D-Day' : dDay > 0 ? `D-${dDay}` : `D+${Math.abs(dDay)}`

                      return (
                      <div key={prog.id} className="group border border-gray-100 rounded-sm p-4 hover:border-black hover:shadow-sm transition-all bg-white cursor-pointer">
                         <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-mono font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-sm border border-red-100">
                               {dDayStr}
                            </span>
                            <Bookmark size={14} className="text-gray-300 group-hover:text-black transition-colors" />
                         </div>
                         <h3 className="text-sm font-bold text-gray-900 leading-snug mb-2 group-hover:text-draft-blue transition-colors">
                            {prog.title}
                         </h3>
                         <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Building2 size={12} />
                            <span className="truncate">{prog.date}</span>
                         </div>
                      </div>
                   )}) : (
                       <div className="text-xs text-gray-400 text-center py-10 italic">No upcoming deadlines</div>
                   )}

                   <div className="p-4 border border-dashed border-gray-200 rounded-sm text-center hover:bg-gray-50 transition-colors cursor-pointer">
                      <p className="text-xs text-gray-400 mb-2 font-mono">MORE OPPORTUNITIES</p>
                      <button className="text-xs font-bold text-black hover:underline uppercase">Sync K-Startup</button>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* Add Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        <Plus size={18} /> Add Event
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-1.5">Event Title</label>
                        <input
                            type="text"
                            value={newEventTitle}
                            onChange={(e) => setNewEventTitle(e.target.value)}
                            placeholder="e.g. Project Meeting"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-black transition-colors"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-1.5">Date</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="date"
                                    value={newEventDate}
                                    onChange={(e) => setNewEventDate(e.target.value)}
                                    className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-black transition-colors"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-1.5">Time (Optional)</label>
                            <div className="relative">
                                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="time"
                                    value={newEventTime}
                                    onChange={(e) => setNewEventTime(e.target.value)}
                                    className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-black transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-1.5">Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['deadline', 'meeting', 'todo'] as const).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setNewEventType(t)}
                                    className={`py-2 text-xs font-bold uppercase rounded-sm border transition-all ${
                                        newEventType === t
                                        ? 'bg-black text-white border-black'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 mt-2">
                        <button
                            type="submit"
                            className="w-full bg-draft-blue text-white py-3.5 rounded-sm font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            Create Event
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  )
}
