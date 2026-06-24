import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Question,
  StudyMaterial,
  TestAttempt,
  MockTest,
  UserProfile,
  CalendarEvent,
  UserNote,
  initialQuestions,
  initialMockTests,
  initialStudyMaterials,
  initialAttempts,
  initialEvents,
  initialNotes,
  mockUsers
} from '../data/mockData';

interface LmsContextType {
  activeUser: UserProfile | null;
  questions: Question[];
  mockTests: MockTest[];
  studyMaterials: StudyMaterial[];
  attempts: TestAttempt[];
  events: CalendarEvent[];
  notes: UserNote[];
  login: (user: UserProfile, token: string) => void;
  logout: () => void;
  addQuestion: (q: Omit<Question, 'id'>) => void;
  addStudyMaterial: (sm: Omit<StudyMaterial, 'id'>) => void;
  deleteStudyMaterial: (id: string) => void;
  addNote: (note: Omit<UserNote, 'id' | 'lastUpdated'>) => void;
  updateNote: (id: string, content: string, title?: string) => void;
  deleteNote: (id: string) => void;
  submitAttempt: (attempt: Omit<TestAttempt, 'id'>) => string;
  addFeedback: (attemptId: string, feedbackText: string, aiSuggestions?: string[]) => void;
  weakTopics: string[];
  strongTopics: string[];
  generateAdaptiveQuiz: (subject: string, topic: string) => Question[];
  addCalendarEvent: (e: Omit<CalendarEvent, 'id'>) => void;
  runTour: boolean;
  setRunTour: (run: boolean) => void;
  upgradeUserPlan: (plan: 'Pro' | 'Premium', targetCourse: 'PCB' | 'PCM' | 'PCMB', targetExam: 'JEE' | 'NEET' | 'MHT-CET') => Promise<void>;
  isMockTestActive: boolean;
  setIsMockTestActive: (active: boolean) => void;
}

const LmsContext = createContext<LmsContextType | undefined>(undefined);

