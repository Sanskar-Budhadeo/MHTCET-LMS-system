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

const AppContent: React.FC = () => {
  const { activeUser } = useLms();
  const [currentTab, setCurrentTab] = useState<string>('student-dashboard');
  const [selectedAttemptIdForFeedback, setSelectedAttemptIdForFeedback] = useState<string | undefined>(undefined);

  // Set default tabs based on active user role changes
  useEffect(() => {
    if (activeUser) {
      if (activeUser.role === 'student') {
        setCurrentTab('student-dashboard');
      } else if (activeUser.role === 'admin') {
        setCurrentTab('admin-dashboard');
      } else if (activeUser.role === 'parent') {
        setCurrentTab('parent-dashboard');
      }
    }
  }, [activeUser]);

  if (!activeUser) {
    return <LandingPage />;
  }

  const renderContent = () => {
    switch (currentTab) {
      // Student Portal
      case 'student-dashboard':
        return <StudentDashboard setCurrentTab={setCurrentTab} />;
      case 'student-materials':
        return <StudentMaterials />;
      case 'student-tests':
        return <MockTestEngine />;
      case 'student-adaptive':
        return <AdaptiveQuiz />;
      case 'student-notes':
        return <NotesApp />;

      // Admin Portal
      case 'admin-dashboard':
        return (
          <AdminDashboard
            setCurrentTab={setCurrentTab}
            setSelectedAttemptIdForFeedback={setSelectedAttemptIdForFeedback}
          />
        );
      case 'admin-generator':
        return <TestGenerator />;
      case 'admin-materials':
        return <MaterialRepository />;
      case 'admin-feedback':
        return (
          <AdminFeedback
            selectedAttemptId={selectedAttemptIdForFeedback}
            clearSelectedAttemptId={() => setSelectedAttemptIdForFeedback(undefined)}
          />
        );

      // Parent Portal
      case 'parent-dashboard':
        return <ParentDashboard />;

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
