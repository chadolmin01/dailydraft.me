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
    <div className="flex-1 overflow-y-auto h-screen bg-surface-bg bg-grid-engineering relative">
      <div className="max-w-[100rem] mx-auto p-8 lg:p-12 space-y-8">

        {/* Header */}
        <div className="flex justify-between items-end border-b border-dashed border-border pb-6">
           <div>
             <div className="text-[0.625rem] font-mono font-bold uppercase tracking-widest text-txt-tertiary mb-2 flex items-center gap-2">
                 <span className="w-2 h-2 bg-brand"></span>
                 WORKSPACE / SCHEDULE
             </div>
             <h1 className="text-3xl font-bold text-txt-primary tracking-tight">Schedule</h1>
           </div>

           <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                 <button className="p-2 hover:bg-surface-sunken transition-colors border border-transparent hover:border-border"><ChevronLeft size={20}/></button>
                 <span className="text-xl font-bold font-mono text-txt-primary">2026.02</span>
                 <button className="p-2 hover:bg-surface-sunken transition-colors border border-transparent hover:border-border"><ChevronRight size={20}/></button>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-brand text-white border border-brand text-sm font-bold hover:bg-brand-hover shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
              >
                 <Plus size={16} /> Add Event
              </button>
           </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">

          {/* Left: Main Calendar */}
          <div className="xl:col-span-3 space-y-6">
             <div className="bg-surface-card border border-border-strong shadow-sharp overflow-hidden">
                <div className="grid grid-cols-7 border-b border-border-strong bg-surface-sunken">
                   {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, i) => (
                      <div key={day} className={`
                         py-3 text-center text-[0.625rem] font-bold font-mono uppercase tracking-widest
                         ${i === 0 ? 'text-status-danger-text' : (i === 6 ? 'text-status-info-text' : 'text-txt-disabled')}
                      `}>
                         {day}
                      </div>
                   ))}
                </div>

                <div className="grid grid-cols-7">
                   {Array.from({ length: startDayOffset }).map((_, i) => (
                      <div key={`empty-${i}`} className="min-h-[10rem] border-r border-b border-border bg-surface-sunken/30"></div>
                   ))}

                   {days.map((day) => {
                      const isToday = day === 13
                      const dateStr = `2026-02-${day.toString().padStart(2, '0')}`
                      const dayEvents = events.filter(e => e.date === dateStr)

                      return (
                         <div key={day} className={`
                            min-h-[10rem] border-r border-b border-border p-2 relative group hover:bg-surface-sunken transition-colors
                            ${(day + startDayOffset) % 7 === 0 ? 'border-r-0' : ''}
                            ${isToday ? 'bg-brand-bg' : ''}
                         `}>
                            <div className="flex justify-between items-start">
                                <span className={`
                                   text-xs font-bold font-mono block mb-3 pl-1
                                   ${(day + startDayOffset - 1) % 7 === 0 ? 'text-status-danger-text' : ((day + startDayOffset - 1) % 7 === 6 ? 'text-status-info-text' : 'text-txt-secondary')}
                                   ${isToday ? 'text-brand' : ''}
                                `}>
                                   {day} {isToday && <span className="ml-1 w-1.5 h-1.5 bg-brand inline-block mb-0.5"></span>}
                                </span>
                                <button
                                    onClick={() => {
                                        setNewEventDate(dateStr)
                                        setIsModalOpen(true)
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-surface-sunken text-txt-disabled hover:text-txt-primary transition-all"
                                >
                                    <Plus size={12}/>
                                </button>
                            </div>

                            <div className="space-y-1">
                                {dayEvents.map(event => (
                                    <div
                                        key={event.id}
                                        className={`px-2 py-1 text-[0.625rem] font-mono font-bold border cursor-pointer hover:opacity-80 truncate flex items-center gap-1
                                            ${event.type === 'deadline' ? 'bg-status-danger-bg text-status-danger-text border-status-danger-text/20' :
                                              event.type === 'meeting' ? 'bg-brand-bg text-brand border-brand-border' :
                                              'bg-surface-sunken text-txt-secondary border-border'}
                                        `}
                                    >
                                        {event.type === 'meeting' && event.time && <span className="font-mono text-[0.5625rem] opacity-75">{event.time}</span>}
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
             <div className="bg-surface-card border border-border-strong p-6 h-full shadow-sharp flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                   <Calendar size={18} className="text-txt-primary" />
                   <h2 className="text-[0.625rem] font-bold font-mono text-txt-tertiary uppercase tracking-widest flex items-center gap-2">
                     <span className="w-2 h-2 bg-indicator-alert"></span>
                     Upcoming Deadlines
                   </h2>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                   {upcomingDeadlines.length > 0 ? upcomingDeadlines.map((prog) => {
                      const dDay = Math.ceil((new Date(prog.date).getTime() - new Date('2026-02-13').getTime()) / (1000 * 60 * 60 * 24))
                      const dDayStr = dDay === 0 ? 'D-Day' : dDay > 0 ? `D-${dDay}` : `D+${Math.abs(dDay)}`

                      return (
                      <div key={prog.id} className="group border border-border p-4 hover:border-border-strong hover:shadow-sharp transition-all bg-surface-card cursor-pointer">
                         <div className="flex justify-between items-start mb-2">
                            <span className="text-[0.625rem] font-mono font-bold text-status-danger-text bg-status-danger-bg px-1.5 py-0.5 border border-status-danger-text/20">
                               {dDayStr}
                            </span>
                            <Bookmark size={14} className="text-txt-disabled group-hover:text-txt-primary transition-colors" />
                         </div>
                         <h3 className="text-sm font-bold text-txt-primary leading-snug mb-2 group-hover:text-brand transition-colors">
                            {prog.title}
                         </h3>
                         <div className="flex items-center gap-1.5 text-xs text-txt-tertiary">
                            <Building2 size={12} />
                            <span className="truncate font-mono">{prog.date}</span>
                         </div>
                      </div>
                   )}) : (
                       <div className="text-xs text-txt-disabled text-center py-10 font-mono">No upcoming deadlines</div>
                   )}

                   <div className="p-4 border border-dashed border-border text-center hover:bg-surface-sunken transition-colors cursor-pointer">
                      <p className="text-[0.625rem] text-txt-disabled mb-2 font-mono font-bold uppercase tracking-widest">MORE OPPORTUNITIES</p>
                      <button className="text-xs font-bold text-txt-primary hover:underline uppercase">Sync K-Startup</button>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* Add Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-surface-card w-full max-w-md shadow-brutal overflow-hidden border border-border-strong animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-5 border-b border-dashed border-border bg-surface-sunken">
                    <h3 className="font-bold text-lg text-txt-primary flex items-center gap-2">
                        <Plus size={18} /> Add Event
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-txt-disabled hover:text-txt-primary transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[0.625rem] font-bold text-txt-tertiary font-mono uppercase tracking-widest mb-1.5">Event Title</label>
                        <input
                            type="text"
                            value={newEventTitle}
                            onChange={(e) => setNewEventTitle(e.target.value)}
                            placeholder="e.g. Project Meeting"
                            className="w-full p-3 bg-surface-sunken border border-border-strong text-sm focus:outline-none focus:border-brand transition-colors"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[0.625rem] font-bold text-txt-tertiary font-mono uppercase tracking-widest mb-1.5">Date</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-disabled" />
                                <input
                                    type="date"
                                    value={newEventDate}
                                    onChange={(e) => setNewEventDate(e.target.value)}
                                    className="w-full pl-10 pr-3 py-3 bg-surface-sunken border border-border-strong text-sm focus:outline-none focus:border-brand transition-colors"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[0.625rem] font-bold text-txt-tertiary font-mono uppercase tracking-widest mb-1.5">Time (Optional)</label>
                            <div className="relative">
                                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-disabled" />
                                <input
                                    type="time"
                                    value={newEventTime}
                                    onChange={(e) => setNewEventTime(e.target.value)}
                                    className="w-full pl-10 pr-3 py-3 bg-surface-sunken border border-border-strong text-sm focus:outline-none focus:border-brand transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[0.625rem] font-bold text-txt-tertiary font-mono uppercase tracking-widest mb-1.5">Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['deadline', 'meeting', 'todo'] as const).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setNewEventType(t)}
                                    className={`py-2 text-xs font-bold uppercase border transition-all ${
                                        newEventType === t
                                        ? 'bg-black text-white border-black'
                                        : 'bg-surface-card text-txt-tertiary border-border-strong hover:border-txt-secondary'
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
                            className="w-full bg-brand text-white border border-brand py-3.5 font-bold text-sm hover:bg-brand-hover shadow-solid-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
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
