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
  CheckSquare,
  Download,
  Lock,
  Zap,
  Trash2
} from 'lucide-react';

interface StudentDashboardProps {
  setCurrentTab: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ setCurrentTab }) => {
  const { activeUser, events, attempts, weakTopics, upgradeUserPlan } = useLms();
  
  // Dynamic MHT-CET Exam countdown
  const examDate = new Date('2027-05-12T00:00:00');
  const now = new Date();
  const diffTime = examDate.getTime() - now.getTime();
  const countdownDaysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<'Pro' | 'Premium'>('Pro');
  const [targetCourse, setTargetCourse] = useState<'PCB' | 'PCM' | 'PCMB'>((activeUser?.targetCourse as any) || 'PCM');
  const [targetExam, setTargetExam] = useState<'JEE' | 'NEET' | 'MHT-CET'>((activeUser?.targetExam as any) || 'MHT-CET');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/29');
  const [cvv, setCvv] = useState('123');
  const [upiId, setUpiId] = useState('student@okaxis');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const handleSimulatedUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentProcessing(true);
    setTimeout(async () => {
      try {
        await upgradeUserPlan(upgradePlan, targetCourse, targetExam);
        setShowUpgradeModal(false);
      } catch (err) {
        console.error(err);
      } finally {
        setPaymentProcessing(false);
      }
    }, 1500);
  };

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

  const deleteTask = async (taskId: string) => {
    const token = localStorage.getItem('mht_cet_token');
    try {
      const response = await fetch(`http://localhost:5000/api/user/tasks/${taskId}`, {
        method: 'DELETE',
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
      console.error('Error deleting task:', err);
    }
  };

  const clearAllTasks = async () => {
    const token = localStorage.getItem('mht_cet_token');
    try {
      const response = await fetch('http://localhost:5000/api/user/tasks', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const updatedTasks = await response.json();
        setStats(prev => ({
          ...prev,
          tasks: updatedTasks,
          completedTasks: 0,
          dailyGoalProgress: 0
        }));
      }
    } catch (err) {
      console.error('Error clearing tasks:', err);
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
      {/* Student Details Card */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderLeft: '4px solid var(--accent)', padding: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
              Target: {activeUser?.targetExam || 'MHT-CET'} ({activeUser?.targetCourse || 'PCMB'})
            </span>
            <span className={`badge ${activeUser?.plan === 'Free' ? 'badge-secondary' : 'badge-primary'}`} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {activeUser?.plan === 'Free' ? <Lock size={10} /> : <Zap size={10} />}
              {activeUser?.plan || 'Free'} Plan
            </span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
            Welcome back, {activeUser?.name}!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
            Email: {activeUser?.email} {activeUser?.invoiceId && `| Billing Reference: ${activeUser.invoiceId}`}
          </p>
        </div>

          {activeUser?.plan === 'Free' && (
            <button onClick={() => { setUpgradePlan('Pro'); setShowUpgradeModal(true); }} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} />
              <span>Upgrade to Pro</span>
            </button>
          )}
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
              <button onClick={() => setCurrentTab('student-notes')} className="btn btn-outline" style={{ flex: 1 }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <CheckSquare size={18} style={{ color: 'var(--accent)' }} /> Goals & Tasks Checklist
              </h3>
              {stats.tasks.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {showClearConfirm ? (
                    <>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Are you sure?</span>
                      <button 
                        onClick={async () => {
                          await clearAllTasks();
                          setShowClearConfirm(false);
                        }} 
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Yes
                      </button>
                      <button 
                        onClick={() => setShowClearConfirm(false)} 
                        style={{ background: 'none', border: 'none', color: 'var(--text-light)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setShowClearConfirm(true)} 
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Clear All
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
              {stats.tasks.map(task => (
                <div 
                  key={task._id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '10px', 
                    padding: '8px 12px', 
                    borderRadius: 'var(--radius-sm)', 
                    backgroundColor: 'var(--primary-light)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
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
                  <button 
                    onClick={() => deleteTask(task._id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                    title="Delete Goal"
                  >
                    <Trash2 size={14} />
                  </button>
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
              MHT-CET Main Exam: <strong>May 12, 2027</strong> (<strong>{countdownDaysLeft} Days Left</strong>)
            </div>
          </div>
        </div>
      </div>
      {/* Simulated Upgrade Checkout Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <Zap size={32} style={{ color: 'var(--accent)', margin: '0 auto 8px' }} className="pulse" />
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Upgrade Subscription</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                Unlocks full platform features: Analysis, AI Insights & AI Tutor
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                className={`btn btn-sm ${upgradePlan === 'Pro' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setUpgradePlan('Pro')}
              >
                Pro Pack (₹1,499)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${upgradePlan === 'Premium' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setUpgradePlan('Premium')}
              >
                Premium Pack (₹2,999)
              </button>
            </div>

            <form onSubmit={handleSimulatedUpgrade}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Target Course</label>
                  <select className="form-select" value={targetCourse} onChange={(e) => setTargetCourse(e.target.value as any)} style={{ fontSize: '0.8rem', padding: '6px' }}>
                    <option value="PCM">PCM</option>
                    <option value="PCB">PCB</option>
                    <option value="PCMB">PCMB</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Target Exam</label>
                  <select className="form-select" value={targetExam} onChange={(e) => setTargetExam(e.target.value as any)} style={{ fontSize: '0.8rem', padding: '6px' }}>
                    <option value="MHT-CET">MHT-CET</option>
                    <option value="JEE">JEE</option>
                    <option value="NEET">NEET</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`btn btn-xs ${paymentMethod === 'card' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ height: '32px' }}
                >
                  Card Payment
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`btn btn-xs ${paymentMethod === 'upi' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ height: '32px' }}
                >
                  UPI Payment
                </button>
              </div>

              {paymentMethod === 'card' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Card Number</label>
                    <input type="text" className="form-input" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Expiry</label>
                      <input type="text" className="form-input" value={expiry} onChange={(e) => setExpiry(e.target.value)} required />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>CVV</label>
                      <input type="password" className="form-input" value={cvv} onChange={(e) => setCvv(e.target.value)} required />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '20px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>UPI Address</label>
                  <input type="text" className="form-input" value={upiId} onChange={(e) => setUpiId(e.target.value)} required />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  disabled={paymentProcessing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2, display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
                  disabled={paymentProcessing}
                >
                  {paymentProcessing ? (
                    <>
                      <div className="pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white' }} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Pay ₹{upgradePlan === 'Pro' ? '1,499' : '2,999'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
