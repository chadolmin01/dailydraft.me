import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Home } from './components/Home';
import { SplashScreen } from './components/SplashScreen';
import { Onboarding } from './components/Onboarding';
import { LoadingGuide } from './components/LoadingGuide';
import { Dashboard } from './components/Dashboard';
import { Profile } from './components/Profile';
import { CalendarView } from './components/CalendarView';
import { Explore } from './components/Explore';
import { Projects } from './components/Projects';
import { Chat } from './components/Chat';
import { Documents } from './components/Documents';
import { Network } from './components/Network';
import { LandingPage } from './components/LandingPage';
import { MessageCircle } from 'lucide-react';
import { CalendarEvent } from './types';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Landing page only mode - for pre-launch deployment
// const isLandingOnly = import.meta.env.VITE_LANDING_ONLY === 'true';
const isLandingOnly = true; // TEMP: hardcoded for testing

function AppContent() {
  const { isAuthenticated, isLoading: authLoading, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appState, setAppState] = useState<'landing' | 'splash' | 'onboarding' | 'guide' | 'ready'>('landing');

  // Landing page only mode - show only landing page with waitlist
  if (isLandingOnly) {
    return <LandingPage onLogin={() => {
      // In landing-only mode, scroll to waitlist instead of going to login
      document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
    }} />;
  }

  // Shared Event State
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: '1', title: '예비창업패키지 마감', date: '2026-02-10', type: 'deadline', completed: false },
    { id: '2', title: '데이터바우처 신청', date: '2026-02-13', type: 'deadline', completed: false },
    { id: '3', title: 'Co-founder 미팅', date: '2026-02-14', time: '14:00', type: 'meeting', completed: false },
    { id: '4', title: '프로필 업데이트', date: '2026-02-15', type: 'todo', completed: false },
    { id: '5', title: '네트워킹 데이', date: '2026-02-24', time: '19:00', type: 'meeting', completed: false },
  ]);

  // Handle auth state changes
  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        // User is logged in
        if (profile?.onboarding_completed) {
          setAppState('ready');
        } else {
          setAppState('onboarding');
        }
      }
    }
  }, [authLoading, isAuthenticated, profile]);

  const handleAddEvent = (newEvent: CalendarEvent) => {
    setEvents(prev => [...prev, newEvent]);
  };

  const handleToggleEvent = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, completed: !e.completed } : e));
  };

  const handleLandingLogin = () => {
    setAppState('splash');
  };

  const handleSplashComplete = (targetTab: string) => {
    if (targetTab === 'onboarding') {
      setAppState('onboarding');
    } else {
      setAppState('ready');
      setActiveTab('dashboard');
    }
  };

  const handleOnboardingComplete = () => {
    setAppState('guide');
  };

  const handleGuideComplete = () => {
    setAppState('ready');
    setActiveTab('dashboard');
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#FAFAFA] flex flex-col items-center justify-center font-mono">
        <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-black text-lg rounded-sm mb-4">D</div>
        <div className="text-[10px] text-gray-400 font-medium tracking-widest animate-pulse uppercase">
          Loading...
        </div>
      </div>
    );
  }

  if (appState === 'landing') {
    return <LandingPage onLogin={handleLandingLogin} />;
  }

  if (appState === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (appState === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (appState === 'guide') {
    return <LoadingGuide onComplete={handleGuideComplete} />;
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'home': return <Dashboard setActiveTab={setActiveTab} events={events} onToggleEvent={handleToggleEvent} />; 
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} events={events} onToggleEvent={handleToggleEvent} />;
      case 'profile': return <Profile />;
      case 'calendar': return <CalendarView events={events} onAddEvent={handleAddEvent} />;
      case 'explore': return <Explore />;
      case 'projects': return <Projects />;
      case 'messages': return <Chat />;
      case 'documents': return <Documents />;
      case 'network': return <Network />;
      default: return <Dashboard setActiveTab={setActiveTab} events={events} onToggleEvent={handleToggleEvent} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F7F7F5] font-sans text-gray-900 animate-in fade-in duration-500">
      {/* Fixed Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {renderContent()}
      </div>

      {/* Floating Chat Button - Only show if not on messages tab */}
      {activeTab !== 'messages' && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setActiveTab('messages')}
            className="bg-[#007086] hover:bg-[#005a6b] text-white p-3.5 rounded-full shadow-lg transition-colors duration-200 flex items-center justify-center"
          >
            <MessageCircle size={24} fill="white" strokeWidth={0} />
          </button>
        </div>
      )}
    </div>
  );
}

// Main App component with providers
export default function App() {
  // Landing only mode - skip auth entirely
  if (isLandingOnly) {
    return <LandingPage onLogin={() => {
      document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' });
    }} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}