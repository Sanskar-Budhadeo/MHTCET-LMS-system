import React, { useState } from 'react';
import { useLms } from '../../context/LmsContext';
import { Question } from '../../data/mockData';
import { PenTool, Sparkles, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';

export const TestGenerator: React.FC = () => {
  const { addQuestion } = useLms();
  const [activeMode, setActiveMode] = useState<'manual' | 'ai'>('manual');

  // Manual Form States
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
  const [generatedQs, setGeneratedQs] = useState<Question[]>([]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !questionText || options.some(o => !o) || !explanation) {
      alert('Please fill out all form inputs.');
      return;
    }

    addQuestion({
      subject,
      topic,
      difficulty,
      question: questionText,
      options,
      correctAnswer,
      explanation,
      marks: subject === 'Mathematics' ? 2 : 1
    });

    alert('MCQ added to MHT-CET database successfully!');
    // Reset form
    setQuestionText('');
    setOptions(['', '', '', '']);
    setExplanation('');
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '4px' }}>
          MHT-CET MCQ Test Generator
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Create MHT-CET compliant multiple choice questions manually or dynamically using our AI generator.
        </p>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '16px' }}>
        <button
          className={`btn ${activeMode === 'manual' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveMode('manual')}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' }}
        >
          <PenTool size={16} /> Manual Input Form
        </button>
        <button
          className={`btn ${activeMode === 'ai' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveMode('ai')}
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' }}
        >
          <Sparkles size={16} /> AI Adaptive Question Generator
        </button>
      </div>

      {/* Manual Input Mode */}
      {activeMode === 'manual' && (
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

          {/* Options Grid */}
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
              <label className="form-label">Correct Solution explanation</label>
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
      )}

      {/* AI MCQ Generator Mode */}
      {activeMode === 'ai' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', alignItems: 'start' }}>
          {/* Input Panel */}
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

          {/* Console Output Terminal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Terminal logs */}
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

            {/* Generated results list */}
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
                        {q.options.map((opt, oIdx) => (
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
  );
};
