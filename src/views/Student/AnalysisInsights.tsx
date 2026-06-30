import React, { useState } from 'react';
import { useLms } from '../../context/LmsContext';
import { 
  TrendingUp, 
  Award, 
  Clock, 
  Sparkles, 
  UserCheck, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  Lock, 
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from 'recharts';

interface TopicData {
  name: string;
  accuracy: number;
  solved: number;
  recommendation: string;
}

interface ChapterData {
  name: string;
  accuracy: number;
  topics: TopicData[];
}

interface SubjectData {
  subject: 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology';
  accuracy: number;
  chapters: ChapterData[];
}

export const AnalysisInsights: React.FC = () => {
  const { activeUser, attempts, questions, upgradeUserPlan } = useLms();
  
  // Upgrade states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [targetCourse, setTargetCourse] = useState<'PCB' | 'PCM' | 'PCMB'>((activeUser?.targetCourse as any) || 'PCM');
  const [targetExam, setTargetExam] = useState<'JEE' | 'NEET' | 'MHT-CET'>((activeUser?.targetExam as any) || 'MHT-CET');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/29');
  const [cvv, setCvv] = useState('123');
  const [upiId, setUpiId] = useState('student@okaxis');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const [activeSubject, setActiveSubject] = useState<'Physics' | 'Chemistry' | 'Mathematics' | 'Biology'>('Physics');
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  const handleSimulatedUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentProcessing(true);
    setTimeout(async () => {
      try {
        await upgradeUserPlan('Pro', targetCourse, targetExam);
        setShowUpgradeModal(false);
      } catch (err) {
        console.error(err);
      } finally {
        setPaymentProcessing(false);
      }
    }, 1500);
  };

  const isFree = activeUser?.plan === 'Free' || activeUser?.subscriptionTier === 'Free';

  // Filter out dummy seeded attempts to get rid of all dummy data
  const realAttempts = attempts.filter(att => 
    att.id !== 'past_attempt_1' && 
    att.id !== 'past_attempt_2' && 
    att.testName !== 'MHT-CET Rotational Dynamics Practice Quiz'
  );
  
  const totalTests = realAttempts.length;
  const isDatabaseEmpty = totalTests === 0;

  // 1. DYNAMIC COMPILATION OF ACCURACIES
  // Subject level stats
  const computedSubjectStats: { [sub: string]: { correct: number; total: number } } = {
    Physics: { correct: 0, total: 0 },
    Chemistry: { correct: 0, total: 0 },
    Mathematics: { correct: 0, total: 0 },
    Biology: { correct: 0, total: 0 }
  };
  
  // Chapter level stats
  const computedChapterStats: { 
    [ch: string]: { 
      correct: number; 
      total: number; 
      subject: string; 
      topics: { [top: string]: { correct: number; total: number } } 
    } 
  } = {};

  realAttempts.forEach(attempt => {
    if (attempt.answers) {
      Object.entries(attempt.answers).forEach(([qId, ans]) => {
        const question = questions.find(q => q.id === qId);
        if (question) {
          const sub = question.subject;
          const ch = question.topic || 'General';
          const top = question.topic || ch;

          if (computedSubjectStats[sub]) {
            computedSubjectStats[sub].total += 1;
            if (ans.isCorrect) computedSubjectStats[sub].correct += 1;
          }

          if (!computedChapterStats[ch]) {
            computedChapterStats[ch] = { correct: 0, total: 0, subject: sub, topics: {} };
          }
          computedChapterStats[ch].total += 1;
          if (ans.isCorrect) computedChapterStats[ch].correct += 1;

          if (!computedChapterStats[ch].topics[top]) {
            computedChapterStats[ch].topics[top] = { correct: 0, total: 0 };
          }
          computedChapterStats[ch].topics[top].total += 1;
          if (ans.isCorrect) computedChapterStats[ch].topics[top].correct += 1;
        }
      });
    }
  });

  // Calculate generic student stats
  const avgAccuracy = !isDatabaseEmpty 
    ? Math.round(realAttempts.reduce((sum, att) => sum + att.accuracy, 0) / totalTests) 
    : 0;
  const bestPercentile = !isDatabaseEmpty
    ? Math.max(...realAttempts.map(att => att.percentile || 84.5))
    : 0;
  const currentRank = !isDatabaseEmpty
    ? Math.min(...realAttempts.map(att => att.nationalRank || 1245))
    : 0;

  // 2. HIERARCHICAL SUBJECT -> CHAPTER -> TOPIC BINDING
  const hierarchicalData: SubjectData[] = [];
  const subjectsList: ('Physics' | 'Chemistry' | 'Mathematics' | 'Biology')[] = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];

  subjectsList.forEach(subName => {
    const dbSub = computedSubjectStats[subName];
    const subAcc = dbSub && dbSub.total > 0 ? Math.round((dbSub.correct / dbSub.total) * 100) : 0;
    
    const subChapters: ChapterData[] = [];
    Object.entries(computedChapterStats).forEach(([chName, chData]) => {
      if (chData.subject === subName) {
        const chAcc = chData.total > 0 ? Math.round((chData.correct / chData.total) * 100) : 0;
        
        const chTopics: TopicData[] = [];
        Object.entries(chData.topics).forEach(([topName, topData]) => {
          const topAcc = topData.total > 0 ? Math.round((topData.correct / topData.total) * 100) : 0;
          chTopics.push({
            name: topName,
            accuracy: topAcc,
            solved: topData.total,
            recommendation: topAcc >= 75 
              ? 'Excellent retention. Keep practicing standard derivations.'
              : topAcc >= 50
                ? 'Satisfactory. Practice composite questions to master speed.'
                : 'Concept weaknesses flagged. Review core principles and equations.'
          });
        });

        subChapters.push({
          name: chName,
          accuracy: chAcc,
          topics: chTopics
        });
      }
    });

    hierarchicalData.push({
      subject: subName,
      accuracy: subAcc,
      chapters: subChapters
    });
  });

  const activeSubjectData = hierarchicalData.find(s => s.subject === activeSubject) || { subject: activeSubject, accuracy: 0, chapters: [] };

  const subjectsChartData = hierarchicalData.map(s => ({
    subject: s.subject,
    Accuracy: s.accuracy
  }));

  const chaptersChartData = activeSubjectData.chapters.map(c => ({
    chapter: c.name.length > 15 ? c.name.substring(0, 15) + '..' : c.name,
    Accuracy: c.accuracy
  }));

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '80vh' }}>
      
      {/* Premium Locking Overlay */}
      {isFree && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40,
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            className="card" 
            style={{ 
              maxWidth: '460px', 
              textAlign: 'center', 
              padding: '40px 30px', 
              border: '2px solid var(--accent)', 
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              backgroundColor: 'var(--bg-card)'
            }}
          >
            <div style={{ display: 'inline-flex', padding: '16px', backgroundColor: 'var(--primary-light)', borderRadius: '50%', color: 'var(--accent)', marginBottom: '20px' }}>
              <Lock size={36} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
              Unlock AI Insights & Analytics
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.6' }}>
              Get detailed chapter-wise accuracy breakdowns, direct feedback from Gemini diagnostics, manual institute teacher guidelines, and custom study plans recommendation based on weak concepts.
            </p>
            <button 
              onClick={() => setShowUpgradeModal(true)} 
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', height: '44px', fontWeight: 700 }}
            >
              <Zap size={16} /> Upgrade to Pro (₹1,499)
            </button>
          </div>
        </div>
      )}

      {/* Main Content (Blurred if Free) */}
      <div style={{ opacity: isFree ? 0.3 : 1, pointerEvents: isFree ? 'none' : 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
            Analysis & AI Performance Insights
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Hierarchical diagnostic evaluation breaking down conceptual accuracy by Subject, Chapter, and Topic.
          </p>
        </div>

        {isDatabaseEmpty ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', textAlign: 'center', border: '1px dashed var(--border)', gap: '16px' }}>
            <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--accent)', padding: '16px', borderRadius: '50%' }}>
              <AlertTriangle size={32} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>No Performance Logs Found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '460px', lineHeight: '1.6', margin: 0 }}>
              AI diagnostics, weakness tracking, and concept-wise accuracy breakdowns will compile dynamically once you complete and submit an exam from the Test Arena.
            </p>
          </div>
        ) : (
          <>
            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--accent)', padding: '12px', borderRadius: '10px' }}>
                  <TrendingUp size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{avgAccuracy}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Accuracy</div>
                </div>
              </div>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ backgroundColor: '#fffbeb', color: '#f59e0b', padding: '12px', borderRadius: '10px' }}>
                  <Award size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{bestPercentile}%ile</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Peak Percentile</div>
                </div>
              </div>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ backgroundColor: '#ecfdf5', color: '#10b981', padding: '12px', borderRadius: '10px' }}>
                  <CheckCircle size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>#{currentRank}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Rank</div>
                </div>
              </div>
            </div>

            {/* Actionable Next Step Card */}
            {(() => {
              const weakChapters = Object.entries(computedChapterStats)
                .filter(([_, stats]) => stats.total > 0)
                .map(([name, stats]) => ({
                  name,
                  accuracy: Math.round((stats.correct / stats.total) * 100),
                  subject: stats.subject
                }))
                .filter(ch => ch.accuracy < 50);

              weakChapters.sort((a, b) => a.accuracy - b.accuracy);

              let recommendChapter = '';
              if (weakChapters.length > 0) {
                recommendChapter = weakChapters[0].name;
              } else if (activeUser?.weakTopics && activeUser.weakTopics.length > 0) {
                recommendChapter = activeUser.weakTopics[0];
              }

              if (!recommendChapter) return null;

              const mockChapterNumbers: { [key: string]: number } = {
                'Rotational Dynamics': 1,
                'Oscillations': 2,
                'Mechanical Properties of Fluids': 3,
                'Chemical Kinetics': 4,
                'Solid State': 5,
                'Vectors': 6,
                'Trigonometric Functions': 7,
                'Photosynthesis': 8,
                'Respiration and Energy Transfer': 9
              };
              const chapterNum = mockChapterNumbers[recommendChapter] || 1;

              return (
                <div 
                  className="card"
                  style={{
                    borderLeft: '5px solid var(--danger)',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '20px',
                    padding: '24px',
                    boxShadow: '0 8px 30px rgba(239, 68, 68, 0.12)',
                    borderTop: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRight: '1px solid rgba(239, 68, 68, 0.2)',
                    borderBottom: '1px solid rgba(239, 68, 68, 0.2)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '280px' }}>
                    <div style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Actionable Next Step Recommendation
                      </span>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0 6px', color: 'var(--text-main)' }}>
                        Review Recommended: Chapter {chapterNum} - {recommendChapter}
                      </h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>
                        Your recorded accuracy for this segment is currently below the 50% threshold. Watch this targeted diagnostic review lesson to strengthen your concept mastery.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => alert(`Launching targeted video concept guide for Chapter ${chapterNum}: ${recommendChapter} (Duration: 8 minutes)...`)} 
                    className="btn btn-danger"
                    style={{ 
                      fontWeight: 700, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      borderRadius: '9999px',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                      padding: '12px 24px'
                    }}
                  >
                    Watch Video (8m)
                  </button>
                </div>
              );
            })()}

            {/* Teacher Evaluation Feedback Log */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <UserCheck size={18} style={{ color: 'var(--accent)' }} /> Teacher Evaluation & Feedback Logs
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Direct guidelines and manual reviews submitted by institute faculty advisors evaluating your mock attempts.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
                {(() => {
                  const reviewedAttempts = realAttempts.filter(att => 
                    att.feedback && 
                    att.feedback.text && 
                    att.feedback.instructorName && 
                    att.feedback.instructorName !== 'AI Engine' && 
                    att.feedback.instructorName !== 'AI Diagnostic Engine'
                  );

                  if (reviewedAttempts.length === 0) {
                    return (
                      <div style={{ padding: '24px', backgroundColor: 'var(--primary-light)', border: '1px dashed var(--border)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        📢 No manual faculty evaluations logged yet. Once your teacher reviews your mock submissions from the Teacher Portal, their specialized feedback and target guidance notes will appear here.
                      </div>
                    );
                  }

                  return reviewedAttempts.map(att => (
                    <div 
                      key={att.id} 
                      style={{ 
                        padding: '18px', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border)', 
                        backgroundColor: 'var(--bg-card)', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '12px' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>{att.testName}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Reviewed by {att.feedback?.instructorName} on {att.feedback?.date}</span>
                        </div>
                        <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                          Accuracy: {att.accuracy}% | Score: {att.score}/{att.maxScore}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.5', padding: '10px 14px', backgroundColor: 'var(--primary-light)', borderRadius: '6px', borderLeft: '3px solid var(--accent)' }}>
                        "{att.feedback?.text}"
                      </div>

                      {att.feedback?.aiSuggestions && att.feedback.aiSuggestions.length > 0 && (
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Target Improvement Steps:</span>
                          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {att.feedback.aiSuggestions.map((sug, sIdx) => (
                              <li key={sIdx}>{sug}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Subject Navigation Tabs & Radar Chart */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <BookOpen size={18} style={{ color: 'var(--accent)' }} /> 1. Subject Level Breakdown
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                  {hierarchicalData.map(s => (
                    <button
                      key={s.subject}
                      onClick={() => {
                        setActiveSubject(s.subject);
                        setExpandedChapter(null);
                      }}
                      style={{
                        padding: '16px',
                        borderRadius: '8px',
                        border: activeSubject === s.subject ? '2px solid var(--accent)' : '1px solid var(--border)',
                        backgroundColor: activeSubject === s.subject ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-card)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>SUBJECT</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{s.subject}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--primary-light)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ width: `${s.accuracy}%`, height: '100%', backgroundColor: 'var(--accent)' }}></div>
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>{s.accuracy}%</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-muted)', alignSelf: 'flex-start', margin: '0 0 10px 0' }}>
                  Platform Syllabus Strengths Radar
                </h3>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={subjectsChartData}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-light)', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--text-light)', fontSize: 9 }} />
                      <Radar name="Syllabus Accuracy" dataKey="Accuracy" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '10px', lineHeight: '1.4', width: '100%' }}>
                  <strong>Binomial Confidence Probability & MHT-CET Scores</strong>: Confidence scores represent the probability parameter p of a binomial distribution B(n, p) modeling student response correctness. Integrating self-reported confidence indices with mock accuracies generates a higher-fidelity prediction of actual statewide MHT-CET percentile outcomes by isolating guess factors.
                </div>
              </div>
            </div>

            {/* Chapter Breakdown & Topic Drilldown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              
              {/* Chapter cards list */}
              <div className="card">
                <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Sparkles size={18} style={{ color: 'var(--accent)' }} /> 2. Chapter Diagnostics: {activeSubject}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeSubjectData.chapters.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '10px' }}>No chapters logged for this subject yet.</p>
                  ) : (
                    activeSubjectData.chapters.map(ch => {
                      const isExpanded = expandedChapter === ch.name;
                      return (
                        <div 
                          key={ch.name}
                          style={{
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: isExpanded ? 'rgba(37, 99, 235, 0.02)' : 'var(--bg-card)'
                          }}
                        >
                          <button
                            onClick={() => setExpandedChapter(isExpanded ? null : ch.name)}
                            style={{
                              width: '100%',
                              padding: '16px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: 'none',
                              border: 'none',
                              textAlign: 'left',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-main)' }}>
                                {ch.name}
                              </h4>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '120px', height: '6px', backgroundColor: 'var(--primary-light)', borderRadius: '99px', overflow: 'hidden' }}>
                                  <div style={{ width: `${ch.accuracy}%`, height: '100%', backgroundColor: ch.accuracy >= 70 ? '#10b981' : '#f59e0b' }}></div>
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: ch.accuracy >= 70 ? '#10b981' : '#f59e0b' }}>
                                  {ch.accuracy}% Accuracy
                                </span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span 
                                className={`badge badge-${ch.accuracy >= 70 ? 'success' : ch.accuracy >= 60 ? 'warning' : 'danger'}`}
                                style={{ fontSize: '0.65rem' }}
                              >
                                {ch.accuracy >= 70 ? 'Mastered' : ch.accuracy >= 60 ? 'Review Needed' : 'Critical Focus'}
                              </span>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </button>

                          {/* Expandable Topic Level Breakdown */}
                          {isExpanded && (
                            <div style={{ padding: '16px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--primary-light)' }}>
                              <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-light)', margin: '0 0 10px 0', letterSpacing: '0.05em' }}>
                                3. Topic Level Breakdown (Drilldown)
                              </h5>
                              
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {ch.topics.map(t => (
                                  <div 
                                    key={t.name}
                                    style={{
                                      padding: '12px',
                                      borderRadius: '6px',
                                      backgroundColor: 'var(--bg-card)',
                                      border: '1px solid var(--border)',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '6px'
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{t.name}</span>
                                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: t.accuracy >= 70 ? '#10b981' : '#f59e0b' }}>{t.accuracy}%</span>
                                    </div>
                                    <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--primary-light)', borderRadius: '99px', overflow: 'hidden' }}>
                                      <div style={{ width: `${t.accuracy}%`, height: '100%', backgroundColor: t.accuracy >= 70 ? '#10b981' : '#f59e0b' }}></div>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                      Solved: <strong>{t.solved}</strong> questions
                                    </span>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '4px 0 0 0', fontStyle: 'italic', lineHeight: '1.3' }}>
                                      💡 Recommendation: {t.recommendation}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Dynamic Chapter Accuracy Comparison Bar Chart */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-muted)', margin: 0 }}>
                  Chapter Accuracy Index
                </h3>
                
                {activeSubjectData.chapters.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '10px' }}>No chapters loaded to map chart.</p>
                ) : (
                  <div style={{ width: '100%', height: 320, marginTop: '8px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chaptersChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="chapter" tick={{ fill: 'var(--text-light)', fontSize: 10 }} stroke="var(--border)" />
                        <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-light)', fontSize: 10 }} stroke="var(--border)" />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text-main)' }} />
                        <Bar dataKey="Accuracy" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Checkout Simulator Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <Zap size={32} style={{ color: 'var(--accent)', margin: '0 auto 8px' }} className="pulse" />
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Upgrade Subscription</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                Simulating upgrade transaction for Pro Series access
              </p>
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
                    <span>Pay ₹1,499</span>
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
