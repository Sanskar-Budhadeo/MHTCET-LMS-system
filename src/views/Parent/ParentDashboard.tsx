import React, { useState, useEffect } from 'react';
import { useLms } from '../../context/LmsContext';
import { TrendingUp, Calendar, MessageSquare, Sparkles, Clock, Bell, Check, X, ShieldAlert, CheckCircle, AlertTriangle, Award, Users, BookOpen } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface SystemAlertData {
  _id: string;
  message: string;
  type: string;
  read: boolean;
  createdAt?: string;
}

interface ParentDashboardProps {
  activeSection?: 'performance' | 'diagnostics' | 'ranking';
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ activeSection = 'performance' }) => {
  const { attempts } = useLms();
  const [loading, setLoading] = useState<boolean>(true);
  const [parentData, setParentData] = useState<any>(null);
  const [studentAnalytics, setStudentAnalytics] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  
  // Notification Bell States
  const [alerts, setAlerts] = useState<SystemAlertData[]>([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState<boolean>(false);

  const fetchAlerts = () => {
    const token = localStorage.getItem('mht_cet_token');
    fetch('http://localhost:5000/api/alerts', {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAlerts(data);
        }
      })
      .catch(err => console.error('Error fetching parent alerts:', err));
  };

  const markAlertAsRead = (alertId: string) => {
    const token = localStorage.getItem('mht_cet_token');
    fetch(`http://localhost:5000/api/alerts/${alertId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
      .then(res => res.json())
      .then(() => {
        setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, read: true } : a));
      })
      .catch(err => console.error('Error reading alert:', err));
  };

  // Fetch Parent linked students list on mount
  useEffect(() => {
    const token = localStorage.getItem('mht_cet_token');
    fetch('http://localhost:5000/api/parent/dashboard', {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Parent dashboard endpoint error');
        return res.json();
      })
      .then(data => {
        setParentData(data);
        if (data.students && data.students.length > 0) {
          setSelectedStudentId(data.students[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Error fetching parent dashboard links:', err);
        setLoading(false);
      });

    fetchAlerts();
  }, []);

  // Fetch analytics for selected student
  useEffect(() => {
    if (!selectedStudentId) return;
    setLoading(true);
    const token = localStorage.getItem('mht_cet_token');
    fetch(`http://localhost:5000/api/analytics/parent/${selectedStudentId}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Student analytics endpoint error');
        return res.json();
      })
      .then(data => {
        setStudentAnalytics(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching student analytics:', err);
        setLoading(false);
      });
  }, [selectedStudentId]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <h3>Loading Parent Insights...</h3>
      </div>
    );
  }

  if (!parentData || !parentData.students || parentData.students.length === 0) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <h3>No Student Link Configured</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          This parent profile is not linked to any active students. Please request system support.
        </p>
      </div>
    );
  }

  const studentObj = studentAnalytics?.student || {};
  const studentName = studentObj.name || 'Student';
  const studentStreak = studentObj.streak || 0;
  const hoursStudied = studentObj.hoursStudied || 0;
  const weakSubjects = studentObj.weakTopics || [];
  const strongSubjects = studentObj.strongTopics || [];

  // Performance scores array for rendering trends (Line Chart)
  const recentAttempts = studentAnalytics?.recentAttempts || [];
  const scoreTrends = recentAttempts.slice().reverse(); // chronological order

  const chartData = scoreTrends.map((trend: any) => ({
    name: trend.testName.replace('MHT-CET ', '').replace(' Full Syllabus', ''),
    accuracy: trend.accuracy,
    score: trend.score,
    maxScore: trend.maxScore,
    date: trend.createdAt ? trend.createdAt.split('T')[0] : ''
  }));

  // Consistency Grid (last 30 days)
  const getLast30Days = () => {
    const dates = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const last30Days = getLast30Days();

  // Active login dates and attempt dates
  const studentLoginDates = studentObj.loginDates || [];
  const studentAttemptDates = recentAttempts.map((a: any) => a.createdAt ? a.createdAt.split('T')[0] : '');
  const activeDatesSet = new Set([...studentLoginDates, ...studentAttemptDates]);

  // Determine contribution level
  const getContributionLvlClass = (dateStr: string) => {
    const hasActive = activeDatesSet.has(dateStr);
    const hasTest = studentAttemptDates.includes(dateStr);
    
    if (hasTest) return 'lvl-4'; // Completed test (dark green)
    if (hasActive) return 'lvl-2'; // Logged in (light green)
    return 'lvl-0'; // Inactive
  };

  // Quantitative AI Diagnostics from Attempts Responses
  const errorStats: { [topic: string]: { wrongCount: number; totalCount: number; sumTime: number } } = {};
  recentAttempts.forEach((att: any) => {
    const responses = att.responses || [];
    responses.forEach((resp: any) => {
      const topic = resp.chapter || 'General';
      if (!errorStats[topic]) {
        errorStats[topic] = { wrongCount: 0, totalCount: 0, sumTime: 0 };
      }
      errorStats[topic].totalCount += 1;
      errorStats[topic].sumTime += resp.timeSpent || 0;
      if (!resp.isCorrect) {
        errorStats[topic].wrongCount += 1;
      }
    });
  });

  const diagnostics = Object.entries(errorStats)
    .map(([topic, stats]) => {
      const errPercentage = Math.round((stats.wrongCount / stats.totalCount) * 100);
      const avgTime = Math.round(stats.sumTime / stats.totalCount);
      return { topic, errPercentage, avgTime };
    })
    .sort((a, b) => b.errPercentage - a.errPercentage);

  const instructorComments = recentAttempts.filter((a: any) => a.feedback && a.feedback.instructorName && a.feedback.text);
  const unreadAlerts = alerts.filter(a => !a.read);

  // Subject progress calculations
  const getSubjectMastery = (subjectName: string, totalChapters: number) => {
    const subjectAttempts = recentAttempts.filter((att: any) => att.subject === subjectName);
    const masteredChapters = new Set(
      subjectAttempts
        .filter((att: any) => att.accuracy >= 70)
        .map((att: any) => att.testName)
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
      
      {/* Dashboard Top Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', position: 'relative' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
            {activeSection === 'performance' ? 'Performance Overview' : activeSection === 'diagnostics' ? 'AI Diagnostics & Comments' : 'National Standing & Leaderboard'}
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Review score metrics, consistency streaks, and qualitative evaluations for student: <strong>{studentName}</strong>.
          </p>
        </div>

        {/* Multi-student toggle & Notification bell */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {parentData.students.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--primary-light)', padding: '4px', borderRadius: '8px' }}>
              {parentData.students.map((student: any) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className={`btn btn-sm ${selectedStudentId === student.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  {student.name}
                </button>
              ))}
            </div>
          )}

          {/* Notification Bell Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                padding: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)'
              }}
              title="System Alerts & Notifications"
            >
              <Bell size={20} />
              {unreadAlerts.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: 'var(--danger)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            {showNotificationDropdown && (
              <div 
                style={{
                  position: 'absolute',
                  top: '46px',
                  right: 0,
                  width: '320px',
                  maxHeight: '380px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                  zIndex: 100,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Parent System Alerts</span>
                  <button 
                    onClick={() => setShowNotificationDropdown(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
                <div style={{ padding: '8px 0' }}>
                  {alerts.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', margin: 0 }}>
                      No notifications or warnings.
                    </p>
                  ) : (
                    alerts.map(alert => (
                      <div 
                        key={alert._id} 
                        style={{ 
                          padding: '12px 16px', 
                          borderBottom: '1px solid var(--border)', 
                          backgroundColor: alert.read ? 'transparent' : 'rgba(37, 99, 235, 0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--text-main)', lineHeight: '1.4' }}>{alert.message}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={`badge badge-${alert.type === 'critical' ? 'danger' : alert.type === 'warning' ? 'warning' : 'info'}`} style={{ fontSize: '0.55rem', padding: '1px 4px' }}>
                            {alert.type}
                          </span>
                          {!alert.read && (
                            <button 
                              onClick={() => markAlertAsRead(alert._id)}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: 'var(--accent)', 
                                fontSize: '0.7rem', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '3px',
                                fontWeight: 600
                              }}
                            >
                              <Check size={12} /> Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PERFORMANCE TAB */}
      {activeSection === 'performance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: '#eff6ff', color: 'var(--accent)', padding: '16px', borderRadius: '12px' }}>
                <Clock size={32} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Syllabus Study Hours</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>{hoursStudied} Hours</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <div style={{ width: '100px', height: '6px', backgroundColor: 'var(--primary-light)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (hoursStudied / 40) * 100)}%`, height: '100%', backgroundColor: 'var(--accent)' }}></div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target: 40h</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: '#fffbeb', color: '#f59e0b', padding: '16px', borderRadius: '12px' }}>
                <Calendar size={32} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Consecutive Day Streak</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>{studentStreak} Days</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active student log tracker</span>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: '#ecfdf5', color: '#10b981', padding: '16px', borderRadius: '12px' }}>
                <TrendingUp size={32} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Subject Mastery index</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {chartData.length > 0 ? `${chartData[chartData.length - 1].accuracy}%` : '82%'}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latest syllabus attempt accuracy</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
            {/* Subject-wise Analysis */}
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} style={{ color: 'var(--accent)' }} /> Subject-wise Analysis
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {subjectProgress.map(prog => (
                  <div key={prog.subject}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }} className={`badge ${prog.badge}`}>
                        {prog.subject}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
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
            </div>

            {/* Consistency Tracker */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>Active Consistency Heatmap</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Visualization of child's login days & Mock test completion over the last 30 days.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '6px', maxWidth: '280px', margin: '0 auto' }}>
                  {last30Days.map(date => {
                    const level = getContributionLvlClass(date);
                    let color = 'var(--primary-light)';
                    if (level === 'lvl-2') color = 'rgba(16, 185, 129, 0.4)';
                    if (level === 'lvl-4') color = '#10b981';
                    return (
                      <div
                        key={date}
                        style={{ width: '22px', height: '22px', backgroundColor: color, borderRadius: '4px', border: '1px solid var(--border)' }}
                        title={`${date}: ${level === 'lvl-4' ? 'Mock Test Complete' : level === 'lvl-2' ? 'Active Portal Study' : 'Inactive'}`}
                      />
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', justifyContent: 'center', marginTop: '16px', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--primary-light)', borderRadius: '2px', display: 'inline-block' }}></span> No Activity
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', backgroundColor: 'rgba(16, 185, 129, 0.4)', borderRadius: '2px', display: 'inline-block' }}></span> Active Session
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '2px', display: 'inline-block' }}></span> Exam Taken
                </span>
              </div>
            </div>
          </div>

          {/* Chapter-wise Analysis Details */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Chapter-wise Analysis</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {['Physics', 'Chemistry', 'Mathematics', 'Biology'].map(sub => {
                const subAttempts = recentAttempts.filter((att: any) => att.subject === sub);
                const chapters = Array.from(new Set(subAttempts.map((att: any) => att.testName)));
                return (
                  <div key={sub} className="card" style={{ padding: '16px', border: '1px solid var(--border)', boxShadow: 'none', backgroundColor: 'var(--primary-light)' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-main)' }}>{sub} Modules</h4>
                    {chapters.length === 0 ? (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No attempts logged yet</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {chapters.map(ch => {
                          const matchingAttempts = subAttempts.filter((att: any) => att.testName === ch);
                          const bestAttempt = matchingAttempts.reduce((max: any, current: any) => current.accuracy > max.accuracy ? current : max, { accuracy: 0 });
                          const status = bestAttempt.accuracy >= 70 ? 'Mastered' : bestAttempt.accuracy >= 50 ? 'Proficient' : 'Needs Review';
                          const color = status === 'Mastered' ? '#10b981' : status === 'Proficient' ? '#f59e0b' : '#ef4444';
                          return (
                            <div key={ch as string} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{ch as string}</span>
                                <span style={{ color, fontWeight: 700 }}>{bestAttempt.accuracy}%</span>
                              </div>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>Status: {status}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* AI DIAGNOSTICS TAB */}
      {activeSection === 'diagnostics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Comparison with previous attempts & AI Error stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <TrendingUp size={18} style={{ color: 'var(--accent)' }} /> Comparison with Previous Attempts (Score Trend)
              </h3>
              {chartData.length > 0 ? (
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }} />
                      <Legend />
                      <Line type="monotone" dataKey="accuracy" name="Attempt Accuracy (%)" stroke="var(--accent)" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '40px 0' }}>No mock exam logs recorded.</p>
              )}
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Sparkles size={18} style={{ color: 'var(--info)' }} /> AI Diagnostic Error Metrics
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {diagnostics.slice(0, 4).map(diag => (
                  <div key={diag.topic} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'var(--primary-light)', borderRadius: '6px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>{diag.topic}</h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>Avg response delay: {diag.avgTime}s</span>
                    </div>
                    <span className={`badge badge-${diag.errPercentage >= 50 ? 'danger' : 'warning'}`} style={{ fontSize: '0.65rem' }}>{diag.errPercentage}% Errors</span>
                  </div>
                ))}
                {diagnostics.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No AI telemetry calculated.</p>
                )}
              </div>
            </div>
          </div>

          {/* AI weak topics & Human comments */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <AlertTriangle size={18} style={{ color: 'var(--warning)' }} /> AI-Generated Weak Topics
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Gemini diagnostic triggers identifying structural syllabus gaps and recommended recovery areas.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {weakSubjects.map((topic: string) => (
                  <div key={topic} style={{ padding: '8px 12px', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />
                    <span>{topic}</span>
                  </div>
                ))}
                {weakSubjects.length === 0 && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No critical weaknesses identified. Recommend continuing full mock series.
                  </p>
                )}
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <MessageSquare size={18} style={{ color: 'var(--accent)' }} /> Qualitative Instructor Review
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                {instructorComments.map((att: any) => (
                  <div key={att._id} style={{ border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                      <strong style={{ color: 'var(--accent)' }}>{att.feedback?.instructorName}</strong>
                      <span style={{ color: 'var(--text-light)' }}>{att.feedback?.date}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', fontStyle: 'italic' }}>"{att.feedback?.text}"</p>
                  </div>
                ))}
                {instructorComments.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No comments logged yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NATIONAL STANDING TAB */}
      {activeSection === 'ranking' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Standing KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: '#fffbeb', color: '#f59e0b', padding: '16px', borderRadius: '12px' }}>
                <Award size={32} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Projected National Rank</span>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)' }}>#425</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Top 0.5% of state candidates</span>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '16px', borderRadius: '12px' }}>
                <TrendingUp size={32} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Estimated Percentile</span>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)' }}>98.40%</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>State-wide benchmark index</span>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: '#ecfdf5', color: '#10b981', padding: '16px', borderRadius: '12px' }}>
                <Users size={32} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Mock Test Standings</span>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)' }}>4th Place</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Among local coaching cohort</span>
              </div>
            </div>
          </div>

          {/* Comparative graph & cohort standing */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Rank Percentile Comparative Analysis</h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Topper Average', percentile: 99.85 },
                    { name: 'Your Child', percentile: 98.40 },
                    { name: 'State Average', percentile: 72.10 },
                    { name: 'Batch Average', percentile: 68.50 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" fontSize={11} stroke="var(--text-muted)" />
                    <YAxis domain={[0, 100]} fontSize={11} stroke="var(--text-muted)" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }} />
                    <Bar dataKey="percentile" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Percentile Score">
                      {/* Highlight the student */}
                      <Cell fill="#10b981" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={18} style={{ color: '#f59e0b' }} /> Peer Standings & Ranks (Topper Cohort)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { rank: 1, name: 'Amit Patil', percentile: 99.85, accuracy: '95%', target: 'PCM' },
                  { rank: 2, name: 'Neha Deshmukh', percentile: 99.20, accuracy: '92%', target: 'PCB' },
                  { rank: 3, name: 'Pranav Joshi', percentile: 98.75, accuracy: '89%', target: 'PCMB' },
                  { rank: 4, name: `${studentName} (Child)`, percentile: 98.40, accuracy: '88%', target: 'PCMB', active: true },
                  { rank: 5, name: 'Sayali Kulkarni', percentile: 93.10, accuracy: '80%', target: 'PCM' },
                ].map(peer => (
                  <div key={peer.rank} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '6px', backgroundColor: peer.active ? 'var(--primary-light)' : 'transparent', border: peer.active ? '1px solid var(--accent)' : '1px solid transparent', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: peer.rank === 1 ? '#d97706' : peer.rank === 2 ? '#6b7280' : peer.rank === 3 ? '#b45309' : 'var(--text-main)' }}>#{peer.rank}</strong>
                      <span style={{ fontWeight: peer.active ? 700 : 500 }}>{peer.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{peer.target}</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{peer.percentile}%ile</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
