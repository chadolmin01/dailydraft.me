import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  Compass, 
  LayoutGrid, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Users, 
  Settings,
  PenTool,
  Layers,
  User,
  LayoutDashboard,
  Briefcase,
  LogOut,
  Bell
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'DASHBOARD' }, 
    { id: 'explore', icon: Compass, label: 'EXPLORE' },
    { id: 'projects', icon: Briefcase, label: 'PROJECTS' },
    { id: 'profile', icon: User, label: 'PROFILE' },
    { id: 'calendar', icon: Calendar, label: 'SCHEDULE' },
    { id: 'messages', icon: MessageSquare, label: 'COMM' },
    { id: 'documents', icon: FileText, label: 'DOCS' },
    { id: 'network', icon: Users, label: 'NET' },
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleMenuAction = (action: string) => {
    if (action === 'profile') setActiveTab('profile');
    setIsMenuOpen(false);
  };

  return (
    <div className="w-16 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col items-center py-6 h-screen sticky top-0 z-50 shadow-[1px_0_0_0_rgba(0,0,0,0.02)]">
      
      {/* Home / Logo Button - Now goes to Dashboard */}
      <div className="mb-8 cursor-pointer group relative" onClick={() => setActiveTab('dashboard')}>
        <div className={`w-10 h-10 flex items-center justify-center rounded-lg shadow-md transition-colors
            ${activeTab === 'dashboard' ? 'bg-black text-white' : 'bg-white text-black border border-gray-200 hover:bg-black hover:text-white hover:border-black'}
        `}>
           <PenTool size={20} />
        </div>
        {/* Tooltip for Home */}
        <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-black text-white text-[10px] font-medium px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
           MAIN
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-3 w-full px-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-10 h-10 flex items-center justify-center transition-all duration-200 mx-auto rounded-lg relative group
              ${activeTab === item.id 
                ? 'bg-gray-100 text-black shadow-sm border border-gray-200' 
                : 'text-gray-400 hover:text-black hover:bg-gray-50'
              }`}
          >
            <item.icon size={20} strokeWidth={1.5} />
            
            {/* Tooltip */}
            <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-black text-white text-[10px] font-medium px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {item.label}
            </div>
          </button>
        ))}
      </nav>

      {/* Settings / Profile Menu Area */}
      <div className="mt-auto flex flex-col gap-4 w-full px-3 pb-4 relative" ref={menuRef}>
         
         {/* Popup Menu */}
         {isMenuOpen && (
            <div className="absolute left-14 bottom-2 w-56 bg-white border border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] rounded-sm p-1 flex flex-col gap-0.5 z-50 animate-in fade-in zoom-in-95 duration-100 origin-bottom-left">
              {/* User Info */}
              <div className="px-3 py-2.5 mb-1 border-b border-gray-100">
                <div className="font-bold text-sm text-gray-900">Lee Sungmin</div>
                <div className="text-[10px] text-gray-400 font-mono mt-0.5">leesm@draft.io</div>
              </div>

              {/* Menu Items */}
              <button 
                onClick={() => handleMenuAction('profile')} 
                className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-black rounded-sm transition-colors text-left w-full"
              >
                <User size={14} /> My Profile
              </button>
              <button className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-black rounded-sm transition-colors text-left w-full">
                <Settings size={14} /> Settings
              </button>
              <button className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-black rounded-sm transition-colors text-left w-full">
                <Bell size={14} /> Notifications <span className="ml-auto bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full text-[9px] font-bold">2</span>
              </button>

              <div className="h-px bg-gray-100 my-1"></div>

              <button className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-sm transition-colors text-left w-full">
                <LogOut size={14} /> Sign Out
              </button>
            </div>
         )}

        {/* Profile Avatar Trigger */}
        <button 
          className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all border relative group
            ${isMenuOpen 
              ? 'bg-black text-white border-black' 
              : 'bg-gray-100 text-gray-600 border-gray-200 hover:border-black'
            }`} 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          LS
          {/* Notification Dot */}
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
        </button>
      </div>
    </div>
  );
};