import React, { useState, useEffect } from 'react';
import { useLms } from '../../context/LmsContext';
import { TestAttempt } from '../../data/mockData';
import { MessageSquare, AlertCircle, Sparkles, Send, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';

interface AdminFeedbackProps {
  selectedAttemptId?: string;
  clearSelectedAttemptId?: () => void;
}

export const AdminFeedback: React.FC<AdminFeedbackProps> = ({ selectedAttemptId, clearSelectedAttemptId }) => {
  const { attempts, addFeedback, questions } = useLms();
  const [activeAttempt, setActiveAttempt] = useState<TestAttempt | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  // Handle selectedAttemptId passed from dashboard
  useEffect(() => {
    if (selectedAttemptId) {
      const match = attempts.find(a => a.id === selectedAttemptId);
      if (match) {
        setActiveAttempt(match);
        setFeedbackText(match.feedback?.text || '');
      }
    }
  }, [selectedAttemptId, attempts]);

  const handleSelectAttempt = (att: TestAttempt) => {
    setActiveAttempt(att);
    setFeedbackText(att.feedback?.text || '');
  };

  const handleAIFeedbackSuggest = () => {
    if (!activeAttempt) return;

    // Dynamically draft feedback text based on accuracy and wrong topics
    const wrongTopics: string[] = [];
    Object.entries(activeAttempt.answers).forEach(([qId, ans]) => {
      if (!ans.isCorrect) {
        const q = questions.find(item => item.id === qId);
        if (q && !wrongTopics.includes(q.topic)) {
          wrongTopics.push(q.topic);
        }
      }
    });

    const isHighScorer = activeAttempt.accuracy >= 80;
    const isMediumScorer = activeAttempt.accuracy >= 60 && activeAttempt.accuracy < 80;

    let suggestion = '';
    if (isHighScorer) {
      suggestion = `Excellent work on ${activeAttempt.testName}, Rahul! You achieved a solid score of ${activeAttempt.score}/${activeAttempt.maxScore}. Your understanding of these subjects is very clear. `;
      if (wrongTopics.length > 0) {
        suggestion += `Keep refining your grasp on ${wrongTopics.join(', ')} to push closer to the 100th percentile. Review the core equations for these chapters in the notes space.`;
      } else {
        suggestion += `You solved all questions perfectly. Try taking hard sectional mock tests next!`;
      }
    } else if (isMediumScorer) {
      suggestion = `Good attempt on ${activeAttempt.testName}, Rahul. You scored ${activeAttempt.score}/${activeAttempt.maxScore}. While some topics are strong, we noted conceptual gaps in chapters: ${wrongTopics.slice(0, 3).join(', ')}. `;
      suggestion += `Try generating targeted AI adaptive quizzes for these chapters, and dedicate 30 minutes to review corresponding formula guide manuals.`;
    } else {
      suggestion = `Fair effort, Rahul. You scored ${activeAttempt.score}/${activeAttempt.maxScore} (${activeAttempt.accuracy}% accuracy). It is recommended to perform a thorough revision of the syllabus notes. `;
      suggestion += `Direct attention towards ${wrongTopics.slice(0, 3).join(', ')}. Try solving easier questions in these chapters before moving onto hard mocks.`;
    }

    setFeedbackText(suggestion);
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAttempt || !feedbackText) return;

    addFeedback(activeAttempt.id, feedbackText);
    alert('Instructor feedback successfully published to Student & Parent Dashboards!');
    
    // Refresh local view
    const updated = attempts.find(a => a.id === activeAttempt.id);
    if (updated) {
      setActiveAttempt(updated);
    }
    
    if (clearSelectedAttemptId) clearSelectedAttemptId();
  };

  const handleBack = () => {
    setActiveAttempt(null);
    setFeedbackText('');
    if (clearSelectedAttemptId) clearSelectedAttemptId();
  };

  if (activeAttempt) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={handleBack} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} /> Back to List
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Student Name: Rahul Sharma</span>
        </div>

        <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Script Details */}
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Attempt Breakdown</h3>
            <div style={{ backgroundColor: 'var(--primary-light)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 6px' }}>{activeAttempt.testName}</h4>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>Score: <strong>{activeAttempt.score} / {activeAttempt.maxScore}</strong></span>
                <span>Accuracy: <strong>{activeAttempt.accuracy}%</strong></span>
                <span>Time: <strong>{Math.round(activeAttempt.timeSpent / 60)} mins</strong></span>
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '10px' }}>Question Responses</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto', paddingRight: '8px' }}>
              {Object.entries(activeAttempt.answers).map(([qId, log], idx) => {
                const q = questions.find(item => item.id === qId);
                if (!q) return null;
                return (
                  <div 
                    key={qId} 
                    style={{ 
                      padding: '10px 14px', 
                      border: '1px solid var(--border)', 
                      borderRadius: '6px', 
                      backgroundColor: 'var(--bg-card)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Q{idx + 1} • {q.subject}</span>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: 600, margin: '2px 0 0', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {q.question}
                      </h5>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{log.timeTaken}s</span>
                      <span className={`badge badge-${log.isCorrect ? 'success' : 'danger'}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                        {log.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback Form */}
          <form onSubmit={handleSubmitFeedback} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Review Feedback</h3>
                <button
                  type="button"
                  onClick={handleAIFeedbackSuggest}
                  className="btn btn-outline btn-sm"
                  style={{ color: 'var(--accent)', borderColor: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Sparkles size={14} /> AI Suggest Comments
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Instructor Guidelines & Comments</label>
                <textarea
                  className="form-textarea"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Type structural revision recommendations here..."
                  style={{ minHeight: '220px' }}
                  required
                />
              </div>

              {activeAttempt.feedback && activeAttempt.feedback.instructorName !== 'AI Engine' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontSize: '0.8rem', backgroundColor: 'var(--success-bg)', padding: '10px', borderRadius: '6px', marginBottom: '20px' }}>
                  <CheckCircle2 size={16} />
                  <span>Manual review published on {activeAttempt.feedback.date} by {activeAttempt.feedback.instructorName}</span>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-end', marginTop: 'auto' }}>
              <Send size={16} /> Publish Guidelines
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
          Manual Feedback Panel
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Review student answer scripts, verify time analysis, and submit structured feedback.
        </p>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Student Attempt History Logs</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Mock Exam Name</th>
                <th>Date</th>
                <th>Score</th>
                <th>Accuracy</th>
                <th>Review Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map(att => {
                const isManualReviewed = att.feedback && att.feedback.instructorName !== 'AI Engine';
                return (
                  <tr key={att.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>Rahul Sharma</td>
                    <td>{att.testName}</td>
                    <td>{att.date}</td>
                    <td><span style={{ fontWeight: 700 }}>{att.score}</span>/{att.maxScore}</td>
                    <td>{att.accuracy}%</td>
                    <td>
                      <span className={`badge badge-${isManualReviewed ? 'success' : 'warning'}`} style={{ fontSize: '0.65rem' }}>
                        {isManualReviewed ? 'Instructor Evaluated' : 'AI Diagnostic Only'}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleSelectAttempt(att)} 
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span>Evaluate</span>
                        <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
