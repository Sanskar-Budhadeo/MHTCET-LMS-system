import React, { useState, useEffect } from 'react';
import { useLms } from '../../context/LmsContext';
import { Flame, Trophy, Award, Calendar, CheckSquare, Sparkles, Plus, Trash2, Zap } from 'lucide-react';

// Custom lightweight Axios wrapper to prevent package installation issues (ACL permissions)
const axios = {
  get: async (url: string, config?: any) => {
    const res = await fetch(url, {
      headers: config?.headers || {}
    });
    if (!res.ok) throw new Error('API request failed');
    return { data: await res.json() };
  },
  post: async (url: string, body?: any, config?: any) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config?.headers || {})
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('API request failed');
    return { data: await res.json() };
  },
  put: async (url: string, body?: any, config?: any) => {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(config?.headers || {})
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('API request failed');
    return { data: await res.json() };
  },
  delete: async (url: string, config?: any) => {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: config?.headers || {}
    });
    if (!res.ok) throw new Error('API request failed');
    return { data: await res.json() };
  }
};

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface EventData {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
}

interface SyllabusSubject {
  mastered: number;
  total: number;
  percentage: number;
}

interface DashboardData {
  name: string;
  email: string;
  prn: string;
  billingId: string;
  plan: string;
  accuracyIndex: number;
  streak: number;
  hoursStudied: number;
  tasks: Task[];
  upcomingEvents: EventData[];
  syllabusProgress: {
    physics: SyllabusSubject;
    chemistry: SyllabusSubject;
    math: SyllabusSubject;
  };
}

