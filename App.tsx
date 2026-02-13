import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { Sidebar } from './components/Sidebar';
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

// Landing page only mode - hardcoded true for production
const isLandingOnly = true;

// Mock profile for demo mode
const DEMO_PROFILE = {
  id: 'demo-user',
  user_id: 'demo-user-id',
  nickname: 'Demo User',
  contact_email: 'demo@draft.io',
  university: 'Seoul National University',
  major: 'Computer Science',
  location: 'Seoul, Korea',
  desired_position: 'Product Manager',
  interest_tags: ['AI/ML', 'Startup', 'Product'],
  profile_visibility: 'public' as const,
  onboarding_completed: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Loading component
const LoadingScreen = () => (
  <div className="fixed inset-0 z-[100] bg-[#FAFAFA] flex flex-col items-center justify-center font-mono">
    <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-black text-lg rounded-sm mb-4">D</div>
    <div className="text-[10px] text-gray-400 font-medium tracking-widest animate-pulse uppercase">
      Loading...
    </div>
  </div>
);

// Demo App Component - Runs without authentication
function DemoApp({ onExitDemo }: { onExitDemo: () => void }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: '1', title: '예비창업패키지 마감', date: '2026-02-14', type: 'deadline', completed: false },
    { id: '2', title: '데이터바우처 신청', date: '2026-02-15', type: 'deadline', completed: false },
    { id: '3', title: 'Co-founder 미팅', date: '2026-02-16', time: '14:00', type: 'meeting', completed: false },
    { id: '4', title: '프로필 업데이트', date: '2026-02-17', type: 'todo', completed: false },
    { id: '5', title: '네트워킹 데이', date: '2026-02-24', time: '19:00', type: 'meeting', completed: false },
  ]);

  const handleAddEvent = (newEvent: CalendarEvent) => {
    setEvents(prev => [...prev, newEvent]);
  };

  const handleToggleEvent = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, completed: !e.completed } : e));
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'home':
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} events={events} onToggleEvent={handleToggleEvent} />;
      case 'profile':
        return <Profile />;
      case 'calendar':
        return <CalendarView events={events} onAddEvent={handleAddEvent} />;
      case 'explore':
        return <Explore />;
      case 'projects':
        return <Projects />;
      case 'messages':
        return <Chat />;
      case 'documents':
        return <Documents />;
      case 'network':
        return <Network />;
      default:
        return <Dashboard setActiveTab={setActiveTab} events={events} onToggleEvent={handleToggleEvent} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F7F7F5] font-sans text-gray-900 animate-in fade-in duration-500">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onBackToLanding={onExitDemo} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {renderContent()}
      </div>
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
      {/* Demo Mode Badge */}
      <div className="fixed top-4 right-4 z-50 bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-bold font-mono shadow-lg">
        DEMO MODE
      </div>
    </div>
  );
}

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if onboarding is needed
  if (!profile?.onboarding_completed && location.pathname !== '/onboarding' && location.pathname !== '/guide') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

// Public Route wrapper (redirect to dashboard if already logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, profile } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    if (profile?.onboarding_completed) {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
};

// Landing Page wrapper
const LandingPageWrapper = () => {
  const navigate = useNavigate();
  return <LandingPage onLogin={() => navigate('/login')} />;
};

// Login Page wrapper
const LoginPageWrapper = () => {
  const navigate = useNavigate();

  const handleComplete = (targetTab: string) => {
    if (targetTab === 'onboarding') {
      navigate('/onboarding');
    } else {
      navigate('/dashboard');
    }
  };

  return <SplashScreen onComplete={handleComplete} />;
};

// Onboarding wrapper
const OnboardingWrapper = () => {
  const navigate = useNavigate();
  return <Onboarding onComplete={() => navigate('/guide')} />;
};

// Guide wrapper
const GuideWrapper = () => {
  const navigate = useNavigate();
  return <LoadingGuide onComplete={() => navigate('/dashboard')} />;
};

// Main App Layout with Sidebar
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get active tab from current path
  const getActiveTab = () => {
    const path = location.pathname.slice(1) || 'dashboard';
    return path;
  };

  const setActiveTab = (tab: string) => {
    navigate(`/${tab}`);
  };

  return (
    <div className="flex min-h-screen bg-[#F7F7F5] font-sans text-gray-900 animate-in fade-in duration-500">
      <Sidebar activeTab={getActiveTab()} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {children}
      </div>
      {getActiveTab() !== 'messages' && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => navigate('/messages')}
            className="bg-[#007086] hover:bg-[#005a6b] text-white p-3.5 rounded-full shadow-lg transition-colors duration-200 flex items-center justify-center"
          >
            <MessageCircle size={24} fill="white" strokeWidth={0} />
          </button>
        </div>
      )}
    </div>
  );
};

