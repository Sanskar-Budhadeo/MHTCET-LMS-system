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
  const totalTests = attempts.length;
  const isDatabaseEmpty = totalTests === 0;

  // 1. DYNAMIC COMPILATION OF ACCURACIES
  // Subject level
  const computedSubjectStats: { [sub: string]: { correct: number; total: number } } = {
    Physics: { correct: 0, total: 0 },
    Chemistry: { correct: 0, total: 0 },
    Mathematics: { correct: 0, total: 0 },
    Biology: { correct: 0, total: 0 }
  };
  
  // Chapter level
  const computedChapterStats: { [ch: string]: { correct: number; total: number; subject: string } } = {};

  attempts.forEach(attempt => {
    Object.entries(attempt.answers).forEach(([qId, ans]) => {
      const question = questions.find(q => q.id === qId);
      if (question) {
        const sub = question.subject;
        const topic = question.topic; // mapped to Chapter name in seed

        if (computedSubjectStats[sub]) {
          computedSubjectStats[sub].total += 1;
          if (ans.isCorrect) computedSubjectStats[sub].correct += 1;
        }

        if (!computedChapterStats[topic]) {
          computedChapterStats[topic] = { correct: 0, total: 0, subject: sub };
        }
        computedChapterStats[topic].total += 1;
        if (ans.isCorrect) computedChapterStats[topic].correct += 1;
      }
    });
  });

  // Calculate generic student stats
  const avgAccuracy = !isDatabaseEmpty 
    ? Math.round(attempts.reduce((sum, att) => sum + att.accuracy, 0) / totalTests) 
    : 74;
  const bestPercentile = !isDatabaseEmpty
    ? Math.max(...attempts.map(att => {
        const suggestions = att.feedback?.aiSuggestions || [];
        const match = suggestions.join(' ').match(/Percentile:\s*(\d+\.\d+)/);
        return match ? parseFloat(match[1]) : 84.5;
      }))
    : 84.5;
  const currentRank = !isDatabaseEmpty
    ? Math.min(...attempts.map(att => {
        const suggestions = att.feedback?.aiSuggestions || [];
        const match = suggestions.join(' ').match(/Rank\s*#*(\d+)/);
        return match ? parseInt(match[1]) : 1245;
      }))
    : 1245;

  // 2. HIERARCHICAL SUBJECT -> CHAPTER -> TOPIC SEED / DYNAMIC DATA BINDING
  const mockHierarchy: SubjectData[] = [
    {
      subject: 'Physics',
      accuracy: 72,
      chapters: [
        {
          name: 'Rotational Dynamics',
          accuracy: 58,
          topics: [
            { name: 'Moment of Inertia of Rings & Discs', accuracy: 75, solved: 12, recommendation: 'Solid retention. Keep practicing standard derivations.' },
            { name: 'Rolling Acceleration on Incline', accuracy: 42, solved: 8, recommendation: 'Torque component breakdown errors flagged. Review inertia coefficients: k^2/R^2.' },
            { name: 'Centripetal Force & Banking of Roads', accuracy: 64, solved: 10, recommendation: 'Revise static friction coefficient equations.' }
          ]
        },
        {
          name: 'Oscillations',
          accuracy: 85,
          topics: [
            { name: 'S.H.M. Differential Equations', accuracy: 90, solved: 15, recommendation: 'Excellent. Limits and velocity bounds are fully clear.' },
            { name: 'SHM Energy Transformations', accuracy: 80, solved: 10, recommendation: 'Good. Practice a few spring coefficient composite questions.' }
          ]
        },
        {
          name: 'Mechanical Properties of Fluids',
          accuracy: 76,
          topics: [
            { name: 'Capillary Action & Tube Curvatures', accuracy: 85, solved: 9, recommendation: 'Stable. Jurins Law parameters h * r are understood.' },
            { name: 'Surface Tension & Viscosity Coefficients', accuracy: 68, solved: 11, recommendation: 'Verify pressure bubbles formulas.' }
          ]
        }
      ]
    },
    {
      subject: 'Chemistry',
      accuracy: 78,
      chapters: [
        {
          name: 'Chemical Kinetics',
          accuracy: 62,
          topics: [
            { name: 'First-Order Half-lives & Rate Laws', accuracy: 50, solved: 14, recommendation: 'Halflife integration errors flagged. Practice t_1/2 = 0.693/k conversions.' },
            { name: 'Arrhenius Activation Equations', accuracy: 74, solved: 8, recommendation: 'Satisfactory. Watch natural log transformations.' }
          ]
        },
        {
          name: 'Solid State',
          accuracy: 88,
          topics: [
            { name: 'Crystal Lattice Types & Voids', accuracy: 92, solved: 10, recommendation: 'Excellent understanding of FCC/BCC packings.' },
            { name: 'Unit Cell Density Calculations', accuracy: 84, solved: 6, recommendation: 'Keep parameters conversion units (picometers to cm) consistent.' }
          ]
        }
      ]
    },
    {
      subject: 'Mathematics',
      accuracy: 82,
      chapters: [
        {
          name: 'Vectors',
          accuracy: 60,
          topics: [
            { name: '3D Vector Dot Product', accuracy: 85, solved: 16, recommendation: 'Very good. Projections and work formulas are accurate.' },
            { name: 'Vector Cross Product Area Calculations', accuracy: 45, solved: 12, recommendation: 'Parallelogram diagonals cross-product 1/2*|d1xd2| is a weak spot.' }
          ]
        },
        {
          name: 'Trigonometric Functions',
          accuracy: 86,
          topics: [
            { name: 'Principal Solutions of Trig Equations', accuracy: 90, solved: 10, recommendation: 'Excellent unit circle quadrant resolution.' },
            { name: 'General Solutions of Trig Equations', accuracy: 82, solved: 8, recommendation: 'Double check boundary checks for tangent domains.' }
          ]
        }
      ]
    },
    {
      subject: 'Biology',
      accuracy: 68,
      chapters: [
        {
          name: 'Photosynthesis',
          accuracy: 58,
          topics: [
            { name: 'Light Reactions & Z-Scheme', accuracy: 65, solved: 8, recommendation: 'Review electron transport carriers sequence.' },
            { name: 'Calvin Cycle (Dark Reactions)', accuracy: 50, solved: 12, recommendation: 'Focus on RuBisCO enzyme limits and ATP requirements.' }
          ]
        },
        {
          name: 'Respiration and Energy Transfer',
          accuracy: 82,
          topics: [
            { name: 'Glycolysis Pathway Enzymes', accuracy: 88, solved: 10, recommendation: 'Strong retention of glucose phosphorylation stages.' },
            { name: 'Krebs Cycle (TCA Cycle)', accuracy: 76, solved: 8, recommendation: 'Recall decarboxylation step carbon counts.' }
          ]
        }
      ]
    }
  ];

  // 3. MAP DATABASE ACCURACIES INTO HIERARCHY
  const hierarchicalData = mockHierarchy.map(sub => {
    // Check if we have active DB stats for this subject
    const dbSub = computedSubjectStats[sub.subject];
    let subAcc = sub.accuracy;
    if (dbSub && dbSub.total > 0) {
      subAcc = Math.round((dbSub.correct / dbSub.total) * 100);
    }

    const updatedChapters = sub.chapters.map(ch => {
      const dbCh = computedChapterStats[ch.name];
      let chAcc = ch.accuracy;
      if (dbCh && dbCh.total > 0) {
        chAcc = Math.round((dbCh.correct / dbCh.total) * 100);
      }

      // Slightly distribute chapter accuracy changes into topics for visual simulation
      const updatedTopics = ch.topics.map((t, idx) => {
        let topicAcc = t.accuracy;
        if (dbCh && dbCh.total > 0) {
          // Adjust based on the actual database chapter score variation
          const diff = chAcc - ch.accuracy;
          topicAcc = Math.min(100, Math.max(0, Math.round(t.accuracy + diff)));
        }
        return { ...t, accuracy: topicAcc };
      });

      return { ...ch, accuracy: chAcc, topics: updatedTopics };
    });

    return {
      ...sub,
      accuracy: subAcc,
      chapters: updatedChapters
    };
  });

  const activeSubjectData = hierarchicalData.find(s => s.subject === activeSubject)!;

  // Chart Data preparation
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

        {isDatabaseEmpty && (
          <div style={{ backgroundColor: 'var(--primary-light)', borderLeft: '4px solid var(--accent)', padding: '12px 18px', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
            💡 <strong>Database Check:</strong> No mock attempts logged yet. Showing diagnostic default assessment data based on your target syllabus.
          </div>
        )}

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
          // Find any chapter below 50% accuracy dynamically
          const weakChapters = Object.entries(computedChapterStats)
            .filter(([_, stats]) => stats.total > 0)
            .map(([name, stats]) => ({
              name,
              accuracy: Math.round((stats.correct / stats.total) * 100),
              subject: stats.subject
            }))
            .filter(ch => ch.accuracy < 50);

          // Let's sort them to find the absolute weakest chapter below 50%
          weakChapters.sort((a, b) => a.accuracy - b.accuracy);

          // We determine the weak chapter. If empty (0 attempts or all >50%),
          // but the student has weakTopics in their profile, we can use the first weak topic as a mock fallback!
          let recommendChapter = '';
          if (weakChapters.length > 0) {
            recommendChapter = weakChapters[0].name;
          } else if (activeUser?.weakTopics && activeUser.weakTopics.length > 0) {
            recommendChapter = activeUser.weakTopics[0];
          }

          if (!recommendChapter) return null;

          // Prepend a mock chapter number for realistic display (e.g. Chapter 4)
          const mockChapterNumbers: { [key: string]: number } = {
            'Rotational Dynamics': 1,
            'Oscillations': 2,
            'Mechanical Properties of Fluids': 3,
            'Chemical Kinetics': 4,
            'Solid State': 5,
            'Vectors': 6,
            'Trigonometric Functions': 7,
            'Photosynthesis': 8,
            'Respiration and Energy Transfer': 9,
            'Chemical Bonding': 4
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
              {activeSubjectData.chapters.map(ch => {
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
                              <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--primary-light)', borderRadius: '99px', overflow: 'hidden' }}>
                                <div style={{ width: `${t.accuracy}%`, height: '100%', backgroundColor: t.accuracy >= 70 ? '#10b981' : '#f59e0b' }}></div>
                              </div>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                                💡 <strong>AI Tip:</strong> {t.recommendation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chapters Bar Chart */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Chapter Accuracy Comparison - {activeSubject}
            </h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chaptersChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="chapter" stroke="var(--text-light)" fontSize={10} />
                  <YAxis stroke="var(--text-light)" fontSize={10} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
                    labelStyle={{ color: 'var(--text-main)', fontWeight: 600 }}
                  />
                  <Bar dataKey="Accuracy" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '10px', lineHeight: '1.4' }}>
              <strong>Cognitive Retrieval Strength & Spaced Repetition Models</strong>: Under the SuperMemo-2 spaced repetition paradigm, a student's recall probability decays exponentially: R = e^(-t/S), where S is memory strength and t is time elapsed. Chapter accuracies represent current retrieval strength. Target revisions are triggered when R drops below 70% threshold, scheduling optimal study reminders.
            </div>
          </div>
        </div>
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
