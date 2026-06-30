import React, { useState, useEffect } from 'react';
import { Clock, Trophy, TrendingUp, Sparkles, CheckCircle, AlertTriangle, MessageSquare, ChevronRight, Zap, Target, X, BarChart2 } from 'lucide-react';
import { useLms } from '../../context/LmsContext';

interface Topic {
  name: string;
  percentage: number;
}

interface Chapter {
  name: string;
  percentage: number;
  topics: Topic[];
}

interface SubjectData {
  name: string;
  percentage: number;
  color: string;
  textColor: string;
  chapters: Chapter[];
  strongAreas: string[];
  weakAreas: string[];
  mistakePatterns: { pattern: string; desc: string; frequency: string }[];
  conceptGaps: { gap: string; desc: string; severity: string }[];
  facultyNote: string;
  facultyTeacher: string;
}

export const StudentAnalysis: React.FC = () => {
  // Load Tailwind CDN dynamically to parse utility classes if not already globally configured
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  // State for Modal detailed drill-down
  const [selectedSubject, setSelectedSubject] = useState<SubjectData | null>(null);

  const { activeUser, attempts, questions } = useLms();

  const realAttempts = (attempts || []).filter(att => 
    att &&
    att.id !== 'past_attempt_1' && 
    att.id !== 'past_attempt_2' && 
    att.testName !== 'MHT-CET Rotational Dynamics Practice Quiz'
  );

  const totalAttemptsCount = realAttempts.length;
  const isDatabaseEmpty = totalAttemptsCount === 0;

  // Compile dynamic stats
  const avgAccuracy = !isDatabaseEmpty 
    ? Math.round(realAttempts.reduce((sum, att) => {
        const acc = att.accuracy !== undefined ? att.accuracy : (att.max_score > 0 ? Math.round((att.score / att.max_score) * 100) : 0);
        return sum + acc;
      }, 0) / totalAttemptsCount) 
    : 0;

  const bestPercentile = !isDatabaseEmpty
    ? Math.max(...realAttempts.map(att => att.percentile || 0))
    : 0;

  const currentRank = !isDatabaseEmpty
    ? Math.min(...realAttempts.map(att => att.nationalRank || 9999))
    : 9999;

  // Compute average speed index
  let totalTimeSpent = 0;
  let totalQuestionsCount = 0;
  realAttempts.forEach(att => {
    totalTimeSpent += att.timeSpent || 0;
    if (att.answers) {
      totalQuestionsCount += Object.keys(att.answers).length;
    }
  });
  const avgSpeedIndexSeconds = totalQuestionsCount > 0 ? Math.round(totalTimeSpent / totalQuestionsCount) : 0;
  const avgSpeedString = avgSpeedIndexSeconds > 0 
    ? `${Math.floor(avgSpeedIndexSeconds / 60)}m ${avgSpeedIndexSeconds % 60}s`
    : '0s';

  // Dynamic Syllabus Hierarchy Compilation
  const computedSubjectStats: { [sub: string]: { correct: number; total: number } } = {
    Physics: { correct: 0, total: 0 },
    Chemistry: { correct: 0, total: 0 },
    Mathematics: { correct: 0, total: 0 },
    Biology: { correct: 0, total: 0 }
  };

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

  // Construct subjectsData
  const subjectsData: SubjectData[] = [];
  const subjectsConfig = [
    { name: 'Physics', color: 'bg-sky-500', textColor: 'text-sky-400' },
    { name: 'Chemistry', color: 'bg-amber-500', textColor: 'text-amber-400' },
    { name: 'Mathematics', color: 'bg-fuchsia-500', textColor: 'text-fuchsia-400' },
    { name: 'Biology', color: 'bg-emerald-500', textColor: 'text-emerald-400' }
  ];

  subjectsConfig.forEach(conf => {
    const stats = computedSubjectStats[conf.name];
    const percentage = stats && stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

    const chaptersList: Chapter[] = [];
    const strongAreas: string[] = [];
    const weakAreas: string[] = [];
    const conceptGaps: { gap: string; desc: string; severity: string }[] = [];
    const mistakePatterns: { pattern: string; desc: string; frequency: string }[] = [];

    let facultyNote = `AI Advisor: Concept mastery is at ${percentage}%. Focus on regular spaced-repetition drills to patch weak points.`;
    let facultyTeacher = 'AI Performance Diagnostics Engine';

    const reviewedAttempt = realAttempts.find(att => 
      att.subject === conf.name && 
      att.feedback && 
      att.feedback.text && 
      att.feedback.instructorName && 
      att.feedback.instructorName !== 'AI Engine'
    );
    if (reviewedAttempt) {
      facultyNote = reviewedAttempt.feedback!.text;
      facultyTeacher = `${reviewedAttempt.feedback!.instructorName} (${conf.name} Dept)`;
    }

    Object.entries(computedChapterStats).forEach(([chName, chData]) => {
      if (chData.subject === conf.name) {
        const chPercentage = chData.total > 0 ? Math.round((chData.correct / chData.total) * 100) : 0;
        
        const topicsList: Topic[] = [];
        Object.entries(chData.topics).forEach(([topName, topData]) => {
          const topPercentage = topData.total > 0 ? Math.round((topData.correct / topData.total) * 100) : 0;
          topicsList.push({ name: topName, percentage: topPercentage });

          if (topPercentage >= 75) {
            strongAreas.push(topName);
          } else if (topPercentage < 50) {
            weakAreas.push(topName);
            conceptGaps.push({
              gap: topName,
              desc: `Conceptual retrieval accuracy for ${topName} dropped below threshold (currently at ${topPercentage}%).`,
              severity: topPercentage < 35 ? 'Critical' : 'Moderate'
            });
          }
        });

        chaptersList.push({
          name: chName,
          percentage: chPercentage,
          topics: topicsList
        });
      }
    });

    if (avgSpeedIndexSeconds > 120) {
      mistakePatterns.push({
        pattern: 'Poor Time Management',
        desc: `Average response rate is ${avgSpeedString} per question. Speed threshold for optimal scores is 1m 30s.`,
        frequency: 'High'
      });
    }
    if (percentage > 0 && percentage < 70) {
      mistakePatterns.push({
        pattern: 'Formula Calculation Slip',
        desc: 'Frequent points lost on composite steps or negative sign conventions in test answers.',
        frequency: 'Medium'
      });
    }

    if (mistakePatterns.length === 0) {
      mistakePatterns.push({
        pattern: 'Consistent Execution',
        desc: 'Maintained strong speed indicators and formula accuracy across mock trials.',
        frequency: 'Low'
      });
    }

    subjectsData.push({
      name: conf.name,
      percentage,
      color: conf.color,
      textColor: conf.textColor,
      chapters: chaptersList,
      strongAreas: strongAreas.length > 0 ? strongAreas : ['None tracked yet'],
      weakAreas: weakAreas.length > 0 ? weakAreas : ['None tracked yet'],
      conceptGaps: conceptGaps.length > 0 ? conceptGaps : [{ gap: 'None', desc: 'No concept gaps detected so far.', severity: 'Low' }],
      mistakePatterns,
      facultyNote,
      facultyTeacher
    });
  });

  return (
    <div className="w-full min-h-screen text-slate-100 flex flex-col gap-8 p-4 md:p-8 bg-[#09090b] font-sans relative">
      
      {/* Detailed Analysis Modal / slideover */}
      {selectedSubject && (
        <div className="fixed inset-0 bg-[#09090b] z-[9999] flex flex-col overflow-hidden select-text animate-fade-in">
          <div className="w-full h-full max-w-7xl mx-auto p-6 md:p-10 flex flex-col justify-between overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-zinc-800 pb-5 mb-5 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-zinc-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={selectedSubject.textColor}
                      strokeWidth="3.5"
                      strokeDasharray={`${selectedSubject.percentage}, 100`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-[11px] font-black text-white">{selectedSubject.percentage}%</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Granular Subject Diagnostic</span>
                  <h3 className="text-2xl font-black text-white flex items-center gap-2">
                    {selectedSubject.name} Syllabus Evaluation
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSubject(null)}
                className="bg-zinc-900 hover:bg-zinc-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-zinc-800"
              >
                <X className="w-4 h-4" /> Close Details
              </button>
            </div>

            {/* Split Grid Content */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden min-h-0">
              
              {/* Left Column - Diagnostic Summary */}
              <div className="lg:col-span-5 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                
                {/* Overall Stats Quick Card */}
                <div className="bg-[#121214] border border-zinc-900 rounded-2xl p-5 flex flex-col gap-3 shadow-md">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">AI Subject Performance Rating</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-black ${selectedSubject.textColor}`}>{selectedSubject.percentage}%</span>
                    <div className="flex-1 h-3 bg-[#09090b] border border-zinc-900 rounded-full overflow-hidden">
                      <div className={`${selectedSubject.color} h-full rounded-full transition-all`} style={{ width: `${selectedSubject.percentage}%` }} />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    Syllabus mastery is calculated based on accuracy, correct/incorrect ratio, and chapter weightages.
                  </p>
                </div>

                {/* Strong & Weak Areas Card */}
                <div className="bg-[#121214] border border-zinc-900 rounded-2xl p-5 flex flex-col gap-4 shadow-md">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2 border-b border-zinc-900/60 pb-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" /> Strongest Concept Mastery
                    </span>
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {selectedSubject.strongAreas.map((area, idx) => (
                        <span key={idx} className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-full px-3 py-1 text-[9px] font-bold shadow-sm">
                          🎯 {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2">
                    <span className="text-[10px] font-black uppercase text-red-400 tracking-wider flex items-center gap-2 border-b border-zinc-900/60 pb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" /> Areas of Improvement
                    </span>
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {selectedSubject.weakAreas.map((area, idx) => (
                        <span key={idx} className="bg-red-950/40 border border-red-500/20 text-red-400 rounded-full px-3 py-1 text-[9px] font-bold shadow-sm">
                          ⚠️ {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recurring Mistake Patterns Card */}
                <div className="bg-[#121214] border border-zinc-900 rounded-2xl p-5 flex flex-col gap-4 shadow-md">
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider border-b border-zinc-900 pb-2 flex items-center gap-1.5">
                    ⚙️ Recurring Mistake Patterns
                  </span>
                  <div className="space-y-3">
                    {selectedSubject.mistakePatterns.map((pat, idx) => (
                      <div key={idx} className="border-b border-zinc-900/50 pb-3 last:border-0 last:pb-0 flex flex-col gap-1">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                          <span>{pat.pattern}</span>
                          <span className="text-[8px] font-black text-amber-400 uppercase bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded">
                            {pat.frequency}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">{pat.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conceptual Gaps Card */}
                <div className="bg-[#121214] border border-zinc-900 rounded-2xl p-5 flex flex-col gap-4 shadow-md">
                  <span className="text-[10px] font-black uppercase text-red-400 tracking-wider border-b border-zinc-900 pb-2 flex items-center gap-1.5">
                    📖 Core Conceptual Gaps
                  </span>
                  <div className="space-y-3">
                    {selectedSubject.conceptGaps.map((gap, idx) => (
                      <div key={idx} className="border-b border-zinc-900/50 pb-3 last:border-0 last:pb-0 flex flex-col gap-1">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                          <span>{gap.gap}</span>
                          <span className="text-[8px] font-black text-red-400 uppercase bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded">
                            {gap.severity}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">{gap.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Faculty Feedback Note */}
                <div className="border-l-4 border-[#e2fc5c] bg-[#121214]/60 p-5 rounded-r-2xl border-y border-r border-zinc-900 shadow-md">
                  <span className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    ✍️ Faculty Evaluator Assessment & Action Guidelines
                  </span>
                  <p className="text-[11px] text-slate-100 leading-relaxed font-semibold italic">
                    "{selectedSubject.facultyNote}"
                  </p>
                  <span className="block text-[9px] text-right font-black text-sky-400 mt-3">
                    - {selectedSubject.facultyTeacher}
                  </span>
                </div>

              </div>

              {/* Right Column - Chapter & Topic Mastery Breakdown */}
              <div className="lg:col-span-7 bg-[#121214] border border-zinc-900 rounded-2xl p-6 flex flex-col gap-6 shadow-md overflow-hidden h-full">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 flex-shrink-0">
                  <BarChart2 className="w-4 h-4 text-[#e2fc5c]" /> Chapter & Topic Mastery Breakdown
                </h4>

                <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                  {selectedSubject.chapters.map((chapter, cIdx) => (
                    <div 
                      key={cIdx} 
                      className="border border-zinc-900 bg-[#09090b]/60 hover:bg-[#09090b]/80 p-4 rounded-xl flex flex-col gap-3 transition duration-200"
                    >
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-100 text-sm">{chapter.name}</span>
                        <div className="flex items-center gap-2">
                          <span 
                            className={`badge text-[9px] px-2 py-0.5 rounded font-black uppercase ${
                              chapter.percentage >= 75 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : chapter.percentage >= 50
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {chapter.percentage >= 75 ? 'Mastered' : chapter.percentage >= 50 ? 'Needs Review' : 'Critical Focus'}
                          </span>
                          <span className="text-slate-300 font-extrabold">{chapter.percentage}% Mastery</span>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden">
                        <div className={`${selectedSubject.color} h-full rounded-full`} style={{ width: `${chapter.percentage}%` }} />
                      </div>
                      
                      {/* Nested Topics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1.5 pl-3 border-l-2 border-zinc-800">
                        {chapter.topics.map((topic, tIdx) => (
                          <div 
                            key={tIdx} 
                            className="flex justify-between items-center text-[10px] font-semibold text-slate-400 bg-zinc-900/40 p-2 rounded-lg border border-zinc-900/30"
                          >
                            <span className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${selectedSubject.color}`} />
                              {topic.name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-300">{topic.percentage}%</span>
                              <span className={`w-2 h-2 rounded-full ${topic.percentage >= 75 ? 'bg-emerald-400' : topic.percentage >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="text-center text-[9px] text-slate-500 mt-4 font-semibold border-t border-zinc-850 pt-3 flex-shrink-0">
              MHT-CET Platform Diagnostics Engine v1.0.0
            </div>

          </div>
        </div>
      ) /* Detailed Analysis Modal / slideover */ }

      {/* Page Header */}
      <div className="flex flex-col gap-1.5 border-b border-zinc-800 pb-5">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
          <Sparkles className="w-8 h-8 text-[#e2fc5c]" /> Analysis & AI Insights
        </h1>
        <p className="text-sm text-slate-400 font-semibold leading-relaxed">
          Comprehensive diagnostic logs detailing syllabus mastery curves, speed index tracking, and specialized AI diagnostics.
        </p>
      </div>

      {/* Top Performance Header (Grid) */}
      {isDatabaseEmpty ? (
        <div className="bg-[#121214] border border-[#27272a] rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="bg-zinc-900 text-amber-400 p-5 rounded-full border border-zinc-800">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-white">No tests attempted yet.</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            AI syllabus diagnostics, speed indices, and conceptual weakness grids compile dynamically once you complete and submit an exam from the Test Arena.
          </p>
          <a
            href="#test-arena"
            onClick={() => {
              alert("Please go to the Test Arena tab from the sidebar, launch an exam, and click submit!");
            }}
            className="mt-2 bg-[#e2fc5c] hover:bg-[#c4de32] text-[#09090b] px-6 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-1.5"
          >
            Go to Test Arena <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Metric 1: Overall Accuracy */}
            <div className="bg-[#121214] border border-[#27272a] rounded-3xl p-6 shadow-lg flex flex-col justify-between min-h-[140px]">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Overall Accuracy</span>
                <span className="text-[#e2fc5c] bg-[#e2fc5c]/10 px-2 py-0.5 rounded-full border border-[#e2fc5c]/20 text-[9px] font-bold">
                  Target 80%
                </span>
              </div>
              <div className="text-4xl md:text-5xl font-black text-white mt-3 flex items-baseline gap-2">
                {avgAccuracy}%
                {avgAccuracy >= 80 && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Optimal
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-semibold mt-2">
                Calculated across previous {totalAttemptsCount} practice attempts.
              </p>
            </div>

            {/* Metric 2: Percentile & Rank */}
            <div className="bg-[#121214] border border-[#27272a] rounded-3xl p-6 shadow-lg flex flex-col justify-between min-h-[140px]">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Percentile & Rank</span>
                <span className="text-[#e2fc5c] bg-[#e2fc5c]/10 px-2 py-0.5 rounded-full border border-[#e2fc5c]/20 text-[9px] font-bold">
                  Active User
                </span>
              </div>
              <div className="text-4xl md:text-5xl font-black text-white mt-3 flex items-baseline gap-2">
                {bestPercentile}%ile
                {currentRank < 9999 && (
                  <span className="text-sm font-bold text-slate-400">#{currentRank} Rank</span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-semibold mt-2">
                National standing metrics updated in real-time.
              </p>
            </div>

            {/* Metric 3: Time Analysis */}
            <div className="bg-[#121214] border border-[#27272a] rounded-3xl p-6 shadow-lg flex flex-col justify-between min-h-[140px]">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Average Speed Index</span>
                <span className="text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20 text-[9px] font-bold">
                  {avgSpeedIndexSeconds <= 90 ? 'Optimal' : 'Needs Work'}
                </span>
              </div>
              <div className="text-4xl md:text-5xl font-black text-white mt-3 flex items-baseline gap-2">
                {avgSpeedString}
                <span className="text-xs font-semibold text-slate-400">per question</span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold mt-2">
                Recommended pace is 1m 30s per question.
              </p>
            </div>

          </div>

          {/* Simplified High-Level Subject Cards */}
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
              <span>📚</span> Subject Performance Overview
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subjectsData.filter(s => s.chapters.length > 0).map(subject => {
                // Calculate detailed statistics to show inside the card
                const masteredCount = subject.chapters.filter(c => c.percentage >= 75).length;
                const totalChapters = subject.chapters.length;
                const criticalGapsCount = subject.conceptGaps.filter(g => g.severity === 'Critical' && g.gap !== 'None').length;
                
                return (
                  <div 
                    key={subject.name} 
                    className="bg-[#121214] border border-[#27272a] hover:border-zinc-600 rounded-3xl p-6 shadow-xl flex flex-col justify-between gap-5 transition duration-300 group"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-black uppercase text-slate-500">Subject Tracker</span>
                        <span className={`w-3 h-3 rounded-full ${subject.color} shadow-lg`} />
                      </div>
                      <h3 className="text-xl font-extrabold text-white mt-1 leading-snug">
                        {subject.name}
                      </h3>
                      
                      {/* Detailed Subject Stats Summary */}
                      <div className="grid grid-cols-2 gap-3 mt-4 mb-4 border-y border-zinc-900 py-3 text-[10px] font-semibold text-slate-400">
                        <div className="flex flex-col gap-0.5 border-r border-zinc-900 pr-2">
                          <span className="text-slate-500 uppercase tracking-widest text-[8px]">Chapters Mastered</span>
                          <span className="text-slate-200 text-xs font-black">{masteredCount} / {totalChapters}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 pl-2">
                          <span className="text-slate-500 uppercase tracking-widest text-[8px]">Critical Gaps</span>
                          <span className={`${criticalGapsCount > 0 ? 'text-red-400' : 'text-emerald-400'} text-xs font-black`}>
                            {criticalGapsCount} Flagged
                          </span>
                        </div>
                      </div>

                      {/* High level progress bar */}
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-xs font-bold text-slate-400">
                          <span>Overall Mastery Progress</span>
                          <span className="text-white font-extrabold">{subject.percentage}%</span>
                        </div>
                        <div className="w-full bg-[#09090b] border border-zinc-900 h-2.5 rounded-full overflow-hidden">
                          <div className={`${subject.color} h-full rounded-full transition-all duration-500`} style={{ width: `${subject.percentage}%` }} />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedSubject(subject)}
                      className="bg-[#e2fc5c] hover:bg-[#c4de32] text-[#09090b] w-full text-center py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#e2fc5c]/5 group-hover:scale-[1.02]"
                    >
                      Open Subject Diagnostics <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

    </div>
  );
};
