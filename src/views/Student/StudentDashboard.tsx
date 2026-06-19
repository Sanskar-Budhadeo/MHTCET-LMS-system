import React, { useState, useEffect } from 'react';
import { useLms } from '../../context/LmsContext';
import {
  Flame,
  Calendar,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ClipboardList,
  CheckSquare
} from 'lucide-react';

interface StudentDashboardProps {
  setCurrentTab: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ setCurrentTab }) => {
  const { activeUser, events, attempts, weakTopics } = useLms();

  // Dynamic Dashboard Stats State
  const [stats, setStats] = useState<{
    streaks: number;
    hoursStudied: number;
    completedTasks: number;
    dailyGoalProgress: number;
    avgAccuracy: number;
    totalTests: number;
    weakTopicsCount: number;
    tasks: { _id: string; text: string; completed: boolean }[];
    savedNotesCount: number;
  }>({
    streaks: 0,
    hoursStudied: 0,
    completedTasks: 0,
    dailyGoalProgress: 0,
    avgAccuracy: 0,
    totalTests: 0,
    weakTopicsCount: 0,
    tasks: [],
    savedNotesCount: 0
  });

  const [newTaskText, setNewTaskText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    const token = localStorage.getItem('mht_cet_token');
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5000/api/user/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [attempts]); // Re-fetch stats when attempts count changes

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const token = localStorage.getItem('mht_cet_token');
    try {
      const response = await fetch('http://localhost:5000/api/user/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: newTaskText })
      });
      if (response.ok) {
        const updatedTasks = await response.json();
        setStats(prev => {
          const total = updatedTasks.length;
          const completed = updatedTasks.filter((t: any) => t.completed).length;
          return {
            ...prev,
            tasks: updatedTasks,
            completedTasks: completed,
            dailyGoalProgress: total > 0 ? Math.round((completed / total) * 100) : 0
          };
        });
        setNewTaskText('');
      }
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const toggleTask = async (taskId: string) => {
    const token = localStorage.getItem('mht_cet_token');
    try {
      const response = await fetch(`http://localhost:5000/api/user/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const updatedTasks = await response.json();
        setStats(prev => {
          const total = updatedTasks.length;
          const completed = updatedTasks.filter((t: any) => t.completed).length;
          return {
            ...prev,
            tasks: updatedTasks,
            completedTasks: completed,
            dailyGoalProgress: total > 0 ? Math.round((completed / total) * 100) : 0
          };
        });
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  // Dynamically calculate syllabus progress from actual test attempts
  const getSubjectMastery = (subjectName: string, totalChapters: number) => {
    const subjectAttempts = attempts.filter(att => att.subject === subjectName);
    // Count unique chapters with score >= 70% accuracy
    const masteredChapters = new Set(
      subjectAttempts
        .filter(att => att.accuracy >= 70)
        .map(att => att.testName)
    );
    return {
      completed: Math.min(masteredChapters.size, totalChapters),
      total: totalChapters
    };
  };

  const subjectProgress = [
    { subject: 'Physics', ...getSubjectMastery('Physics', 4), badge: 'badge-physics' },
    { subject: 'Chemistry', ...getSubjectMastery('Chemistry', 4), badge: 'badge-chemistry' },
    { subject: 'Mathematics', ...getSubjectMastery('Mathematics', 3), badge: 'badge-mathematics' },
    { subject: 'Biology', ...getSubjectMastery('Biology', 3), badge: 'badge-biology' }
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
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.streaks} Days</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Preparation Streak</div>
          </div>
        </div>

        {/* Hours Studied */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#eff6ff', color: 'var(--accent)', padding: '12px', borderRadius: '10px' }}>
            <Clock size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.hoursStudied} Hours</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Hours Studied Tracker</div>
          </div>
        </div>

        {/* Daily Goal Progress */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#ecfdf5', color: '#10b981', padding: '12px', borderRadius: '10px' }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.dailyGoalProgress}%</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Daily Goals Completed</div>
          </div>
        </div>

        {/* Mean Accuracy or Test Score */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '10px' }}>
            <ClipboardList size={28} />
          </div>
          <div>
            <div style={{ fontSize: stats.totalTests > 0 ? '1.75rem' : '1.1rem', fontWeight: 800 }}>
              {stats.totalTests > 0 ? `${stats.avgAccuracy}%` : 'No tests taken yet (or 0%)'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Mean Question Accuracy</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Syllabus + Goal Checklist / Calendar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr', gap: '24px', alignItems: 'start' }}>
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

        {/* Goals Checklist & Calendar Events */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Goals / Tasks Checklist */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckSquare size={18} style={{ color: 'var(--accent)' }} /> Goals & Tasks Checklist
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
              {stats.tasks.map(task => (
                <div 
                  key={task._id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    padding: '8px 12px', 
                    borderRadius: 'var(--radius-sm)', 
                    backgroundColor: 'var(--primary-light)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={task.completed} 
                    onChange={() => toggleTask(task._id)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <span 
                    style={{ 
                      fontSize: '0.875rem', 
                      color: task.completed ? 'var(--text-light)' : 'var(--text-main)', 
                      textDecoration: task.completed ? 'line-through' : 'none',
                      fontWeight: 500 
                    }}
                  >
                    {task.text}
                  </span>
                </div>
              ))}

              {stats.tasks.length === 0 && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
                  No active tasks. Create your first daily goal!
                </p>
              )}
            </div>

            <form onSubmit={addTask} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="form-input" 
                value={newTaskText} 
                onChange={(e) => setNewTaskText(e.target.value)} 
                placeholder="E.g. Study Chemistry formulas"
                style={{ padding: '6px 12px', fontSize: '0.85rem', flex: 1 }}
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }}>
                Add Goal
              </button>
            </form>
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

              {events.length === 0 && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                  No scheduled events or deadlines. Check back later!
                </p>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'center' }}>
              Time Remaining for MHT-CET Exam: <strong>310 Days</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
