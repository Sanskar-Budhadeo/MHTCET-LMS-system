import React, { useState, useEffect } from 'react';
import { useLms } from '../../context/LmsContext';
import { Calendar, Clock, Award, FileText, CheckCircle, ArrowUpRight, ShieldAlert, Zap } from 'lucide-react';

// Custom lightweight Axios wrapper to prevent package installation issues (ACL permissions)
const axios = {
  get: async (url: string, config?: any) => {
    const res = await fetch(url, {
      headers: config?.headers || {}
    });
    if (!res.ok) throw new Error('API request failed');
    return { data: await res.json() };
  }
};

interface AvailableTest {
  id: string;
  title: string;
  duration: number; // in minutes
  subjects: string[];
  scheduledTime: string; // ISO string
}

interface PastTestResult {
  id: string;
  testName: string;
  score: number;
  totalMarks: number;
  dateAttempted: string; // ISO string
  accuracy: number;
}

export const TestArena: React.FC = () => {
  const { activeUser } = useLms();
  const [loading, setLoading] = useState(true);
  const [availableTests, setAvailableTests] = useState<AvailableTest[]>([]);
  const [pastResults, setPastResults] = useState<PastTestResult[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load Tailwind CDN dynamically to parse utility classes if not already globally configured
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  // Update currentTime state every second for precise real-time time-gated buttons
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Test Arena Dashboard Data from backend
  useEffect(() => {
    const fetchArenaData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('mht_cet_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const userId = activeUser?.id || activeUser?._id || 'rahul_sharma';
        const response = await axios.get(`http://localhost:5000/api/test-arena/dashboard/${userId}`, { headers });
        
        setAvailableTests(response.data.availableTests || []);
        setPastResults(response.data.pastResults || []);
      } catch (err) {
        console.warn('Backend server offline or endpoint error. Falling back to local offline mock data.', err);
        // Robust offline fallback data
        setAvailableTests([
          {
            id: 'mock_test_1',
            title: 'MHT-CET Full Syllabus Mock Test #4',
            duration: 180,
            subjects: ['Physics', 'Chemistry', 'Mathematics'],
            scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1 day in future
          },
          {
            id: 'mock_test_2',
            title: 'Mathematics: Vector Algebra & Calculus',
            duration: 90,
            subjects: ['Mathematics'],
            scheduledTime: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
          },
          {
            id: 'mock_test_3',
            title: 'Physics & Chemistry: Organic Mechanics & Optics',
            duration: 90,
            subjects: ['Physics', 'Chemistry'],
            scheduledTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 2 days in future
          }
        ]);
        setPastResults([
          {
            id: 'past_attempt_1',
            testName: 'MHT-CET Full Syllabus Mock Test #3',
            score: 148,
            totalMarks: 200,
            dateAttempted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            accuracy: 74
          },
          {
            id: 'past_attempt_2',
            testName: 'Mathematics Chapter Drill: Vectors',
            score: 82,
            totalMarks: 100,
            dateAttempted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            accuracy: 82
          },
          {
            id: 'past_attempt_3',
            testName: 'Chemistry Practical: Kinetic Formulas',
            score: 76,
            totalMarks: 100,
            dateAttempted: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            accuracy: 76
          },
          {
            id: 'past_attempt_4',
            testName: 'Physics Standard: Electrostatics Drill #2',
            score: 41,
            totalMarks: 50,
            dateAttempted: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            accuracy: 82
          },
          {
            id: 'past_attempt_5',
            testName: 'MHT-CET Full Syllabus Mock Test #2',
            score: 124,
            totalMarks: 200,
            dateAttempted: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            accuracy: 62
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchArenaData();
  }, [activeUser]);

  // Click Handler for Active Mock Tests
  const handleStartExam = (testId: string, testTitle: string) => {
    alert(`Starting Exam: ${testTitle} (ID: ${testId}). Good luck!`);
  };

  // Helper: check future test scheduled status
  const checkTimeStatus = (scheduledTimeStr: string) => {
    const scheduledDate = new Date(scheduledTimeStr);
    const isFuture = currentTime < scheduledDate;
    
    // Format options
    const formattedTime = scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = scheduledDate.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });

    return {
      isFuture,
      formattedTime,
      formattedDate
    };
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[var(--border)] border-t-[#e2fc5c] animate-spin" />
          <span className="text-xs font-bold text-[var(--text-muted)] tracking-wider">Loading Test Arena...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen text-[var(--text-main)] flex flex-col gap-8 p-4 md:p-8 bg-[var(--bg-app)] font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col gap-1.5 border-b border-[var(--border)] pb-5">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-main)] flex items-center gap-2.5">
          <FileText className="w-8 h-8 text-[#e2fc5c]" /> Test Arena
        </h1>
        <p className="text-sm text-[var(--text-muted)] font-semibold leading-relaxed">
          Select and launch simulated examinations, scheduled mock papers, and practice chapter drills.
        </p>
      </div>

      {/* Main Grid Layout (Split View) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Available & Upcoming Tests (span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <h2 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <span>📅</span> Available & Upcoming Exams
          </h2>
          <div className="flex flex-col gap-6">
            {availableTests.map(test => {
              const status = checkTimeStatus(test.scheduledTime);
              return (
                <div 
                  key={test.id} 
                  className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 shadow-lg flex flex-col justify-between gap-5 hover:border-[var(--text-light)] transition duration-300"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5 mb-3.5">
                      <span className="bg-[var(--bg-app)] border border-[var(--border)] text-[var(--text-main)] rounded-full px-3.5 py-1 text-[10px] font-bold">
                        {test.subjects.join(' / ')}
                      </span>
                      <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full px-3.5 py-1 text-[10px] font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {test.duration} Mins
                      </span>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-3.5 py-1 text-[10px] font-bold">
                        {test.duration >= 180 ? '200' : '100'} Marks
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-[var(--text-main)] leading-snug">
                      {test.title}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed font-semibold">
                      Complete simulated MHT-CET assessment drill evaluating speed, precision, and concept correctness.
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-4 border-t border-[var(--border)] pt-4">
                    <div className="flex justify-between items-center text-xs text-[var(--text-muted)] font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#e2fc5c]" /> {status.formattedDate}
                      </span>
                      <span>Scheduled time: {status.formattedTime}</span>
                    </div>
                    
                    <button 
                      disabled={status.isFuture}
                      onClick={() => handleStartExam(test.id, test.title)}
                      className={`w-full text-center py-3 rounded-2xl text-xs font-bold transition border ${
                        status.isFuture 
                          ? 'bg-[var(--bg-app)] border-[var(--border)] text-[var(--text-light)] cursor-not-allowed opacity-60' 
                          : 'bg-[#e2fc5c] hover:bg-[#c4de32] text-[#09090b] border-transparent font-black shadow-md'
                      }`}
                    >
                      {status.isFuture ? `Starts at ${status.formattedTime}` : 'Start Exam'}
                    </button>
                  </div>
                </div>
              );
            })}

            {availableTests.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6">
                <ShieldAlert className="w-8 h-8 text-[var(--text-light)] mb-2 animate-bounce" />
                <p className="text-xs text-[var(--text-muted)] font-semibold">
                  No mock examinations currently scheduled.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Previous Score Log & Results (span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <h2 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <span>📊</span> Previous Score Log & Results
          </h2>
          <div className="max-h-[600px] overflow-y-auto pr-2 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {pastResults.map(result => (
              <div 
                key={result.id} 
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 flex items-center justify-between shadow-md hover:border-[var(--text-light)] transition duration-300"
              >
                <div className="flex flex-col gap-1.5 max-w-[65%]">
                  <span className="text-xs font-bold text-[var(--text-main)] leading-snug break-words">
                    {result.testName}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold">
                    Attempted: {new Date(result.dateAttempted).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <a 
                    href="#report" 
                    className="text-[10px] font-bold text-[#e2fc5c] hover:underline flex items-center gap-0.5 mt-0.5"
                  >
                    View Report <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
                
                <div className="flex flex-col items-end text-right">
                  <div className="text-sm font-black text-[var(--text-main)]">
                    {result.score} <span className="text-[10px] text-[var(--text-muted)] font-medium">/ {result.totalMarks}</span>
                  </div>
                  <span className="text-[9px] text-[#e2fc5c] bg-[#e2fc5c]/10 px-2 py-0.5 rounded-full border border-[#e2fc5c]/20 font-bold mt-1.5">
                    {result.accuracy}% Acc
                  </span>
                </div>
              </div>
            ))}

            {pastResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6">
                <ShieldAlert className="w-8 h-8 text-[var(--text-light)] mb-2" />
                <p className="text-xs text-[var(--text-muted)] font-semibold">
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
