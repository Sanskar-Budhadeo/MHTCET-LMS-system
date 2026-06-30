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
  const { activeUser, events, attempts, questions, weakTopics, upgradeUserPlan, fetchEvents, fetchAttempts, stats, setStats, fetchStats } = useLms();
  
  // Dynamic MHT-CET Exam countdown
  const examDate = new Date('2027-05-12T00:00:00');
  const now = new Date();
  const diffTime = examDate.getTime() - now.getTime();
  const countdownDaysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const sortedAttempts = [...attempts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastExamAccuracy = sortedAttempts.length > 0 ? sortedAttempts[0].accuracy : stats.avgAccuracy;

  const calculateStreak = (dates: string[]): number => {
    if (!dates || dates.length === 0) return 0;
    const sortedDates = [...dates]
      .map(d => new Date(d).toISOString().split('T')[0])
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    let streakCount = 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (!sortedDates.includes(todayStr) && !sortedDates.includes(yesterdayStr)) {
      return 0;
    }
    let checkDate = sortedDates.includes(todayStr) ? today : yesterday;
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (sortedDates.includes(dateStr)) {
        streakCount++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streakCount;
  };
  const activeStreak = activeUser?.loginDates ? calculateStreak(activeUser.loginDates) : stats.streaks;

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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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

  const [newTaskText, setNewTaskText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fetchEvents) fetchEvents();
    if (fetchAttempts) fetchAttempts();
    if (fetchStats) fetchStats();
  }, []);

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

  // Dynamically calculate subject-wise progress based on time, tests, quiz accuracy, and multiple factors
  const getSubjectProgress = (subjectName: string, totalChapters: number) => {
    // 1. Chapters predefined list
    const subjectChapters: { [key: string]: string[] } = {
      Physics: ['Rotational Dynamics', 'Oscillations', 'Mechanical Properties of Fluids'],
      Chemistry: ['Chemical Kinetics', 'Solid State'],
      Mathematics: ['Vectors', 'Trigonometric Functions'],
      Biology: ['Photosynthesis', 'Respiration and Energy Transfer']
    };
    const chapters = subjectChapters[subjectName] || [];
    const limitChapters = chapters.length > 0 ? chapters.length : totalChapters;

    // 2. Tests taken in this subject
    const subjectAttempts = attempts.filter(att => 
      att.testName?.toLowerCase().includes(subjectName.toLowerCase()) || 
      (att.answers && Object.keys(att.answers).some(qId => questions.find(q => q.id === qId)?.subject === subjectName))
    );
    const testsCount = subjectAttempts.length;

    // 3. Reading factor: Notes created for this subject
    const subjectNotesCount = stats.savedNotesCount || 0;
    const notesFactor = Math.min((subjectNotesCount / 4) + 1, 3);

    // 4. Accuracy factor: average accuracy on this subject
    let totalScoreAcc = 0;
    subjectAttempts.forEach(att => { totalScoreAcc += att.accuracy; });
    const avgAcc = testsCount > 0 ? (totalScoreAcc / testsCount) : 0;

    // 5. Time spent factor: fraction of total hours studied allocated to this subject
    const hoursFactor = stats.hoursStudied > 0 ? (stats.hoursStudied / 4) : 0;

    // Weighted progress percentage calculation incorporating multiple factors
    // - Base score accuracy contributes 40%
    // - Tests taken count contributes 30%
    // - Reading notes count contributes 15%
    // - Time spent (hoursStudied) contributes 15%
    let progressPercentage = 0;
    if (testsCount === 0) {
      const notesWeight = Math.min((notesFactor / 3) * 100, 100) * 0.5;
      const timeWeight = Math.min((hoursFactor / 5) * 100, 100) * 0.5;
      progressPercentage = Math.round(notesWeight + timeWeight);
    } else {
      const accWeight = avgAcc * 0.4;
      const testWeight = Math.min((testsCount / 4) * 100, 100) * 0.3;
      const notesWeight = Math.min((notesFactor / 3) * 100, 100) * 0.15;
      const timeWeight = Math.min((hoursFactor / 5) * 100, 100) * 0.15;
      progressPercentage = Math.round(accWeight + testWeight + notesWeight + timeWeight);
    }

    const completed = Math.round((progressPercentage / 100) * limitChapters);

    return {
      completed: Math.min(completed, limitChapters),
      total: limitChapters,
      percentage: Math.min(progressPercentage, 100)
    };
  };

  const subjectProgress = [
    { subject: 'Physics', ...getSubjectProgress('Physics', 4), badge: 'badge-physics' },
    { subject: 'Chemistry', ...getSubjectProgress('Chemistry', 4), badge: 'badge-chemistry' },
    { subject: 'Mathematics', ...getSubjectProgress('Mathematics', 3), badge: 'badge-mathematics' },
    { subject: 'Biology', ...getSubjectProgress('Biology', 3), badge: 'badge-biology' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Student Details Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '9999px', border: '1px solid var(--border)', backgroundColor: '#09090b', color: 'white', fontWeight: 600 }}>
              Target: {activeUser?.targetExam || 'MHT-CET'} ({activeUser?.targetCourse || 'PCM'})
            </span>
            <span style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '9999px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              {activeUser?.plan === 'Free' ? <Lock size={12} /> : <Zap size={12} style={{ color: 'var(--lime-accent-hover)' }} />}
              {activeUser?.plan || 'Free'} Plan
            </span>
          </div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'var(--font-display)', margin: 0, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            Welcome back, {activeUser?.name}!
            {activeUser?.prn && (
              <span style={{ fontSize: '0.85rem', padding: '4px 12px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', border: '1px solid var(--border)', color: 'var(--text-main)', fontWeight: 600 }}>
                PRN: {activeUser.prn}
              </span>
            )}
            {stats.siteRank && (
              <span style={{ fontSize: '0.85rem', padding: '4px 12px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', color: '#d97706', fontWeight: 600 }}>
                Site Rank: #{stats.siteRank}
              </span>
            )}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Email: {activeUser?.email} {activeUser?.phone && `| Phone: ${activeUser.phone}`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setNotificationsEnabled(!notificationsEnabled)} 
            className="btn btn-secondary btn-sm" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '9999px' }}
          >
            <span>{notificationsEnabled ? '🔔 Notifications On' : '🔕 Notifications Muted'}</span>
          </button>

          {activeUser?.plan === 'Free' && (
            <button onClick={() => { setUpgradePlan('Pro'); setShowUpgradeModal(true); }} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--lime-accent)', color: '#09090b', border: '1px solid #c4de32' }}>
              <Zap size={14} />
              <span>Upgrade to Pro</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Banner Stats Grid (Inspired by the Make-style cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* Card 1: Accuracy Index (Operations style) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
              <span>ACCURACY INDEX</span>
              <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{stats.totalTests} tests</span>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, margin: '12px 0 4px', fontFamily: 'var(--font-display)' }}>
              {stats.totalTests > 0 ? `${lastExamAccuracy}%` : '0%'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Daily goal progress: {stats.dailyGoalProgress}%
            </div>
          </div>
          {/* Custom cylindrical progress indicators */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
            {[1, 2, 3, 4, 5].map((idx) => {
              const activeCount = Math.ceil(lastExamAccuracy / 20);
              return (
                <div 
                  key={idx} 
                  style={{ 
                    width: '16px', 
                    height: '28px', 
                    borderRadius: '8px', 
                    backgroundColor: idx <= activeCount ? '#09090b' : 'var(--primary-light)',
                    transition: 'var(--transition)'
                  }} 
                />
              );
            })}
          </div>
        </div>

        {/* Card 2: Streak Metric (Data Transfer style in Lime Accent) */}
        <div className="card card-highlight" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(9, 9, 11, 0.6)', fontSize: '0.85rem', fontWeight: 700 }}>
              <span>ACTIVE STREAK</span>
              <span className="badge" style={{ fontSize: '0.65rem', backgroundColor: 'rgba(9,9,11,0.08)', color: '#09090b' }}>Daily drill</span>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, margin: '12px 0 4px', fontFamily: 'var(--font-display)' }}>
              {activeStreak} Days
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(9, 9, 11, 0.6)' }}>
              Hours Studied: {stats.hoursStudied} hrs
            </div>
          </div>
          {/* Custom cylindrical indicators */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
            {[1, 2, 3, 4, 5].map((idx) => {
              const activeCount = Math.min(activeStreak, 5);
              return (
                <div 
                  key={idx} 
                  style={{ 
                    width: '16px', 
                    height: '28px', 
                    borderRadius: '8px', 
                    backgroundColor: idx <= activeCount ? '#09090b' : 'rgba(9, 9, 11, 0.15)',
                    transition: 'var(--transition)'
                  }} 
                />
              );
            })}
          </div>
        </div>

        {/* Card 3: Promotion Callout Banner (Upgrade style) */}
        <div className="card card-dark" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--lime-accent)', fontSize: '0.8rem', fontWeight: 700 }}>
              <Sparkles size={14} />
              <span>ACADEMIC INTEGRATOR</span>
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '8px 0 4px', color: 'white' }}>
              Elevate Prep to Next Level
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.3' }}>
              {activeUser?.plan === 'Free' ? 'Unlock AI LaTeX doubt solver, rank predictors, and custom reviews.' : 'You have active access to premium AI tutor tools.'}
            </p>
          </div>
          <div style={{ marginTop: '12px', zIndex: 2 }}>
            {activeUser?.plan === 'Free' ? (
              <button 
                onClick={() => { setUpgradePlan('Pro'); setShowUpgradeModal(true); }} 
                className="btn" 
                style={{ width: '100%', padding: '8px 16px', fontSize: '0.75rem', backgroundColor: '#ffffff', color: '#09090b', borderRadius: '9999px', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                Upgrade Now
              </button>
            ) : (
              <button 
                onClick={() => setCurrentTab('student-learning')}
                className="btn" 
                style={{ width: '100%', padding: '8px 16px', fontSize: '0.75rem', backgroundColor: 'var(--lime-accent)', color: '#09090b', borderRadius: '9999px', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                Launch AI Tutor
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Main Grid: Syllabus + Goal Checklist / Calendar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        {/* Subject Progress and Shortcuts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} /> Subject-wise Progress Tracker
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {subjectProgress.map(prog => (
                <div key={prog.subject}>
                  <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginBottom: '6px', width: '100%' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }} className={`badge ${prog.badge}`}>
                      {prog.subject}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {prog.percentage}% Progress ({prog.completed}/{prog.total} Chapters)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--primary-light)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${prog.percentage}%`, 
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