export const LmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeUser, setActiveUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('mht_cet_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem('mht_cet_questions');
    return saved ? JSON.parse(saved) : initialQuestions;
  });

  const [mockTests, setMockTests] = useState<MockTest[]>(() => {
    const saved = localStorage.getItem('mht_cet_mocktests');
    return saved ? JSON.parse(saved) : initialMockTests;
  });

  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>(() => {
    const saved = localStorage.getItem('mht_cet_materials');
    return saved ? JSON.parse(saved) : initialStudyMaterials;
  });

  const [attempts, setAttempts] = useState<TestAttempt[]>(() => {
    const saved = localStorage.getItem('mht_cet_attempts');
    return saved ? JSON.parse(saved) : initialAttempts;
  });

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('mht_cet_events');
    return saved ? JSON.parse(saved) : initialEvents;
  });

  const [notes, setNotes] = useState<UserNote[]>(() => {
    const saved = localStorage.getItem('mht_cet_notes');
    return saved ? JSON.parse(saved) : initialNotes;
  });

  // Dynamic calculations for strengths and weaknesses
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [strongTopics, setStrongTopics] = useState<string[]>([]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('mht_cet_questions', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('mht_cet_mocktests', JSON.stringify(mockTests));
  }, [mockTests]);

  useEffect(() => {
    localStorage.setItem('mht_cet_materials', JSON.stringify(studyMaterials));
  }, [studyMaterials]);

  useEffect(() => {
    localStorage.setItem('mht_cet_attempts', JSON.stringify(attempts));
  }, [attempts]);

  useEffect(() => {
    localStorage.setItem('mht_cet_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('mht_cet_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if (activeUser) {
      localStorage.setItem('mht_cet_user', JSON.stringify(activeUser));
    } else {
      localStorage.removeItem('mht_cet_user');
    }
  }, [activeUser]);

  // Recalculate weak and strong topics from mock test history
  useEffect(() => {
    // We group questions by topic and count correct vs total attempts
    const topicStats: { [topic: string]: { correct: number; total: number } } = {};

    attempts.forEach(attempt => {
      Object.entries(attempt.answers).forEach(([qId, answer]) => {
        const question = questions.find(q => q.id === qId);
        if (question) {
          if (!topicStats[question.topic]) {
            topicStats[question.topic] = { correct: 0, total: 0 };
          }
          topicStats[question.topic].total += 1;
          if (answer.isCorrect) {
            topicStats[question.topic].correct += 1;
          }
        }
      });
    });

    const weak: string[] = [];
    const strong: string[] = [];

    Object.entries(topicStats).forEach(([topic, stats]) => {
      const accuracy = (stats.correct / stats.total) * 100;
      if (accuracy < 70) {
        weak.push(topic);
      } else {
        strong.push(topic);
      }
    });

    // Fallbacks from initial profile if empty
    const defaultStudent = mockUsers.find(u => u.role === 'student');
    setWeakTopics(weak.length > 0 ? weak : (defaultStudent?.weakTopics || []));
    setStrongTopics(strong.length > 0 ? strong : (defaultStudent?.strongTopics || []));
  }, [attempts, questions]);

  // Actions
  const login = (user: UserProfile, token: string) => {
    localStorage.setItem('mht_cet_token', token);
    setActiveUser(user);
    // Reset mock lists for live authenticated session
    setAttempts([]);
    setNotes([]);
    setEvents(initialEvents);
  };

  const logout = () => {
    localStorage.removeItem('mht_cet_token');
    setActiveUser(null);
    setAttempts([]);
    setNotes([]);
    setEvents(initialEvents);
  };

  const addQuestion = (q: Omit<Question, 'id'>) => {
    const newQ: Question = {
      ...q,
      id: 'q_' + Math.random().toString(36).substr(2, 9)
    };
    setQuestions(prev => {
      const updated = [...prev, newQ];
      // Update mock tests that contain this subject, just in case
      return updated;
    });

    // If added manually or generated, let's also update the mock tests list
    // (We add it to the first full mock test as supplementary)
    setMockTests(prev => {
      return prev.map(test => {
        if (test.id === 't1' && test.subjects.includes(newQ.subject)) {
          return { ...test, questions: [...test.questions, newQ] };
        }
        return test;
      });
    });
  };

  const addStudyMaterial = (sm: Omit<StudyMaterial, 'id'>) => {
    const newSM: StudyMaterial = {
      ...sm,
      id: 'sm_' + Math.random().toString(36).substr(2, 9)
    };
    setStudyMaterials(prev => [...prev, newSM]);
  };

  const deleteStudyMaterial = (id: string) => {
    setStudyMaterials(prev => prev.filter(sm => sm.id !== id));
  };

  const addNote = (note: Omit<UserNote, 'id' | 'lastUpdated'>) => {
    const newNote: UserNote = {
      ...note,
      id: 'note_' + Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const updateNote = (id: string, content: string, title?: string) => {
    setNotes(prev =>
      prev.map(note =>
        note.id === id
          ? {
              ...note,
              content,
              title: title || note.title,
              lastUpdated: new Date().toISOString().split('T')[0]
            }
          : note
      )
    );
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const submitAttempt = (attempt: Omit<TestAttempt, 'id'>): string => {
    const attemptId = 'att_' + Math.random().toString(36).substr(2, 9);
    const newAttempt: TestAttempt = {
      ...attempt,
      id: attemptId,
      // Automatically add standard AI feedback triggers
      feedback: {
        instructorName: 'AI Engine',
        text: 'Reviewing performance logs. Subject tutor will submit detailed guidelines soon.',
        date: new Date().toISOString().split('T')[0],
        aiSuggestions: [
          `Calculated accuracy: ${attempt.accuracy}%.`,
          `Time ratio: Average of ${Math.round(attempt.timeSpent / Object.keys(attempt.answers).length)}s per question.`,
          `Weak topics encountered: ${Object.entries(attempt.answers)
            .filter(([_, ans]) => !ans.isCorrect)
            .map(([qId]) => questions.find(q => q.id === qId)?.topic)
            .filter((v, i, a) => v && a.indexOf(v) === i)
            .join(', ') || 'None'}`
        ]
      }
    };
    setAttempts(prev => [newAttempt, ...prev]);

    // Live backend integration with try/catch fallback
    const token = localStorage.getItem('mht_cet_token');
    fetch('http://localhost:5000/api/student/analyze-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({
        testAttemptId: attemptId,
        subject: attempt.subject,
        test_name: attempt.testName || 'Practice Quiz',
        scoreData: {
          score: attempt.score,
          maxScore: attempt.maxScore,
          accuracy: attempt.accuracy,
          timeSpent: attempt.timeSpent,
          answers: attempt.answers
        }
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Backend server connection failed.');
        return res.json();
      })
      .then(data => {
        // Update local logs details with live Gemini metrics
        if (data && data.ai_analysis) {
          setAttempts(prev =>
            prev.map(att => {
              if (att.id === attemptId) {
                return {
                  ...att,
                  feedback: {
                    instructorName: 'AI GenAI Engine',
                    text: data.ai_analysis.student_feedback || att.feedback?.text || '',
                    date: new Date().toISOString().split('T')[0],
                    aiSuggestions: [
                      `Time Index: ${data.ai_analysis.time_management_rating}`,
                      `Conceptual weaknesses flagged: ${(data.ai_analysis.weak_topics || []).join(', ') || 'None'}`,
                      `Parent report: ${data.ai_analysis.parent_feedback || 'No issues flagged.'}`
                    ]
                  }
                };
              }
              return att;
            })
          );
        }
      })
      .catch(err => {
        console.warn('[AI INTEGRATION] Live API server offline. Reverted to browser sandbox AI model.', err.message);
      });

    // Update loginDates to mark today active in student tracking
    if (activeUser && activeUser.role === 'student') {
      const todayStr = new Date().toISOString().split('T')[0];
      const dates = activeUser.loginDates ? [...activeUser.loginDates] : [];
      if (!dates.includes(todayStr)) {
        dates.push(todayStr);
        setActiveUser(prev => prev ? { ...prev, loginDates: dates } : null);
      }
    }

    return attemptId;
  };

  const addFeedback = (attemptId: string, feedbackText: string, aiSuggestions?: string[]) => {
    setAttempts(prev =>
      prev.map(att => {
        if (att.id === attemptId) {
          return {
            ...att,
            feedback: {
              instructorName: 'Prof. Sharma',
              text: feedbackText,
              date: new Date().toISOString().split('T')[0],
              aiSuggestions: aiSuggestions || (att.feedback?.aiSuggestions || [])
            }
          };
        }
        return att;
      })
    );
  };

  // Generate 5 questions targeting weak topics (AI Adaptive engine)
  const generateAdaptiveQuiz = (subject: string, topic: string): Question[] => {
    // Find questions in database matching subject and topic
    let match = questions.filter(q => q.subject === subject && q.topic === topic);
    
    // If we don't have enough, grab others from the same subject
    if (match.length < 5) {
      const padding = questions.filter(q => q.subject === subject && q.topic !== topic);
      match = [...match, ...padding].slice(0, 5);
    }
    
    // If still less than 5, grab general questions
    if (match.length < 5) {
      match = [...match, ...questions].slice(0, 5);
    }

    // Return exactly 5 questions (randomized or capped)
    return match.slice(0, 5);
  };

  const [runTour, setRunTour] = useState(false);
  const [isMockTestActive, setIsMockTestActive] = useState<boolean>(false);

  const upgradeUserPlan = async (plan: 'Pro' | 'Premium', targetCourse: 'PCB' | 'PCM' | 'PCMB', targetExam: 'JEE' | 'NEET' | 'MHT-CET') => {
    const token = localStorage.getItem('mht_cet_token');
    try {
      const response = await fetch('http://localhost:5000/api/user/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ plan, targetCourse, targetExam })
      });
      if (!response.ok) {
        throw new Error('Failed to upgrade subscription on server');
      }
      const data = await response.json();
      if (data.success && data.user) {
        setActiveUser(prev => prev ? { ...prev, ...data.user } : data.user);
        alert(`Successfully upgraded to ${plan}! Invoice reference: ${data.user.invoiceId}`);
      }
    } catch (err: any) {
      console.error('[UPGRADE ERROR]', err);
      setActiveUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          plan,
          targetCourse,
          targetExam,
          invoiceId: `INV-MOCK-UPGRADE-${Date.now()}`,
          invoiceUrl: `/public/invoices/mock.pdf`
        };
      });
      alert(`Upgraded to ${plan} (offline mockup mode).`);
    }
  };

  const addCalendarEvent = (e: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...e,
      id: 'e_' + Math.random().toString(36).substr(2, 9)
    };
    setEvents(prev => [...prev, newEvent]);
  };

  return (
    <LmsContext.Provider
      value={{
        activeUser,
        questions,
        mockTests,
        studyMaterials,
        attempts,
        events,
        notes,
        login,
        logout,
        addQuestion,
        addStudyMaterial,
        deleteStudyMaterial,
        addNote,
        updateNote,
        deleteNote,
        submitAttempt,
        addFeedback,
        weakTopics,
        strongTopics,
        generateAdaptiveQuiz,
        addCalendarEvent,
        runTour,
        setRunTour,
        upgradeUserPlan,
        isMockTestActive,
        setIsMockTestActive
      }}
    >
      {children}
    </LmsContext.Provider>
  );
};

export const useLms = () => {
  const context = useContext(LmsContext);
  if (context === undefined) {
    throw new Error('useLms must be used within a LmsProvider');
  }
  return context;
};
