import React from 'react';
import { useLms } from '../../context/LmsContext';
import { Users, FileText, CheckSquare, TrendingUp, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';

interface AdminDashboardProps {
  setCurrentTab: (tab: string) => void;
  setSelectedAttemptIdForFeedback: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ setCurrentTab, setSelectedAttemptIdForFeedback }) => {
  const { attempts, studyMaterials, questions } = useLms();

  // Calculate stats
  const pendingReviews = attempts.filter(att => !att.feedback || att.feedback.instructorName === 'AI Engine');
  const totalSubscribed = 142; // static seeded value
  const dailyEngagement = '89%';

  const handleReviewClick = (attId: string) => {
    setSelectedAttemptIdForFeedback(attId);
    setCurrentTab('admin-feedback');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
          Admin Platform Control
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Monitor enrollments, modify syllabus items, generate test MCQs, and evaluate student scripts.
        </p>
      </div>

      {/* Admin Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#eff6ff', color: 'var(--accent)', padding: '12px', borderRadius: '10px' }}>
            <Users size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{totalSubscribed} Students</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Registrations</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#ecfdf5', color: '#10b981', padding: '12px', borderRadius: '10px' }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{dailyEngagement}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Daily Active Users</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#fffbeb', color: '#f59e0b', padding: '12px', borderRadius: '10px' }}>
            <FileText size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{studyMaterials.length} Materials</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Syllabus Documents</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '10px' }}>
            <CheckSquare size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{pendingReviews.length} Pending</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Instructor Reviews</div>
          </div>
        </div>
      </div>

      {/* Content management and Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        {/* Pending Student mock attempts */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} style={{ color: 'var(--warning)' }} /> Pending Student Mock Test Evaluations
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            These students submitted tests and are awaiting detailed instructor comments and study guidelines.
          </p>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Mock Test</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingReviews.map(att => (
                  <tr key={att.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>Rahul Sharma</td>
                    <td>{att.testName}</td>
                    <td>{att.date}</td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{att.score}</span>/{att.maxScore} ({att.accuracy}%)
                    </td>
                    <td>
                      <button 
                        onClick={() => handleReviewClick(att.id)} 
                        className="btn btn-primary btn-sm"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        Provide Review
                      </button>
                    </td>
                  </tr>
                ))}

                {pendingReviews.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '30px' }}>
                      🎉 Excellent! All mock tests have been evaluated with manual feedback.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subscription & Class overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Enrollment Package Split</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span>Mock Test Series Pro (₹1,499)</span>
                  <span style={{ fontWeight: 600 }}>84 Students</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--primary-light)', borderRadius: '99px' }}>
                  <div style={{ width: '59%', height: '100%', backgroundColor: 'var(--accent)', borderRadius: '99px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span>Master Prep Complete (₹2,999)</span>
                  <span style={{ fontWeight: 600 }}>32 Students</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--primary-light)', borderRadius: '99px' }}>
                  <div style={{ width: '22%', height: '100%', backgroundColor: '#10b981', borderRadius: '99px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span>Free Evaluation Pack</span>
                  <span style={{ fontWeight: 600 }}>26 Students</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--primary-light)', borderRadius: '99px' }}>
                  <div style={{ width: '18%', height: '100%', backgroundColor: 'var(--text-light)', borderRadius: '99px' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ backgroundColor: 'var(--primary-light)' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: 'var(--accent)' }} /> AI Generator Shortcut
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
              Quickly draft a set of multiple-choice questions matching MHT-CET style parameters with zero negative markings.
            </p>
            <button onClick={() => setCurrentTab('admin-generator')} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
              Open Test Generator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
