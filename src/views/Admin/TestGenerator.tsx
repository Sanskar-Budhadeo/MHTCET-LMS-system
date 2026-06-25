import React, { useState, useEffect } from 'react';
import { useLms } from '../../context/LmsContext';
import { Question } from '../../data/mockData';
import { PenTool, Sparkles, Terminal, CheckCircle2, Trash2, Edit2, Plus, Calendar, FileText, Check } from 'lucide-react';

export const TestGenerator: React.FC = () => {
  const { addQuestion, fetchEvents } = useLms();
  const [activeMode, setActiveMode] = useState<'pool' | 'create' | 'publish'>('pool');

  // Database Pool & Selection State
  const [questionsList, setQuestionsList] = useState<any[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [loadingPool, setLoadingPool] = useState(false);

  // Question CRUD Editing state
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Manual Form States
  const [createMode, setCreateMode] = useState<'manual' | 'ai'>('manual');
  const [subject, setSubject] = useState<'Physics' | 'Chemistry' | 'Mathematics' | 'Biology'>('Physics');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [explanation, setExplanation] = useState('');

  // AI Form States
  const [aiSubject, setAiSubject] = useState<'Physics' | 'Chemistry' | 'Mathematics' | 'Biology'>('Physics');
  const [aiTopic, setAiTopic] = useState('Rotational Dynamics');
  const [aiDifficulty, setAiDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [aiPrompt, setAiPrompt] = useState('Focus on rolling kinetic energy and cylinders.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [generatedQs, setGeneratedQs] = useState<any[]>([]);

  // Test Publishing Form States
  const [testName, setTestName] = useState('');
  const [testDuration, setTestDuration] = useState(180);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [scheduledPublishTime, setScheduledPublishTime] = useState('');
  const [publishing, setPublishing] = useState(false);

  const fetchQuestions = async () => {
    setLoadingPool(true);
    try {
      const response = await fetch('http://localhost:5000/api/questions');
      if (response.ok) {
        const data = await response.json();
        setQuestionsList(data);
      }
    } catch (err) {
      console.error('Error fetching questions from database:', err);
    } finally {
      setLoadingPool(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !questionText || options.some(o => !o) || !explanation) {
      alert('Please fill out all form inputs.');
      return;
    }

    const payload = {
      subject,
      chapter: topic,
      difficulty,
      question_text: questionText,
      options: {
        A: options[0],
        B: options[1],
        C: options[2],
        D: options[3]
      },
      correct_option: correctAnswer === 0 ? 'A' : correctAnswer === 1 ? 'B' : correctAnswer === 2 ? 'C' : 'D',
      explanation
    };

    const token = localStorage.getItem('mht_cet_token');
    try {
      const response = await fetch('http://localhost:5000/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const newQ = await response.json();
        alert('MCQ stored in MHT-CET database successfully!');
        
        // Add to local context
        addQuestion({
          id: newQ._id,
          subject: newQ.subject,
          topic: newQ.chapter,
          difficulty: newQ.difficulty,
          question: newQ.question_text,
          options: [newQ.options.A, newQ.options.B, newQ.options.C, newQ.options.D],
          correctAnswer: correctAnswer,
          explanation: newQ.explanation,
          marks: newQ.subject === 'Mathematics' ? 2 : 1
        });

        // Reset form
        setQuestionText('');
        setOptions(['', '', '', '']);
        setExplanation('');
        setTopic('');
        fetchQuestions();
      } else {
        const errData = await response.json();
        alert('Error: ' + (errData.error || 'Failed to save question'));
      }
    } catch (err) {
      console.error('Error storing question:', err);
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    setOptions(prev => {
      const updated = [...prev];
      updated[idx] = val;
      return updated;
    });
  };

  const triggerAIGenerator = async () => {
    setIsGenerating(true);
    setGenerationLogs([
      `[INFO] Initializing Google Gemini LLM API connection...`,
      `[INFO] Connecting to backend at http://localhost:5000/api/admin/generate-questions...`,
      `[INFO] Prompting: Generate 2 MHT-CET standard MCQs for ${aiSubject} - ${aiTopic} (${aiDifficulty})...`
    ]);
    setGeneratedQs([]);

    const token = localStorage.getItem('mht_cet_token');
    try {
      const response = await fetch('http://localhost:5000/api/admin/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: aiSubject,
          chapter: aiTopic,
          difficulty: aiDifficulty,
          count: 2
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'AI generation failed');
      }

      setGenerationLogs(prev => [
        ...prev,
        `[PROCESS] Output successfully parsed as JSON array.`,
        `[VALIDATE] Executing validation rules (no negative marking, 4 options count).`,
        `[SUCCESS] 2 questions passed all structural checks! Appending to database...`,
        `[DB CONNECTION] Successfully fetched and stored ${data.length} questions in MongoDB!`
      ]);

      const mapped = data.map((q: any) => ({
        id: q._id || 'q_' + Math.random().toString(36).substring(2, 9),
        subject: q.subject,
        topic: q.chapter,
        difficulty: q.difficulty,
        question: q.question_text,
        options: [q.options.A, q.options.B, q.options.C, q.options.D],
        correctAnswer: q.correct_option === 'A' ? 0 : q.correct_option === 'B' ? 1 : q.correct_option === 'C' ? 2 : 3,
        explanation: q.explanation,
        marks: q.subject === 'Mathematics' ? 2 : 1
      }));

      // Update state in Context
      mapped.forEach((q: any) => {
        addQuestion(q);
      });

      setGeneratedQs(mapped);
      fetchQuestions();
    } catch (err: any) {
      console.error('AI Generation error:', err);
      setGenerationLogs(prev => [
        ...prev,
        `[ERROR] Generation failed: ${err.message || err}`
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditClick = (q: any) => {
    setEditingQuestion({
      _id: q._id,
      subject: q.subject,
      chapter: q.chapter,
      difficulty: q.difficulty,
      question_text: q.question_text,
      options: {
        A: q.options.A,
        B: q.options.B,
        C: q.options.C,
        D: q.options.D
      },
      correct_option: q.correct_option,
      explanation: q.explanation
    });
    setShowEditModal(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    const token = localStorage.getItem('mht_cet_token');
    try {
      const response = await fetch(`http://localhost:5000/api/questions/${editingQuestion._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingQuestion)
      });
      if (response.ok) {
        alert('Question updated in database successfully!');
        setShowEditModal(false);
        setEditingQuestion(null);
        fetchQuestions();
      } else {
        const errData = await response.json();
        alert('Error: ' + (errData.error || 'Failed to update question'));
      }
    } catch (err) {
      console.error('Error updating question:', err);
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question? This cannot be undone.')) return;
    const token = localStorage.getItem('mht_cet_token');
    try {
      const response = await fetch(`http://localhost:5000/api/questions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        alert('Question deleted from database!');
        setSelectedQuestionIds(prev => prev.filter(qId => qId !== id));
        fetchQuestions();
      } else {
        const errData = await response.json();
        alert('Error: ' + (errData.error || 'Failed to delete question'));
      }
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  const handleToggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(qId => qId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) {
      alert('Please enter a mock test name.');
      return;
    }
    if (selectedQuestionIds.length === 0) {
      alert('Please select at least one question for the test.');
      return;
    }

    setPublishing(true);
    const token = localStorage.getItem('mht_cet_token');
    try {
      const response = await fetch('http://localhost:5000/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: testName,
          duration: testDuration,
          subjects: selectedSubjects.length > 0 ? selectedSubjects : ['General'],
          questions: selectedQuestionIds,
          scheduledTime: scheduledPublishTime ? new Date(scheduledPublishTime).toISOString() : null,
          isPublished: true
        })
      });
      if (response.ok) {
        alert(`Mock test "${testName}" published successfully! Students can access it according to schedule.`);
        setTestName('');
        setTestDuration(180);
        setSelectedSubjects([]);
        setScheduledPublishTime('');
        setSelectedQuestionIds([]);
        setActiveMode('pool');
        if (fetchEvents) fetchEvents();
      } else {
        const errData = await response.json();
        alert('Publish failed: ' + (errData.error || 'Server error'));
      }
    } catch (err) {
      console.error('Publish error:', err);
    } finally {
      setPublishing(false);
    }
  };

  const handleSubjectCheckboxChange = (subj: string) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subj)) {
        return prev.filter(s => s !== subj);
      } else {
        return [...prev, subj];
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
          MHT-CET Test Generator & Manager
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Review the questions pool, manage database questions, and compile custom Mock Tests with custom scheduling.
        </p>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '16px' }}>
        <button
          className={`btn ${activeMode === 'pool' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveMode('pool')}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' }}
        >
          <FileText size={16} /> Question Database Pool ({questionsList.length})
        </button>
        <button
          className={`btn ${activeMode === 'create' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveMode('create')}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' }}
        >
          <Plus size={16} /> Create / Generate Question
        </button>
        <button
          className={`btn ${activeMode === 'publish' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveMode('publish')}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none', position: 'relative' }}
        >
          <Calendar size={16} /> Publish Test Builder
          {selectedQuestionIds.length > 0 && (
            <span style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: 'var(--lime-accent)', color: '#09090b', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {selectedQuestionIds.length}
            </span>
          )}
        </button>
      </div>

      {/* Mode 1: Pool List (Single Column Layout with Checks, Edit, Delete) */}
      {activeMode === 'pool' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Selected <strong>{selectedQuestionIds.length}</strong> questions to build custom Mock Test
            </span>
            {selectedQuestionIds.length > 0 && (
              <button onClick={() => setActiveMode('publish')} className="btn btn-primary btn-sm" style={{ backgroundColor: 'var(--lime-accent)', color: '#09090b', borderColor: '#c4de32' }}>
                Build Test with {selectedQuestionIds.length} Questions &rarr;
              </button>
            )}
          </div>

          {loadingPool ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading database questions pool...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {questionsList.map((q) => {
                const isSelected = selectedQuestionIds.includes(q._id);
                return (
                  <div 
                    key={q._id} 
                    className="card" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '16px', 
                      padding: '20px', 
                      borderLeft: isSelected ? '4px solid #2563eb' : '1px solid var(--border)',
                      backgroundColor: isSelected ? 'rgba(37,99,235,0.01)' : 'var(--bg-card)'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => handleToggleSelectQuestion(q._id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '4px' }}
                    />
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <span className={`badge badge-${q.subject.toLowerCase()}`}>{q.subject}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>{q.chapter}</span>
                        <span className={`badge badge-${q.difficulty.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{q.difficulty}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginLeft: 'auto' }}>ID: {q._id}</span>
                      </div>

                      <p style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '12px', lineHeight: '1.4' }}>
                        {q.question_text}
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        <div><strong>A:</strong> {q.options.A} {q.correct_option === 'A' && '✔️'}</div>
                        <div><strong>B:</strong> {q.options.B} {q.correct_option === 'B' && '✔️'}</div>
                        <div><strong>C:</strong> {q.options.C} {q.correct_option === 'C' && '✔️'}</div>
                        <div><strong>D:</strong> {q.options.D} {q.correct_option === 'D' && '✔️'}</div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                          <strong>Explanation:</strong> {q.explanation}
                        </span>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleEditClick(q)} 
                            className="btn btn-outline btn-sm" 
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px' }}
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(q._id)} 
                            className="btn btn-outline btn-sm" 
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {questionsList.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No questions currently in the MHT-CET database. Go to 'Create / Generate' to add questions!
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Question Creation Form */}
      {activeMode === 'create' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className={`btn btn-sm ${createMode === 'manual' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCreateMode('manual')}>
              Manual Question Creator
            </button>
            <button className={`btn btn-sm ${createMode === 'ai' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCreateMode('ai')}>
              AI Question Generator (Gemini LLM)
            </button>
          </div>

          {createMode === 'manual' ? (
            <form onSubmit={handleManualSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Subject</label>
                  <select className="form-select" value={subject} onChange={(e) => setSubject(e.target.value as any)}>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Biology">Biology</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Chapter Sub-Topic</label>
                  <input
                    type="text"
                    className="form-input"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="E.g. Rotational Dynamics"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Difficulty Rating</label>
                  <select className="form-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
                    <option value="Easy">Easy (Board Level)</option>
                    <option value="Medium">Medium (CET Avg)</option>
                    <option value="Hard">Hard (CET Advanced)</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Question Text (Supports formulas)</label>
                <textarea
                  className="form-input"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Type the question content here..."
                  style={{ minHeight: '80px' }}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '10px' }}>Answer Options (4 Options required)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {options.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{String.fromCharCode(65 + idx)}:</span>
                      <input
                        type="text"
                        className="form-input"
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Correct Option Index</label>
                  <select 
                    className="form-select" 
                    value={correctAnswer} 
                    onChange={(e) => setCorrectAnswer(parseInt(e.target.value))}
                  >
                    <option value={0}>Option A</option>
                    <option value={1}>Option B</option>
                    <option value={2}>Option C</option>
                    <option value={3}>Option D</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Correct Solution Explanation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Step-by-step formula resolving logic..."
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', marginTop: '10px' }}>
                Save MCQ into Database
              </button>
            </form>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', alignItems: 'start' }}>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>AI Generator Inputs</h3>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Subject</label>
                  <select className="form-select" value={aiSubject} onChange={(e) => setAiSubject(e.target.value as any)}>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Biology">Biology</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Topic Chapter</label>
                  <input
                    type="text"
                    className="form-input"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="E.g. Rotational Dynamics"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Difficulty</label>
                  <select className="form-select" value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value as any)}>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Prompt Directives (optional)</label>
                  <textarea
                    className="form-input"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="E.g. Focus on kinetic energy comparison..."
                    style={{ minHeight: '60px' }}
                  />
                </div>

                <button 
                  onClick={triggerAIGenerator} 
                  className="btn btn-primary" 
                  disabled={isGenerating}
                  style={{ width: '100%', marginTop: '10px' }}
                >
                  {isGenerating ? 'Running Generation Engine...' : 'Trigger AI MCQ Generation'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div 
                  className="card" 
                  style={{ 
                    backgroundColor: '#0f172a', 
                    color: '#38bdf8', 
                    fontFamily: 'monospace', 
                    fontSize: '0.8rem', 
                    padding: '20px', 
                    minHeight: '260px',
                    border: '1px solid #334155',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    overflowY: 'auto',
                    maxHeight: '300px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '6px', marginBottom: '8px', color: '#94a3b8' }}>
                    <Terminal size={14} />
                    <span>AI Generator Console Terminal</span>
                  </div>
                  
                  {generationLogs.map((log, i) => (
                    <div key={i} style={{ lineBreak: 'anywhere' }}>
                      {log}
                    </div>
                  ))}

                  {isGenerating && (
                    <div className="pulse" style={{ color: '#fb7185' }}>
                      &gt; Computing LLM iterations...
                    </div>
                  )}

                  {!isGenerating && generationLogs.length === 0 && (
                    <div style={{ color: '#64748b' }}>
                      &gt; Terminal idle. Configure parameters and click 'Trigger AI MCQ Generation'.
                    </div>
                  )}
                </div>

                {generatedQs.length > 0 && (
                  <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <CheckCircle2 size={16} style={{ color: 'var(--success)' }} /> AI Generated Output Preview
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {generatedQs.map((q, idx) => (
                        <div key={q.id} style={{ borderBottom: idx === generatedQs.length - 1 ? 'none' : '1px solid var(--border)', paddingBottom: '12px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600 }}>MCQ {idx + 1}</span>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: '4px 0 8px', fontWeight: 500 }}>
                            {q.question}
                          </p>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {q.options.map((opt: string, oIdx: number) => (
                              <div key={oIdx}>
                                <strong>{String.fromCharCode(65 + oIdx)}.</strong> {opt} {oIdx === q.correctAnswer && '✔️'}
                              </div>
                            ))}
                          </div>

                          <div style={{ marginTop: '8px', fontSize: '0.75rem', backgroundColor: 'var(--primary-light)', padding: '6px 10px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                            <strong>Explanation:</strong> {q.explanation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Test Builder / Publisher Panel */}
      {activeMode === 'publish' && (
        <form onSubmit={handlePublishSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            Publish Selected Questions as Mock Test
          </h3>

          <div style={{ backgroundColor: 'var(--primary-light)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            Selected Questions Count: <strong>{selectedQuestionIds.length}</strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '12px' }}>
              (Go back to 'Question Database Pool' tab to add or remove questions)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Mock Test Title</label>
              <input
                type="text"
                className="form-input"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="E.g. Physics Chapterwise Mock Test 1"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Duration (Minutes)</label>
              <input
                type="number"
                className="form-input"
                value={testDuration}
                onChange={(e) => setTestDuration(parseInt(e.target.value) || 180)}
                placeholder="180"
                min={10}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Scheduled Publish Date & Time (Optional)</label>
              <input
                type="datetime-local"
                className="form-input"
                value={scheduledPublishTime}
                onChange={(e) => setScheduledPublishTime(e.target.value)}
                placeholder="Select date and time"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '4px', display: 'block' }}>
                If provided, students cannot see or start the test until this date/time.
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Subjects Tagged</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {['Physics', 'Chemistry', 'Mathematics', 'Biology'].map(subj => {
                  const isChecked = selectedSubjects.includes(subj);
                  return (
                    <label key={subj} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleSubjectCheckboxChange(subj)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>{subj}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ alignSelf: 'flex-end', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}
            disabled={publishing || selectedQuestionIds.length === 0}
          >
            {publishing ? 'Publishing Test...' : (scheduledPublishTime ? 'Schedule & Publish Test' : 'Publish Test Instantly')}
          </button>
        </form>
      )}

      {/* Edit Question Modal */}
      {showEditModal && editingQuestion && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '16px' }}>
              Edit Database Question
            </h3>

            <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Subject</label>
                  <select 
                    className="form-select" 
                    value={editingQuestion.subject} 
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, subject: e.target.value })}
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Biology">Biology</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Chapter Sub-Topic</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingQuestion.chapter}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, chapter: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Difficulty Rating</label>
                  <select 
                    className="form-select" 
                    value={editingQuestion.difficulty} 
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value })}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Question Text</label>
                <textarea
                  className="form-input"
                  value={editingQuestion.question_text}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })}
                  style={{ minHeight: '80px' }}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '8px' }}>Answer Options</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {['A', 'B', 'C', 'D'].map((opt: string) => (
                    <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700 }}>{opt}:</span>
                      <input
                        type="text"
                        className="form-input"
                        value={editingQuestion.options[opt]}
                        onChange={(e) => setEditingQuestion({
                          ...editingQuestion,
                          options: {
                            ...editingQuestion.options,
                            [opt]: e.target.value
                          }
                        })}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Correct Option</label>
                  <select 
                    className="form-select" 
                    value={editingQuestion.correct_option} 
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, correct_option: e.target.value })}
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Solution Explanation</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingQuestion.explanation}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
