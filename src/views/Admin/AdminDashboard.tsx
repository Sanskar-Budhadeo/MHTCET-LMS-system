import React from 'react';
import { useLms } from '../../context/LmsContext';
import { Users, FileText, CheckSquare, TrendingUp, Sparkles, MessageSquare, AlertCircle, Database, Cpu, Activity, RefreshCw } from 'lucide-react';

interface AdminDashboardProps {
  setCurrentTab: (tab: string) => void;
  setSelectedAttemptIdForFeedback: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ setCurrentTab, setSelectedAttemptIdForFeedback }) => {
  const { attempts, studyMaterials, questions } = useLms();

  // System Status State
  const [status, setStatus] = React.useState<{
    database: 'connected' | 'disconnected' | 'checking';
    ai: 'configured' | 'missing' | 'checking';
    loading: boolean;
  }>({
    database: 'checking',
    ai: 'checking',
    loading: false
  });

  const checkStatus = async () => {
    setStatus(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch('http://localhost:5000/api/health-check');
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus({
        database: data.database,
        ai: data.ai,
        loading: false
      });
    } catch (error) {
      console.error('Health check error:', error);
      setStatus({
        database: 'disconnected',
        ai: 'missing',
        loading: false
      });
    }
  };

  React.useEffect(() => {
    checkStatus();
  }, []);

  // Dynamic Stats and Pending Attempts States
  const [stats, setStats] = React.useState<{
    totalStudents: number;
    dailyActivePercentage: string;
    totalQuestions: number;
    pendingReviews: number;
  }>({
    totalStudents: 0,
    dailyActivePercentage: '0%',
    totalQuestions: 0,
    pendingReviews: 0
  });

  const [pendingAttempts, setPendingAttempts] = React.useState<any[]>([]);
  const [loadingStats, setLoadingStats] = React.useState(true);

  const fetchStatsAndAttempts = async () => {
    const token = localStorage.getItem('mht_cet_token');
    if (!token) return;

    try {
      const statsRes = await fetch('http://localhost:5000/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const statsData = await statsRes.json();
      if (statsRes.ok) {
        setStats(statsData);
      }

      const attemptsRes = await fetch('http://localhost:5000/api/admin/pending-attempts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const attemptsData = await attemptsRes.json();
      if (attemptsRes.ok) {
        setPendingAttempts(attemptsData);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  React.useEffect(() => {
    fetchStatsAndAttempts();
  }, []);

  const handleReviewClick = (attId: string) => {
    setSelectedAttemptIdForFeedback(attId);
    setCurrentTab('admin-feedback');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
          Admin Platform Control
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Monitor enrollments, modify syllabus items, generate test MCQs, and evaluate student scripts.
        </p>
      </div>

      {/* Admin Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#eff6ff', color: 'var(--accent)', padding: '12px', borderRadius: '10px' }}>
            <Users size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.totalStudents} Students</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Registrations</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#ecfdf5', color: '#10b981', padding: '12px', borderRadius: '10px' }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.dailyActivePercentage}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Daily Active Users</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#fffbeb', color: '#f59e0b', padding: '12px', borderRadius: '10px' }}>
            <FileText size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.totalQuestions} MCQs</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Syllabus MCQ Bank</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '10px' }}>
            <CheckSquare size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.pendingReviews} Pending</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Instructor Reviews</div>
          </div>
        </div>
      </div>

      {/* Content management and Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        {/* Pending Student mock attempts */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} style={{ color: 'var(--warning)' }} /> Pending Student Mock Test Evaluations
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            These students submitted tests and are awaiting detailed instructor comments and study guidelines.
          </p>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Mock Test</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingAttempts.map(att => (
                  <tr key={att.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{att.studentName}</td>
                    <td>{att.testName}</td>
                    <td>{att.date}</td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{att.score}</span>/{att.maxScore} ({att.accuracy}%)
                    </td>
                    <td>
                      <button 
                        onClick={() => handleReviewClick(att.id)} 
                        className="btn btn-primary btn-sm"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        Provide Review
                      </button>
                    </td>
                  </tr>
                ))}

                {pendingAttempts.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '30px' }}>
                      🎉 Excellent! All mock tests have been evaluated with manual feedback.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subscription & Class overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* System Status Widget */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} style={{ color: status.database === 'connected' && status.ai === 'configured' ? 'var(--success)' : 'var(--warning)' }} />
                System Status
              </h3>
              <button 
                onClick={checkStatus} 
                disabled={status.loading}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: 'var(--text-light)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '4px' 
                }}
                title="Refresh Status"
              >
                <RefreshCw size={14} className={status.loading ? 'pulse' : ''} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Database Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Database size={16} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Database Active</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: status.database === 'connected' ? 'var(--success)' : status.database === 'checking' ? 'var(--warning)' : 'var(--danger)',
                    boxShadow: status.database === 'connected' ? '0 0 8px var(--success)' : 'none'
                  }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: status.database === 'connected' ? 'var(--success)' : status.database === 'checking' ? 'var(--warning)' : 'var(--danger)' }}>
                    {status.database === 'connected' ? 'CONNECTED' : status.database === 'checking' ? 'CHECKING...' : 'DISCONNECTED'}
                  </span>
                </div>
              </div>

              {/* AI Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Cpu size={16} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>AI Ready</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: status.ai === 'configured' ? 'var(--success)' : status.ai === 'checking' ? 'var(--warning)' : 'var(--danger)',
                    boxShadow: status.ai === 'configured' ? '0 0 8px var(--success)' : 'none'
                  }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: status.ai === 'configured' ? 'var(--success)' : status.ai === 'checking' ? 'var(--warning)' : 'var(--danger)' }}>
                    {status.ai === 'configured' ? 'CONFIGURED' : status.ai === 'checking' ? 'CHECKING...' : 'DEMO MODE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning indicator if either fails */}
            {(status.database !== 'connected' || status.ai !== 'configured') && status.database !== 'checking' && status.ai !== 'checking' && (
              <div style={{ 
                marginTop: '12px', 
                padding: '8px 12px', 
                borderRadius: 'var(--radius-sm)', 
                backgroundColor: 'var(--danger-bg)', 
                border: '1px solid var(--danger)',
                fontSize: '0.75rem', 
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <AlertCircle size={14} />
                <span>
                  {status.database !== 'connected' && status.ai !== 'configured' 
                    ? 'Critical: Database offline & AI in demo mode.'
                    : status.database !== 'connected' 
                    ? 'Warning: Database offline. Data is read-only.'
                    : 'Notice: AI in demo mode. Gemini API Key is missing.'}
                </span>
              </div>
            )}
          </div>

          {/* Enrollment package splits removed for dynamic metrics cleanup */}

          <div className="card" style={{ backgroundColor: 'var(--primary-light)' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: 'var(--accent)' }} /> AI Generator Shortcut
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
              Quickly draft a set of multiple-choice questions matching MHT-CET style parameters with zero negative markings.
            </p>
            <button onClick={() => setCurrentTab('admin-generator')} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
              Open Test Generator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
