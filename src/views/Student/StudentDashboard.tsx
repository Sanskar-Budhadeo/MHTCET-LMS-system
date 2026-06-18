import React from 'react';
import { useLms } from '../../context/LmsContext';
import {
  Flame,
  Calendar,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ClipboardList
} from 'lucide-react';

interface StudentDashboardProps {
  setCurrentTab: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ setCurrentTab }) => {
  const { activeUser, events, attempts, weakTopics } = useLms();

  // Calculate stats
  const totalTestsAttempted = attempts.length;
  const avgAccuracy = attempts.length 
    ? Math.round(attempts.reduce((sum, att) => sum + att.accuracy, 0) / attempts.length) 
    : 0;

  const subjectProgress = [
    { subject: 'Physics', completed: 2, total: 4, badge: 'badge-physics' },
    { subject: 'Chemistry', completed: 3, total: 4, badge: 'badge-chemistry' },
    { subject: 'Mathematics', completed: 2, total: 3, badge: 'badge-mathematics' },
    { subject: 'Biology', completed: 2, total: 3, badge: 'badge-biology' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
          Welcome back, {activeUser?.name}!
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Let's keep up your preparation. Target MHT-CET 2026 percentile: 99.5+.
        </p>
      </div>

      {/* Top Banner Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        {/* Streak card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#fffbeb', color: '#f59e0b', padding: '12px', borderRadius: '10px' }}>
            <Flame size={28} className="pulse" />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{activeUser?.streak || 1} Days</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Preparation Streak</div>
          </div>
        </div>

        {/* Tests Attempted */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#eff6ff', color: 'var(--accent)', padding: '12px', borderRadius: '10px' }}>
            <ClipboardList size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{totalTestsAttempted} Tests</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Simulator Exams Logged</div>
          </div>
        </div>

        {/* Avg Accuracy */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#ecfdf5', color: '#10b981', padding: '12px', borderRadius: '10px' }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{avgAccuracy}%</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mean Question Accuracy</div>
          </div>
        </div>

        {/* Weak Area warning */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '10px' }}>
            <Sparkles size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{weakTopics.length} Areas</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Weak Sub-Topics Identified</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Shortcuts + Study Schedule Calendar */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Subject Progress and Shortcuts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} /> MHT-CET PCMB Syllabus Tracker
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {subjectProgress.map(prog => (
                <div key={prog.subject}>
                  <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '6px', width: '100%' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }} className={`badge ${prog.badge}`}>
                      {prog.subject}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {prog.completed}/{prog.total} Chapters Mastered
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--primary-light)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${(prog.completed / prog.total) * 100}%`, 
                        height: '100%', 
                        backgroundColor: prog.subject === 'Physics' ? '#0369a1' : prog.subject === 'Chemistry' ? '#b45309' : prog.subject === 'Mathematics' ? '#a21caf' : '#15803d',
                        borderRadius: '99px' 
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button onClick={() => setCurrentTab('student-materials')} className="btn btn-outline" style={{ flex: 1 }}>
                Browse Notes Repository
              </button>
              <button onClick={() => setCurrentTab('student-tests')} className="btn btn-primary" style={{ flex: 1 }}>
                Enter Exam Simulator
              </button>
            </div>
          </div>

          {/* AI Advisor Banner */}
          {weakTopics.length > 0 && (
            <div 
              style={{
                backgroundColor: 'var(--warning-bg)',
                border: '1px solid var(--warning)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div>
                <h4 style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} style={{ color: 'var(--warning)' }} /> AI Adaptive Quiz Engine Recommendation
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                  Your scorecard shows a weak spot in <strong>{weakTopics[0]}</strong>. Take an adaptive micro-quiz of 5 questions to patch this gap.
                </p>
              </div>
              <button onClick={() => setCurrentTab('student-adaptive')} className="btn btn-primary btn-sm" style={{ backgroundColor: 'var(--warning)', borderColor: 'var(--warning)' }}>
                Solve Quiz <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Study Schedule Calendar */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} /> Calendar & Deadlines
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {events.map(event => (
              <div 
                key={event.id}
                style={{
                  borderLeft: '4px solid ' + (
                    event.type === 'Test' ? 'var(--danger)' : event.type === 'Lecture' ? 'var(--accent)' : 'var(--success)'
                  ),
                  padding: '8px 12px',
                  backgroundColor: 'var(--primary-light)',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {event.title}
                  </span>
                  <span 
                    className={`badge badge-${
                      event.type === 'Test' ? 'danger' : event.type === 'Lecture' ? 'info' : 'success'
                    }`}
                    style={{ fontSize: '0.6rem', padding: '1px 4px' }}
                  >
                    {event.type}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <Clock size={10} />
                  <span>{event.date}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'center' }}>
            Time Remaining for MHT-CET Exam: <strong>310 Days</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
