import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Plus, Calendar, User, FileText, CheckCircle, TrendingUp, Loader2, Check, AlertCircle, X, Clock, HelpCircle, Award, BookOpen, Activity } from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface Student {
  id: string;
  _id?: string;
  name: string;
  email: string;
  targetCourse?: string;
  targetExam?: string;
  plan?: string;
  prn: string;
  status: string;
}

interface CalendarEvent {
  id?: string;
  _id?: string;
  title: string;
  date: string;
  type: string;
  subject: string;
}

interface TeacherDashboardProps {
  view?: 'dashboard' | 'tracking';
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ view = 'dashboard' }) => {
  const { fetchEvents: fetchEventsGlobal } = useLms();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'submitted'>('all');

  // Student details metrics states
  const [studentDetail, setStudentDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [activeInfoTab, setActiveInfoTab] = useState<'overview' | 'progress' | 'attempts'>('overview');

  // AI Report State
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Teacher feedback submission states
  const [feedbackInputs, setFeedbackInputs] = useState<{ [attemptId: string]: string }>({});

  const submitTeacherFeedback = (attemptId: string, text: string) => {
    if (!text.trim()) return;
    const token = localStorage.getItem('mht_cet_token');
    fetch(`http://localhost:5000/api/attempts/${attemptId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({ text })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to submit feedback');
        return res.json();
      })
      .then(data => {
        alert('Feedback guidelines successfully published to Student & Parent portals!');
        // Update local studentDetail copy so the UI refreshes immediately
        if (studentDetail && studentDetail.testProgress) {
          const updatedProgress = studentDetail.testProgress.map((att: any) => {
            if (att._id === attemptId || att.id === attemptId) {
              return { ...att, feedback: data.feedback };
            }
            return att;
          });
          setStudentDetail({ ...studentDetail, testProgress: updatedProgress });
        }
        // Clear input field
        setFeedbackInputs(prev => ({ ...prev, [attemptId]: '' }));
      })
      .catch(err => {
        console.error('Error submitting feedback:', err);
        alert('Failed to save feedback on database.');
      });
  };

  // Custom Test Schedule State
  const [testTitle, setTestTitle] = useState<string>('');
  const [testDate, setTestDate] = useState<string>('');
  const [testSubject, setTestSubject] = useState<string>('Physics');
  const [scheduling, setScheduling] = useState<boolean>(false);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Calendar events list state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(false);

  // Phase 3 submissions tracker states
  const [submissionsData, setSubmissionsData] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);

  // Fetch upcoming scheduled events
  const fetchEvents = () => {
    setLoadingEvents(true);
    fetch('http://localhost:5000/api/events')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEvents(data);
        }
        setLoadingEvents(false);
      })
      .catch(err => {
        console.error('Error fetching calendar events:', err);
        setLoadingEvents(false);
      });
  };

  const fetchSubmissions = () => {
    setLoadingSubmissions(true);
    const token = localStorage.getItem('mht_cet_token');
    fetch('http://localhost:5000/api/admin/test-submissions', {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Submissions API error');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setSubmissionsData(data);
        }
        setLoadingSubmissions(false);
      })
      .catch(err => {
        console.error('Error fetching teacher test submissions:', err);
        setLoadingSubmissions(false);
      });
  };

  useEffect(() => {
    // Initial fetch of calendar events
    fetchEvents();
    // Fetch mock test submissions tracker
    fetchSubmissions();
    // Default search for students on load
    handleSearch('Rahul');
  }, []);

  const handleSearch = (queryVal?: string) => {
    const q = queryVal !== undefined ? queryVal : searchQuery;
    if (!q.trim()) {
      setError('Please enter a search term.');
      return;
    }
    setError(null);
    setLoadingSearch(true);

    const token = localStorage.getItem('mht_cet_token');
    fetch(`http://localhost:5000/api/teacher/students/search?query=${encodeURIComponent(q)}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Search request failed');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setStudents(data);
          if (data.length === 0) {
            setError('No students found matching that query.');
          }
        }
        setLoadingSearch(false);
      })
      .catch(err => {
        console.error('Error searching students:', err);
        setError('Failed to fetch students. Rendering offline fallback list.');
        // Set offline mock list if endpoint fails
        setStudents([
          { id: 'u_ राहुल', name: 'Rahul Sharma', email: 'rahul@cet.com', targetCourse: 'PCM', targetExam: 'MHT-CET', plan: 'Pro', prn: 'MHT202612345', status: 'active' },
          { id: 'u_प्रिया', name: 'Priya Patil', email: 'priya@cet.com', targetCourse: 'PCB', targetExam: 'MHT-CET', plan: 'Free', prn: 'MHT202654321', status: 'active' },
          { id: 'u_अमित', name: 'Amit Deshmukh', email: 'amit@cet.com', targetCourse: 'PCMB', targetExam: 'MHT-CET', plan: 'Premium', prn: 'MHT202688990', status: 'active' }
        ]);
        setLoadingSearch(false);
      });
  };

  const handleGenerateReport = (studentId: string) => {
    setLoadingReport(true);
    setAiReport(null);
    setReportError(null);

    const token = localStorage.getItem('mht_cet_token');
    fetch('http://localhost:5000/api/teacher/generate-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({ studentId })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to generate report card');
        return res.json();
      })
      .then(data => {
        if (data.report) {
          setAiReport(data.report);
        } else {
          setReportError('No report content returned.');
        }
        setLoadingReport(false);
      })
      .catch(err => {
        console.error('Error generating AI report:', err);
        setReportError('Failed to call AI API. Displaying standard evaluation.');
        setAiReport(`### Student Performance Evaluation Report (Local Diagnostics)

* Cumulative Mock Accuracy: **76%**
* Status: Active

**Action Items**:
1. Review physics rolling inertia equations.
2. Complete chemistry kinetics first-order reaction practice.`);
        setLoadingReport(false);
      });
  };

  const handleScheduleTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim() || !testDate || !testSubject) {
      setScheduleError('Please fill out all schedule fields.');
      return;
    }
    setScheduleError(null);
    setScheduleSuccess(null);
    setScheduling(true);

    const token = localStorage.getItem('mht_cet_token');
    fetch('http://localhost:5000/api/teacher/schedule-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        title: testTitle,
        date: testDate,
        subject: testSubject
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Test scheduling failed.');
        return res.json();
      })
      .then(data => {
        setScheduleSuccess(`Successfully scheduled custom test "${testTitle}" for ${testDate}. Alerts sent to all active students!`);
        setTestTitle('');
        setTestDate('');
        setScheduling(false);
        fetchEvents(); // Refresh upcoming lists
        fetchEventsGlobal(); // Refresh global events for student portal
      })
      .catch(err => {
        console.error('Error scheduling test:', err);
        setScheduleError('Failed to schedule test. Please check database connectivity.');
        setScheduling(false);
      });
  };

  const selectStudent = async (student: Student) => {
    setSelectedStudent(student);
    setAiReport(null);
    setReportError(null);
    setStudentDetail(null);
    setLoadingDetail(true);
    setActiveInfoTab('overview');

    const token = localStorage.getItem('mht_cet_token');
    const studentId = student.id || student._id;
    if (!studentId) {
      setLoadingDetail(false);
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStudentDetail(data);
      }
    } catch (err) {
      console.error('Error fetching student detailed metrics for teacher:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (view === 'tracking') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Page Header */}
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
            Exam Tracking & Submissions
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Track mock test submissions, pending completions, and grade logs across all classes.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <FileText size={18} style={{ color: 'var(--accent)' }} /> Mock Exam Submissions Tracker
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-light)' }}>Filter by Status:</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="form-select"
                style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', border: '1px solid var(--border)' }}
              >
                <option value="all">All Submissions</option>
                <option value="submitted">Submitted</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {loadingSubmissions ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '20px 0' }}>
              <Loader2 size={16} className="spinner" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading submissions data...</span>
            </div>
          ) : submissionsData.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>
              No mock test submissions data found in the database.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {submissionsData.map(testGroup => {
                const matchedRows = testGroup.submissions.filter((sub: any) => {
                  if (statusFilter === 'all') return true;
                  if (statusFilter === 'pending') return !sub.submitted;
                  if (statusFilter === 'submitted') return sub.submitted;
                  return true;
                });

                return (
                  <div key={testGroup.testId} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', backgroundColor: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '12px' }}>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>{testGroup.testName}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Subjects: {testGroup.subjects.join(', ')}</span>
                      </div>
                      <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                        {testGroup.submissions.filter((s: any) => s.submitted).length} / {testGroup.submissions.length} Submitted
                      </span>
                    </div>

                    <div className="table-container" style={{ overflowX: 'auto' }}>
                      <table className="table" style={{ width: '100%', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '6px 8px', textAlign: 'left' }}>Student</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>PRN</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>Status</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>Date</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>Score</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>Accuracy</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matchedRows.map((sub: any) => (
                            <tr key={sub.studentId} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '8px 4px', textAlign: 'left', fontWeight: 600 }}>{sub.studentName}</td>
                              <td style={{ padding: '8px 4px', textAlign: 'center' }}>{sub.prn || '—'}</td>
                              <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                                <span className={`badge badge-${sub.submitted ? 'success' : 'warning'}`} style={{ fontSize: '0.65rem', padding: '1px 4px' }}>
                                  {sub.submitted ? 'Submitted' : 'Pending'}
                                </span>
                              </td>
                              <td style={{ padding: '8px 4px', textAlign: 'center', color: 'var(--text-light)' }}>
                                {sub.submitted ? sub.date : '—'}
                              </td>
                              <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 700 }}>
                                {sub.submitted ? `${sub.score}/${sub.maxScore}` : '—'}
                              </td>
                              <td style={{ padding: '8px 4px', textAlign: 'center', color: 'var(--accent)' }}>
                                {sub.submitted ? `${sub.accuracy}%` : '—'}
                              </td>
                            </tr>
                          ))}
                          {matchedRows.length === 0 && (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                No student test records match the filter status.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
          Teacher Dashboard & Class Panel
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Monitor individual student enrollment metrics, dispatch personalized AI diagnostics, and schedule mock tests.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Student search and event stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Search Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} style={{ color: 'var(--accent)' }} /> Student Directory
            </h3>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input
                  type="text"
                  placeholder="Search by Name or PRN..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-main)',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
              <button 
                onClick={() => handleSearch()} 
                className="btn btn-primary"
                disabled={loadingSearch}
                style={{ padding: '8px 16px' }}
              >
                {loadingSearch ? <Loader2 size={16} className="spinner" /> : 'Search'}
              </button>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning)', fontSize: '0.75rem' }}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {/* Student list results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px', maxHeight: '350px', overflowY: 'auto' }}>
              {students.map(s => {
                const isSelected = selectedStudent?.id === s.id || (s._id && selectedStudent?._id === s._id);
                return (
                  <div
                    key={s.id || s._id}
                    onClick={() => selectStudent(s)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                      backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                    className="student-list-item"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? 'var(--accent)' : 'var(--text-main)' }}>
                        {s.name}
                      </span>
                      <span className={`badge badge-${s.plan?.toLowerCase() === 'premium' ? 'info' : s.plan?.toLowerCase() === 'pro' ? 'success' : 'secondary'}`} style={{ fontSize: '0.65rem' }}>
                        {s.plan || 'Free'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>PRN: <strong>{s.prn}</strong></span>
                      <span>Exam: {s.targetCourse} / {s.targetExam}</span>
                    </div>
                  </div>
                );
              })}
              {students.length === 0 && !loadingSearch && (
                <p style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.8rem', padding: '20px 0' }}>
                  Enter student name or PRN to load records.
                </p>
              )}
            </div>
          </div>

          {/* Scheduled Tests Stream */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} style={{ color: 'var(--info)' }} /> Scheduled Mock Exams
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto' }}>
              {events.filter(ev => ev.type === 'Test').map((ev, index) => (
                <div key={ev.id || ev._id || index} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{ev.title}</span>
                    <span className="badge badge-info" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>
                      {ev.subject}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.725rem', color: 'var(--text-light)' }}>
                    <Clock size={12} />
                    <span>Scheduled for: {ev.date}</span>
                  </div>
                </div>
              ))}
              {events.filter(ev => ev.type === 'Test').length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '10px 0' }}>
                  No scheduled tests found in system calendar.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Selection detail panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {selectedStudent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Selected Profile Banner */}
              <div className="card" style={{
                background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(37, 99, 235, 0.03) 100%)',
                borderColor: 'var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px',
                position: 'relative'
              }}>
                <button
                  onClick={() => setSelectedStudent(null)}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-light)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  title="Close Profile View and Return to Class Tracker"
                >
                  <X size={18} />
                </button>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{selectedStudent.name}</h3>
                    <span className={`badge badge-${selectedStudent.status === 'active' ? 'success' : 'warning'}`} style={{ fontSize: '0.65rem' }}>
                      {selectedStudent.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    Permanent Registration Number: <strong style={{ color: 'var(--text-main)' }}>{selectedStudent.prn}</strong>
                  </p>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Email: <span>{selectedStudent.email}</span>
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Target Preparation</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)' }}>
                    {selectedStudent.targetCourse} / {selectedStudent.targetExam || 'MHT-CET'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Billing Tier: {selectedStudent.plan || 'Free'}
                  </span>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: '8px', gap: '16px' }}>
                <button
                  type="button"
                  onClick={() => setActiveInfoTab('overview')}
                  className={`btn btn-xs ${activeInfoTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ height: '32px', padding: '0 16px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <Sparkles size={14} style={{ marginRight: '4px' }} />
                  Overview & Diagnostics
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInfoTab('progress')}
                  className={`btn btn-xs ${activeInfoTab === 'progress' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ height: '32px', padding: '0 16px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <TrendingUp size={14} style={{ marginRight: '4px' }} />
                  AI Analytics & Progress
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInfoTab('attempts')}
                  className={`btn btn-xs ${activeInfoTab === 'attempts' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ height: '32px', padding: '0 16px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <FileText size={14} style={{ marginRight: '4px' }} />
                  Mock Exam History
                </button>
              </div>

              {/* Tab Content A: Overview & Custom Schedule */}
              {activeInfoTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Generate AI report */}
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={18} style={{ color: 'var(--accent)' }} /> AI Student Diagnostic Evaluator
                      </h3>
                      <button
                        onClick={() => handleGenerateReport(selectedStudent.id || selectedStudent._id || '')}
                        className="btn btn-primary"
                        disabled={loadingReport}
                        style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                      >
                        {loadingReport ? (
                          <>
                            <Loader2 size={14} className="spinner" /> Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} /> Generate AI Performance Report
                          </>
                        )}
                      </button>
                    </div>

                    {reportError && (
                      <div style={{ padding: '10px 14px', backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: '6px', color: 'var(--danger)', fontSize: '0.775rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <AlertCircle size={14} />
                        <span>{reportError}</span>
                      </div>
                    )}

                    {aiReport ? (
                      <div style={{
                        backgroundColor: 'var(--bg-app)',
                        border: '1px dashed var(--border)',
                        borderRadius: '8px',
                        padding: '20px',
                        fontSize: '0.85rem',
                        lineHeight: '1.6',
                        color: 'var(--text-main)',
                        maxHeight: '350px',
                        overflowY: 'auto',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {aiReport}
                      </div>
                    ) : !loadingReport ? (
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                        No report has been compiled yet. Click the button above to request automated AI performance evaluation card.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '40px 0' }}>
                        <Loader2 size={32} className="spinner" style={{ color: 'var(--accent)' }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gemini AI analyzing student mock test database metrics...</span>
                      </div>
                    )}
                  </div>

                  {/* Custom Test Scheduler form */}
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Plus size={18} style={{ color: 'var(--accent)' }} /> Schedule Custom Mock Test
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Deploy a custom calendar target exam. Submitting notifies all enrolled students on their notification stream.
                    </p>

                    <form onSubmit={handleScheduleTest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)' }}>Mock Test Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Chemical Kinetics Special"
                            value={testTitle}
                            onChange={e => setTestTitle(e.target.value)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--bg-app)',
                              color: 'var(--text-main)',
                              fontSize: '0.8rem'
                            }}
                            required
                          />
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)' }}>Schedule Date & Time</label>
                          <input
                            type="text"
                            placeholder="e.g. 2026-07-01 10:00 AM"
                            value={testDate}
                            onChange={e => setTestDate(e.target.value)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--bg-app)',
                              color: 'var(--text-main)',
                              fontSize: '0.8rem'
                            }}
                            required
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)' }}>Syllabus Subject</label>
                          <select
                            value={testSubject}
                            onChange={e => setTestSubject(e.target.value)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--bg-app)',
                              color: 'var(--text-main)',
                              fontSize: '0.8rem',
                              height: '35px'
                            }}
                          >
                            <option value="Physics">Physics</option>
                            <option value="Chemistry">Chemistry</option>
                            <option value="Mathematics">Mathematics</option>
                            <option value="Biology">Biology</option>
                            <option value="General">General</option>
                          </select>
                        </div>
                      </div>

                      {scheduleError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', fontSize: '0.75rem' }}>
                          <AlertCircle size={14} />
                          <span>{scheduleError}</span>
                        </div>
                      )}

                      {scheduleSuccess && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '0.75rem', backgroundColor: 'var(--success-bg)', border: '1px solid var(--success)', padding: '8px 12px', borderRadius: '6px' }}>
                          <CheckCircle size={14} />
                          <span>{scheduleSuccess}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={scheduling}
                        style={{ alignSelf: 'flex-end', fontSize: '0.8rem', padding: '8px 20px' }}
                      >
                        {scheduling ? <Loader2 size={14} className="spinner" /> : 'Schedule Test'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Tab Content B: AI Analytics & Progress */}
              {activeInfoTab === 'progress' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {loadingDetail ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '40px 0' }}>
                      <Loader2 size={24} className="spinner" style={{ color: 'var(--accent)' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fetching student analytics details...</span>
                    </div>
                  ) : studentDetail ? (
                    <>
                      {/* Metric cards grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 600 }}>DAILY STREAK</span>
                          <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{studentDetail.streak || studentDetail.streaks || 0} Days</span>
                        </div>
                        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 600 }}>STUDY HOURS</span>
                          <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{(studentDetail.hoursStudied || 0).toFixed(2)} hrs</span>
                        </div>
                        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 600 }}>GOALS CLEARED</span>
                          <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{studentDetail.completedTasks || 0} tasks</span>
                        </div>
                        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: 600 }}>DAILY TARGET</span>
                          <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{studentDetail.dailyGoalProgress || 0}%</span>
                        </div>
                      </div>

                      {/* Strengths and Weaknesses */}
                      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>AI Diagnostic Topics Tagging</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)', display: 'block', marginBottom: '8px' }}>Weak Syllabus Areas</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {studentDetail.weakTopics && studentDetail.weakTopics.length > 0 ? (
                                studentDetail.weakTopics.map((t: string) => (
                                  <span key={t} className="badge badge-danger" style={{ fontSize: '0.7rem' }}>{t}</span>
                                ))
                              ) : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None flagged</span>}
                            </div>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', display: 'block', marginBottom: '8px' }}>Strong Syllabus Areas</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {studentDetail.strongTopics && studentDetail.strongTopics.length > 0 ? (
                                studentDetail.strongTopics.map((t: string) => (
                                  <span key={t} className="badge badge-success" style={{ fontSize: '0.7rem' }}>{t}</span>
                                ))
                              ) : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None flagged</span>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Score Trend Chart */}
                      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Mock Test Performance Trend</h4>
                        {studentDetail.testProgress && studentDetail.testProgress.length > 0 ? (
                          <div style={{ width: '100%', height: 220 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={studentDetail.testProgress.map((att: any, idx: number) => ({
                                name: `Attempt ${idx + 1}`,
                                accuracy: att.accuracy || 0
                              }))} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
                                <YAxis stroke="var(--text-muted)" fontSize={10} domain={[0, 100]} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }} />
                                <Line type="monotone" dataKey="accuracy" name="Accuracy (%)" stroke="var(--accent)" strokeWidth={2.5} activeDot={{ r: 6 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '20px 0' }}>
                            No exam scoring history registered for this student.
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--danger)', fontSize: '0.85rem' }}>
                      Failed to load detailed profile. Please verify network connection.
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content C: Mock Exam History attempts logs */}
              {activeInfoTab === 'attempts' && (
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Student Mock Test Log Sheets</h3>
                  
                  {loadingDetail ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '40px 0' }}>
                      <Loader2 size={24} className="spinner" style={{ color: 'var(--accent)' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fetching attempts logs...</span>
                    </div>
                  ) : studentDetail && studentDetail.testProgress && studentDetail.testProgress.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '450px', overflowY: 'auto' }}>
                      {studentDetail.testProgress.map((att: any, idx: number) => (
                        <div key={idx} style={{ padding: '14px', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'var(--bg-app)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{att.test_name}</strong>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Date: {att.createdAt ? att.createdAt.split('T')[0] : 'N/A'} | Accuracy: {att.accuracy}%
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <strong style={{ fontSize: '0.95rem', color: '#059669', display: 'block' }}>{att.score} / {att.max_score}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                {att.percentile ? `${att.percentile}%ile` : 'N/A Rank'}
                              </span>
                            </div>
                          </div>
                          
                          {/* AI feedback triggers nested */}
                          {att.ai_analysis && (
                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                              <div><strong>AI Diagnostic:</strong> <span style={{ fontStyle: 'italic', color: 'var(--text-main)' }}>{att.ai_analysis.student_feedback || 'No comments logged.'}</span></div>
                            </div>
                          )}

                          {att.feedback && att.feedback.text && (
                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}>
                              <div>
                                <strong>Instructor Remarks ({att.feedback.instructorName || 'Teacher'}):</strong>
                                <span style={{ display: 'block', fontStyle: 'italic', color: 'var(--text-main)', marginTop: '2px', backgroundColor: 'var(--primary-light)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                  "{att.feedback.text}"
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Submit custom feedback guidelines form */}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                            <input
                              type="text"
                              placeholder="Write guidelines / remarks..."
                              value={feedbackInputs[att._id || att.id] || ''}
                              onChange={e => setFeedbackInputs(prev => ({ ...prev, [att._id || att.id]: e.target.value }))}
                              style={{
                                flex: 1,
                                padding: '6px 10px',
                                fontSize: '0.75rem',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                backgroundColor: 'var(--bg-card)',
                                color: 'var(--text-main)'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => submitTeacherFeedback(att._id || att.id, feedbackInputs[att._id || att.id] || '')}
                              className="btn btn-primary btn-xs"
                              style={{ padding: '0 12px', fontSize: '0.75rem', height: '30px', display: 'flex', alignItems: 'center' }}
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '30px 0' }}>
                      No mock exam attempts logged in the database for this student.
                    </p>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
                <User size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.6 }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Student Profile Viewer</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', maxWidth: '400px', margin: '8px 0 0' }}>
                  Please select a student from the directory on the left to examine their academic logs, request AI performance reports, and schedule customized exam sessions.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
