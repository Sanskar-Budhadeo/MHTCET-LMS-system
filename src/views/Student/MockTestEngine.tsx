import React, { useState, useEffect, useRef } from 'react';
import { useLms } from '../../context/LmsContext';
import { MockTest, Question, TestAttempt } from '../../data/mockData';
import { Clock, Eye, AlertCircle, Award, CheckCircle2, XCircle, ChevronRight, HelpCircle, ArrowLeft } from 'lucide-react';

export const MockTestEngine: React.FC = () => {
  const { mockTests, submitAttempt, attempts, questions } = useLms();
  const [activeTest, setActiveTest] = useState<MockTest | null>(null);
  const [reviewAttempt, setReviewAttempt] = useState<TestAttempt | null>(null);
  
  // Test taker state
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: number }>({});
  const [questionStatus, setQuestionStatus] = useState<{ [qId: string]: 'visited' | 'answered' | 'marked' | 'marked-answered' | 'unvisited' }>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // seconds
  const [questionTimes, setQuestionTimes] = useState<{ [qId: string]: number }>({}); // time spent per question
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);
  const [testStartTime, setTestStartTime] = useState<number>(0);
  
  const timerRef = useRef<any>(null);
  const qTimeRef = useRef<number>(0);

  // Set up timer for active test
  useEffect(() => {
    if (activeTest) {
      setTimeRemaining(activeTest.duration * 60);
      setTestStartTime(Date.now());
      
      // Initialize question statuses
      const initialStatus: typeof questionStatus = {};
      activeTest.questions.forEach((q, idx) => {
        initialStatus[q.id] = idx === 0 ? 'visited' : 'unvisited';
      });
      setQuestionStatus(initialStatus);
      setSelectedAnswers({});
      setQuestionTimes({});
      setCurrentQIndex(0);
      qTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTest]);

  // Track time spent on individual questions
  useEffect(() => {
    if (activeTest) {
      const currentQ = activeTest.questions[currentQIndex];
      const now = Date.now();
      const diff = Math.round((now - qTimeRef.current) / 1000);
      
      return () => {
        setQuestionTimes(prev => ({
          ...prev,
          [currentQ.id]: (prev[currentQ.id] || 0) + diff
        }));
        qTimeRef.current = Date.now();
      };
    }
  }, [currentQIndex, activeTest]);

  const handleStartTest = (test: MockTest) => {
    setActiveTest(test);
    setReviewAttempt(null);
  };

  const handleOptionSelect = (optionIdx: number) => {
    if (!activeTest) return;
    const qId = activeTest.questions[currentQIndex].id;
    setSelectedAnswers(prev => ({ ...prev, [qId]: optionIdx }));
    
    setQuestionStatus(prev => {
      const current = prev[qId];
      const nextStatus = (current === 'marked' || current === 'marked-answered') ? 'marked-answered' : 'answered';
      return { ...prev, [qId]: nextStatus };
    });
  };

  const handleClearResponse = () => {
    if (!activeTest) return;
    const qId = activeTest.questions[currentQIndex].id;
    setSelectedAnswers(prev => {
      const updated = { ...prev };
      delete updated[qId];
      return updated;
    });

    setQuestionStatus(prev => {
      const current = prev[qId];
      const nextStatus = (current === 'marked-answered' || current === 'marked') ? 'marked' : 'visited';
      return { ...prev, [qId]: nextStatus };
    });
  };

  const handleSaveAndNext = () => {
    if (!activeTest) return;
    const qId = activeTest.questions[currentQIndex].id;

    // If no option was selected, set status to unanswered (red)
    if (selectedAnswers[qId] === undefined) {
      setQuestionStatus(prev => ({
        ...prev,
        [qId]: prev[qId] === 'marked' ? 'marked' : 'visited' // Red/visited status
      }));
    }

    // Move to next question or stay
    if (currentQIndex < activeTest.questions.length - 1) {
      const nextQId = activeTest.questions[currentQIndex + 1].id;
      setQuestionStatus(prev => ({
        ...prev,
        [nextQId]: prev[nextQId] === 'unvisited' ? 'visited' : prev[nextQId]
      }));
      setCurrentQIndex(prev => prev + 1);
    }
  };

  const handleMarkForReview = () => {
    if (!activeTest) return;
    const qId = activeTest.questions[currentQIndex].id;
    const hasAnswer = selectedAnswers[qId] !== undefined;

    setQuestionStatus(prev => ({
      ...prev,
      [qId]: hasAnswer ? 'marked-answered' : 'marked'
    }));

    if (currentQIndex < activeTest.questions.length - 1) {
      const nextQId = activeTest.questions[currentQIndex + 1].id;
      setQuestionStatus(prev => ({
        ...prev,
        [nextQId]: prev[nextQId] === 'unvisited' ? 'visited' : prev[nextQId]
      }));
      setCurrentQIndex(prev => prev + 1);
    }
  };

  const handleNavigateQuestion = (index: number) => {
    if (!activeTest) return;
    const targetQId = activeTest.questions[index].id;
    setQuestionStatus(prev => ({
      ...prev,
      [targetQId]: prev[targetQId] === 'unvisited' ? 'visited' : prev[targetQId]
    }));
    setCurrentQIndex(index);
  };

  const handleAutoSubmit = () => {
    submitQuizData();
  };

  const submitQuizData = () => {
    if (!activeTest) return;
    if (timerRef.current) clearInterval(timerRef.current);

    // Save final question time
    const now = Date.now();
    const finalDiff = Math.round((now - qTimeRef.current) / 1000);
    const lastQId = activeTest.questions[currentQIndex].id;
    const finalTimes = {
      ...questionTimes,
      [lastQId]: (questionTimes[lastQId] || 0) + finalDiff
    };

    // Evaluate answers
    let score = 0;
    let maxScore = 0;
    let correctCount = 0;
    const answerLogs: TestAttempt['answers'] = {};

    activeTest.questions.forEach(q => {
      const selected = selectedAnswers[q.id];
      const isCorrect = selected === q.correctAnswer;
      const qMarks = q.marks || 1;
      
      maxScore += qMarks;
      if (selected !== undefined && isCorrect) {
        score += qMarks;
        correctCount++;
      }

      answerLogs[q.id] = {
        selected: selected !== undefined ? selected : -1,
        isCorrect: selected !== undefined && isCorrect,
        timeTaken: finalTimes[q.id] || 30 // fallback
      };
    });

    const elapsed = Math.round((Date.now() - testStartTime) / 1000);
    const accuracy = Math.round((correctCount / activeTest.questions.length) * 100);

    const attemptId = submitAttempt({
      testId: activeTest.id,
      testName: activeTest.name,
      date: new Date().toISOString().split('T')[0],
      score,
      maxScore,
      timeSpent: elapsed,
      accuracy,
      answers: answerLogs
    });

    // Find and load the saved attempt to review
    // We can lookup in our local storage sync, or mock database
    setActiveTest(null);
    setShowSubmitConfirm(false);
    
    // We'll redirect to review screen for this attempt
    const newAttempt: TestAttempt = {
      id: attemptId,
      testId: activeTest.id,
      testName: activeTest.name,
      date: new Date().toISOString().split('T')[0],
      score,
      maxScore,
      timeSpent: elapsed,
      accuracy,
      answers: answerLogs,
      feedback: {
        instructorName: 'AI Diagnostic',
        text: `Test submitted successfully! You secured a score of ${score}/${maxScore} (${accuracy}% accuracy). Review structural chapter errors below.`,
        date: new Date().toISOString().split('T')[0],
        aiSuggestions: [
          `You completed the test in ${Math.round(elapsed / 60)} minutes.`,
          `High response delays noted on subject topics: ${activeTest.questions
            .filter(q => (finalTimes[q.id] || 0) > 200)
            .map(q => q.topic)
            .filter((v, i, a) => a.indexOf(v) === i)
            .slice(0, 2)
            .join(', ') || 'None'}.`
        ]
      }
    };
    setReviewAttempt(newAttempt);
  };

  const getTimerString = () => {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    return `${hours > 0 ? hours + ':' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getButtonClass = (index: number) => {
    if (!activeTest) return '';
    const qId = activeTest.questions[index].id;
    const status = questionStatus[qId];
    const isCurrent = currentQIndex === index;
    
    let cls = 'palette-btn';
    if (isCurrent) cls += ' active';

    if (status === 'answered') cls += ' answered';
    else if (status === 'visited' && selectedAnswers[qId] === undefined) cls += ' unanswered';
    else if (status === 'marked') cls += ' marked';
    else if (status === 'marked-answered') cls += ' marked-answered';

    return cls;
  };

  // Render score details / answer reviews
  if (reviewAttempt) {
    const matchedTest = mockTests.find(t => t.id === reviewAttempt.testId) || { questions: questions };
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setReviewAttempt(null)} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} /> Back to Arena
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Attempt Date: {reviewAttempt.date}</span>
        </div>

        <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
          {/* Summary scores */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderRight: '1px solid var(--border)', paddingRight: '24px' }}>
            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: 'var(--primary-light)', borderRadius: '12px' }}>
              <Award size={48} style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{reviewAttempt.testName}</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', margin: '12px 0' }}>
                {reviewAttempt.score} <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>/ {reviewAttempt.maxScore}</span>
              </div>
              <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>Completed</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="card" style={{ padding: '12px', textAlign: 'center', boxShadow: 'none' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{reviewAttempt.accuracy}%</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Accuracy</span>
              </div>
              <div className="card" style={{ padding: '12px', textAlign: 'center', boxShadow: 'none' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{Math.round(reviewAttempt.timeSpent / 60)}m</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Time Spent</span>
              </div>
            </div>

            {reviewAttempt.feedback && (
              <div style={{ backgroundColor: 'var(--info-bg)', border: '1px solid var(--info)', padding: '16px', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', marginBottom: '6px' }}>
                  <AlertCircle size={14} style={{ color: 'var(--info)' }} /> AI Diagnostic Recommendations:
                </h4>
                <ul style={{ fontSize: '0.75rem', paddingLeft: '16px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  {reviewAttempt.feedback.aiSuggestions.map((sug, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{sug}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Question Breakdown and Solutions */}
          <div style={{ overflowY: 'auto', maxHeight: '70vh', paddingRight: '12px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Review Questions & Solutions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {matchedTest.questions.map((q, idx) => {
                const ans = reviewAttempt.answers[q.id] || { selected: -1, isCorrect: false };
                return (
                  <div key={q.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Question {idx + 1}</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span className={`badge badge-${q.subject.toLowerCase()}`}>{q.subject}</span>
                        {ans.isCorrect ? (
                          <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                            <CheckCircle2 size={10} /> Correct (+{q.marks || 1})
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                            <XCircle size={10} /> {ans.selected === -1 ? 'Skipped' : 'Incorrect'} (0)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '12px', fontWeight: 500 }}>
                      {q.question}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = oIdx === q.correctAnswer;
                        const isSelected = oIdx === ans.selected;
                        
                        let borderStyle = '1px solid var(--border)';
                        let bgStyle = 'transparent';
                        if (isCorrect) {
                          borderStyle = '1px solid #10b981';
                          bgStyle = '#ecfdf5';
                        } else if (isSelected) {
                          borderStyle = '1px solid #ef4444';
                          bgStyle = '#fef2f2';
                        }

                        return (
                          <div 
                            key={oIdx} 
                            style={{ 
                              padding: '8px 12px', 
                              border: borderStyle, 
                              backgroundColor: bgStyle,
                              borderRadius: '4px', 
                              fontSize: '0.8rem',
                              fontWeight: isCorrect ? 600 : 400
                            }}
                          >
                            <strong>{String.fromCharCode(65 + oIdx)}.</strong> {opt}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ backgroundColor: 'var(--primary-light)', padding: '12px', borderRadius: '6px', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-main)' }}>Explanation:</span>
                      <p style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>{q.explanation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Timer test space simulator
  if (activeTest) {
    const currentQuestion = activeTest.questions[currentQIndex];
    const isMarked = questionStatus[currentQuestion.id] === 'marked' || questionStatus[currentQuestion.id] === 'marked-answered';
    const isSelected = selectedAnswers[currentQuestion.id] !== undefined;

    return (
      <div className="test-layout">
        {/* Left Side Workspace */}
        <div className="test-workspace">
          {/* Header */}
          <div className="test-header">
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{activeTest.name}</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Question {currentQIndex + 1} of {activeTest.questions.length} | Marks: +{currentQuestion.marks || 1}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '6px 14px', 
                  backgroundColor: timeRemaining < 300 ? 'var(--danger-bg)' : 'var(--bg-card)', 
                  border: '1px solid ' + (timeRemaining < 300 ? 'var(--danger)' : 'var(--border)'),
                  borderRadius: '6px',
                  color: timeRemaining < 300 ? 'var(--danger)' : 'var(--text-main)',
                  fontWeight: 700
                }}
              >
                <Clock size={16} />
                <span>Time Left: {getTimerString()}</span>
              </div>
              
              <button onClick={() => setShowSubmitConfirm(true)} className="btn btn-danger btn-sm">
                Submit Test
              </button>
            </div>
          </div>

          {/* Test Arena Question Area */}
          <div className="test-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className={`badge badge-${currentQuestion.subject.toLowerCase()}`}>{currentQuestion.subject}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Topic: {currentQuestion.topic}</span>
            </div>

            <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '24px', lineHeight: '1.6' }}>
              {currentQuestion.question}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {currentQuestion.options.map((opt, index) => (
                <label 
                  key={index} 
                  className={`question-option-label ${selectedAnswers[currentQuestion.id] === index ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name={`q-${currentQuestion.id}`}
                    checked={selectedAnswers[currentQuestion.id] === index}
                    onChange={() => handleOptionSelect(index)}
                    style={{ marginTop: '4px' }}
                  />
                  <span>
                    <strong>{String.fromCharCode(65 + index)}.</strong> {opt}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Controls Footer */}
          <div className="test-footer">
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handleClearResponse}
                className="btn btn-secondary btn-sm"
                disabled={!isSelected}
              >
                Clear Response
              </button>
              <button 
                onClick={handleMarkForReview}
                className="btn btn-outline btn-sm"
                style={{ borderColor: '#8b5cf6', color: '#8b5cf6' }}
              >
                {isMarked ? 'Marked for Review' : 'Mark for Review & Next'}
              </button>
            </div>
            
            <button 
              onClick={handleSaveAndNext} 
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Save & Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Right Side Control Palette Grid */}
        <div className="test-sidebar">
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>Question Navigator</h4>
          
          <div className="palette-grid">
            {activeTest.questions.map((_, index) => (
              <button
                key={index}
                className={getButtonClass(index)}
                onClick={() => handleNavigateQuestion(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {/* Color Legend */}
          <div className="legend-container">
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#10b981' }}></div>
              <span>Answered</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#ef4444' }}></div>
              <span>Unanswered</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#8b5cf6' }}></div>
              <span>Marked Review</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#f3f4f6', border: '1px solid var(--border)' }}></div>
              <span>Not Visited</span>
            </div>
          </div>

          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: '0.75rem', color: 'var(--text-light)' }}>
            ⚠️ <strong>Notice:</strong> Closing or refreshing this window submits your current state. No negative markings applied under standard MHT-CET criteria.
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        {showSubmitConfirm && (
          <div className="modal-overlay" onClick={() => setShowSubmitConfirm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} style={{ color: 'var(--danger)' }} /> Submit Mock Exam?
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                Are you sure you want to end your exam? You cannot modify answers after submission.
              </p>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setShowSubmitConfirm(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Resume Test
                </button>
                <button onClick={submitQuizData} className="btn btn-danger" style={{ flex: 1 }}>
                  Confirm Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default Mock Test Lobby List
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
          MHT-CET Mock Test Arena
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Practice in standard simulated test dashboards mimicking the computer entrance environment.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Mock test series cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.15rem' }}>Available Test Mock Series</h3>
          {mockTests.map(test => (
            <div key={test.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px' }}>{test.name}</h4>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Duration: <strong>{test.duration} minutes</strong></span>
                  <span>•</span>
                  <span>Questions: <strong>{test.questions.length} MCQs</strong></span>
                  <span>•</span>
                  <span>Subjects: <strong>{test.subjects.join(', ')}</strong></span>
                </div>
              </div>
              <button onClick={() => handleStartTest(test)} className="btn btn-primary btn-sm">
                Begin Simulator
              </button>
            </div>
          ))}
        </div>

        {/* Historical score summaries */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Previous Score Logs</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {attempts.map(att => (
              <div 
                key={att.id} 
                className="card" 
                style={{ 
                  padding: '12px', 
                  boxShadow: 'none', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  backgroundColor: 'var(--primary-light)'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {att.testName}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{att.date}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{att.score}/{att.maxScore}</span>
                  <button onClick={() => setReviewAttempt(att)} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }}>
                    Review
                  </button>
                </div>
              </div>
            ))}

            {attempts.length === 0 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No exam logs recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
