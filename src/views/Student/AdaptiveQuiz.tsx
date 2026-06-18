import React, { useState } from 'react';
import { useLms } from '../../context/LmsContext';
import { Question } from '../../data/mockData';
import { Brain, Sparkles, CheckCircle, HelpCircle, ArrowLeft, BookOpen } from 'lucide-react';

export const AdaptiveQuiz: React.FC = () => {
  const { weakTopics, strongTopics, generateAdaptiveQuiz, submitAttempt, questions } = useLms();
  
  // Active micro-quiz states
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[] | null>(null);
  const [activeTopic, setActiveTopic] = useState<string>('');
  const [activeSubject, setActiveSubject] = useState<'Physics' | 'Chemistry' | 'Mathematics' | 'Biology'>('Physics');
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<{ [qId: string]: number }>({});
  const [quizResult, setQuizResult] = useState<{ score: number; maxScore: number; accuracy: number } | null>(null);

  const startQuiz = (topic: string) => {
    // Find subject for this topic
    const sample = questions.find(q => q.topic === topic);
    const subject = sample ? sample.subject : 'Physics';
    
    const quizQs = generateAdaptiveQuiz(subject, topic);
    setActiveQuizQuestions(quizQs);
    setActiveTopic(topic);
    setActiveSubject(subject);
    setCurrentIdx(0);
    setAnswers({});
    setQuizResult(null);
  };

  const handleSelectOption = (optIdx: number) => {
    if (!activeQuizQuestions) return;
    const qId = activeQuizQuestions[currentIdx].id;
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const nextQuestion = () => {
    if (currentIdx < 4) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (!activeQuizQuestions) return;

    let correctCount = 0;
    let totalMarks = 0;
    let score = 0;
    const answerLogs: any = {};

    activeQuizQuestions.forEach(q => {
      const selected = answers[q.id];
      const isCorrect = selected === q.correctAnswer;
      const qMarks = q.marks || 1;

      totalMarks += qMarks;
      if (selected !== undefined && isCorrect) {
        score += qMarks;
        correctCount++;
      }

      answerLogs[q.id] = {
        selected: selected !== undefined ? selected : -1,
        isCorrect: selected !== undefined && isCorrect,
        timeTaken: 60 // average simulated time
      };
    });

    const accuracy = Math.round((correctCount / activeQuizQuestions.length) * 100);

    // Save to global attempts so strengths/weaknesses recalculate
    submitAttempt({
      testId: 'adaptive_' + activeTopic.toLowerCase().replace(/\s+/g, '_'),
      testName: `Adaptive Quiz: ${activeTopic}`,
      date: new Date().toISOString().split('T')[0],
      score,
      maxScore: totalMarks,
      timeSpent: 300, // 5 mins
      accuracy,
      answers: answerLogs
    });

    setQuizResult({
      score,
      maxScore: totalMarks,
      accuracy
    });
  };

  const handleExitQuiz = () => {
    setActiveQuizQuestions(null);
    setQuizResult(null);
  };

  // Helper to determine subject background
  const getSubjectColor = (subj: string) => {
    switch (subj) {
      case 'Physics': return '#e0f2fe';
      case 'Chemistry': return '#fef3c7';
      case 'Mathematics': return '#fae8ff';
      case 'Biology': return '#dcfce7';
      default: return 'var(--primary-light)';
    }
  };

  // Render active micro-quiz workspace
  if (activeQuizQuestions) {
    const currentQ = activeQuizQuestions[currentIdx];
    const isSelected = answers[currentQ.id] !== undefined;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '750px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={handleExitQuiz} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} /> Leave Quiz
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={18} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Topic: {activeTopic}</span>
          </div>
        </div>

        {quizResult ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <CheckCircle size={56} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Micro-Quiz Completed!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Your accuracy on {activeTopic} was evaluated to calculate conceptual understanding.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '300px', margin: '0 auto 32px' }}>
              <div className="card" style={{ padding: '16px', boxShadow: 'none', backgroundColor: 'var(--primary-light)' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{quizResult.score} / {quizResult.maxScore}</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Score</span>
              </div>
              <div className="card" style={{ padding: '16px', boxShadow: 'none', backgroundColor: 'var(--primary-light)' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{quizResult.accuracy}%</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Accuracy</span>
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '24px' }}>
              {quizResult.accuracy >= 70 
                ? '🏆 Excellent progress! This topic index will shift towards your Strong Categories.'
                : '💡 Keep practicing. Read the reference notes for this topic in the study repository.'}
            </p>

            <button onClick={handleExitQuiz} className="btn btn-primary">
              Return to Adaptive Engine
            </button>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
            {/* Quiz progress header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
              <span className={`badge badge-${activeSubject.toLowerCase()}`}>
                {activeSubject}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Question {currentIdx + 1} of 5
              </span>
            </div>

            {/* Question layout */}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '20px' }}>
                {currentQ.question}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {currentQ.options.map((opt, oIdx) => (
                  <label 
                    key={oIdx}
                    className={`question-option-label ${answers[currentQ.id] === oIdx ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`adaptive-q-${currentQ.id}`}
                      checked={answers[currentQ.id] === oIdx}
                      onChange={() => handleSelectOption(oIdx)}
                      style={{ marginTop: '4px' }}
                    />
                    <span>
                      <strong>{String.fromCharCode(65 + oIdx)}.</strong> {opt}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Next/Prev buttons */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
              <button 
                onClick={prevQuestion} 
                className="btn btn-secondary btn-sm"
                disabled={currentIdx === 0}
              >
                Previous
              </button>

              {currentIdx === 4 ? (
                <button 
                  onClick={handleSubmitQuiz} 
                  className="btn btn-primary btn-sm"
                  disabled={Object.keys(answers).length < 5}
                  title={Object.keys(answers).length < 5 ? 'Answer all 5 questions to submit' : ''}
                >
                  Submit Quiz
                </button>
              ) : (
                <button 
                  onClick={nextQuestion} 
                  className="btn btn-primary btn-sm"
                  disabled={!isSelected}
                >
                  Next Question
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
          AI Adaptive Learning Engine
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          The adaptive engine scans your mock test accuracy metrics to identify chapter gaps, serving custom micro-quizzes to master them.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Weak topics card */}
        <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles size={18} style={{ color: 'var(--danger)' }} /> Weak Sub-Topics (&lt; 70% Accuracy)
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            These chapters require immediate revision. Launch a 5-MCQ micro-quiz to check your conceptual knowledge.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {weakTopics.map(topic => {
              // Find subject associated with topic
              const sample = questions.find(q => q.topic === topic);
              const subject = sample ? sample.subject : 'Physics';
              return (
                <div 
                  key={topic} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: 'var(--primary-light)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div>
                    <span className={`badge badge-${subject.toLowerCase()}`} style={{ fontSize: '0.65rem', marginBottom: '4px' }}>
                      {subject}
                    </span>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{topic}</h4>
                  </div>
                  <button onClick={() => startQuiz(topic)} className="btn btn-danger btn-sm" style={{ padding: '6px 12px' }}>
                    Generate Quiz
                  </button>
                </div>
              );
            })}

            {weakTopics.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                🎉 Amazing! No weak topics identified in your current mock histories.
              </div>
            )}
          </div>
        </div>

        {/* Strong topics card */}
        <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
          <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <CheckCircle size={18} style={{ color: 'var(--success)' }} /> Strong Categories (&gt; 70% Accuracy)
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            You have solid concept retention here. Keep maintaining consistency by taking mock tests periodically.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {strongTopics.map(topic => {
              const sample = questions.find(q => q.topic === topic);
              const subject = sample ? sample.subject : 'Chemistry';
              return (
                <div 
                  key={topic} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: 'var(--primary-light)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)'
                  }}
                >
                  <span className={`badge badge-${subject.toLowerCase()}`} style={{ fontSize: '0.65rem', minWidth: '80px', textAlign: 'center' }}>
                    {subject}
                  </span>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>{topic}</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600 }}>Sufficient Mastery</span>
                  </div>
                </div>
              );
            })}

            {strongTopics.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                Solve mock tests to record answers and identify strong chapter lists.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
