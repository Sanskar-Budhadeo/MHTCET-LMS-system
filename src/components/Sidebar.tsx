import React from 'react';
import { useLms } from '../context/LmsContext';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Brain,
  Edit,
  Sliders,
  PenTool,
  MessageSquare,
  Users,
  Settings,
  ShieldCheck,
  UserCheck,
  Lock,
  Zap,
  Download,
  Award,
  Sparkles,
  Activity,
  DollarSign
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { activeUser, isMockTestActive } = useLms();

  if (!activeUser) return null;

  const handleTabClick = (tab: string) => {
    if (isMockTestActive) {
      alert("A mock test is currently in progress. You cannot navigate away. Please submit or complete your test first.");
      return;
    }
    setCurrentTab(tab);
  };

  const renderStudentMenu = () => (
    <>
      <li className="sidebar-item">
        <button
          id="step-overview"
          onClick={() => handleTabClick('student-overview')}
          className={`sidebar-link btn-block ${currentTab === 'student-overview' ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Overview</span>
        </button>
      </li>
      <li className="sidebar-item">
        <button
          id="step-mocktest"
          onClick={() => handleTabClick('student-tests')}
          className={`sidebar-link btn-block ${currentTab === 'student-tests' ? 'active' : ''}`}
        >
          <FileText size={18} />
          <span>Test Arena</span>
        </button>
      </li>
      <li className="sidebar-item">
        <button
          id="step-analysis"
          onClick={() => handleTabClick('student-analysis')}
          className={`sidebar-link btn-block ${currentTab === 'student-analysis' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} style={{ color: activeUser.plan === 'Free' ? '#94a3b8' : (currentTab === 'student-analysis' ? '#09090b' : 'var(--lime-accent)') }} />
            <span>Analysis & AI Insights</span>
          </div>
          {activeUser.plan === 'Free' && <Lock size={14} style={{ color: '#94a3b8', opacity: 0.8 }} />}
        </button>
      </li>
      <li className="sidebar-item">
        <button
          onClick={() => handleTabClick('student-adaptive')}
          className={`sidebar-link btn-block ${currentTab === 'student-adaptive' ? 'active' : ''}`}
        >
          <Brain size={18} style={{ color: currentTab === 'student-adaptive' ? '#09090b' : 'var(--lime-accent)' }} />
          <span>AI Adaptive Learning</span>
        </button>
      </li>
      <li className="sidebar-item">
        <button
          id="step-learning"
          onClick={() => handleTabClick('student-learning')}
          className={`sidebar-link btn-block ${currentTab === 'student-learning' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} />
            <span>Learning</span>
          </div>
          {activeUser.plan === 'Free' && <Lock size={14} style={{ color: '#94a3b8', opacity: 0.8 }} />}
        </button>
      </li>
      <li className="sidebar-item">
        <button
          onClick={() => handleTabClick('student-settings')}
          className={`sidebar-link btn-block ${currentTab === 'student-settings' ? 'active' : ''}`}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </li>
      {activeUser.plan !== 'Free' && activeUser.invoiceUrl && (
        <li className="sidebar-item" style={{ marginTop: '16px' }}>
          <a
            href={`http://localhost:5000${activeUser.invoiceUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-link btn-block"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              color: 'rgba(255, 255, 255, 0.9)',
              backgroundColor: 'rgba(226, 252, 92, 0.1)',
              border: '1px dashed rgba(226, 252, 92, 0.2)',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              fontSize: '0.85rem'
            }}
          >
            <Download size={18} style={{ color: 'var(--lime-accent)' }} />
            <span>Download Invoice</span>
          </a>
        </li>
      )}
    </>
  );

  const renderAdminMenu = () => (
    <>
      <li className="sidebar-item">
        <button
          onClick={() => handleTabClick('admin-performance')}
          className={`sidebar-link btn-block ${currentTab === 'admin-dashboard' || currentTab === 'admin-performance' ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Admin Overview</span>
        </button>
      </li>
      <li className="sidebar-item">
        <button
          onClick={() => handleTabClick('admin-users')}
          className={`sidebar-link btn-block ${currentTab === 'admin-users' ? 'active' : ''}`}
        >
          <Users size={18} />
          <span>User Management</span>
        </button>
      </li>
      <li className="sidebar-item">
        <button
          onClick={() => handleTabClick('admin-settings')}
          className={`sidebar-link btn-block ${currentTab === 'admin-settings' ? 'active' : ''}`}
        >
          <Settings size={18} />
          <span>System Settings</span>
        </button>
      </li>
    </>
  );

  const renderParentMenu = () => (
    <>
      <li className="sidebar-item">
        <button
          onClick={() => handleTabClick('parent-performance')}
          className={`sidebar-link btn-block ${currentTab === 'parent-performance' ? 'active' : ''}`}
        >
          <Sliders size={18} />
          <span>Performance Overview</span>
        </button>
      </li>
      <li className="sidebar-item">
        <button
          onClick={() => handleTabClick('parent-diagnostics')}
          className={`sidebar-link btn-block ${currentTab === 'parent-diagnostics' ? 'active' : ''}`}
        >
          <Sparkles size={18} />
          <span>AI Diagnostics</span>
        </button>
      </li>
      <li className="sidebar-item">
        <button
          onClick={() => handleTabClick('parent-ranking')}
          className={`sidebar-link btn-block ${currentTab === 'parent-ranking' ? 'active' : ''}`}
        >
          <Award size={18} />
          <span>National Standings</span>
        </button>
      </li>
    </>
  );

  const renderTeacherMenu = () => (
    <>
      <li className="sidebar-item">
        <button
          onClick={() => handleTabClick('teacher-dashboard')}
          className={`sidebar-link btn-block ${currentTab === 'teacher-dashboard' ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Class Overview</span>
        </button>
      </li>
      <li className="sidebar-item">
        <button
          onClick={() => handleTabClick('teacher-tracking')}
          className={`sidebar-link btn-block ${currentTab === 'teacher-tracking' ? 'active' : ''}`}
        >
          <FileText size={18} />
          <span>Exam Tracking</span>
        </button>
      </li>
      <li className="sidebar-item">
        <button
          onClick={() => handleTabClick('teacher-generator')}
          className={`sidebar-link btn-block ${currentTab === 'teacher-generator' ? 'active' : ''}`}
        >
          <PenTool size={18} />
          <span>Test Generator</span>
        </button>
      </li>
      <li className="sidebar-item">
        <button
          onClick={() => handleTabClick('teacher-materials')}
          className={`sidebar-link btn-block ${currentTab === 'teacher-materials' ? 'active' : ''}`}
        >
          <BookOpen size={18} />
          <span>Manage Materials</span>
        </button>
      </li>
      <li className="sidebar-item">
        <button
          onClick={() => handleTabClick('teacher-feedback')}
          className={`sidebar-link btn-block ${currentTab === 'teacher-feedback' ? 'active' : ''}`}
        >
          <MessageSquare size={18} />
          <span>Manual Feedback</span>
        </button>
      </li>
    </>
  );

  const renderExecutiveMenu = () => (
    <>
      <li className="sidebar-item">
        <button
          onClick={() => handleTabClick('executive-dashboard')}
          className={`sidebar-link btn-block ${currentTab === 'executive-dashboard' ? 'active' : ''}`}
        >
          <Zap size={18} />
          <span>BI Analytics</span>
        </button>
      </li>
      <li className="sidebar-item">
        <button
          onClick={() => handleTabClick('executive-finance')}
          className={`sidebar-link btn-block ${currentTab === 'executive-finance' ? 'active' : ''}`}
        >
          <DollarSign size={18} />
          <span>Financial Overview</span>
        </button>
      </li>
      <li className="sidebar-item">
        <button
          onClick={() => handleTabClick('executive-acquisition')}
          className={`sidebar-link btn-block ${currentTab === 'executive-acquisition' ? 'active' : ''}`}
        >
          <Users size={18} />
          <span>User Acquisition</span>
        </button>
      </li>
      <li className="sidebar-item">
        <button
          onClick={() => handleTabClick('executive-health')}
          className={`sidebar-link btn-block ${currentTab === 'executive-health' ? 'active' : ''}`}
        >
          <Activity size={18} />
          <span>Platform Health</span>
        </button>
      </li>
    </>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <ShieldCheck size={22} style={{ color: 'var(--lime-accent)' }} />
        <span>MHT-CET PORTAL</span>
      </div>
      
      <div style={{ padding: '12px 16px', margin: '0 8px 16px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <UserCheck size={16} style={{ color: 'var(--lime-accent)' }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Logged in as</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeUser.name}
          </span>
        </div>
      </div>

      <ul className="sidebar-menu">
        {activeUser.role === 'student' && renderStudentMenu()}
        {activeUser.role === 'admin' && renderAdminMenu()}
        {activeUser.role === 'parent' && renderParentMenu()}
        {activeUser.role === 'teacher' && renderTeacherMenu()}
        {activeUser.role === 'executive' && renderExecutiveMenu()}
      </ul>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>
          <Settings size={12} />
          <span>MHT-CET LMS v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
