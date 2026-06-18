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
  UserCheck
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { activeUser } = useLms();

  if (!activeUser) return null;

  const renderStudentMenu = () => (
    <>
      <li className="sidebar-item">
        <button
          onClick={() => setCurrentTab('student-dashboard')}
          className={`sidebar-link btn-block ${currentTab === 'student-dashboard' ? 'active' : ''}`}
          style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </button>
      </li>
      <li className="sidebar-item">
        <button
          onClick={() => setCurrentTab('student-materials')}
          className={`sidebar-link btn-block ${currentTab === 'student-materials' ? 'active' : ''}`}
          style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
        >
          <BookOpen size={18} />
          <span>Study Materials</span>
        </button>
      </li>
      <li className="sidebar-item">
        <button
          onClick={() => setCurrentTab('student-tests')}
          className={`sidebar-link btn-block ${currentTab === 'student-tests' ? 'active' : ''}`}
          style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
        >
          <FileText size={18} />
          <span>Mock Test Arena</span>
        </button>
      </li>
      <li className="sidebar-item">
        <button
          onClick={() => setCurrentTab('student-adaptive')}
          className={`sidebar-link btn-block ${currentTab === 'student-adaptive' ? 'active' : ''}`}
          style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
        >
          <Brain size={18} />
          <span>AI Adaptive Quiz</span>
        </button>
      </li>
      <li className="sidebar-item">
        <button
          onClick={() => setCurrentTab('student-notes')}
          className={`sidebar-link btn-block ${currentTab === 'student-notes' ? 'active' : ''}`}
          style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
        >
          <Edit size={18} />
          <span>My Notes Canvas</span>
        </button>
      </li>
    </>
  );

  const renderAdminMenu = () => (
    <>
      <li className="sidebar-item">
        <button
          onClick={() => setCurrentTab('admin-dashboard')}
          className={`sidebar-link btn-block ${currentTab === 'admin-dashboard' ? 'active' : ''}`}
          style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
        >
          <LayoutDashboard size={18} />
          <span>Admin Overview</span>
        </button>
      </li>
      <li className="sidebar-item">
        <button
          onClick={() => setCurrentTab('admin-generator')}
          className={`sidebar-link btn-block ${currentTab === 'admin-generator' ? 'active' : ''}`}
          style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
        >
          <PenTool size={18} />
          <span>Test Generator</span>
        </button>
      </li>
      <li className="sidebar-item">
        <button
          onClick={() => setCurrentTab('admin-materials')}
          className={`sidebar-link btn-block ${currentTab === 'admin-materials' ? 'active' : ''}`}
          style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
        >
          <BookOpen size={18} />
          <span>Manage Materials</span>
        </button>
      </li>
      <li className="sidebar-item">
        <button
          onClick={() => setCurrentTab('admin-feedback')}
          className={`sidebar-link btn-block ${currentTab === 'admin-feedback' ? 'active' : ''}`}
          style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
        >
          <MessageSquare size={18} />
          <span>Manual Feedback</span>
        </button>
      </li>
    </>
  );

  const renderParentMenu = () => (
    <>
      <li className="sidebar-item">
        <button
          onClick={() => setCurrentTab('parent-dashboard')}
          className={`sidebar-link btn-block ${currentTab === 'parent-dashboard' ? 'active' : ''}`}
          style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
        >
          <Users size={18} />
          <span>Parent Insights</span>
        </button>
      </li>
    </>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <ShieldCheck size={22} style={{ color: 'var(--accent)' }} />
        <span>MHT-CET PORTAL</span>
      </div>
      
      <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <UserCheck size={16} style={{ color: 'var(--accent)' }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Logged in as</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeUser.name}
          </span>
        </div>
      </div>

      <ul className="sidebar-menu">
        {activeUser.role === 'student' && renderStudentMenu()}
        {activeUser.role === 'admin' && renderAdminMenu()}
        {activeUser.role === 'parent' && renderParentMenu()}
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
