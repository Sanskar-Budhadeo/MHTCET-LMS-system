import React, { useState, useEffect } from 'react';
import { Clock, Trophy, TrendingUp, Sparkles, CheckCircle, AlertTriangle, MessageSquare, ChevronRight, Zap, Target, X, BarChart2 } from 'lucide-react';

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

  // Nested structured syllabus and diagnostic data per subject
  const subjectsData: SubjectData[] = [
    {
      name: 'Mathematics',
      percentage: 84,
      color: 'bg-fuchsia-500',
      textColor: 'text-fuchsia-400',
      strongAreas: ['Definite Integration', 'Vector Scalar Products', 'Coplanar Vectors', 'Limits & Continuity'],
      weakAreas: ['Probability Distributions', 'Poisson Variables', 'Differential Word Problems'],
      mistakePatterns: [
        { pattern: 'Poor Time Management', desc: 'Spend avg. 3m 40s on difficult Math calculus questions.', frequency: 'High' },
        { pattern: 'Calculation/Sign Errors', desc: 'Loss of marks due to simple negative/positive sign flips in vector lines.', frequency: 'Medium' }
      ],
      conceptGaps: [
        { gap: 'Integration Area Boundaries', desc: 'Confusion setting up coordinates for area under curved surfaces.', severity: 'Critical' }
      ],
      facultyNote: 'Rahul, exceptional accuracy in Definite integration integrals. However, your time management on vector calculations needs optimization. Set strict speed limits in 3D direction cosines.',
      facultyTeacher: 'Prof. S. R. Joshi (Mathematics Dept)',
      chapters: [
        {
          name: 'Vectors & 3D Geometry',
          percentage: 88,
          topics: [
            { name: 'Vector Scalar Products', percentage: 92 },
            { name: 'Direction Cosines & Ratios', percentage: 85 },
            { name: 'Coplanar Vectors', percentage: 87 }
          ]
        },
        {
          name: 'Integration & Calculus',
          percentage: 78,
          topics: [
            { name: 'Definite Integration Limits', percentage: 92 },
            { name: 'Area Under Curve', percentage: 70 },
            { name: 'Differential Equations', percentage: 72 }
          ]
        },
        {
          name: 'Probability Distributions',
          percentage: 64,
          topics: [
            { name: 'Binomial Distribution', percentage: 68 },
            { name: 'Poisson Variables', percentage: 60 }
          ]
        }
      ]
    },
    {
      name: 'Physics',
      percentage: 72,
      color: 'bg-sky-500',
      textColor: 'text-sky-400',
      strongAreas: ['Coulomb\'s Law applications', 'Logic Gates', 'Gauss Theorem limits', 'Current Electricity'],
      weakAreas: ['Rigid Body Angular Momentum', 'Wave Optics Interference', 'Diffraction path gaps'],
      mistakePatterns: [
        { pattern: 'Calculation/Sign Errors', desc: 'Loss of marks due to simple vector cross product coordinate flips.', frequency: 'High' },
        { pattern: 'Secondary Formula Skips', desc: 'Forgetting to apply air gap factors in capacitance equations.', frequency: 'Medium' }
      ],
      conceptGaps: [
        { gap: 'Parallel Axis Theorem', desc: 'Core misunderstanding of axis shift distance variables in rigid bodies.', severity: 'Critical' }
      ],
      facultyNote: 'Rahul, your numerical accuracy in Electrostatics has improved significantly. However, you are losing easy marks in Rotational Mechanics by skipping steps in vector cross products. Keep working on the AI adaptive recommended practice sets.',
      facultyTeacher: 'Prof. Anand Deshmukh (HOD Physics)',
      chapters: [
        {
          name: 'Rotational Dynamics',
          percentage: 60,
          topics: [
            { name: 'Moment of Inertia calculations', percentage: 55 },
            { name: 'Angular Momentum shifts', percentage: 65 }
          ]
        },
        {
          name: 'Electrostatics',
          percentage: 82,
          topics: [
            { name: 'Coulomb\'s Law applications', percentage: 85 },
            { name: 'Gauss Theorem limits', percentage: 79 }
          ]
        },
        {
          name: 'Wave Optics',
          percentage: 68,
          topics: [
            { name: 'Double Slit Interference', percentage: 65 },
            { name: 'Diffraction patterns', percentage: 71 }
          ]
        }
      ]
    },
    {
      name: 'Chemistry',
      percentage: 80,
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
      strongAreas: ['Coordination Compounds', 'Thermodynamics', 'Ligands & Oxidation states', 'Chemical Kinetics'],
      weakAreas: ['Aldehydes & Ketones Reactions', 'Transition State Energy curves', 'Symmetry Structures'],
      mistakePatterns: [
        { pattern: 'Formula Application Error', desc: 'Tendency to misapply secondary equations in thermodynamics.', frequency: 'High' },
        { pattern: 'Naming Rules Confusions', desc: 'Errors naming complex ligands under IUPAC rules.', frequency: 'Medium' }
      ],
      conceptGaps: [
        { gap: 'Transition State Energy curves', desc: 'Confusion between intermediate states and activation thresholds.', severity: 'Moderate' }
      ],
      facultyNote: 'Rahul, your Kinetics graphs are accurate. Pay closer attention to ligand isomer structures in Coordination Compounds. Solid practice effort in Chemistry overall.',
      facultyTeacher: 'Prof. K. Mehta (Chemistry Dept)',
      chapters: [
        {
          name: 'Chemical Kinetics',
          percentage: 85,
          topics: [
            { name: 'Order & Molecularity', percentage: 90 },
            { name: 'Activation energy math', percentage: 80 }
          ]
        },
        {
          name: 'Coordination Compounds',
          percentage: 75,
          topics: [
            { name: 'Ligands & Oxidation States', percentage: 82 },
            { name: 'Isomerism limits', percentage: 68 }
          ]
        }
      ]
    }
  ];

  return (
    <div className="w-full min-h-screen text-slate-100 flex flex-col gap-8 p-4 md:p-8 bg-[#09090b] font-sans relative">
      
      {/* Detailed Analysis Modal / slideover */}
      {selectedSubject && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-[#121214] border border-[#27272a] rounded-3xl p-6 max-w-4xl w-full h-[90vh] shadow-2xl flex flex-col justify-between overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Granular Subject Diagnostic</span>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${selectedSubject.color}`} />
                  {selectedSubject.name} Analysis Details
                </h3>
              </div>
              <button 
                onClick={() => setSelectedSubject(null)}
                className="bg-zinc-850 hover:bg-zinc-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-zinc-800"
              >
                <X className="w-4 h-4" /> Close Details
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-6 scrollbar-thin scrollbar-thumb-zinc-850 scrollbar-track-transparent">
              
              {/* Row 1: Chapter & Topic mastery bars */}
              <div className="bg-[#09090b] border border-zinc-900 rounded-2xl p-5 flex flex-col gap-5">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-[#e2fc5c]" /> Chapter & Topic Mastery Breakdown
                </h4>
                
                <div className="flex flex-col gap-5">
                  {selectedSubject.chapters.map((chapter, cIdx) => (
                    <div key={cIdx} className="flex flex-col gap-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-100">{chapter.name}</span>
                        <span className="text-slate-400">{chapter.percentage}% Mastery</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                        <div className={`${selectedSubject.color} h-full rounded-full`} style={{ width: `${chapter.percentage}%` }} />
                      </div>
                      
                      {/* Nested Topics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1.5 pl-3 border-l border-zinc-850">
                        {chapter.topics.map((topic, tIdx) => (
                          <div key={tIdx} className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <span className={`w-1 h-1 rounded-full ${selectedSubject.color}`} />
                              {topic.name}
                            </span>
                            <span className="font-bold text-slate-300">{topic.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 2: Strong & Weak Areas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#09090b] border border-zinc-900 rounded-2xl p-5 flex flex-col gap-3">
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> High Mastery Areas
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedSubject.strongAreas.map((area, idx) => (
                      <span key={idx} className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-full px-2.5 py-0.5 text-[9px] font-bold">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-[#09090b] border border-zinc-900 rounded-2xl p-5 flex flex-col gap-3">
                  <span className="text-[10px] font-black uppercase text-red-400 tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Weak Spot Gaps
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedSubject.weakAreas.map((area, idx) => (
                      <span key={idx} className="bg-red-950/40 border border-red-500/20 text-red-400 rounded-full px-2.5 py-0.5 text-[9px] font-bold">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Mistakes & Concept Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#09090b] border border-zinc-900 rounded-2xl p-5 flex flex-col gap-3">
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Mistake Patterns</span>
                  <div className="space-y-3.5 mt-1">
                    {selectedSubject.mistakePatterns.map((pat, idx) => (
                      <div key={idx} className="border-b border-zinc-900 pb-2.5 last:border-0 last:pb-0 flex flex-col gap-0.5">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                          <span>{pat.pattern}</span>
                          <span className="text-[8px] font-black text-amber-400 uppercase bg-amber-500/10 px-1.5 py-0.5 rounded">
                            {pat.frequency}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">{pat.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#09090b] border border-zinc-900 rounded-2xl p-5 flex flex-col gap-3">
                  <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">Concept Gaps</span>
                  <div className="space-y-3.5 mt-1">
                    {selectedSubject.conceptGaps.map((gap, idx) => (
                      <div key={idx} className="border-b border-zinc-900 pb-2.5 last:border-0 last:pb-0 flex flex-col gap-0.5">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                          <span>{gap.gap}</span>
                          <span className="text-[8px] font-black text-red-400 uppercase bg-red-500/10 px-1.5 py-0.5 rounded">
                            {gap.severity}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">{gap.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 4: Faculty Feedback Note */}
              <div className="border-l-4 border-[#e2fc5c] bg-[#09090b] p-4 rounded-r-2xl border-y border-r border-zinc-900">
                <span className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  Faculty Advisor Review Note
                </span>
                <p className="text-[10px] text-slate-200 leading-relaxed font-semibold italic">
                  "{selectedSubject.facultyNote}"
                </p>
                <span className="block text-[8px] text-right font-black text-sky-400 mt-2">
                  - {selectedSubject.facultyTeacher}
                </span>
              </div>

            </div>

            <div className="text-center text-[9px] text-slate-500 mt-4 font-semibold border-t border-zinc-850 pt-3">
              MHT-CET Platform Diagnostics Engine v1.0.0
            </div>

          </div>
        </div>
      )}

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
            78.4%
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +2.3%
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold mt-2">
            Calculated across previous 8 practice attempts.
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
            97.8%
            <span className="text-sm font-bold text-slate-400">#45 Rank</span>
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
              Optimal
            </span>
          </div>
          <div className="text-4xl md:text-5xl font-black text-white mt-3 flex items-baseline gap-2">
            1m 24s
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
          {subjectsData.map(subject => (
            <div 
              key={subject.name} 
              className="bg-[#121214] border border-[#27272a] rounded-3xl p-6 shadow-lg flex flex-col justify-between gap-5 hover:border-zinc-700 transition duration-300"
            >
              <div>
                <span className="text-[9px] font-black uppercase text-slate-500">Subject Tracker</span>
                <h3 className="text-lg font-extrabold text-white mt-1 leading-snug">
                  {subject.name}
                </h3>
                
                {/* High level progress bar */}
                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>Mastery Progress</span>
                    <span className="text-white">{subject.percentage}%</span>
                  </div>
                  <div className="w-full bg-[#09090b] border border-zinc-900 h-2 rounded-full overflow-hidden">
                    <div className={`${subject.color} h-full rounded-full`} style={{ width: `${subject.percentage}%` }} />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedSubject(subject)}
                className="bg-[#e2fc5c] hover:bg-[#c4de32] text-[#09090b] w-full text-center py-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1"
              >
                View Detailed Analysis <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
