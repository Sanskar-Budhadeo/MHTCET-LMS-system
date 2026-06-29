import React, { useEffect } from 'react';
import { useLms } from '../../context/LmsContext';
import { Calendar, Clock, Award, FileText, CheckCircle, ArrowUpRight, ShieldAlert } from 'lucide-react';

interface AvailableTest {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number; // in minutes
  totalMarks: number;
  subject: string;
}

interface PastTestResult {
  id: string;
  testName: string;
  score: number;
  totalMarks: number;
  dateAttempted: string;
  accuracy: number;
}

export const TestArena: React.FC = () => {
  // Load Tailwind CDN dynamically to parse utility classes if not already globally configured
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  // Mock data for Available & Upcoming Tests
  const availableTests: AvailableTest[] = [
    {
      id: '1',
      title: 'MHT-CET Full Syllabus Mock Test #4',
      description: 'Comprehensive simulation covering entire Physics, Chemistry, and Mathematics syllabus. Structured exactly as per the official exam pattern.',
      date: 'July 05, 2026',
      time: '10:00 AM',
      duration: 180,
      totalMarks: 200,
      subject: 'PCM'
    },
    {
      id: '2',
      title: 'Mathematics: Vector Algebra & Calculus',
      description: 'Subject-wise challenge test focused on High-Weightage Vector Algebra, Lines and Planes, and Calculus differentiation chapters.',
      date: 'July 08, 2026',
      time: '02:30 PM',
      duration: 90,
      totalMarks: 100,
      subject: 'Mathematics'
    },
    {
      id: '3',
      title: 'Physics & Chemistry: Organic Mechanics & Optics',
      description: 'Chapter-wise test targeting Wave Optics, Electrostatics, and Carbonyl compounds with instant score feedback logs.',
      date: 'July 12, 2026',
      time: '04:00 PM',
      duration: 90,
      totalMarks: 100,
      subject: 'Physics / Chemistry'
    }
  ];

  // Mock data for Previous Score Log & Results
  const pastResults: PastTestResult[] = [
    {
      id: '1',
      testName: 'MHT-CET Full Syllabus Mock Test #3',
      score: 148,
      totalMarks: 200,
      dateAttempted: 'June 25, 2026',
      accuracy: 74
    },
    {
      id: '2',
      testName: 'Mathematics Chapter Drill: Vectors',
      score: 82,
      totalMarks: 100,
      dateAttempted: 'June 21, 2026',
      accuracy: 82
    },
    {
      id: '3',
      testName: 'Chemistry Practical: Kinetic Formulas',
      score: 76,
      totalMarks: 100,
      dateAttempted: 'June 18, 2026',
      accuracy: 76
    },
    {
      id: '4',
      testName: 'Physics Standard: Electrostatics Drill #2',
      score: 41,
      totalMarks: 50,
      dateAttempted: 'June 12, 2026',
      accuracy: 82
    },
    {
      id: '5',
      testName: 'MHT-CET Full Syllabus Mock Test #2',
      score: 124,
      totalMarks: 200,
      dateAttempted: 'June 05, 2026',
      accuracy: 62
    }
  ];

  return (
    <div className="w-full min-h-screen text-slate-100 flex flex-col gap-8 p-4 md:p-8 bg-[#09090b] font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col gap-1.5 border-b border-zinc-800 pb-5">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
          <FileText className="w-8 h-8 text-[#e2fc5c]" /> Test Arena
        </h1>
        <p className="text-sm text-slate-400 font-semibold leading-relaxed">
          Select and launch simulated examinations, scheduled mock papers, and practice chapter drills.
        </p>
      </div>

      {/* Main Grid Layout (Split View) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Available & Upcoming Tests (span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
            <span>📅</span> Available & Upcoming Exams
          </h2>
          <div className="flex flex-col gap-6">
            {availableTests.map(test => (
              <div 
                key={test.id} 
                className="bg-[#121214] border border-[#27272a] rounded-3xl p-6 shadow-lg flex flex-col justify-between gap-5 hover:border-zinc-700 transition duration-300"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
                    <span className="bg-[#09090b] border border-zinc-800 text-white rounded-full px-3.5 py-1 text-[10px] font-bold">
                      {test.subject}
                    </span>
                    <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full px-3.5 py-1 text-[10px] font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {test.duration} Mins
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-3.5 py-1 text-[10px] font-bold">
                      {test.totalMarks} Marks
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-white leading-snug">
                    {test.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed font-semibold">
                    {test.description}
                  </p>
                </div>
                
                <div className="flex flex-col gap-4 border-t border-zinc-800/80 pt-4">
                  <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#e2fc5c]" /> {test.date}
                    </span>
                    <span>Starts at {test.time}</span>
                  </div>
                  <button className="bg-[#e2fc5c] hover:bg-[#c4de32] text-[#09090b] w-full text-center py-3 rounded-2xl text-xs font-bold transition">
                    Start Exam
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Previous Score Log & Results (span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
            <span>📊</span> Previous Score Log & Results
          </h2>
          <div className="max-h-[600px] overflow-y-auto pr-2 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {pastResults.map(result => (
              <div 
                key={result.id} 
                className="bg-[#121214] border border-[#27272a] rounded-3xl p-5 flex items-center justify-between shadow-md hover:border-zinc-700 transition duration-300"
              >
                <div className="flex flex-col gap-1.5 max-w-[65%]">
                  <span className="text-xs font-bold text-white leading-snug break-words">
                    {result.testName}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Attempted: {result.dateAttempted}
                  </span>
                  <a 
                    href="#report" 
                    className="text-[10px] font-bold text-[#e2fc5c] hover:underline flex items-center gap-0.5 mt-0.5"
                  >
                    View Report <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
                
                <div className="flex flex-col items-end text-right">
                  <div className="text-sm font-black text-white">
                    {result.score} <span className="text-[10px] text-slate-500 font-medium">/ {result.totalMarks}</span>
                  </div>
                  <span className="text-[9px] text-[#e2fc5c] bg-[#e2fc5c]/10 px-2 py-0.5 rounded-full border border-[#e2fc5c]/20 font-bold mt-1.5">
                    {result.accuracy}% Acc
                  </span>
                </div>
              </div>
            ))}

            {pastResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-[#121214] border border-[#27272a] rounded-3xl p-6">
                <ShieldAlert className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-500 font-semibold">
                  No exams attempted yet.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