// Dashboard with events state
const DashboardPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: '1', title: '예비창업패키지 마감', date: '2026-02-10', type: 'deadline', completed: false },
    { id: '2', title: '데이터바우처 신청', date: '2026-02-13', type: 'deadline', completed: false },
    { id: '3', title: 'Co-founder 미팅', date: '2026-02-14', time: '14:00', type: 'meeting', completed: false },
    { id: '4', title: '프로필 업데이트', date: '2026-02-15', type: 'todo', completed: false },
    { id: '5', title: '네트워킹 데이', date: '2026-02-24', time: '19:00', type: 'meeting', completed: false },
  ]);

  const handleToggleEvent = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, completed: !e.completed } : e));
  };

  return (
    <AppLayout>
      <Dashboard
        setActiveTab={(tab) => navigate(`/${tab}`)}
        events={events}
        onToggleEvent={handleToggleEvent}
      />
    </AppLayout>
  );
};

// Calendar with events state
const CalendarPage = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: '1', title: '예비창업패키지 마감', date: '2026-02-10', type: 'deadline', completed: false },
    { id: '2', title: '데이터바우처 신청', date: '2026-02-13', type: 'deadline', completed: false },
    { id: '3', title: 'Co-founder 미팅', date: '2026-02-14', time: '14:00', type: 'meeting', completed: false },
    { id: '4', title: '프로필 업데이트', date: '2026-02-15', type: 'todo', completed: false },
    { id: '5', title: '네트워킹 데이', date: '2026-02-24', time: '19:00', type: 'meeting', completed: false },
  ]);

  const handleAddEvent = (newEvent: CalendarEvent) => {
    setEvents(prev => [...prev, newEvent]);
  };

  return (
    <AppLayout>
      <CalendarView events={events} onAddEvent={handleAddEvent} />
    </AppLayout>
  );
};

// Simple page wrappers
const ProfilePage = () => <AppLayout><Profile /></AppLayout>;
const ExplorePage = () => <AppLayout><Explore /></AppLayout>;
const ProjectsPage = () => <AppLayout><Projects /></AppLayout>;
const MessagesPage = () => <AppLayout><Chat /></AppLayout>;
const DocumentsPage = () => <AppLayout><Documents /></AppLayout>;
const NetworkPage = () => <AppLayout><Network /></AppLayout>;

// Full App Routes (with auth)
function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={
        <PublicRoute>
          <LandingPageWrapper />
        </PublicRoute>
      } />
      <Route path="/login" element={
        <PublicRoute>
          <LoginPageWrapper />
        </PublicRoute>
      } />

      {/* Auth flow routes */}
      <Route path="/onboarding" element={
        <ProtectedRoute>
          <OnboardingWrapper />
        </ProtectedRoute>
      } />
      <Route path="/guide" element={
        <ProtectedRoute>
          <GuideWrapper />
        </ProtectedRoute>
      } />

      {/* Protected app routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      <Route path="/calendar" element={
        <ProtectedRoute>
          <CalendarPage />
        </ProtectedRoute>
      } />
      <Route path="/explore" element={
        <ProtectedRoute>
          <ExplorePage />
        </ProtectedRoute>
      } />
      <Route path="/projects" element={
        <ProtectedRoute>
          <ProjectsPage />
        </ProtectedRoute>
      } />
      <Route path="/messages" element={
        <ProtectedRoute>
          <MessagesPage />
        </ProtectedRoute>
      } />
      <Route path="/documents" element={
        <ProtectedRoute>
          <DocumentsPage />
        </ProtectedRoute>
      } />
      <Route path="/network" element={
        <ProtectedRoute>
          <NetworkPage />
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Landing Only App with Demo Mode support
function LandingOnlyApp() {
  const [isDemo, setIsDemo] = useState(false);

  const handleEnterDemo = () => {
    setIsDemo(true);
  };

  const handleExitDemo = () => {
    setIsDemo(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  if (isDemo) {
    return <DemoApp onExitDemo={handleExitDemo} />;
  }

  return <LandingPage onLogin={handleEnterDemo} isDemo={true} />;
}

// Main App component with providers
export default function App() {
  // Landing only mode - show landing with demo option
  if (isLandingOnly) {
    return <LandingOnlyApp />;
  }

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