export const StudentOverview: React.FC = () => {
  const { activeUser } = useLms();

  // Load Tailwind CDN dynamically to parse utility classes if not already globally configured
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  // Onboarding modal tour
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [tourStep, setTourStep] = useState(1);

  useEffect(() => {
    const tourCompleted = localStorage.getItem('overview_tour_completed');
    if (tourCompleted !== 'true') {
      setShowWelcomeModal(true);
    }
  }, []);

  const handleNextStep = () => {
    if (tourStep < 3) {
      setTourStep(prev => prev + 1);
    } else {
      localStorage.setItem('overview_tour_completed', 'true');
      setShowWelcomeModal(false);
    }
  };

  // State from real API calls
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');

  // Fetch Dashboard Data from MERN Backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('mht_cet_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get('http://localhost:5000/api/student/overview-data', { headers });
        setDashboardData(response.data);
        setTasks(response.data.tasks || []);
      } catch (err) {
        console.error('Error fetching student overview dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Tasks mutation helpers connecting to MERN API endpoints
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    try {
      const token = localStorage.getItem('mht_cet_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post('http://localhost:5000/api/student/tasks', { text: newTaskText.trim() }, { headers });
      setTasks(prev => [...prev, response.data]);
      setNewTaskText('');
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const toggleTask = async (id: string) => {
    try {
      const token = localStorage.getItem('mht_cet_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.put(`http://localhost:5000/api/student/tasks/${id}/toggle`, {}, { headers });
      setTasks(prev => prev.map(t => t.id === id ? response.data : t));
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const token = localStorage.getItem('mht_cet_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`http://localhost:5000/api/student/tasks/${id}`, { headers });
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Spinner Loading State UI
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#09090b] text-slate-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-zinc-800 border-t-[#e2fc5c] animate-spin" />
          <span className="text-xs font-bold text-slate-400 tracking-wider">Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  // Fallbacks in case dashboardData fails
  const studentName = dashboardData?.name || activeUser?.name || 'Rahul Sharma';
  const studentEmail = dashboardData?.email || activeUser?.email || 'rahul@cet.com';
  const studentPrn = dashboardData?.prn || activeUser?.prn || 'MHT202684730';
  const billingId = dashboardData?.billingId || 'INV-1782305377435-7748';
  const plan = dashboardData?.plan || 'Free';
  const accuracyIndex = dashboardData?.accuracyIndex ?? 37;
  const streak = dashboardData?.streak ?? 0;
  const hoursStudied = dashboardData?.hoursStudied ?? 0;
  const upcomingEvents = dashboardData?.upcomingEvents || [];
  const syllabusProgress = dashboardData?.syllabusProgress || {
    physics: { mastered: 0, total: 4, percentage: 0 },
    chemistry: { mastered: 0, total: 4, percentage: 0 },
    math: { mastered: 0, total: 3, percentage: 0 }
  };

  // Achievements Badges
  const achievements = [
    { id: '1', title: 'Streak Master', desc: `${streak} Days active streak`, icon: <Flame className="w-8 h-8 text-orange-500" /> },
    { id: '2', title: 'Accuracy Ace', desc: 'Above 85% in Mock Test', icon: <Trophy className="w-8 h-8 text-[#e2fc5c]" /> },
    { id: '3', title: 'Formula Wizard', desc: 'Completed Physics drills', icon: <Sparkles className="w-8 h-8 text-cyan-400" /> },
    { id: '4', title: 'Elite Status', desc: 'Top 50 Peer Leaderboard', icon: <Award className="w-8 h-8 text-fuchsia-400" /> }
  ];

  return (
    <div className="w-full min-h-screen text-slate-100 flex flex-col gap-6 p-4 md:p-8 bg-[#09090b] font-sans relative">
      
      {/* Onboarding Welcome Tour Overlay */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
          <div className="bg-[#121214] border-2 border-[#e2fc5c]/35 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-4 bg-[#e2fc5c]/10 rounded-full border border-[#e2fc5c]/25">
                <Sparkles className="w-10 h-10 text-[#e2fc5c] animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-white">
                {tourStep === 1 && "Welcome to MHT-CET Ace!"}
                {tourStep === 2 && "Performance Analytics"}
                {tourStep === 3 && "AI Adaptive Tools"}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                {tourStep === 1 && "Your customized dashboard layout is ready. Let's walk through the key features to maximize your score improvement."}
                {tourStep === 2 && "Track your active streaks, accuracy indices, and estimated national rank standing in real-time."}
                {tourStep === 3 && "Use the AI Adaptive Learning and Analysis sections in the sidebar to run custom micro-drills to target your concept gaps."}
              </p>
              
              <div className="flex items-center gap-1.5 mt-2">
                <div className={`w-2 h-2 rounded-full ${tourStep === 1 ? 'bg-[#e2fc5c]' : 'bg-zinc-800'}`} />
                <div className={`w-2 h-2 rounded-full ${tourStep === 2 ? 'bg-[#e2fc5c]' : 'bg-zinc-800'}`} />
                <div className={`w-2 h-2 rounded-full ${tourStep === 3 ? 'bg-[#e2fc5c]' : 'bg-zinc-800'}`} />
              </div>
              
              <button 
                onClick={handleNextStep}
                className="bg-[#e2fc5c] hover:bg-[#c4de32] text-[#09090b] font-black rounded-2xl w-full py-3.5 mt-4 text-xs uppercase tracking-wider transition"
              >
                {tourStep === 3 ? "Get Started" : "Next Option"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Target & Plan Tags + Profile Welcome Header */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <span className="bg-[#09090b] border border-zinc-800 text-white rounded-full px-3.5 py-1 text-xs font-bold">
            Target: MHT-CET (PCM)
          </span>
          <span className="border border-dashed border-[#e2fc5c]/50 bg-[#e2fc5c]/5 text-[#e2fc5c] rounded-full px-3.5 py-1 text-xs font-bold flex items-center gap-1">
            <Zap className="w-3 h-3 fill-[#e2fc5c]" /> {plan} Plan
          </span>
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Welcome back, {studentName}!
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-semibold">
            Email: <span className="text-slate-300">{studentEmail}</span> | Billing ID: <span className="text-slate-300">{billingId}</span> | PRN: <span className="text-slate-300">{studentPrn}</span>
          </p>
        </div>
      </div>

      {/* 1. Hero Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Accuracy Index */}
        <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-6 shadow-lg flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Accuracy Index</span>
              <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold">
                Dynamic Score
              </span>
            </div>
            <div className="text-4xl font-extrabold text-white mt-3.5">
              {accuracyIndex}%
            </div>
            <div className="text-xs text-slate-400 mt-2 font-semibold">
              Daily goal progress: 0%
            </div>
          </div>
          {/* Custom cylindrical progress indicators */}
          <div className="flex gap-1.5 mt-4">
            <div className="w-[18px] h-7 rounded-[6px] bg-[#09090b]" />
            <div className="w-[18px] h-7 rounded-[6px] bg-[#09090b]" />
            <div className="w-[18px] h-7 rounded-[6px] bg-zinc-800" />
            <div className="w-[18px] h-7 rounded-[6px] bg-zinc-800" />
            <div className="w-[18px] h-7 rounded-[6px] bg-zinc-800" />
          </div>
        </div>

        {/* Card 2: Active Streak (Bright Lime Theme) */}
        <div className="bg-[#e2fc5c] rounded-2xl p-6 shadow-lg flex flex-col justify-between min-h-[160px] text-[#09090b]">
          <div>
            <div className="flex justify-between items-center text-[10px] font-bold text-[#09090b]/60 uppercase tracking-widest">
              <span>Active Streak</span>
              <span className="bg-[#09090b]/10 text-[#09090b] border border-[#09090b]/15 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                Daily Study
              </span>
            </div>
            <div className="text-4xl font-extrabold mt-3.5">
              {streak} Days
            </div>
            <div className="text-xs text-[#09090b]/80 mt-2 font-semibold">
              Hours Studied: {hoursStudied} hrs
            </div>
          </div>
          {/* Custom cylindrical progress indicators */}
          <div className="flex gap-1.5 mt-4">
            <div className="w-[18px] h-7 rounded-[6px] bg-[#09090b]" />
            <div className="w-[18px] h-7 rounded-[6px] bg-[#09090b]" />
            <div className="w-[18px] h-7 rounded-[6px] bg-[#09090b]" />
            <div className="w-[18px] h-7 rounded-[6px] bg-[#09090b]" />
            <div className="w-[18px] h-7 rounded-[6px] bg-[#09090b]" />
          </div>
        </div>

        {/* Card 3: Academic Integrator */}
        <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-6 shadow-lg flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-[#e2fc5c]" />
              <span>Academic Integrator</span>
            </div>
            <h3 className="text-sm font-bold text-white mt-3">
              Elevate Prep to Next Level
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-semibold">
              You have active access to premium AI tutor tools.
            </p>
          </div>
          <button className="bg-[#e2fc5c] hover:bg-[#c4de32] text-[#09090b] w-full text-center py-2.5 rounded-xl text-xs font-bold mt-4 transition">
            Launch AI Tutor
          </button>
        </div>

      </div>

      {/* 2. Action Center & Tracker Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: MHT-CET PCMB Syllabus Tracker */}
        <div className="lg:col-span-7 bg-[#121214] border border-[#27272a] rounded-2xl p-6 shadow-lg flex flex-col gap-6">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
            <span className="text-[#e2fc5c]">🕮</span> MHT-CET PCMB Syllabus Tracker
          </h2>
          <div className="flex flex-col gap-6">
            
            {/* Physics */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="bg-sky-500/10 text-sky-400 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide">
                  PHYSICS
                </span>
                <span className="text-slate-400 text-xs font-semibold">
                  {syllabusProgress.physics.mastered}/{syllabusProgress.physics.total} Chapters Mastered
                </span>
              </div>
              <div className="w-full bg-[#09090b] border border-zinc-800/80 h-2.5 rounded-full mt-1.5">
                <div className="bg-sky-500 h-full rounded-full" style={{ width: `${syllabusProgress.physics.percentage}%` }} />
              </div>
            </div>

            {/* Chemistry */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide">
                  CHEMISTRY
                </span>
                <span className="text-slate-400 text-xs font-semibold">
                  {syllabusProgress.chemistry.mastered}/{syllabusProgress.chemistry.total} Chapters Mastered
                </span>
              </div>
              <div className="w-full bg-[#09090b] border border-zinc-800/80 h-2.5 rounded-full mt-1.5">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${syllabusProgress.chemistry.percentage}%` }} />
              </div>
            </div>

            {/* Mathematics */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="bg-fuchsia-500/10 text-fuchsia-400 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide">
                  MATHEMATICS
                </span>
                <span className="text-slate-400 text-xs font-semibold">
                  {syllabusProgress.math.mastered}/{syllabusProgress.math.total} Chapters Mastered
                </span>
              </div>
              <div className="w-full bg-[#09090b] border border-zinc-800/80 h-2.5 rounded-full mt-1.5">
                <div className="bg-fuchsia-500 h-full rounded-full" style={{ width: `${syllabusProgress.math.percentage}%` }} />
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Goals & Tasks Checklist */}
        <div className="lg:col-span-5 bg-[#121214] border border-[#27272a] rounded-2xl p-6 shadow-lg flex flex-col justify-between min-h-[280px]">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3 mb-4">
              <CheckSquare className="w-4 h-4 text-[#e2fc5c]" /> Goals & Tasks Checklist
            </h2>
            <div className="space-y-3 max-h-[170px] overflow-y-auto pr-1">
              {tasks.map(task => (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between gap-3 p-3 bg-[#09090b] border border-zinc-800/80 rounded-xl"
                >
                  <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => toggleTask(task.id)}>
                    <input 
                      type="checkbox" 
                      checked={task.completed}
                      onChange={() => {}} 
                      className="w-4 h-4 rounded text-[#e2fc5c] focus:ring-0 focus:ring-offset-0 bg-slate-800 border-slate-700 accent-[#e2fc5c]"
                    />
                    <span className={`text-xs ${task.completed ? 'line-through text-slate-500 font-medium' : 'text-slate-200 font-semibold'}`}>
                      {task.text}
                    </span>
                  </div>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="text-slate-400 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {tasks.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6 font-semibold">
                  No active tasks. Create your first daily goal!
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleAddTask} className="flex gap-2 mt-4 pt-4 border-t border-zinc-800/80">
            <input 
              type="text" 
              className="flex-1 bg-[#09090b] border border-zinc-800 text-xs rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-zinc-700 font-semibold placeholder:text-slate-600"
              value={newTaskText} 
              onChange={(e) => setNewTaskText(e.target.value)} 
              placeholder="E.g. Study Chemistry formulas"
            />
            <button 
              type="submit" 
              className="bg-black hover:bg-zinc-900 border border-zinc-800 text-white font-bold rounded-xl px-4 py-2 text-xs transition"
            >
              Add Goal
            </button>
          </form>
        </div>

      </div>

      {/* 3. Calendar & Deadlines (Upcoming Exams) with Overflow & Scroll Fix */}
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-6 shadow-lg">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4 border-b border-zinc-800 pb-3">
          <Calendar className="w-4 h-4 text-[#e2fc5c]" /> Calendar & Upcoming Exam Deadlines
        </h2>
        <div className="max-h-64 overflow-y-auto pr-2 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-zinc-850 scrollbar-track-transparent">
          {upcomingEvents.map(event => (
            <div key={event.id} className="flex gap-4 p-4 bg-[#09090b] border border-zinc-800 rounded-xl">
              <div className="flex flex-col items-center justify-center bg-slate-900 border border-zinc-800 px-3 py-1.5 rounded text-center min-w-[70px]">
                <span className="text-[9px] uppercase font-extrabold text-slate-400">
                  {event.date.split(' ')[0]}
                </span>
                <span className="text-lg font-black text-white">
                  {event.date.split(' ')[1]?.replace(',', '') || '01'}
                </span>
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-xs font-bold text-slate-200">{event.title}</span>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-semibold">
                  <span>{event.time}</span>
                  <span>•</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    event.type === 'test' ? 'bg-red-950/40 text-red-400 border border-red-500/20' : 
                    event.type === 'lecture' ? 'bg-[#e2fc5c]/10 text-[#e2fc5c] border border-[#e2fc5c]/20' : 
                    'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {event.type.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Achievements Section */}
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-6 shadow-lg mb-6">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4 border-b border-zinc-800 pb-3">
          <Award className="w-4 h-4 text-[#e2fc5c]" /> Earned Badges of Achievement
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {achievements.map(ach => (
            <div key={ach.id} className="flex flex-col items-center text-center p-4 bg-[#09090b] border border-[#27272a] rounded-xl hover:border-zinc-700 transition-all">
              <div className="p-3 bg-zinc-900 rounded-full border border-zinc-850 mb-3 shadow-inner">
                {ach.icon}
              </div>
              <span className="text-xs font-bold text-white mb-1">{ach.title}</span>
              <span className="text-[9px] text-slate-400 font-semibold">{ach.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
