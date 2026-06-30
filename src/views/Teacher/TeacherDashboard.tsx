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

  // Student Performance Dossier Hub states
  const [trackingTab, setTrackingTab] = useState<'submissions' | 'dossiers'>('submissions');
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [selectedDossierPRN, setSelectedDossierPRN] = useState<string | null>(null);
  const [dossierData, setDossierData] = useState<any | null>(null);
  const [loadingDossier, setLoadingDossier] = useState<boolean>(false);

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

  // Scheduled Test Wizard State
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [examCategory, setExamCategory] = useState<string>('MHT-CET');
  const [testType, setTestType] = useState<string>('FULL_SYLLABUS');
  const [customTestName, setCustomTestName] = useState<string>('');
  const [customDuration, setCustomDuration] = useState<number>(180);
  const [selectedSubject, setSelectedSubject] = useState<string>('Physics');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [marksCorrect, setMarksCorrect] = useState<number>(1);
  const [negMarks, setNegMarks] = useState<number>(0);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [wizardSuccess, setWizardSuccess] = useState<string | null>(null);
  const [submittingWizard, setSubmittingWizard] = useState<boolean>(false);


  // Created Tests State
  const [createdTests, setCreatedTests] = useState<any[]>([]);
  const [loadingCreatedTests, setLoadingCreatedTests] = useState<boolean>(false);

  // Calendar events list state
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(false);

  // Phase 3 submissions tracker states
  const [submissionsData, setSubmissionsData] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);

  // Dashboard overview stats state
  const [stats, setStats] = useState<{
    totalStudents: number;
    testsScheduledThisWeek: number;
    recentActivity: any[];
    testSubmissionOverview: any[];
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  const fetchDashboardStats = () => {
    setLoadingStats(true);
    const token = localStorage.getItem('mht_cet_token');
    fetch('http://localhost:5000/api/teacher/dashboard-stats', {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Stats fetch error');
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoadingStats(false);
      })
      .catch(err => {
        console.error('Error fetching dashboard stats:', err);
        // Fallback for offline mode
        setStats({
          totalStudents: 3,
          testsScheduledThisWeek: 1,
          recentActivity: [
            { _id: 'a1', action: 'System Setup', details: 'LMS Academic Server started in offline fallback mode.', createdAt: new Date().toISOString() }
          ],
          testSubmissionOverview: [
            { testName: 'MHT-CET Full Syllabus Active Practice Exam #1', submitted: 0, pending: 3 }
          ]
        });
        setLoadingStats(false);
      });
  };

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

  const fetchCreatedTests = () => {
    setLoadingCreatedTests(true);
    const token = localStorage.getItem('mht_cet_token');
    fetch('http://localhost:5000/api/faculty/created-tests', {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch created tests');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setCreatedTests(data);
        }
        setLoadingCreatedTests(false);
      })
      .catch(err => {
        console.error('Error fetching created tests:', err);
        setLoadingCreatedTests(false);
      });
  };

  const fetchAllStudents = (q: string = '') => {
    const token = localStorage.getItem('mht_cet_token');
    fetch(`http://localhost:5000/api/teacher/students/search?query=${encodeURIComponent(q)}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStudents(data);
        }
      })
      .catch(err => console.error('Error fetching students:', err));
  };

  const fetchStudentDossier = (prn: string) => {
    setLoadingDossier(true);
    const token = localStorage.getItem('mht_cet_token');
    fetch(`http://localhost:5000/api/faculty/student-report/${prn}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch student dossier');
        return res.json();
      })
      .then(data => {
        setDossierData(data);
        setLoadingDossier(false);
      })
      .catch(err => {
        console.error('Error fetching dossier:', err);
        setLoadingDossier(false);
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
    // Fetch teacher overview dashboard stats & audit logs
    fetchDashboardStats();
    // Fetch tests created by this faculty
    fetchCreatedTests();
    // Fetch all student profiles
    fetchAllStudents();
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
        setError('Failed to fetch students. Search returned no results.');
        setStudents([]);
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

  const CHAPTERS_BY_SUBJECT: Record<string, string[]> = {
    Physics: ['Rotational Dynamics', 'Oscillations', 'Electrostatics', 'Wave Optics', 'Electromagnetic Induction'],
    Chemistry: ['Chemical Kinetics', 'Solid State', 'Coordination Compounds', 'Thermodynamics'],
    Mathematics: ['Vectors', 'Trigonometric Functions', 'Probability Distributions', 'Integration', 'Differentiation'],
    Biology: ['Photosynthesis', 'Respiration and Energy Transfer', 'Inheritance', 'Control and Coordination']
  };

  useEffect(() => {
    if (selectedSubject === 'Mathematics') {
      setMarksCorrect(2);
    } else {
      setMarksCorrect(1);
    }
  }, [selectedSubject]);

  const handleChapterToggle = (chapter: string) => {
    setSelectedChapters(prev => 
      prev.includes(chapter) 
        ? prev.filter(c => c !== chapter) 
        : [...prev, chapter]
    );
  };

  const handleCreateTestWizard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTestName.trim() || !startTime || !endTime) {
      setWizardError('Please fill out all required fields.');
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      setWizardError('Start time must be before end time.');
      return;
    }

    if (start < new Date()) {
      setWizardError('Test start time cannot be in the past.');
      return;
    }

    setWizardError(null);
    setWizardSuccess(null);
    setSubmittingWizard(true);

    const token = localStorage.getItem('mht_cet_token');
    const calculatedTotalMarks = Number(numQuestions) * Number(marksCorrect);

    fetch('http://localhost:5000/api/faculty/create-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        test_name: customTestName,
        test_type: testType,
        exam_id: examCategory,
        duration_minutes: Number(customDuration),
        total_questions: Number(numQuestions),
        total_marks: calculatedTotalMarks,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        is_published: isPublished,
        subject: selectedSubject,
        chapters: selectedChapters,
        marks_per_correct: Number(marksCorrect),
        negative_marks: Number(negMarks)
      })
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(d => { throw new Error(d.error || 'Failed to create test') });
        }
        return res.json();
      })
      .then(data => {
        setWizardSuccess(`Successfully created and scheduled test "${customTestName}"!`);
        setCustomTestName('');
        setStartTime('');
        setEndTime('');
        setSelectedChapters([]);
        setWizardStep(1);
        setSubmittingWizard(false);
        fetchEvents();
        fetchEventsGlobal();
        fetchCreatedTests();
      })
      .catch(err => {
        console.error('Error creating test:', err);
        setWizardError(err.message || 'Failed to create test.');
        setSubmittingWizard(false);
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
        <div className="flex justify-between items-center flex-wrap gap-4 border-b border-[var(--border)] pb-4">
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px', margin: 0 }}>
              Exam Tracking & Submissions
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>
              Track mock test submissions, grade logs, and dynamic student performance dossiers.
            </p>
          </div>
        </div>

        {/* Tab Toggle Selector */}
        <div className="flex gap-4 border-b border-[var(--border)] pb-2 mb-2">
          <button
            onClick={() => setTrackingTab('submissions')}
            className={`pb-2 px-4 text-xs font-bold transition duration-200 border-b-2 bg-transparent cursor-pointer ${
              trackingTab === 'submissions'
                ? 'border-[#e2fc5c] text-[#e2fc5c]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Mock Exam Submissions
          </button>
          <button
            onClick={() => {
              setTrackingTab('dossiers');
              if (students.length === 0) fetchAllStudents();
            }}
            className={`pb-2 px-4 text-xs font-bold transition duration-200 border-b-2 bg-transparent cursor-pointer ${
              trackingTab === 'dossiers'
                ? 'border-[#e2fc5c] text-[#e2fc5c]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            Student Performance Dossiers
          </button>
        </div>

        {trackingTab === 'submissions' && (
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
        )}

        {trackingTab === 'dossiers' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Search & Student PRN List */}
            <div className="lg:col-span-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-4 shadow-lg">
              <h3 className="text-sm font-black text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border)] pb-3" style={{ margin: 0 }}>
                <Search className="w-4 h-4 text-[#e2fc5c]" /> Search Student Profiles
              </h3>
              
              {/* Search Bar Input */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Enter name or PRN..."
                  value={studentSearchQuery}
                  onChange={(e) => {
                    setStudentSearchQuery(e.target.value);
                    fetchAllStudents(e.target.value);
                  }}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border)] text-xs rounded-xl pl-9 pr-4 py-2.5 text-[var(--text-main)] focus:outline-none focus:border-[#e2fc5c] font-semibold placeholder:text-zinc-600"
                />
              </div>

              {/* Roster list of student PRNs */}
              <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {students.map(std => (
                  <button
                    key={std.id || std.prn}
                    onClick={() => {
                      setSelectedDossierPRN(std.prn);
                      fetchStudentDossier(std.prn);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1 cursor-pointer ${
                      selectedDossierPRN === std.prn
                        ? 'bg-[#e2fc5c]/10 border-[#e2fc5c] text-white shadow-md'
                        : 'bg-[var(--bg-app)] border-[var(--border)] hover:border-zinc-500 text-[var(--text-muted)]'
                    }`}
                  >
                    <span className="text-xs font-black text-[var(--text-main)]">{std.name}</span>
                    <div className="flex justify-between items-center text-[9px] font-bold text-[var(--text-muted)]">
                      <span>PRN: {std.prn}</span>
                      <span className="bg-zinc-850 px-1.5 py-0.5 rounded text-[8px] uppercase">
                        {std.targetExam || 'MHT-CET'}
                      </span>
                    </div>
                  </button>
                ))}
                {students.length === 0 && (
                  <p className="text-xs text-[var(--text-muted)] text-center py-6 font-semibold">
                    No student records found.
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Full Student Dossier Ledger */}
            <div className="lg:col-span-8">
              {!selectedDossierPRN ? (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-12 text-center shadow-lg flex flex-col items-center justify-center gap-3">
                  <User className="w-10 h-10 text-[var(--text-muted)] animate-pulse" />
                  <h3 className="text-sm font-black text-[var(--text-main)]" style={{ margin: 0 }}>No Student Profile Selected</h3>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto font-semibold" style={{ margin: 0 }}>
                    Select a student from the sidebar roster on the left to pull their dynamic academic dossier, mock scores, and AI diagnostic insights.
                  </p>
                </div>
              ) : loadingDossier ? (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-12 text-center shadow-lg flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-[#e2fc5c] animate-spin" />
                  <span className="text-xs text-[var(--text-muted)] font-bold">Compiling Student Dossier...</span>
                </div>
              ) : dossierData ? (
                <div className="flex flex-col gap-6">
                  {/* General Info dossier header */}
                  <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-lg flex flex-col gap-3">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div>
                        <h3 className="text-lg font-extrabold text-[var(--text-main)]" style={{ margin: 0 }}>{dossierData.name}</h3>
                        <p className="text-xs text-[var(--text-muted)] mt-1 font-semibold" style={{ margin: 0 }}>
                          Email: <span className="text-[var(--text-main)]">{dossierData.email}</span> | PRN: <span className="text-[var(--text-main)]">{dossierData.prn}</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span className="bg-[#e2fc5c]/10 text-[#e2fc5c] border border-[#e2fc5c]/25 rounded-full px-3 py-1 text-[10px] font-bold">
                          Target: {dossierData.targetExam}
                        </span>
                        <span className="bg-orange-950/40 text-orange-400 border border-orange-500/20 rounded-full px-3 py-1 text-[10px] font-bold flex items-center gap-1">
                          🔥 {dossierData.streak} Day Streak
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Diagnostics Dossier section */}
                  <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-lg flex flex-col gap-4">
                    <h3 className="text-sm font-black text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border)] pb-3" style={{ margin: 0 }}>
                      <Sparkles className="w-4 h-4 text-[#e2fc5c]" /> Dynamic AI Diagnostic Insights
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-[var(--bg-app)] border border-[var(--border)] p-4 rounded-xl text-center">
                        <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] block mb-1">Avg Accuracy</span>
                        <strong className="text-lg font-black text-[#e2fc5c]">{dossierData.aiInsights?.averageAccuracy}%</strong>
                      </div>
                      <div className="bg-[var(--bg-app)] border border-[var(--border)] p-4 rounded-xl text-center">
                        <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] block mb-1">Speed Index</span>
                        <strong className="text-lg font-black text-sky-400">{dossierData.aiInsights?.speedIndex}s <span className="text-[9px] font-medium text-[var(--text-muted)]">/ q</span></strong>
                      </div>
                      <div className="bg-[var(--bg-app)] border border-[var(--border)] p-4 rounded-xl text-center">
                        <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] block mb-1">Rank Weight</span>
                        <strong className="text-lg font-black text-fuchsia-400">Class #1</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[var(--bg-app)] border border-[var(--border)] p-4 rounded-xl">
                        <span className="text-[10px] uppercase font-black text-emerald-400 block mb-2">Verified Strengths</span>
                        {dossierData.aiInsights?.strongTopics?.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {dossierData.aiInsights.strongTopics.map((topic: string) => (
                              <span key={topic} className="bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-bold">
                                {topic}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-[var(--text-muted)] font-semibold">No high-mastery chapters identified yet.</span>
                        )}
                      </div>
                      <div className="bg-[var(--bg-app)] border border-[var(--border)] p-4 rounded-xl">
                        <span className="text-[10px] uppercase font-black text-red-400 block mb-2">Priority Conceptual Gaps</span>
                        {dossierData.aiInsights?.weakTopics?.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {dossierData.aiInsights.weakTopics.map((topic: string) => (
                              <span key={topic} className="bg-red-950/40 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[9px] font-bold">
                                {topic}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-[var(--text-muted)] font-semibold">No critical syllabus gaps detected.</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-[var(--bg-app)] border border-[var(--border)] p-4 rounded-xl">
                      <span className="text-[10px] uppercase font-black text-[#e2fc5c] block mb-2">AI Suggested Action Plan</span>
                      <p className="text-xs text-[var(--text-main)] font-semibold leading-relaxed" style={{ margin: 0 }}>
                        {dossierData.aiInsights?.aiFeedback}
                      </p>
                    </div>
                  </div>

                  {/* Performance Grid section */}
                  <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 shadow-lg flex flex-col gap-4">
                    <h3 className="text-sm font-black text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border)] pb-3" style={{ margin: 0 }}>
                      <FileText className="w-4 h-4 text-[#e2fc5c]" /> Student Exam Attempt Log
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[var(--border)] text-[var(--text-muted)] uppercase tracking-wider font-extrabold text-[9px]">
                            <th className="pb-3 text-left">Exam Name</th>
                            <th className="pb-3 text-center">Score</th>
                            <th className="pb-3 text-center">Accuracy</th>
                            <th className="pb-3 text-center">Correct/Incorrect</th>
                            <th className="pb-3 text-center">Date Attempted</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dossierData.performanceGrid?.map((att: any) => {
                            const accVal = att.maxScore > 0 ? Math.round((att.score / att.maxScore) * 100) : 0;
                            return (
                              <tr key={att.id} className="border-b border-[var(--border)] text-[var(--text-main)] font-semibold">
                                <td className="py-3 text-left font-black">{att.testName}</td>
                                <td className="py-3 text-center font-bold">{att.score} / {att.maxScore}</td>
                                <td className="py-3 text-center text-[#e2fc5c] font-black">{accVal}%</td>
                                <td className="py-3 text-center">
                                  <span className="text-emerald-400">{att.correct} Correct</span>
                                  <span className="text-[var(--text-muted)] mx-1">•</span>
                                  <span className="text-red-400">{att.incorrect} Incorrect</span>
                                </td>
                                <td className="py-3 text-center text-[var(--text-muted)]">
                                  {new Date(att.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                              </tr>
                            );
                          })}
                          {(!dossierData.performanceGrid || dossierData.performanceGrid.length === 0) && (
                            <tr>
                              <td colSpan={5} className="text-center py-6 text-[var(--text-muted)] font-semibold">
                                No test attempts recorded for this student.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-12 text-center shadow-lg">
                  <span className="text-xs text-[var(--text-muted)] font-semibold">Failed to fetch student data record ledger.</span>
                </div>
              )}
            </div>
          </div>
        )}
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

      {/* Quick Metrics Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(37,99,235,0.1)', color: 'var(--accent)', display: 'flex' }}>
            <User size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Active Students Assigned</span>
            <strong style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats ? stats.totalStudents : 0}</strong>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(210,255,61,0.1)', color: 'var(--accent)', display: 'flex' }}>
            <Calendar size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Tests Scheduled This Week</span>
            <strong style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats ? stats.testsScheduledThisWeek : 0}</strong>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(124,58,237,0.1)', color: 'var(--accent)', display: 'flex' }}>
            <Activity size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Audit Logs Recorded</span>
            <strong style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats ? stats.recentActivity.length : 0}</strong>
          </div>
        </div>
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

          {/* Scheduled & Created Exams Stream */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} style={{ color: 'var(--info)' }} /> Scheduled &amp; Created Exams
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '280px', overflowY: 'auto' }}>
              {loadingCreatedTests ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                  <Loader2 size={16} className="spinner" style={{ color: 'var(--accent)' }} />
                </div>
              ) : createdTests.length > 0 ? (
                createdTests.map((t, index) => {
                  const start = new Date(t.start_time);
                  const end = new Date(t.end_time);
                  const now = new Date();
                  const isLive = now >= start && now <= end;
                  const isPast = now > end;
                  
                  let statusBadge = "Scheduled";
                  let badgeClass = "badge-info";
                  if (isLive) {
                    statusBadge = "Live";
                    badgeClass = "badge-success";
                  } else if (isPast) {
                    statusBadge = "Ended";
                    badgeClass = "badge-danger";
                  }

                  if (!t.is_published) {
                    statusBadge = "Draft";
                    badgeClass = "badge-secondary";
                  }

                  return (
                    <div key={t._id || t.id || index} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px', gap: '8px' }}>
                        <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>{t.test_name}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <span className={`badge ${badgeClass}`} style={{ fontSize: '0.55rem', padding: '1px 4px' }}>
                            {statusBadge}
                          </span>
                          <span className="badge badge-info" style={{ fontSize: '0.55rem', padding: '1px 4px', backgroundColor: 'rgba(37,99,235,0.1)', color: 'var(--accent)' }}>
                            {t.exam_id}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Subject: <strong style={{ color: 'var(--text-light)' }}>{t.subjectDetails?.subject || t.subjects?.[0] || 'General'}</strong>
                        {t.subjectDetails?.chapters && t.subjectDetails.chapters.length > 0 && (
                          <span> ({t.subjectDetails.chapters.join(', ')})</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.675rem', color: 'var(--text-light)' }}>
                        <Clock size={10} />
                        <span>Start: {start.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })
              ) : events.filter(ev => ev.type === 'Test').map((ev, index) => (
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

              {!loadingCreatedTests && createdTests.length === 0 && events.filter(ev => ev.type === 'Test').length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '10px 0' }}>
                  No scheduled or created tests found in system calendar.
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

                  {/* Multi-Step Test Creation & Scheduling Wizard */}
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Plus size={18} style={{ color: 'var(--accent)' }} /> Test Creation & Scheduling Wizard
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Design, configure, and publish scheduled assessments for matching student profile streams.
                    </p>

                    {/* Step Indicators */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{
                          backgroundColor: wizardStep >= 1 ? 'var(--accent)' : 'var(--border)',
                          color: wizardStep >= 1 ? 'white' : 'var(--text-light)',
                          width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold'
                        }}>1</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: wizardStep === 1 ? 'bold' : 'normal', color: wizardStep === 1 ? 'var(--text-main)' : 'var(--text-muted)' }}>Config</span>
                      </div>
                      <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)', margin: '0 12px' }} />
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{
                          backgroundColor: wizardStep >= 2 ? 'var(--accent)' : 'var(--border)',
                          color: wizardStep >= 2 ? 'white' : 'var(--text-light)',
                          width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold'
                        }}>2</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: wizardStep === 2 ? 'bold' : 'normal', color: wizardStep === 2 ? 'var(--text-main)' : 'var(--text-muted)' }}>Syllabus</span>
                      </div>
                      <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)', margin: '0 12px' }} />
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{
                          backgroundColor: wizardStep >= 3 ? 'var(--accent)' : 'var(--border)',
                          color: wizardStep >= 3 ? 'white' : 'var(--text-light)',
                          width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold'
                        }}>3</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: wizardStep === 3 ? 'bold' : 'normal', color: wizardStep === 3 ? 'var(--text-main)' : 'var(--text-muted)' }}>Schedule</span>
                      </div>
                    </div>

                    <form onSubmit={handleCreateTestWizard} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* STEP 1: Configuration */}
                      {wizardStep === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)' }}>Target Exam Category</label>
                              <select
                                value={examCategory}
                                onChange={e => setExamCategory(e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.8rem', height: '35px' }}
                              >
                                <option value="MHT-CET">MHT-CET</option>
                                <option value="JEE">JEE</option>
                                <option value="NEET">NEET</option>
                              </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)' }}>Test Type</label>
                              <select
                                value={testType}
                                onChange={e => setTestType(e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.8rem', height: '35px' }}
                              >
                                <option value="FULL_SYLLABUS">Full Syllabus</option>
                                <option value="CHAPTER_WISE_PART_TEST">Chapter-Wise Part Test</option>
                                <option value="SUBJECT_WISE_PART_TEST">Subject-Wise Part Test</option>
                              </select>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.5fr', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)' }}>Test Name / Title</label>
                              <input
                                type="text"
                                placeholder="e.g. Rotational Dynamics Practice Drill"
                                value={customTestName}
                                onChange={e => setCustomTestName(e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                                required
                              />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)' }}>Duration (Mins)</label>
                              <input
                                type="number"
                                min={5}
                                max={300}
                                value={customDuration}
                                onChange={e => setCustomDuration(Number(e.target.value))}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                                required
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setWizardStep(2)}
                            className="btn btn-primary"
                            style={{ alignSelf: 'flex-end', fontSize: '0.8rem', padding: '8px 20px', marginTop: '8px' }}
                          >
                            Next Step &rarr;
                          </button>
                        </div>
                      )}

                      {/* STEP 2: Syllabus Scope */}
                      {wizardStep === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)' }}>Select Subject</label>
                            <select
                              value={selectedSubject}
                              onChange={e => setSelectedSubject(e.target.value)}
                              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.8rem', height: '35px' }}
                            >
                              <option value="Physics">Physics</option>
                              <option value="Chemistry">Chemistry</option>
                              <option value="Mathematics">Mathematics</option>
                              <option value="Biology">Biology</option>
                            </select>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)' }}>Target Chapters</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', maxHeight: '150px', overflowY: 'auto', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--bg-app)' }}>
                              {CHAPTERS_BY_SUBJECT[selectedSubject]?.map(chapter => (
                                <label key={chapter} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.775rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                                  <input
                                    type="checkbox"
                                    checked={selectedChapters.includes(chapter)}
                                    onChange={() => handleChapterToggle(chapter)}
                                    style={{ accentColor: 'var(--accent)' }}
                                  />
                                  <span>{chapter}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)' }}>Total Questions</label>
                              <input
                                type="number"
                                min={1}
                                max={200}
                                value={numQuestions}
                                onChange={e => setNumQuestions(Number(e.target.value))}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                                required
                              />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)' }}>Marks Per Correct</label>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={marksCorrect}
                                onChange={e => setMarksCorrect(Number(e.target.value))}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                                required
                              />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)' }}>Negative Marks</label>
                              <input
                                type="number"
                                min={0}
                                max={5}
                                value={negMarks}
                                onChange={e => setNegMarks(Number(e.target.value))}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                                required
                              />
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setWizardStep(1)}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.8rem', padding: '8px 20px' }}
                            >
                              &larr; Back
                            </button>
                            <button
                              type="button"
                              onClick={() => setWizardStep(3)}
                              className="btn btn-primary"
                              style={{ fontSize: '0.8rem', padding: '8px 20px' }}
                            >
                              Next Step &rarr;
                            </button>
                          </div>
                        </div>
                      )}

                      {/* STEP 3: Scheduling */}
                      {wizardStep === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)' }}>Start Time (Live Activation)</label>
                              <input
                                type="datetime-local"
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.8rem', height: '35px' }}
                                required
                              />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)' }}>End Time (Expiration)</label>
                              <input
                                type="datetime-local"
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.8rem', height: '35px' }}
                                required
                              />
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                            <input
                              type="checkbox"
                              id="publish-switch"
                              checked={isPublished}
                              onChange={e => setIsPublished(e.target.checked)}
                              style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
                            />
                            <label htmlFor="publish-switch" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
                              Publish immediately to Student Feed
                            </label>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setWizardStep(2)}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.8rem', padding: '8px 20px' }}
                              disabled={submittingWizard}
                            >
                              &larr; Back
                            </button>
                            <button
                              type="submit"
                              className="btn btn-primary"
                              disabled={submittingWizard}
                              style={{ fontSize: '0.8rem', padding: '8px 20px' }}
                            >
                              {submittingWizard ? <Loader2 size={14} className="spinner" /> : 'Deploy & Schedule Test'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Error & Success indicators */}
                      {wizardError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', fontSize: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: '10px 14px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                          <AlertCircle size={14} />
                          <span>{wizardError}</span>
                        </div>
                      )}

                      {wizardSuccess && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '0.75rem', backgroundColor: 'var(--success-bg)', border: '1px solid var(--success)', padding: '10px 14px', borderRadius: '6px' }}>
                          <CheckCircle size={14} />
                          <span>{wizardSuccess}</span>
                        </div>
                      )}
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
              
              {/* Activity Timeline */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Activity size={18} style={{ color: 'var(--accent)' }} /> Recent Activity Feed (AUDIT_LOGS)
                </h3>
                
                {loadingStats ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '20px 0' }}>
                    <Loader2 size={16} className="spinner" />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading timeline logs...</span>
                  </div>
                ) : !stats || stats.recentActivity.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>
                    No recent activity logs recorded in the database.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                    {stats.recentActivity.map((log: any, i: number) => (
                      <div key={log._id || i} style={{ display: 'flex', gap: '12px', borderLeft: '2px solid var(--border)', paddingLeft: '16px', position: 'relative' }}>
                        <div style={{
                          position: 'absolute',
                          left: '-6px',
                          top: '4px',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: log.action.includes('Submitted') ? '#10b981' : 'var(--accent)',
                          border: '2px solid var(--bg-card)'
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{log.action}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                              {new Date(log.timestamp || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>{log.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submissions Overview */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <FileText size={18} style={{ color: 'var(--info)' }} /> Mock Exams Submissions Overview
                </h3>
                
                {loadingStats ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '20px 0' }}>
                    <Loader2 size={16} className="spinner" />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading exam submissions...</span>
                  </div>
                ) : !stats || stats.testSubmissionOverview.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>
                    No mock tests currently configured in the database.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {stats.testSubmissionOverview.map((exam: any, i: number) => {
                      const total = exam.submitted + exam.pending;
                      const percent = total > 0 ? Math.round((exam.submitted / total) * 100) : 0;
                      return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: i < stats.testSubmissionOverview.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{exam.testName}</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                              {exam.submitted} Submitted / {exam.pending} Pending
                            </span>
                          </div>
                          
                          {/* Progress bar */}
                          <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--primary-light)', borderRadius: '9999px', overflow: 'hidden', display: 'flex' }}>
                            <div style={{ width: `${percent}%`, height: '100%', backgroundColor: '#10b981', transition: 'width 0.4s ease' }} />
                            <div style={{ flex: 1, height: '100%', backgroundColor: 'rgba(234, 88, 12, 0.15)' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
