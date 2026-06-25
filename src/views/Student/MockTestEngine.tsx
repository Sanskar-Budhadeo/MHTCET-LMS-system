import React, { useState, useEffect, useRef } from 'react';
import { useLms } from '../../context/LmsContext';
import { MockTest, Question, TestAttempt } from '../../data/mockData';
import { Clock, Eye, AlertCircle, Award, CheckCircle2, XCircle, ChevronRight, HelpCircle, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';

export const MockTestEngine: React.FC = () => {
  const { mockTests, submitAttempt, attempts, questions, setIsMockTestActive, fetchAttempts, leaderboard } = useLms();
  const [tests, setTests] = useState<MockTest[]>([]);

  useEffect(() => {
    if (fetchAttempts) fetchAttempts();
  }, []);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Complete' | 'Chapter' | 'Subject'>('All');
  const [activeTest, setActiveTest] = useState<MockTest | null>(null);
  const [selectedLobbyTest, setSelectedLobbyTest] = useState<MockTest | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [reviewAttempt, setReviewAttempt] = useState<TestAttempt | null>(null);

  // AI Custom Practice Test Generator states
  const [aiSubject, setAiSubject] = useState<'Physics' | 'Chemistry' | 'Mathematics' | 'Biology'>('Physics');
  const [aiTopic, setAiTopic] = useState<string>('');
  const [aiDifficulty, setAiDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [generatingAiTest, setGeneratingAiTest] = useState<boolean>(false);

  const handleGenerateAiTest = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingAiTest(true);

    // Combine questions from context pool and loaded tests to get the largest possible pool
    const allAvailableQuestions = [
      ...questions,
      ...tests.flatMap(t => t.questions)
    ];

    // Deduplicate by ID
    const uniqueQuestionsMap = new Map();
    allAvailableQuestions.forEach(q => {
      if (q && q.id) {
        uniqueQuestionsMap.set(q.id, q);
      }
    });
    const deduplicatedQuestions = Array.from(uniqueQuestionsMap.values());

    // Filter questions
    let match = deduplicatedQuestions.filter(q => q.subject === aiSubject);
    if (aiTopic.trim()) {
      match = match.filter(q => q.topic.toLowerCase().includes(aiTopic.toLowerCase().trim()));
    }
    match = match.filter(q => q.difficulty === aiDifficulty);

    // Fallbacks if not enough matches found
    if (match.length < 5) {
      match = deduplicatedQuestions.filter(q => q.subject === aiSubject && q.difficulty === aiDifficulty);
    }
    if (match.length < 5) {
      match = deduplicatedQuestions.filter(q => q.subject === aiSubject);
    }
    if (match.length === 0) {
      match = deduplicatedQuestions.slice(0, 10);
    }

    // Select up to 10 questions randomly
    const shuffled = match.sort(() => 0.5 - Math.random());
    const selectedQs = shuffled.slice(0, 10);

    setTimeout(() => {
      const generatedTest: MockTest = {
        id: 'ai_practice_' + Date.now(),
        name: `AI Custom Practice - ${aiSubject} (${aiTopic.trim() || 'All Topics'})`,
        duration: 15, // 15 minutes
        subjects: [aiSubject],
        questions: selectedQs
      };

      setGeneratingAiTest(false);
      handleStartTest(generatedTest);
    }, 800); // short delay
  };
  
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

  // Fetch mock tests from backend on mount
  useEffect(() => {
    const token = localStorage.getItem('mht_cet_token');
    fetch('http://localhost:5000/api/tests', {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Backend test route unavailable');
        return res.json();
      })
      .then(data => {
        const mapped = data.map((t: any) => ({
          id: t._id,
          name: t.name,
          duration: t.duration,
          subjects: t.subjects,
          questions: t.questions.map((q: any) => ({
            id: q._id,
            subject: q.subject,
            topic: q.chapter,
            difficulty: q.difficulty,
            question: q.question_text,
            options: [q.options.A, q.options.B, q.options.C, q.options.D],
            correctAnswer: q.correct_option === 'A' ? 0 : q.correct_option === 'B' ? 1 : q.correct_option === 'C' ? 2 : 3,
            explanation: q.explanation,
            marks: q.subject === 'Mathematics' ? 2 : 1
          }))
        }));
        setTests(mapped);
        setIsLoading(false);
      })
      .catch(err => {
        console.warn('Evaluation lobby fallback to local mock tests:', err.message);
        setTests(mockTests);
        setIsLoading(false);
      });
  }, [mockTests]);

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

  useEffect(() => {
    setIsMockTestActive(!!activeTest);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeTest) {
        e.preventDefault();
        e.returnValue = "A mock test is currently in progress. If you leave, your progress will be lost.";
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeTest, setIsMockTestActive]);

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
    setSelectedLobbyTest(test);
    setAgreedToTerms(false);
    setReviewAttempt(null);
  };

  const handleBeginActualExam = () => {
    if (!selectedLobbyTest) return;
    setActiveTest(selectedLobbyTest);
    setSelectedLobbyTest(null);
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

    const elapsed = Math.round((Date.now() - testStartTime) / 1000);
    const token = localStorage.getItem('mht_cet_token');
    
    fetch('http://localhost:5000/api/tests/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        testId: activeTest.id,
        answers: selectedAnswers,
        timeSpent: elapsed,
        questionTimes: finalTimes
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Evaluation server offline.');
        return res.json();
      })
      .then(data => {
        setActiveTest(null);
        setShowSubmitConfirm(false);
        
        setReviewAttempt({
          id: data.attemptId,
          testId: activeTest.id,
          testName: activeTest.name,
          date: new Date().toISOString().split('T')[0],
          score: data.score,
          maxScore: data.maxScore,
          timeSpent: elapsed,
          accuracy: data.accuracy,
          answers: activeTest.questions.reduce((acc, q) => {
            const selIdx = selectedAnswers[q.id];
            acc[q.id] = {
              selected: selIdx !== undefined ? selIdx : -1,
              isCorrect: selIdx === q.correctAnswer,
              timeTaken: finalTimes[q.id] || 30
            };
            return acc;
          }, {} as any),
          feedback: {
            instructorName: 'AI Diagnostic Engine',
            text: `Score: ${data.score}/${data.maxScore}. Accuracy: ${data.accuracy}%. Percentile: ${data.percentile || 'N/A'}. National Rank: ${data.nationalRank || 'N/A'}.`,
            date: new Date().toISOString().split('T')[0],
            aiSuggestions: [
              `Time index: Completed in ${Math.round(elapsed / 60)} minutes.`,
              `National Standing: Rank #${data.nationalRank} (Percentile: ${data.percentile}%)`
            ]
          }
        });
      })
      .catch(err => {
        console.warn('Evaluation failed on server, falling back to client evaluation:', err.message);
        
        // Evaluate answers locally
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
            timeTaken: finalTimes[q.id] || 30
          };
        });

        const accuracy = Math.round((correctCount / activeTest.questions.length) * 100);
        submitAttempt({
          testId: activeTest.id,
          testName: activeTest.name,
          date: new Date().toISOString().split('T')[0],
          score,
          maxScore,
          timeSpent: elapsed,
          accuracy,
          answers: answerLogs
        });

        setActiveTest(null);
        setShowSubmitConfirm(false);
        setReviewAttempt({
          id: 'local_att_' + Math.random().toString(36).substr(2, 9),
          testId: activeTest.id,
          testName: activeTest.name,
          date: new Date().toISOString().split('T')[0],
          score,
          maxScore,
          timeSpent: elapsed,
          accuracy,
          answers: answerLogs,
          feedback: {
            instructorName: 'Local Fallback Engine',
            text: `Evaluated locally. Score: ${score}/${maxScore} (${accuracy}% accuracy).`,
            date: new Date().toISOString().split('T')[0],
            aiSuggestions: ['Review weak topics. Server was unavailable for relative scoring.']
          }
        });
      });
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

  // Render instructions screen before start
  if (selectedLobbyTest) {
    return (
      <div className="card" style={{ maxWidth: '800px', margin: '40px auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '30px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
            Exam Simulator Instructions
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Please read the instructions carefully before starting the exam.
          </p>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', paddingTop: '20px', paddingBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>Test Details:</h3>
            <ul style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', listStyleType: 'disc', paddingLeft: '20px' }}>
              <li>Test Name: <strong>{selectedLobbyTest.name}</strong></li>
              <li>Duration: <strong>{selectedLobbyTest.duration} minutes</strong></li>
              <li>Number of Questions: <strong>{selectedLobbyTest.questions.length} MCQs</strong></li>
              <li>Subjects Included: <strong>{selectedLobbyTest.subjects.join(', ')}</strong></li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>Marking Scheme & Criteria:</h3>
            <ul style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', listStyleType: 'disc', paddingLeft: '20px' }}>
              <li><strong>Mathematics</strong> questions carry <strong>+2 marks</strong> for each correct response.</li>
              <li><strong>Physics, Chemistry, and Biology</strong> questions carry <strong>+1 mark</strong> for each correct option.</li>
              <li>There is <strong>no negative marking</strong> for incorrect or unattempted responses.</li>
              <li>The timer cannot be paused once started. Ensure you have a stable connection.</li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>Keyboard & Mouse Navigation Controls:</h3>
            <ul style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', listStyleType: 'disc', paddingLeft: '20px' }}>
              <li>Use the options list to select your choice.</li>
              <li>Click <strong>Save & Next</strong> to save the answer and advance to the next question.</li>
              <li>Click <strong>Mark for Review & Next</strong> to flag the question for review while skipping or answering.</li>
              <li>Use the right-side <strong>Question Palette Grid</strong> to jump directly to any question.</li>
            </ul>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            id="instructions-agree"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="instructions-agree" style={{ fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', color: 'var(--text-main)' }}>
            I have read and understood all exam rules and confirm my system readiness.
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
          <button onClick={() => setSelectedLobbyTest(null)} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleBeginActualExam}
            className="btn btn-primary"
            disabled={!agreedToTerms}
          >
            Begin Exam
          </button>
        </div>
      </div>
    );
  }

  // Render score details / answer reviews
  if (reviewAttempt) {
    const matchedTest = tests.find(t => t.id === reviewAttempt.testId) || { questions: questions };
    
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
          <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 280px)', paddingRight: '12px' }}>
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
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {isSelected && (
                <button
                  onClick={handleSaveAndNext}
                  className="btn btn-sm"
                  style={{ backgroundColor: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer' }}
                >
                  <CheckCircle2 size={14} />
                  <span>Submit Question</span>
                </button>
              )}
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

  // Helper to categorize tests
  const getTestCategory = (test: MockTest): 'Complete' | 'Chapter' | 'Subject' => {
    const name = test.name.toLowerCase();
    if (name.includes('full syllabus') || test.subjects.length > 2) {
      return 'Complete';
    } else if (name.includes('chapterwise') || name.includes('special')) {
      return 'Chapter';
    } else {
      return 'Subject';
    }
  };

  const filteredTests = tests.filter(test => {
    if (selectedCategory === 'All') return true;
    return getTestCategory(test) === selectedCategory;
  });

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

      {/* Category Selection Hub */}
      <div style={{ display: 'flex', gap: '10px', backgroundColor: 'var(--primary-light)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', width: 'fit-content' }}>
        {(['All', 'Complete', 'Chapter', 'Subject'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`btn btn-xs ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            style={{ height: '32px', padding: '0 16px', borderRadius: '6px' }}
          >
            {cat === 'All' ? 'All Tests' : cat === 'Complete' ? 'Complete Syllabus' : cat === 'Chapter' ? 'Chapter-wise' : 'Subject-wise'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Mock test series cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* AI Custom Practice Test Generator Card */}
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Sparkles size={18} style={{ color: 'var(--accent)' }} /> AI Custom Practice Exam Generator
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', margin: 0 }}>
              Generate a custom 10-question practice test matching your choice of subject, chapter/topic, and difficulty.
            </p>
            <form onSubmit={handleGenerateAiTest} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Subject</label>
                <select
                  value={aiSubject}
                  onChange={e => setAiSubject(e.target.value as any)}
                  className="form-select"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                >
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Biology">Biology</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Chapter / Topic Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rotational Dynamics"
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Difficulty Level</label>
                <select
                  value={aiDifficulty}
                  onChange={e => setAiDifficulty(e.target.value as any)}
                  className="form-select"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={generatingAiTest}
                style={{ width: '100%', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {generatingAiTest ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Launch AI Exam</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Available Mock Exams</h3>
          {isLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading exams from backend...</p>
          ) : filteredTests.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No exams found in this category.</p>
          ) : (
            filteredTests.map(test => (
              <div key={test.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s hover' }}>
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
            ))
          )}
        </div>

        {/* Side Panel: Leaderboard & Scores */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Peer Leaderboard UI */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={18} style={{ color: '#f59e0b' }} /> Peer Standings & Ranks
            </h3>
            
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left' }}>Student</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Ovr</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>JEE</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>NEET</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>CET</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>%ile</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard && leaderboard.length > 0 ? (
                    leaderboard.slice(0, 10).map(peer => (
                      <tr 
                        key={peer.id} 
                        style={{ 
                          backgroundColor: peer.active ? 'var(--primary-light)' : 'transparent',
                          fontWeight: peer.active ? 600 : 400
                        }}
                      >
                        <td style={{ padding: '8px 4px', textAlign: 'left' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{peer.name}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>{peer.course}</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 700, color: 'var(--accent)' }}>#{peer.rank}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'center' }}>{typeof peer.jee === 'number' ? `#${peer.jee}` : peer.jee}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'center' }}>{typeof peer.neet === 'number' ? `#${peer.neet}` : peer.neet}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'center' }}>{typeof peer.cet === 'number' ? `#${peer.cet}` : peer.cet}</td>
                        <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 700 }}>
                          {typeof peer.percentile === 'number' ? `${peer.percentile.toFixed(2)}%` : peer.percentile}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                        No leaderboard data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historical score summaries */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Previous Score Logs</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: '4px' }}>
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
                    backgroundColor: 'var(--primary-light)',
                    flexShrink: 0
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 
                      style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 600, 
                        margin: 0, 
                        maxWidth: '160px', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis' 
                      }}
                      title={att.testName}
                    >
                      {att.testName}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{att.date}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
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
    </div>
  );
};
