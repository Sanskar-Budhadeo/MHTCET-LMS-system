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
  LineChart as LineChartIcon,
  Search,
  Phone,
  User as UserIcon,
  BookOpen,
  Calendar,
  X
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
  activeSection?: 'performance' | 'toppers' | 'participation' | 'faculty' | 'growth' | 'revenue' | 'users' | 'settings';
  setCurrentTab: (tab: string) => void;
  setSelectedAttemptIdForFeedback: (id: string) => void;
}

type AdminTab = 'performance' | 'toppers' | 'participation' | 'faculty' | 'growth' | 'revenue' | 'users' | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  activeSection, 
  setCurrentTab, 
  setSelectedAttemptIdForFeedback 
}) => {
  const { activeUser, leaderboard } = useLms();
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('performance');

  // Directory and Drilldown States
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetailData, setUserDetailData] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Phase 3 mock test submissions status tracker states
  const [submissionsData, setSubmissionsData] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  useEffect(() => {
    if (activeSection) {
      setActiveAdminTab(activeSection);
    }
  }, [activeSection]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const token = localStorage.getItem('mht_cet_token');
    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);
    const token = localStorage.getItem('mht_cet_token');
    try {
      const response = await fetch('http://localhost:5000/api/admin/test-submissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissionsData(data);
      }
    } catch (err) {
      console.error('Error fetching submissions tracker:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSubmissions();
  }, []);

  const handleViewUserDetail = async (id: string) => {
    setSelectedUserId(id);
    setLoadingDetail(true);
    setUserDetailData(null);
    const token = localStorage.getItem('mht_cet_token');
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserDetailData(data);
      }
    } catch (err) {
      console.error('Error fetching detailed profile:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

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
    { rank: 1, name: 'Amit Patil', course: 'PCM', percentile: 99.85, completed: 14, accuracy: '95%', jee: 12, neet: '—', cet: 1 },
    { rank: 2, name: 'Neha Deshmukh', course: 'PCB', percentile: 99.20, completed: 12, accuracy: '92%', jee: '—', neet: 8, cet: 4 },
    { rank: 3, name: 'Pranav Joshi', course: 'PCMB', percentile: 98.75, completed: 15, accuracy: '89%', jee: 94, neet: 62, cet: 10 },
    { rank: 4, name: 'Sayali Kulkarni', course: 'PCM', percentile: 93.10, completed: 9, accuracy: '80%', jee: 390, neet: '—', cet: 64 },
    { rank: 5, name: 'Rohan Mehta', course: 'PCM', percentile: 92.50, completed: 11, accuracy: '78%', jee: 450, neet: '—', cet: 72 }
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

  const filteredUsers = usersList.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.prn && user.prn.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const triggerDrilldownByName = (name: string) => {
    const found = usersList.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (found) {
      handleViewUserDetail(found._id);
    } else {
      alert(`User detail profile for "${name}" is not seeded in database. Review the User Directory tab for database accounts.`);
    }
  };

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
        {(['performance', 'toppers', 'participation', 'users', 'faculty', 'growth', 'revenue', 'settings'] as const).map(tab => (
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
             tab === 'growth' ? 'growth analytics' : 
             tab === 'users' ? 'users directory' : 
             tab === 'settings' ? 'system settings' : 'revenue reports'}
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
            <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '12px', lineHeight: '1.5' }}>
              <strong>MHT-CET Weighting & Normalisation Formula</strong>: Under the Maharashtra State CET cell guidelines, raw scores are converted into percentile scores using the formula: Percentile = 100 * (Number of candidates in a session with raw score &lt;= T) / (Total candidates in the session). Physics and Chemistry contribute 50 marks each, while Mathematics contributes 100 marks. Normalising across session cohorts accounts for differences in difficulty indices to ensure fair rankings.
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
            Toppers cohort calculated on highest weighted averages over active complete syllabus simulated mock tests. Click name to drill down details.
          </p>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center' }}>Overall Rank</th>
                  <th style={{ textAlign: 'center' }}>JEE Rank</th>
                  <th style={{ textAlign: 'center' }}>NEET Rank</th>
                  <th style={{ textAlign: 'center' }}>CET Rank</th>
                  <th>Student Name</th>
                  <th>Target Course</th>
                  <th>Percentile</th>
                  <th>Mock Tests Taken</th>
                  <th>Average Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard && leaderboard.length > 0 ? (
                  leaderboard.slice(0, 10).map(student => (
                    <tr key={student.id}>
                      <td style={{ fontWeight: 800, color: 'var(--accent)', textAlign: 'center' }}>#{student.rank}</td>
                      <td style={{ textAlign: 'center' }}>{typeof student.jee === 'number' ? `#${student.jee}` : student.jee}</td>
                      <td style={{ textAlign: 'center' }}>{typeof student.neet === 'number' ? `#${student.neet}` : student.neet}</td>
                      <td style={{ textAlign: 'center' }}>{typeof student.cet === 'number' ? `#${student.cet}` : student.cet}</td>
                      <td 
                        style={{ fontWeight: 600, color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }} 
                        onClick={() => triggerDrilldownByName(student.name)}
                      >
                        {student.name}
                      </td>
                      <td><span className="badge badge-info">{student.course}</span></td>
                      <td style={{ fontWeight: 700 }}>{typeof student.percentile === 'number' ? `${student.percentile.toFixed(2)}%` : student.percentile}</td>
                      <td>{student.completed}</td>
                      <td>{student.accuracy}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                      No leaderboard data available.
                    </td>
                  </tr>
                )}
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

          {/* Live Mock Exam Submissions Status Tracker */}
          <div className="card" style={{ gridColumn: 'span 2', marginTop: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} style={{ color: 'var(--accent)' }} /> Live Mock Exam Submissions Tracker
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Cross-reference mapping of active students and published mock tests to monitor test completion and submission metrics.
            </p>

            {loadingSubmissions ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading submissions telemetry...</p>
            ) : submissionsData.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No mock exam submissions data found in the database.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {submissionsData.map(testGroup => (
                  <div key={testGroup.testId} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', backgroundColor: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '12px' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{testGroup.testName}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Subjects: {testGroup.subjects.join(', ')}</span>
                      </div>
                      <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                        {testGroup.submissions.filter((s: any) => s.submitted).length} / {testGroup.submissions.length} Submitted
                      </span>
                    </div>

                    <div className="table-container" style={{ overflowX: 'auto' }}>
                      <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>Student Name</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>PRN</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>Status</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>Submission Date</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>Score</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>Accuracy</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testGroup.submissions.map((sub: any) => (
                            <tr key={sub.studentId} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>{sub.studentName}</td>
                              <td style={{ padding: '8px', textAlign: 'center' }}>{sub.prn || '—'}</td>
                              <td style={{ padding: '8px', textAlign: 'center' }}>
                                <span className={`badge badge-${sub.submitted ? 'success' : 'warning'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                  {sub.submitted ? 'Submitted' : 'Pending'}
                                </span>
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center', color: 'var(--text-light)' }}>
                                {sub.submitted ? sub.date : '—'}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700 }}>
                                {sub.submitted ? `${sub.score}/${sub.maxScore}` : '—'}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center', color: 'var(--accent)' }}>
                                {sub.submitted ? `${sub.accuracy}%` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* USER DIRECTORY SEARCH (STUDENT & TEACHER LIST) */}
      {activeAdminTab === 'users' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Student & Teacher Directory</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Total Accounts: <strong>{usersList.length}</strong>. Click any user to review analytical, progress, and personal details.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-app)', maxWidth: '300px', width: '100%' }}>
              <Search size={16} style={{ color: 'var(--text-light)' }} />
              <input 
                type="text" 
                placeholder="Search name, email, PRN..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.8rem', width: '100%' }}
              />
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>PRN / ID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user.name}</td>
                    <td>
                      <span className={`badge badge-${
                        user.role === 'teacher' ? 'success' : 
                        user.role === 'student' ? 'info' : 'warning'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phone || '—'}</td>
                    <td><strong style={{ fontSize: '0.8rem' }}>{user.prn || '—'}</strong></td>
                    <td>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        color: user.status === 'active' ? 'var(--success)' : 'var(--warning)' 
                      }}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleViewUserDetail(user._id)} 
                        className="btn btn-outline btn-sm"
                        style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No matching student or teacher accounts found in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
            Summary of exams compiled, study guides uploaded, and manual student evaluations resolved by active teachers. Click names to view detail.
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
                    <td 
                      style={{ fontWeight: 600, color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => triggerDrilldownByName(fac.name)}
                    >
                      {fac.name}
                    </td>
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
              <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '12px', lineHeight: '1.5' }}>
                <strong>Subscription Elasticity & ACV Dynamics</strong>: Analysis of active subscription models indicates that Annualised Contract Value (ACV) grows exponentially with Pro/Premium tier conversion. The pricing elasticity shows high user willingness to pay for custom practice test mocks and automated revision cycles near state exam dates, optimizing customer lifetime value.
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

      {/* SYSTEM SETTINGS */}
      {activeAdminTab === 'settings' && (
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>System Settings</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Configure default platform options, notification limits, and third-party API integration keys.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Default Academy Year</label>
              <select className="form-select" defaultValue="2026" style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                <option value="2026">2026 (Current)</option>
                <option value="2027">2027 (Next)</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>AI Insights Threshold</label>
              <select className="form-select" defaultValue="70" style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                <option value="60">60% Accuracy</option>
                <option value="70">70% Accuracy (Recommended)</option>
                <option value="80">80% Accuracy</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input type="checkbox" defaultChecked id="enableAITutor" />
              <label htmlFor="enableAITutor" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Enable Live AI Doubt Solver</label>
            </div>
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }} onClick={() => alert('Settings saved successfully (simulated)')}>
              Save Configurations
            </button>
          </div>
        </div>
      )}

      {/* Drilldown User Details Modal */}
      {selectedUserId && (
        <div className="modal-overlay" onClick={() => setSelectedUserId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserIcon size={24} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
                  Detailed User Profile Card
                </h3>
              </div>
              <button 
                onClick={() => setSelectedUserId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {loadingDetail ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Fetching user analytics profile details...
              </div>
            ) : userDetailData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Section A: Personal Details */}
                <div style={{ backgroundColor: 'var(--primary-light)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                    Personal Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '0.85rem' }}>
                    <div><strong>Name:</strong> {userDetailData.name}</div>
                    <div><strong>Role:</strong> <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{userDetailData.role}</span></div>
                    <div><strong>Email:</strong> {userDetailData.email}</div>
                    <div><strong>Phone:</strong> {userDetailData.phone || 'Not Configured'}</div>
                    {userDetailData.role === 'student' && (
                      <>
                        <div><strong>PRN Number:</strong> <strong style={{ color: '#2563eb' }}>{userDetailData.prn || '—'}</strong></div>
                        <div><strong>Status:</strong> {userDetailData.status}</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Section B: Academic Progress (Only if Student) */}
                {userDetailData.role === 'student' && (
                  <div style={{ border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                      Academic Tracker & Progress
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ textAlign: 'center', borderRight: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>DAILY STREAK</span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{userDetailData.streak || userDetailData.streaks || 0} Days</div>
                      </div>
                      <div style={{ textAlign: 'center', borderRight: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>HOURS STUDIED</span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{userDetailData.hoursStudied || 0} hrs</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>TARGET EXAM</span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{userDetailData.targetExam || 'MHT-CET'}</div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                      <div><strong>Subscription Tier:</strong> {userDetailData.plan || 'Free'}</div>
                      <div><strong>Course:</strong> {userDetailData.targetCourse || 'PCM'}</div>
                      <div><strong>Tasks Finished:</strong> {userDetailData.completedTasks || 0} goals</div>
                      <div><strong>Daily Progress:</strong> {userDetailData.dailyGoalProgress || 0}%</div>
                    </div>
                  </div>
                )}

                {/* Section C: Analysis (Attempts Logs & Weaknesses) */}
                {userDetailData.role === 'student' && (
                  <div style={{ border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                      Weak & Strong Chapters (AI Diagnostic)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                      <div>
                        <strong>Weak topics tagged:</strong>{' '}
                        {userDetailData.weakTopics && userDetailData.weakTopics.length > 0 ? (
                          userDetailData.weakTopics.map((t: string) => <span key={t} className="badge badge-danger" style={{ marginRight: '4px', fontSize: '0.65rem' }}>{t}</span>)
                        ) : <span style={{ color: 'var(--text-light)' }}>None flagged yet</span>}
                      </div>
                      <div>
                        <strong>Strong topics tagged:</strong>{' '}
                        {userDetailData.strongTopics && userDetailData.strongTopics.length > 0 ? (
                          userDetailData.strongTopics.map((t: string) => <span key={t} className="badge badge-success" style={{ marginRight: '4px', fontSize: '0.65rem' }}>{t}</span>)
                        ) : <span style={{ color: 'var(--text-light)' }}>None flagged yet</span>}
                      </div>
                    </div>

                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                      Mock Test Attempts Log ({userDetailData.testProgress?.length || 0} taken)
                    </h4>

                    {userDetailData.testProgress && userDetailData.testProgress.length > 0 ? (
                      <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {userDetailData.testProgress.map((att: any, idx: number) => (
                          <div key={idx} style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong style={{ display: 'block', color: 'var(--text-main)' }}>{att.test_name}</strong>
                              <span style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>
                                Date: {att.createdAt ? att.createdAt.split('T')[0] : '—'} | Accuracy: {att.accuracy}% | Time: {Math.round(att.time_spent_seconds / 60)}m
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <strong style={{ color: '#059669', fontSize: '0.9rem' }}>{att.score}/{att.max_score}</strong>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {att.percentile ? `${att.percentile}%ile` : 'N/A'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
                        No mock test attempts registered for this student.
                      </p>
                    )}
                  </div>
                )}

                {/* Teacher specific stats */}
                {userDetailData.role === 'teacher' && (
                  <div style={{ border: '1px solid var(--border)', padding: '16px', borderRadius: '12px' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                      Teacher Portfolio Overview
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      Teacher account is active. Registered in technical curriculum mapping for board entrance examinations. Has access to manual student feedback sheets, customized materials repository, and AI flash quiz compiler.
                    </p>
                  </div>
                )}

              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>
                Failed to load profile. Please verify server connection.
              </div>
            )}

            <button 
              onClick={() => setSelectedUserId(null)}
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '20px' }}
            >
              Close Profile View
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
