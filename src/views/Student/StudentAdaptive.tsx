import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Flame, Play, Clock, BarChart, ShieldCheck } from 'lucide-react';

interface RecommendedDrill {
  id: string;
  title: string;
  topic: string;
  duration: number; // minutes
  questions: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

interface CompletedDrill {
  id: string;
  drillName: string;
  score: string;
  dateCompleted: string;
  adaptiveRank: string;
}

export const StudentAdaptive: React.FC = () => {
  // Load Tailwind CDN dynamically to parse utility classes if not already globally configured
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  // Dropdown options state
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');

  // Dummy options
  const subjects = ['Physics', 'Chemistry', 'Mathematics'];
  
  const chaptersMap: Record<string, string[]> = {
    'Physics': ['Rotational Dynamics', 'Electrostatics', 'Wave Optics'],
    'Chemistry': ['Chemical Kinetics', 'Coordination Compounds', 'Thermodynamics'],
    'Mathematics': ['Vectors & 3D Geometry', 'Integration', 'Probability']
  };

  const topicsMap: Record<string, string[]> = {
    'Rotational Dynamics': ['Moment of Inertia', 'Angular Momentum', 'Torque & Equilibrium'],
    'Electrostatics': ['Coulomb\'s Law', 'Electric Potential', 'Gauss Law Applications'],
    'Wave Optics': ['Double Slit Interference', 'Diffraction Patterns'],
    'Chemical Kinetics': ['Order of Reaction', 'Activation Energy', 'Catalysis Rates'],
    'Coordination Compounds': ['Ligands & Oxidation States', 'Isomerism'],
    'Vectors & 3D Geometry': ['Scalar Vector Products', 'Coplanar Vectors', 'Direction Cosines'],
    'Integration': ['Definite Limits', 'Area Under Curve', 'Differential Equations'],
    'Probability': ['Binomial Distribution', 'Poisson Variables']
  };

  const activeChapters = chaptersMap[selectedSubject] || [];
  const activeTopics = topicsMap[selectedChapter] || [];

  // Mock data for AI Recommended Drills
  const recommendedDrills: RecommendedDrill[] = [
    {
      id: '1',
      title: '15-Min Drill: Thermodynamics',
      topic: 'Thermodynamics (Chemistry)',
      duration: 15,
      questions: 10,
      difficulty: 'Intermediate'
    },
    {
      id: '2',
      title: '20-Min Drill: Moment of Inertia',
      topic: 'Rotational Dynamics (Physics)',
      duration: 20,
      questions: 15,
      difficulty: 'Advanced'
    },
    {
      id: '3',
      title: '10-Min Drill: Coplanar Vectors',
      topic: 'Vectors & 3D Geometry (Math)',
      duration: 10,
      questions: 8,
      difficulty: 'Beginner'
    }
  ];

  // Mock data for Completed Test History & Adaptive Rank
  const completedDrills: CompletedDrill[] = [
    {
      id: '1',
      drillName: '15-Min Drill: Definitive Integration',
      score: '9 / 10',
      dateCompleted: 'June 26, 2026',
      adaptiveRank: '#12 in Adaptive Pool'
    },
    {
      id: '2',
      drillName: '10-Min Drill: Order of Reaction',
      score: '7 / 8',
      dateCompleted: 'June 22, 2026',
      adaptiveRank: '#24 in Adaptive Pool'
    },
    {
      id: '3',
      drillName: '20-Min Drill: Wave Interference paths',
      score: '11 / 15',
      dateCompleted: 'June 17, 2026',
      adaptiveRank: '#48 in Adaptive Pool'
    }
  ];

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !selectedChapter || !selectedTopic) {
      alert('Please select a Subject, Chapter, and Topic first.');
      return;
    }
    alert(`Mock test generated successfully for: ${selectedSubject} -> ${selectedChapter} -> ${selectedTopic}`);
  };

  return (
    <div className="w-full min-h-screen text-slate-100 flex flex-col gap-8 p-4 md:p-8 bg-[#09090b] font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col gap-1.5 border-b border-zinc-800 pb-5">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
          <Brain className="w-8 h-8 text-[#e2fc5c]" /> AI Adaptive Learning
        </h1>
        <p className="text-sm text-slate-400 font-semibold leading-relaxed">
          Customized, non-graded practice drills generated dynamically by Gemini AI to target and resolve your core conceptual weaknesses.
        </p>
      </div>

      {/* Custom AI Mock Test Generator (Top Section) */}
      <div className="bg-[#121214] border-2 border-[#e2fc5c]/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col gap-1.5 mb-6">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#e2fc5c]" /> Custom AI Mock Test Generator
          </h2>
          <p className="text-xs text-slate-400 font-semibold">
            Calibrate a targeted practice test on any syllabus topic. The questions will dynamically scale based on your performance.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Subject Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Subject</label>
            <select 
              value={selectedSubject} 
              onChange={(e) => { setSelectedSubject(e.target.value); setSelectedChapter(''); setSelectedTopic(''); }}
              className="bg-[#09090b] border border-zinc-800 text-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-zinc-700 w-full font-semibold appearance-none cursor-pointer"
            >
              <option value="">-- Choose Subject --</option>
              {subjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* Chapter Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Chapter</label>
            <select 
              value={selectedChapter} 
              disabled={!selectedSubject}
              onChange={(e) => { setSelectedChapter(e.target.value); setSelectedTopic(''); }}
              className="bg-[#09090b] border border-zinc-800 text-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-zinc-700 w-full font-semibold appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">-- Choose Chapter --</option>
              {activeChapters.map(ch => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </div>

          {/* Topic Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Topic</label>
            <select 
              value={selectedTopic} 
              disabled={!selectedChapter}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="bg-[#09090b] border border-zinc-800 text-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-zinc-700 w-full font-semibold appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">-- Choose Topic --</option>
              {activeTopics.map(top => (
                <option key={top} value={top}>{top}</option>
              ))}
            </select>
          </div>

          {/* Full Width Button */}
          <div className="md:col-span-3 mt-4 flex justify-end">
            <button 
              type="submit" 
              className="bg-[#e2fc5c] hover:bg-[#c4de32] text-[#09090b] w-full md:w-auto font-black rounded-2xl py-3.5 px-8 text-xs transition uppercase tracking-wider"
            >
              Generate Custom Mock Test
            </button>
          </div>
        </form>
        {/* Subtle decorative glow */}
        <div className="absolute right-0 bottom-0 w-24 h-24 bg-[#e2fc5c]/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* AI Recommended Drills (Middle Section) */}
      <div className="flex flex-col gap-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
          <span>🎯</span> Weak Spot Target: AI Recommended Drills
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendedDrills.map(drill => (
            <div 
              key={drill.id} 
              className="bg-[#121214] border border-[#27272a] rounded-3xl p-6 shadow-lg flex flex-col justify-between gap-5 hover:border-zinc-700 transition duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-[#09090b] border border-zinc-855 text-slate-400 rounded-full px-3 py-0.5 text-[9px] font-bold">
                    {drill.topic.split(' ')[0]}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                    drill.difficulty === 'Advanced' ? 'bg-red-950/40 text-red-400 border border-red-500/20' : 
                    drill.difficulty === 'Intermediate' ? 'bg-amber-950/40 text-amber-400 border border-amber-500/20' : 
                    'bg-sky-950/40 text-sky-400 border border-sky-500/20'
                  }`}>
                    {drill.difficulty}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-white leading-snug">
                  {drill.title}
                </h3>
                <p className="text-[10px] text-slate-500 mt-2 font-semibold leading-relaxed">
                  Focuses on critical weak points identified in your last 3 test reports. Non-graded practice model.
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-850 pt-4 mt-1 text-[10px] text-slate-400 font-bold">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#e2fc5c]" /> {drill.duration} Mins
                </span>
                <span className="flex items-center gap-1">
                  <Play className="w-3 h-3 text-[#e2fc5c] fill-[#e2fc5c]" /> {drill.questions} Qs
                </span>
                <button className="bg-[#e2fc5c] hover:bg-[#c4de32] text-[#09090b] px-3.5 py-1.5 rounded-xl font-bold transition">
                  Start
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Adaptive Test History & Peer Rank (Bottom Section) */}
      <div className="bg-[#121214] border border-[#27272a] rounded-3xl p-6 shadow-lg">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3 mb-5">
          <BarChart className="w-4 h-4 text-[#e2fc5c]" /> Adaptive Drills History & Standings
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-855 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="pb-3 font-extrabold">Drill Name</th>
                <th className="pb-3 font-extrabold">Completed Date</th>
                <th className="pb-3 font-extrabold">Score</th>
                <th className="pb-3 font-extrabold">Peer Rank (Adaptive Pool)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-xs font-semibold text-slate-300">
              {completedDrills.map(drill => (
                <tr key={drill.id} className="hover:bg-zinc-800/10 transition">
                  <td className="py-4 text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> {drill.drillName}
                  </td>
                  <td className="py-4 text-slate-400">{drill.dateCompleted}</td>
                  <td className="py-4 font-bold text-white">{drill.score}</td>
                  <td className="py-4">
                    <span className="bg-sky-950/40 text-sky-400 border border-sky-500/20 px-3 py-1 rounded-full text-[9px] font-bold">
                      {drill.adaptiveRank}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
