import React, { useState, useEffect } from 'react';
import { useLms } from '../../context/LmsContext';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Activity, 
  Award, 
  DollarSign, 
  ShieldAlert, 
  Zap, 
  Briefcase,
  Layers,
  LineChart as LineChartIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts';

interface AdminDashboardProps {
  setCurrentTab: (tab: string) => void;
  setSelectedAttemptIdForFeedback: (id: string) => void;
}

type AdminTab = 'performance' | 'toppers' | 'participation' | 'faculty' | 'growth' | 'revenue';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ setCurrentTab, setSelectedAttemptIdForFeedback }) => {
  const { activeUser } = useLms();
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('performance');

  // Enforce strict role-based access checks
  if (!activeUser || activeUser.role !== 'admin') {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center', margin: '40px auto', maxWidth: '600px' }}>
        <div style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', display: 'inline-flex', padding: '12px', borderRadius: '50%', marginBottom: '16px' }}>
          <ShieldAlert size={32} />
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>Access Denied</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          You do not have permission to access the Administration Dashboard. Please sign in with an authorized account.
        </p>
      </div>
    );
  }

  // Color theme helpers
  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  // Mock datasets for rich aesthetic visuals
  const subjectScores = [
    { subject: 'Physics', avgScore: 74, benchmark: 70 },
    { subject: 'Chemistry', avgScore: 78, benchmark: 70 },
    { subject: 'Mathematics', avgScore: 68, benchmark: 70 },
    { subject: 'Biology', avgScore: 82, benchmark: 70 }
  ];

  const topStudents = [
    { rank: 1, name: 'Amit Patil', course: 'PCM', percentile: 99.85, completed: 14, accuracy: '95%' },
    { rank: 2, name: 'Neha Deshmukh', course: 'PCB', percentile: 99.20, completed: 12, accuracy: '92%' },
    { rank: 3, name: 'Pranav Joshi', course: 'PCMB', percentile: 98.75, completed: 15, accuracy: '89%' },
    { rank: 4, name: 'Sayali Kulkarni', course: 'PCM', percentile: 93.10, completed: 9, accuracy: '80%' },
    { rank: 5, name: 'Rohan Mehta', course: 'PCM', percentile: 92.50, completed: 11, accuracy: '78%' }
  ];

  const testParticipation = [
    { name: 'Full syllabus', value: 1240 },
    { name: 'Chapter-wise', value: 3450 },
    { name: 'Subject-wise', value: 2120 },
    { name: 'AI Adaptive', value: 840 }
  ];

  const facultyPerformance = [
    { name: 'Prof. Sharma', department: 'Physics', tests: 14, materials: 28, feedback: 124 },
    { name: 'Dr. Deshmukh', department: 'Chemistry', tests: 12, materials: 22, feedback: 98 },
    { name: 'Prof. Joshi', department: 'Mathematics', tests: 18, materials: 15, feedback: 142 },
    { name: 'Dr. Patil', department: 'Biology', tests: 10, materials: 31, feedback: 76 }
  ];

  const growthTimeline = [
    { month: 'Jan', students: 250, paid: 40 },
    { month: 'Feb', students: 480, paid: 85 },
    { month: 'Mar', students: 890, paid: 150 },
    { month: 'Apr', students: 1450, paid: 280 },
    { month: 'May', students: 2120, paid: 410 },
    { month: 'Jun', students: 3240, paid: 535 }
  ];

  const revenueSplits = [
    { name: 'Free Tier', value: 2705, revenue: 0 },
    { name: 'Pro Tier (₹1,499)', value: 420, revenue: 629580 },
    { name: 'Premium (₹2,999)', value: 115, revenue: 344885 }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
          Administration Console
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          High-level analytics overview monitoring overall platform KPIs, toppers cohort, and growth trajectories.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '8px', paddingBottom: '2px', flexWrap: 'wrap' }}>
        {(['performance', 'toppers', 'participation', 'faculty', 'growth', 'revenue'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveAdminTab(tab)} 
            style={{ 
              border: 'none', 
              background: 'none', 
              padding: '10px 16px', 
              fontWeight: 600, 
              cursor: 'pointer',
              fontSize: '0.85rem',
              borderBottom: activeAdminTab === tab ? '3px solid var(--accent)' : '3px solid transparent',
              color: activeAdminTab === tab ? 'var(--text-main)' : 'var(--text-muted)',
              textTransform: 'capitalize',
              transition: 'all 0.2s ease'
            }}
          >
            {tab === 'performance' ? 'overall performance' : 
             tab === 'toppers' ? 'top students' : 
             tab === 'participation' ? 'test participations' : 
             tab === 'faculty' ? 'faculty performance' : 
             tab === 'growth' ? 'growth analytics' : 'revenue reports'}
          </button>
        ))}
      </div>

      {/* OVERALL PERFORMANCE */}
      {activeAdminTab === 'performance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: '#eff6ff', color: 'var(--accent)', padding: '16px', borderRadius: '12px' }}>
                <TrendingUp size={32} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Platform Avg Correctness</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>74.2%</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>+2.4% from last cohort</span>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: '#ecfdf5', color: '#10b981', padding: '16px', borderRadius: '12px' }}>
                <Activity size={32} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Total Solved Answers</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>142,500+</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MHT-CET simulated MCQs</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Subject Performance & Benchmarks</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectScores} margin={{ top: 20, right: 30, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="subject" fontSize={11} stroke="var(--text-muted)" />
                  <YAxis fontSize={11} stroke="var(--text-muted)" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }} />
                  <Legend />
                  <Bar dataKey="avgScore" name="Cohort Average (%)" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="benchmark" name="Target Pass Benchmark (%)" fill="#64748b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TOP STUDENTS */}
      {activeAdminTab === 'toppers' && (
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} style={{ color: '#f59e0b' }} /> Platform Leaderboard (Top Rank Standings)
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Toppers cohort calculated on highest weighted averages over active complete syllabus simulated mock tests.
          </p>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>National Rank</th>
                  <th>Student Name</th>
                  <th>Target Course</th>
                  <th>Percentile</th>
                  <th>Mock Tests Taken</th>
                  <th>Average Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {topStudents.map(student => (
                  <tr key={student.rank}>
                    <td style={{ fontWeight: 800, color: 'var(--accent)' }}>#{student.rank}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{student.name}</td>
                    <td><span className="badge badge-info">{student.course}</span></td>
                    <td style={{ fontWeight: 700 }}>{student.percentile}%ile</td>
                    <td>{student.completed}</td>
                    <td>{student.accuracy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TEST PARTICIPATIONS */}
      {activeAdminTab === 'participation' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Simulations Categorized Participations</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={testParticipation} layout="vertical" margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" fontSize={11} stroke="var(--text-muted)" />
                  <YAxis dataKey="name" type="category" fontSize={11} stroke="var(--text-muted)" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }} />
                  <Bar dataKey="value" name="Total Submissions" fill="var(--accent)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifySelf: 'stretch', justifyContent: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', textAlign: 'center' }}>Distribution Breakdown</h3>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={testParticipation}
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    dataKey="value"
                  >
                    {testParticipation.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', marginTop: '16px' }}>
              {testParticipation.map((p, idx) => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', backgroundColor: PIE_COLORS[idx % PIE_COLORS.length], borderRadius: '2px' }} />
                  <span>{p.name} ({Math.round(p.value / 76.5)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FACULTY PERFORMANCE */}
      {activeAdminTab === 'faculty' && (
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={18} style={{ color: 'var(--accent)' }} /> Faculty Contributions & Review Timelines
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Summary of exams compiled, study guides uploaded, and manual student evaluations resolved by active teachers.
          </p>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Instructor</th>
                  <th>Department</th>
                  <th>Exams Compiled</th>
                  <th>Materials Contributed</th>
                  <th>Feedback Comments</th>
                </tr>
              </thead>
              <tbody>
                {facultyPerformance.map(fac => (
                  <tr key={fac.name}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{fac.name}</td>
                    <td><span className={`badge badge-${fac.department.toLowerCase()}`}>{fac.department}</span></td>
                    <td style={{ fontWeight: 700 }}>{fac.tests} MCQs sets</td>
                    <td>{fac.materials} modules</td>
                    <td>{fac.feedback} sheets</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GROWTH ANALYTICS */}
      {activeAdminTab === 'growth' && (
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LineChartIcon size={18} style={{ color: 'var(--accent)' }} /> Student Registration Trends
          </h3>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthTimeline} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }} />
                <Legend />
                <Area type="monotone" dataKey="students" name="Registered Students" stroke="var(--accent)" fillOpacity={1} fill="url(#colorStudents)" strokeWidth={2} />
                <Line type="monotone" dataKey="paid" name="Paid Subscribers" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* REVENUE REPORTS */}
      {activeAdminTab === 'revenue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: '#eff6ff', color: 'var(--accent)', padding: '16px', borderRadius: '12px' }}>
                <DollarSign size={32} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Annualized Contract Value</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>₹9,74,465</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pro & Premium sub tiers combined</span>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: '#ecfdf5', color: '#10b981', padding: '16px', borderRadius: '12px' }}>
                <Zap size={32} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Paid Conversion Rate</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>16.5%</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Free-to-Pro billing collections</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Revenue Contribution by Tier</h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueSplits} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" fontSize={11} stroke="var(--text-muted)" />
                    <YAxis fontSize={11} stroke="var(--text-muted)" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }} />
                    <Bar dataKey="revenue" name="Total Revenue (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Subscriber Base Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                {revenueSplits.map((split, idx) => (
                  <div key={split.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></div>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{split.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{split.value} users</span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                        Share: {Math.round((split.value / 3240) * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
