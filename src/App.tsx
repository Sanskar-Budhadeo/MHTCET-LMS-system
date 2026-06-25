import React, { useState, useEffect } from 'react';
import { LmsProvider, useLms } from './context/LmsContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './views/LandingPage';
import { StudentDashboard } from './views/Student/StudentDashboard';
import { StudentMaterials } from './views/Student/StudentMaterials';
import { MockTestEngine } from './views/Student/MockTestEngine';
import { AdaptiveQuiz } from './views/Student/AdaptiveQuiz';
import { NotesApp } from './views/Student/NotesApp';
import { AdminDashboard } from './views/Admin/AdminDashboard';
import { TestGenerator } from './views/Admin/TestGenerator';
import { MaterialRepository } from './views/Admin/MaterialRepository';
import { AdminFeedback } from './views/Admin/AdminFeedback';
import { ParentDashboard } from './views/Parent/ParentDashboard';
import { TeacherDashboard } from './views/Teacher/TeacherDashboard';
import { ExecutiveDashboard } from './views/Executive/ExecutiveDashboard';

// Custom Phase 3 & 4 Student Views
import { AnalysisInsights } from './views/Student/AnalysisInsights';
import { LearningView } from './views/Student/LearningView';
import { Joyride, Step } from 'react-joyride';

// Joyride step configuration definitions
const joyrideSteps: Step[] = [
  {
    target: '#step-guide',
    content: 'Welcome to your MHT-CET Ace LMS Portal! Click this button at any time to repeat this guide.',
    placement: 'bottom',
    skipBeacon: true
  },
  {
    target: '#step-overview',
    content: 'Use the Overview tab to view your course details, active study streaks, upcoming exam dates, and quick stats.',
    placement: 'right'
  },
  {
    target: '#step-mocktest',
    content: 'Under Mocktest, you can filter and launch tests (Complete Syllabus, Chapter-wise, Subject-wise), review mock standings on the peer leaderboard, and analyze previous score sheets.',
    placement: 'right'
  },
  {
    target: '#step-analysis',
    content: 'Check the Analysis / AI Insights tab (PRO ONLY) to get real-time evaluations from Gemini AI diagnostics and manual faculty instructor reviews.',
    placement: 'right'
  },
  {
    target: '#step-learning',
    content: 'Check the Learning tab (PRO ONLY) to browse educational video guides, edit personal study notes, check predicted ranks, and chat with your LaTeX AI Doubt Solver Tutor.',
    placement: 'right'
  },
  {
    target: '#step-theme-toggle',
    content: 'Switch between light and dark modes to study comfortably in any environment.',
    placement: 'bottom'
  }
];

