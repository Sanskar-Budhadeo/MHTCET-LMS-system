import React, { useState, useEffect } from 'react';
import { useLms } from '../../context/LmsContext';
import { Flame, Trophy, Award, Calendar, CheckSquare, Sparkles, Plus, Trash2, Zap, Clock } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

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
  rank: number;
  loginDates?: string[];
  weeklyActivityList?: any[];
}

// ----------------------------------------------------
// Sub-component 1: Goals & Tasks Checklist
// ----------------------------------------------------
interface TasksChecklistProps {
  tasks: Task[];
  newTaskText: string;
  setNewTaskText: (val: string) => void;
  onAddTask: (e: React.FormEvent) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export const TasksChecklist: React.FC<TasksChecklistProps> = ({
  tasks,
  newTaskText,
  setNewTaskText,
  onAddTask,
  onToggleTask,
  onDeleteTask
}) => {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-main)] rounded-2xl p-6 shadow-lg flex flex-col justify-between min-h-[280px]">
      <div>
        <h2 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border)] pb-3 mb-4">
          <CheckSquare className="w-4 h-4 text-[#e2fc5c]" /> Goals & Tasks Checklist
        </h2>
        <div className="space-y-3 max-h-[170px] overflow-y-auto pr-1">
          {tasks.map(task => (
            <div 
              key={task.id} 
              className="flex items-center justify-between gap-3 p-3 bg-[var(--bg-app)] border border-[var(--border)] rounded-xl"
            >
              <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => onToggleTask(task.id)}>
                <input 
                  type="checkbox" 
                  checked={task.completed}
                  onChange={() => {}} 
                  className="w-4 h-4 rounded text-[#e2fc5c] focus:ring-0 focus:ring-offset-0 bg-[var(--bg-card)] border-[var(--border)] accent-[#e2fc5c]"
                />
                <span className={`text-xs ${task.completed ? 'line-through text-[var(--text-light)] font-medium' : 'text-[var(--text-main)] font-semibold'}`}>
                  {task.text}
                </span>
              </div>
              <button 
                onClick={() => onDeleteTask(task.id)}
                className="text-[var(--text-muted)] hover:text-red-400 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {tasks.length === 0 && (
            <p className="text-xs text-[var(--text-muted)] text-center py-6 font-semibold">
              No active tasks. Create your first daily goal!
            </p>
          )}
        </div>
      </div>

      <form onSubmit={onAddTask} className="flex gap-2 mt-4 pt-4 border-t border-[var(--border)]">
        <input 
          type="text" 
          className="flex-1 bg-[var(--bg-app)] border border-[var(--border)] text-xs rounded-xl px-3.5 py-2.5 text-[var(--text-main)] focus:outline-none focus:border-[var(--text-muted)] font-semibold placeholder:text-[var(--text-light)]"
          value={newTaskText} 
          onChange={(e) => setNewTaskText(e.target.value)} 
          placeholder="E.g. Study Chemistry formulas"
        />
        <button 
          type="submit" 
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] border border-[var(--border)] text-[var(--bg-card)] hover:text-[var(--text-main)] font-bold rounded-xl px-4 py-2 text-xs transition"
        >
          Add Goal
        </button>
      </form>
    </div>
  );
};

// ----------------------------------------------------
// Sub-component 2: Subject-Wise Progress Tracker
// ----------------------------------------------------
interface WeeklyHoursChartProps {
  hoursStudied: number;
  loginDates: string[];
  weeklyActivityList?: { dayName: string; dateStr: string; hours: number }[];
}

