import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Plus, Calendar, User, FileText, CheckCircle, TrendingUp, Loader2, Check, AlertCircle, X, Clock, HelpCircle } from 'lucide-react';

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

export const TeacherDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // AI Report State
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);

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

  useEffect(() => {
    // Initial fetch of calendar events
    fetchEvents();
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
      })
      .catch(err => {
        console.error('Error scheduling test:', err);
        setScheduleError('Failed to schedule test. Please check database connectivity.');
        setScheduling(false);
      });
  };

  const selectStudent = (student: Student) => {
    setSelectedStudent(student);
    setAiReport(null);
    setReportError(null);
  };

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
                gap: '16px'
              }}>
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
          ) : (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ backgroundColor: 'rgba(37, 99, 235, 0.05)', color: 'var(--accent)', padding: '20px', borderRadius: '50%' }}>
                <HelpCircle size={40} />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Select a Student</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '380px' }}>
                Select a student from the directory sidebar to generate AI reports, review their subscription plan status, or configure scheduled mock tests.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
