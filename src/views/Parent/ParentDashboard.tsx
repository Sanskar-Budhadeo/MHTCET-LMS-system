import React from 'react';
import { useLms } from '../../context/LmsContext';
import { TrendingUp, Calendar, MessageSquare, Sparkles } from 'lucide-react';

export const ParentDashboard: React.FC = () => {
  const { attempts, questions } = useLms();
  
  // Hardcode student link context based on mock student profile
  const studentName = 'Rahul Sharma';
  const studentStreak = 12;

  // 1. Performance scores array for rendering trends
  const scoreTrends = attempts.slice().reverse(); // chronological order

  // 2. Consistency Grid (last 30 days)
  // Generate array of last 30 dates in format YYYY-MM-DD
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

  // Mock active login dates for student (matches user profile seed)
  const mockStudentActiveDates = [
    '2026-06-18', '2026-06-17', '2026-06-16', '2026-06-15', '2026-06-14',
    '2026-06-13', '2026-06-12', '2026-06-11', '2026-06-10', '2026-06-09',
    '2026-06-08', '2026-06-07', '2026-06-05', '2026-06-04', '2026-06-03',
    '2026-06-01', '2026-05-30', '2026-05-29', '2026-05-28'
  ];

  // We can merge attempts dates and login dates
  const studentAttemptDates = attempts.map(a => a.date);
  const activeDatesSet = new Set([...mockStudentActiveDates, ...studentAttemptDates]);

  // Determine contribution level
  const getContributionLvlClass = (dateStr: string) => {
    const hasActive = activeDatesSet.has(dateStr);
    const hasTest = studentAttemptDates.includes(dateStr);
    
    if (hasTest) return 'lvl-4'; // Completed test (dark green)
    if (hasActive) return 'lvl-2'; // Logged in (light green)
    return 'lvl-0'; // Inactive
  };

  // 3. Quantitative AI Diagnostics
  // Group error patterns from attempts
  const errorStats: { [topic: string]: { wrongCount: number; totalCount: number; sumTime: number } } = {};
  attempts.forEach(att => {
    Object.entries(att.answers).forEach(([qId, ans]) => {
      const q = questions.find(item => item.id === qId);
      if (q) {
        if (!errorStats[q.topic]) {
          errorStats[q.topic] = { wrongCount: 0, totalCount: 0, sumTime: 0 };
        }
        errorStats[q.topic].totalCount += 1;
        errorStats[q.topic].sumTime += ans.timeTaken;
        if (!ans.isCorrect) {
          errorStats[q.topic].wrongCount += 1;
        }
      }
    });
  });

  const diagnostics = Object.entries(errorStats)
    .map(([topic, stats]) => {
      const errPercentage = Math.round((stats.wrongCount / stats.totalCount) * 100);
      const avgTime = Math.round(stats.sumTime / stats.totalCount);
      return { topic, errPercentage, avgTime };
    })
    .sort((a, b) => b.errPercentage - a.errPercentage); // highest error percentage first

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
          Parent Observation Insights
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Review score metrics, consistency streaks, and qualitative evaluations for student: <strong>{studentName}</strong>.
        </p>
      </div>

      {/* Overview charts and Heatmap grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        {/* Performance Score Trend */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <TrendingUp size={18} style={{ color: 'var(--accent)' }} /> Mock Test Score Progressions
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {scoreTrends.map((trend, idx) => {
              const scorePct = Math.round((trend.score / trend.maxScore) * 100);
              return (
                <div key={trend.id} style={{ borderBottom: idx === scoreTrends.length - 1 ? 'none' : '1px solid var(--border)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{trend.testName}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Score: <strong>{trend.score}/{trend.maxScore}</strong> ({scorePct}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--primary-light)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${scorePct}%`, 
                        height: '100%', 
                        backgroundColor: scorePct >= 80 ? 'var(--success)' : scorePct >= 60 ? 'var(--warning)' : 'var(--danger)',
                        borderRadius: '99px' 
                      }} 
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '4px' }}>
                    <span>Date: {trend.date}</span>
                    <span>Accuracy: {trend.accuracy}%</span>
                  </div>
                </div>
              );
            })}

            {scoreTrends.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No mock exam logs recorded.</p>
            )}
          </div>
        </div>

        {/* Consistency 30 Days tracker */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'between' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Calendar size={18} style={{ color: 'var(--success)' }} /> Student Consistency Map
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Daily logs and active exam drill streak tracking for the last 30 days.
            </p>

            <div className="heatmap-grid" style={{ marginBottom: '24px' }}>
              {last30Days.map(dateStr => (
                <div 
                  key={dateStr}
                  className={`heatmap-day ${getContributionLvlClass(dateStr)}`}
                  title={`Date: ${dateStr}`}
                />
              ))}
            </div>

            {/* Heatmap Legend */}
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div className="heatmap-day lvl-0" style={{ width: '10px', height: '10px' }}></div>
                <span>No Session</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div className="heatmap-day lvl-2" style={{ width: '10px', height: '10px' }}></div>
                <span>Active Study</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div className="heatmap-day lvl-4" style={{ width: '10px', height: '10px' }}></div>
                <span>Exam Drill</span>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--primary-light)', padding: '16px', borderRadius: '8px', marginTop: 'auto' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily Active Streaks:</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {studentStreak} Consecutive Days Active
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Feedback Stream */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        {/* Quantitative AI Diagnostics */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles size={18} style={{ color: 'var(--info)' }} /> AI Diagnostic Error Metrics
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Calculated diagnostic patterns pointing out chapter speed indices and incorrect answer ratios.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {diagnostics.slice(0, 4).map(diag => (
              <div 
                key={diag.topic} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '10px 14px',
                  backgroundColor: 'var(--primary-light)',
                  borderRadius: '6px'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>{diag.topic}</h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                    Response Delay: avg <strong>{diag.avgTime}s</strong> per question
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge badge-${diag.errPercentage >= 50 ? 'danger' : 'warning'}`} style={{ fontSize: '0.65rem' }}>
                    {diag.errPercentage}% Errors
                  </span>
                </div>
              </div>
            ))}

            {diagnostics.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Awaiting more student answers to calculate errors.</p>
            )}
          </div>
        </div>

        {/* Qualitative Human Feedback Stream */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <MessageSquare size={18} style={{ color: 'var(--accent)' }} /> Qualitative Instructor Comments
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Direct syllabus guidance and revision comments posted by Prof. Sharma.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '380px', overflowY: 'auto' }}>
            {attempts
              .filter(a => a.feedback && a.feedback.instructorName !== 'AI Engine')
              .map(att => (
                <div 
                  key={att.id}
                  style={{
                    border: '1px solid var(--border)',
                    padding: '14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-card)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>
                      {att.feedback?.instructorName}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                      Published: {att.feedback?.date}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.5', fontStyle: 'italic' }}>
                    "{att.feedback?.text}"
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', borderTop: '1px solid var(--border)', paddingTop: '6px', marginTop: '8px' }}>
                    Refers to: <strong>{att.testName}</strong>
                  </div>
                </div>
              ))}

            {attempts.filter(a => a.feedback && a.feedback.instructorName !== 'AI Engine').length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0' }}>
                No qualitative reviews published by human instructors yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