const AppContent: React.FC = () => {
  const { activeUser, runTour, setRunTour } = useLms();
  const [currentTab, setCurrentTab] = useState<string>('student-overview');
  const [selectedAttemptIdForFeedback, setSelectedAttemptIdForFeedback] = useState<string | undefined>(undefined);

  // Set default tabs based on active user role changes
  useEffect(() => {
    if (activeUser) {
      if (activeUser.role === 'student') {
        setCurrentTab('student-overview');
      } else if (activeUser.role === 'admin') {
        setCurrentTab('admin-dashboard');
      } else if (activeUser.role === 'parent') {
        setCurrentTab('parent-performance');
      } else if (activeUser.role === 'teacher') {
        setCurrentTab('teacher-dashboard');
      } else if (activeUser.role === 'executive') {
        setCurrentTab('executive-dashboard');
      }
    }
  }, [activeUser]);

  if (!activeUser) {
    return <LandingPage />;
  }

  const renderContent = () => {
    switch (currentTab) {
      // Student Portal
      case 'student-overview':
      case 'student-dashboard': // backwards compatibility
        return <StudentDashboard setCurrentTab={setCurrentTab} />;
      case 'student-materials':
        return <StudentMaterials />;
      case 'student-tests':
        return <MockTestEngine />;
      case 'student-analysis':
        return <AnalysisInsights />;
      case 'student-learning':
        return <LearningView />;
      case 'student-adaptive':
        return <AdaptiveQuiz />;
      case 'student-notes':
        return <NotesApp />;

      // Admin Portal
      case 'admin-dashboard':
      case 'admin-performance':
        return (
          <AdminDashboard
            activeSection="performance"
            setCurrentTab={setCurrentTab}
            setSelectedAttemptIdForFeedback={setSelectedAttemptIdForFeedback}
          />
        );
      case 'admin-toppers':
        return (
          <AdminDashboard
            activeSection="toppers"
            setCurrentTab={setCurrentTab}
            setSelectedAttemptIdForFeedback={setSelectedAttemptIdForFeedback}
          />
        );
      case 'admin-participation':
        return (
          <AdminDashboard
            activeSection="participation"
            setCurrentTab={setCurrentTab}
            setSelectedAttemptIdForFeedback={setSelectedAttemptIdForFeedback}
          />
        );
      case 'admin-users':
        return (
          <AdminDashboard
            activeSection="users"
            setCurrentTab={setCurrentTab}
            setSelectedAttemptIdForFeedback={setSelectedAttemptIdForFeedback}
          />
        );
      case 'admin-settings':
        return (
          <AdminDashboard
            activeSection="settings"
            setCurrentTab={setCurrentTab}
            setSelectedAttemptIdForFeedback={setSelectedAttemptIdForFeedback}
          />
        );

      // Parent Portal
      case 'parent-dashboard':
      case 'parent-performance':
        return <ParentDashboard activeSection="performance" />;
      case 'parent-diagnostics':
        return <ParentDashboard activeSection="diagnostics" />;
      case 'parent-ranking':
        return <ParentDashboard activeSection="ranking" />;

       // Teacher Portal
      case 'teacher-dashboard':
        return <TeacherDashboard view="dashboard" />;
      case 'teacher-tracking':
        return <TeacherDashboard view="tracking" />;
      case 'teacher-generator':
        return <TestGenerator />;
      case 'teacher-materials':
        return <MaterialRepository />;
      case 'teacher-feedback':
        return (
          <AdminFeedback
            selectedAttemptId={selectedAttemptIdForFeedback}
            clearSelectedAttemptId={() => setSelectedAttemptIdForFeedback(undefined)}
          />
        );

      // Executive Portal
      case 'executive-dashboard':
        return <ExecutiveDashboard activeSection="analytics" />;
      case 'executive-finance':
        return <ExecutiveDashboard activeSection="finance" />;
      case 'executive-acquisition':
        return <ExecutiveDashboard activeSection="acquisition" />;
      case 'executive-health':
        return <ExecutiveDashboard activeSection="health" />;

      default:
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h3>View not found</h3>
            <p>The requested route tab is unrecognized by the router.</p>
          </div>
        );
    }
  };

  return (
    <div className="layout-container">
      {/* Joyride Onboarding Tour Guide */}
      {activeUser && activeUser.role === 'student' && (
        <Joyride
          steps={joyrideSteps}
          run={runTour}
          continuous
          options={{
            buttons: ['back', 'close', 'primary', 'skip'],
            showProgress: true
          }}
          onEvent={(data: any) => {
            const { status } = data;
            if (['finished', 'skipped'].includes(status)) {
              setRunTour(false);
            }
          }}
          styles={{
            tooltip: {
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            },
            buttonPrimary: {
              backgroundColor: 'var(--accent)',
              color: 'white',
              fontFamily: 'inherit',
            },
            buttonBack: {
              color: 'var(--text-muted)',
              marginRight: '8px',
            },
            buttonSkip: {
              color: 'var(--text-muted)',
            }
          }}
        />
      )}

      {/* Role Navigation Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Workspace content */}
      <div className="main-content">
        <Navbar />
        <main className="page-container">{renderContent()}</main>
      </div>
    </div>
  );
};

function App() {
  return (
    <LmsProvider>
      <AppContent />
    </LmsProvider>
  );
}

export default App;