export const WeeklyHoursChart: React.FC<WeeklyHoursChartProps> = ({ hoursStudied, loginDates, weeklyActivityList }) => {
  let data;
  let weeklyTotal = parseFloat(hoursStudied.toFixed(1));
  let dailyAverage = parseFloat((hoursStudied / 7).toFixed(1));

  if (weeklyActivityList && weeklyActivityList.length > 0) {
    data = weeklyActivityList.map(item => ({
      day: item.dayName,
      hours: parseFloat(item.hours.toFixed(1)),
      date: item.dateStr
    }));
    const actualTotal = weeklyActivityList.reduce((sum, item) => sum + item.hours, 0);
    weeklyTotal = parseFloat(actualTotal.toFixed(1));
    dailyAverage = parseFloat((actualTotal / 7).toFixed(1));
  } else {
    // Generate last 7 days list
    const getLast7Days = () => {
      const days = [];
      const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        days.push({
          dateStr: d.toISOString().split('T')[0],
          dayName: weekdayNames[d.getDay()],
          rawDate: d
        });
      }
      return days;
    };

    const days = getLast7Days();
    
    // Calculate weights based on logins & days
    const weights = days.map(d => {
      const isToday = d.dateStr === new Date().toISOString().split('T')[0];
      const isLoginDay = (loginDates || []).includes(d.dateStr);
      if (isToday) return 1.5;
      if (isLoginDay) return 1.0;
      const dayOfWeek = d.rawDate.getDay();
      const mockWeight = [0.2, 0.8, 1.2, 0.7, 0.9, 1.4, 0.5][dayOfWeek];
      return mockWeight;
    });

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    data = days.map((d, idx) => {
      const hours = (weights[idx] / totalWeight) * hoursStudied;
      return {
        day: d.dayName,
        hours: parseFloat(hours.toFixed(1)),
        date: d.dateStr
      };
    });
  }

  // Premium Custom Tooltip Component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-3 rounded-xl shadow-xl text-xs font-semibold text-[var(--text-main)]">
          <p className="text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider mb-1">
            {payload[0].payload.day}, {payload[0].payload.date}
          </p>
          <p className="flex items-center gap-1.5 text-[#e2fc5c] font-black text-sm">
            <Clock className="w-3.5 h-3.5" /> {payload[0].value} hrs
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-lg flex flex-col justify-between min-h-[360px]">
      <div>
        <div className="flex justify-between items-start border-b border-[var(--border)] pb-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#e2fc5c]" /> Weekly Activity Tracker
            </h2>
            <p className="text-[10px] text-[var(--text-muted)] font-semibold mt-0.5">
              Active learning time spent on the application
            </p>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Weekly Total</span>
              <div className="text-sm font-black text-[#e2fc5c]">{weeklyTotal} hrs</div>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Daily Avg</span>
              <div className="text-sm font-black text-[var(--text-main)]">{dailyAverage} hrs</div>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="w-full h-56 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 5, left: -25, bottom: 5 }}>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--text-light)', fontSize: 10, fontWeight: 700 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--text-light)', fontSize: 10, fontWeight: 700 }}
                allowDecimals={true}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
              <Bar 
                dataKey="hours" 
                radius={[8, 8, 0, 0]}
              >
                {data.map((entry, index) => {
                  const isToday = entry.date === new Date().toISOString().split('T')[0];
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={isToday ? '#e2fc5c' : '#22d3ee'} 
                      opacity={isToday ? 1.0 : 0.75}
                      className="hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Sub-component 3: Achievements Badges (Rank-Based Logic)
// ----------------------------------------------------
interface AchievementBadgesProps {
  rank: number;
  streak: number;
}

const getRankBadge = (rank: number) => {
  if (rank <= 5) {
    return {
      title: 'Diamond Badge',
      desc: `Platform Top Rank #${rank} (Diamond Tier)`,
      icon: <Award className="w-8 h-8 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] animate-pulse" />
    };
  } else if (rank <= 20) {
    return {
      title: 'Gold Badge',
      desc: `Platform Top Rank #${rank} (Gold Tier)`,
      icon: <Award className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
    };
  } else if (rank <= 50) {
    return {
      title: 'Silver Badge',
      desc: `Platform Top Rank #${rank} (Silver Tier)`,
      icon: <Award className="w-8 h-8 text-slate-300" />
    };
  } else {
    return {
      title: 'Bronze Badge',
      desc: `Platform Rank #${rank} (Bronze Tier)`,
      icon: <Award className="w-8 h-8 text-amber-650" />
    };
  }
};

export const AchievementBadges: React.FC<AchievementBadgesProps> = ({ rank, streak }) => {
  const rankBadge = getRankBadge(rank);
  
  const achievements = [
    { id: '1', title: 'Streak Master', desc: `${streak} Days active streak`, icon: <Flame className="w-8 h-8 text-orange-500 animate-bounce" style={{ animationDuration: '3s' }} /> },
    { id: '2', title: 'Accuracy Ace', desc: 'Dynamic score evaluator', icon: <Trophy className="w-8 h-8 text-[#e2fc5c]" /> },
    { id: '3', title: 'Formula Wizard', desc: 'Completed Physics drills', icon: <Sparkles className="w-8 h-8 text-cyan-400" /> },
    { id: '4', title: rankBadge.title, desc: rankBadge.desc, icon: rankBadge.icon }
  ];

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-lg mb-6">
      <h2 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 mb-4 border-b border-[var(--border)] pb-3">
        <Award className="w-4 h-4 text-[#e2fc5c]" /> Earned Badges of Achievement
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {achievements.map(ach => (
          <div key={ach.id} className="flex flex-col items-center text-center p-4 bg-[var(--bg-app)] border border-[var(--border)] rounded-xl hover:border-[var(--text-light)] transition-all transform hover:-translate-y-1 duration-200">
            <div className="p-3 bg-[var(--bg-card)] rounded-full border border-[var(--border)] mb-3 shadow-inner">
              {ach.icon}
            </div>
            <span className="text-xs font-bold text-[var(--text-main)] mb-1">{ach.title}</span>
            <span className="text-[9px] text-[var(--text-muted)] font-semibold">{ach.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Main Component: StudentOverview
// ----------------------------------------------------
export const StudentOverview: React.FC = () => {
  const { activeUser, attempts } = useLms();

  // Load Tailwind CDN dynamically to parse utility classes if not already globally configured
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  // Onboarding welcome modal tour
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
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('student_overview_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTaskText, setNewTaskText] = useState('');
  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);

  // Persist tasks in localStorage fallback to prevent loss on refresh
  useEffect(() => {
    localStorage.setItem('student_overview_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Fetch Dashboard Data from MERN Backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setLoadingTests(true);
        const token = localStorage.getItem('mht_cet_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const [dashRes, testsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/student/overview-data', { headers }),
          axios.get('http://localhost:5000/api/student/available-tests', { headers }).catch(() => ({ data: [] }))
        ]);

        setDashboardData(dashRes.data);
        setTasks(dashRes.data.tasks || []);
        setAvailableTests(testsRes.data || []);
      } catch (err) {
        console.error('Error fetching student overview dashboard data:', err);
      } finally {
        setLoading(false);
        setLoadingTests(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Tasks mutation helpers using optimistic UI updates and local in-memory fallbacks
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    
    const localId = 't_local_' + Math.random().toString(36).substring(2, 9);
    const localTask = { id: localId, text: newTaskText.trim(), completed: false };
    
    // Optimistically add to UI state
    setTasks(prev => [...prev, localTask]);
    const textToSave = newTaskText.trim();
    setNewTaskText('');

    try {
      const token = localStorage.getItem('mht_cet_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post('http://localhost:5000/api/student/tasks', { text: textToSave }, { headers });
      
      // Update with backend-generated ID
      setTasks(prev => prev.map(t => t.id === localId ? response.data : t));
    } catch (err) {
      console.warn('Backend server/DB connection offline. Retaining local task.', err);
    }
  };

  const toggleTask = async (id: string) => {
    // Optimistically toggle status locally
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));

    try {
      const token = localStorage.getItem('mht_cet_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.put(`http://localhost:5000/api/student/tasks/${id}/toggle`, {}, { headers });
      
      // Sync state with backend response
      setTasks(prev => prev.map(t => t.id === id ? response.data : t));
    } catch (err) {
      console.warn('Backend server/DB connection offline. Retaining local toggle.', err);
    }
  };

  const deleteTask = async (id: string) => {
    // Optimistically remove task locally
    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      const token = localStorage.getItem('mht_cet_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`http://localhost:5000/api/student/tasks/${id}`, { headers });
    } catch (err) {
      console.warn('Backend server/DB connection offline. Retaining local deletion.', err);
    }
  };

  // Helper to parse dates robustly
  const formatEventDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return {
          month: monthNames[d.getMonth()].toUpperCase(),
          day: String(d.getDate()).padStart(2, '0')
        };
      }
    } catch (e) {}
    
    // Fallback to split if it's already in the old human-readable format
    const parts = dateStr.split(' ');
    return {
      month: parts[0]?.substring(0, 3).toUpperCase() || 'JUL',
      day: parts[1]?.replace(',', '') || '01'
    };
  };

  // Spinner Loading State UI
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[var(--border)] border-t-[#e2fc5c] animate-spin" />
          <span className="text-xs font-bold text-[var(--text-muted)] tracking-wider">Loading dashboard data...</span>
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
  const sortedAttempts = [...(attempts || [])].sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());
  const accuracyIndex = sortedAttempts.length > 0 ? sortedAttempts[0].accuracy : (dashboardData?.accuracyIndex ?? 37);

  const calculateStreak = (dates: string[]): number => {
    if (!dates || dates.length === 0) return 0;
    const sortedDates = [...dates]
      .map(d => new Date(d).toISOString().split('T')[0])
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    let streakCount = 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (!sortedDates.includes(todayStr) && !sortedDates.includes(yesterdayStr)) {
      return 0;
    }
    let checkDate = sortedDates.includes(todayStr) ? today : yesterday;
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (sortedDates.includes(dateStr)) {
        streakCount++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streakCount;
  };
  const streak = activeUser?.loginDates ? calculateStreak(activeUser.loginDates) : (dashboardData?.streak ?? 0);
  const hoursStudied = dashboardData?.hoursStudied ?? 0;
  const upcomingEvents = dashboardData?.upcomingEvents || [];
  
  const upcomingDeadlines = availableTests
    .filter(t => {
      const start = t.start_time ? new Date(t.start_time) : new Date(t.scheduledTime);
      return start > new Date();
    })
    .map(t => {
      const start = t.start_time ? new Date(t.start_time) : new Date(t.scheduledTime);
      return {
        id: t.id || t._id,
        title: t.title || t.test_name,
        date: start.toISOString(),
        time: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'test',
        duration: t.duration || t.duration_minutes
      };
    });
  const rank = dashboardData?.rank ?? 4;
  const syllabusProgress = dashboardData?.syllabusProgress || {
    physics: { mastered: 0, total: 4, percentage: 0 },
    chemistry: { mastered: 0, total: 4, percentage: 0 },
    math: { mastered: 0, total: 3, percentage: 0 }
  };

  return (
    <div className="w-full min-h-screen text-[var(--text-main)] flex flex-col gap-6 p-4 md:p-8 bg-[var(--bg-app)] font-sans relative">
      
      {/* Onboarding Welcome Tour Overlay */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
          <div className="bg-[var(--bg-card)] border-2 border-[#e2fc5c]/35 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-4 bg-[#e2fc5c]/10 rounded-full border border-[#e2fc5c]/25">
                <Sparkles className="w-10 h-10 text-[#e2fc5c] animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-[var(--text-main)]">
                {tourStep === 1 && "Welcome to MHT-CET Ace!"}
                {tourStep === 2 && "Performance Analytics"}
                {tourStep === 3 && "AI Adaptive Tools"}
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed font-semibold">
                {tourStep === 1 && "Your customized dashboard layout is ready. Let's walk through the key features to maximize your score improvement."}
                {tourStep === 2 && "Track your active streaks, accuracy indices, and estimated national rank standing in real-time."}
                {tourStep === 3 && "Use the AI Adaptive Learning and Analysis sections in the sidebar to run custom micro-drills to target your concept gaps."}
              </p>
              
              <div className="flex items-center gap-1.5 mt-2">
                <div className={`w-2 h-2 rounded-full ${tourStep === 1 ? 'bg-[#e2fc5c]' : 'bg-[var(--border)]'}`} />
                <div className={`w-2 h-2 rounded-full ${tourStep === 2 ? 'bg-[#e2fc5c]' : 'bg-[var(--border)]'}`} />
                <div className={`w-2 h-2 rounded-full ${tourStep === 3 ? 'bg-[#e2fc5c]' : 'bg-[var(--border)]'}`} />
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
          <span className="bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-main)] rounded-full px-3.5 py-1 text-xs font-bold">
            Target: MHT-CET (PCM)
          </span>
          <span className="border border-dashed border-[#e2fc5c]/50 bg-[#e2fc5c]/5 text-[#e2fc5c] rounded-full px-3.5 py-1 text-xs font-bold flex items-center gap-1">
            <Zap className="w-3 h-3 fill-[#e2fc5c]" /> {plan} Plan
          </span>
          <span className="bg-[#e2fc5c]/10 text-[#e2fc5c] border border-[#e2fc5c]/25 rounded-full px-3.5 py-1 text-xs font-bold flex items-center gap-1">
            <Trophy className="w-3 h-3 text-[#e2fc5c]" /> Platform Rank #{rank}
          </span>
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-main)]">
            Welcome back, {studentName}!
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1 font-semibold">
            Email: <span className="text-[var(--text-main)]">{studentEmail}</span> | Billing ID: <span className="text-[var(--text-main)]">{billingId}</span> | PRN: <span className="text-[var(--text-main)]">{studentPrn}</span>
          </p>
        </div>
      </div>

      {/* 1. Hero Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: AI Achievements & Badges */}
        <div className="bg-[var(--bg-card)] border-2 border-[#e2fc5c] rounded-2xl p-6 shadow-[0_0_15px_rgba(226,252,92,0.15)] flex flex-col justify-between min-h-[160px] transition hover:shadow-[0_0_25px_rgba(226,252,92,0.3)] duration-300">
          <div>
            <div className="flex justify-between items-center text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
              <span>AI Achievements & Badges</span>
              <span className="bg-[#e2fc5c]/10 text-[#e2fc5c] border border-[#e2fc5c]/25 px-2 py-0.5 rounded-full text-[9px] font-bold">
                Gamified Rank
              </span>
            </div>
            
            {sortedAttempts.length === 0 ? (
              <div className="flex flex-col gap-1 mt-4">
                <h4 className="text-xs font-black text-[var(--text-main)]">No achievements unlocked yet</h4>
                <p className="text-[10px] text-[var(--text-muted)] font-semibold mt-0.5 leading-relaxed">
                  Take your first mock test to unlock AI achievements and gamification insights!
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3.5 mt-3.5">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl shadow-lg flex items-center justify-center">
                  <Award className="w-8 h-8 animate-bounce" style={{ animationDuration: '3s' }} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[var(--text-main)]">Consistent Scholar</h4>
                  <p className="text-[10px] text-[var(--text-muted)] font-semibold mt-0.5">
                    Unlocked by maintaining study streaks
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 items-center text-[10px] font-black text-[#e2fc5c] mt-4 border-t border-[var(--border)] pt-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {sortedAttempts.length === 0 ? 'AI ENGINE: READY TO GRADE' : 'AI ENGINE: 1 BADGE EARNED'}
            </span>
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
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-lg flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-[#e2fc5c]" />
              <span>Academic Integrator</span>
            </div>
            <h3 className="text-sm font-bold text-[var(--text-main)] mt-3">
              Elevate Prep to Next Level
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed font-semibold">
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
        
        {/* Left Column: Weekly Hours Spent Sub-component */}
        <div className="lg:col-span-7">
          <WeeklyHoursChart 
            hoursStudied={hoursStudied} 
            loginDates={dashboardData?.loginDates || activeUser?.loginDates || []} 
            weeklyActivityList={dashboardData?.weeklyActivityList}
          />
        </div>

        {/* Right Column: Goals & Tasks Checklist Sub-component */}
        <div className="lg:col-span-5">
          <TasksChecklist 
            tasks={tasks}
            newTaskText={newTaskText}
            setNewTaskText={setNewTaskText}
            onAddTask={handleAddTask}
            onToggleTask={toggleTask}
            onDeleteTask={deleteTask}
          />
        </div>

      </div>

      {/* 3. Calendar & Deadlines (Upcoming Exams) with Overflow & Scroll Fix */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-lg">
        <h2 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 mb-4 border-b border-[var(--border)] pb-3">
          <Calendar className="w-4 h-4 text-[#e2fc5c]" /> Calendar & Upcoming Exam Deadlines
        </h2>
        <div className="max-h-64 overflow-y-auto pr-2 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-zinc-850 scrollbar-track-transparent">
          {loadingTests && (
            <p className="text-xs text-[var(--text-muted)] text-center py-6 font-semibold animate-pulse">
              Loading upcoming deadlines...
            </p>
          )}

          {!loadingTests && upcomingDeadlines.map(event => {
            const dateParsed = formatEventDate(event.date);
            return (
              <div key={event.id} className="flex gap-4 p-4 bg-[var(--bg-app)] border border-[var(--border)] rounded-xl">
                <div className="flex flex-col items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] px-3 py-1.5 rounded text-center min-w-[70px]">
                  <span className="text-[9px] uppercase font-extrabold text-[var(--text-muted)]">
                    {dateParsed.month}
                  </span>
                  <span className="text-lg font-black text-[var(--text-main)]">
                    {dateParsed.day}
                  </span>
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-xs font-bold text-[var(--text-main)]">{event.title}</span>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mt-1 font-semibold">
                    <span>{event.time}</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-950/40 text-red-400 border border-red-500/20">
                      EXAM DEADLINE ({event.duration} Mins)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {!loadingTests && upcomingDeadlines.length === 0 && (
            <p className="text-xs text-[var(--text-muted)] text-center py-6 font-semibold">
              No upcoming exam deadlines scheduled.
            </p>
          )}
        </div>
      </div>

      {/* 4. Achievements Section Sub-component */}
      <AchievementBadges rank={rank} streak={streak} />
    </div>
  );
};
