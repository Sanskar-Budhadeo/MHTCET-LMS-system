import React, { useState, useEffect, useRef } from 'react';
import { useLms } from '../../context/LmsContext';
import { UserNote } from '../../data/mockData';
import { StudentMaterials } from './StudentMaterials';
import { 
  BookOpen, 
  Video, 
  Send, 
  Mic, 
  Image, 
  Clock, 
  TrendingUp, 
  Award, 
  Lock, 
  Zap, 
  Plus, 
  Save, 
  Trash2, 
  Download,
  GraduationCap
} from 'lucide-react';

export const LearningView: React.FC = () => {
  const { activeUser, notes, addNote, updateNote, deleteNote, upgradeUserPlan, attempts, questions, stats } = useLms();

  // Upgrade state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [targetCourse, setTargetCourse] = useState<'PCB' | 'PCM' | 'PCMB'>((activeUser?.targetCourse as any) || 'PCM');
  const [targetExam, setTargetExam] = useState<'JEE' | 'NEET' | 'MHT-CET'>((activeUser?.targetExam as any) || 'MHT-CET');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/29');
  const [cvv, setCvv] = useState('123');
  const [upiId, setUpiId] = useState('student@okaxis');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const isFree = activeUser?.plan === 'Free' || activeUser?.subscriptionTier === 'Free';

  // Calculate dynamic syllabus progress percentage based on reading, tests, and quiz learning
  const getDynamicSyllabusProgress = () => {
    const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
    let totalProgressSum = 0;
    
    subjects.forEach(subjectName => {
      // 1. Tests taken count
      const subjectAttempts = attempts.filter(att => 
        att.testName?.toLowerCase().includes(subjectName.toLowerCase()) || 
        (att.answers && Object.keys(att.answers).some(qId => questions.find(q => q.id === qId)?.subject === subjectName))
      );
      const testsCount = subjectAttempts.length;

      // 2. Reading factor: Notes created for this subject
      const subjectNotesCount = notes.filter(n => n.subject === subjectName).length;

      // 3. Accuracy factor: average accuracy on this subject
      let totalScoreAcc = 0;
      subjectAttempts.forEach(att => { totalScoreAcc += att.accuracy; });
      const avgAcc = testsCount > 0 ? (totalScoreAcc / testsCount) : 0;

      // 4. Time spent factor: fraction of total hours studied allocated to this subject
      const subjectTimeAllocated = stats.hoursStudied * (subjectNotesCount + testsCount + 1) / (notes.length + attempts.length + 4);

      // Weighted progress percentage
      let prog = 0;
      if (testsCount === 0) {
        const notesWeight = Math.min((subjectNotesCount / 5) * 100, 100) * 0.5;
        const timeWeight = Math.min((subjectTimeAllocated / 10) * 100, 100) * 0.5;
        prog = Math.round(notesWeight + timeWeight);
      } else {
        const accWeight = avgAcc * 0.4;
        const testWeight = Math.min((testsCount / 5) * 100, 100) * 0.3;
        const notesWeight = Math.min((subjectNotesCount / 5) * 100, 100) * 0.2;
        const timeWeight = Math.min((subjectTimeAllocated / 10) * 100, 100) * 0.1;
        prog = Math.round(accWeight + testWeight + notesWeight + timeWeight);
      }
      
      totalProgressSum += prog;
    });

    const calculatedProgress = Math.round(totalProgressSum / subjects.length) || 0;
    return Math.min(calculatedProgress, 100);
  };

  const dynamicProgress = getDynamicSyllabusProgress();

  const handleSimulatedUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentProcessing(true);
    setTimeout(async () => {
      try {
        await upgradeUserPlan('Pro', targetCourse, targetExam);
        setShowUpgradeModal(false);
      } catch (err) {
        console.error(err);
      } finally {
        setPaymentProcessing(false);
      }
    }, 1500);
  };

  // Learning Tab state: 'videos' | 'notes' | 'materials'
  const [activeSubTab, setActiveSubTab] = useState<'videos' | 'notes' | 'materials'>('videos');

  // Video portal state
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>('');
  const [selectedVideoTitle, setSelectedVideoTitle] = useState<string>('');

  const videoPlayerRef = useRef<HTMLDivElement>(null);

  const sampleVideos = [
    { 
      id: 'v1', 
      title: 'Rotational Dynamics - Spheres Rolling Acceleration (MHT-CET Class 12)', 
      duration: '18:40', 
      category: 'Physics', 
      instructor: 'Prof. Sharma', 
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnail: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=400&q=80',
      channel: 'LMS Physics Hub',
      views: '12K views'
    },
    { 
      id: 'v2', 
      title: 'Chemical Kinetics - First Order Rate Calculations (Formula & MCQs)', 
      duration: '22:15', 
      category: 'Chemistry', 
      instructor: 'Dr. Deshmukh', 
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnail: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=400&q=80',
      channel: 'Deshmukh Chemistry Lectures',
      views: '9.4K views'
    },
    { 
      id: 'v3', 
      title: 'Vectors - 3D Cross Product Concept Mastery (MHT-CET & JEE)', 
      duration: '15:30', 
      category: 'Mathematics', 
      instructor: 'Prof. Joshi', 
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&q=80',
      channel: 'Entrance Math Tricks',
      views: '15K views'
    },
    { 
      id: 'v4', 
      title: 'Photosynthesis - Dark & Light Cycles Analysis (NCERT & State Board)', 
      duration: '25:10', 
      category: 'Biology', 
      instructor: 'Dr. Patil', 
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      thumbnail: 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=400&q=80',
      channel: 'Patil Biology Prep',
      views: '8.1K views'
    }
  ];

  // Notes state inside learning app
  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || '');
  const [noteTitle, setNoteTitle] = useState(notes[0]?.title || '');
  const [noteSubject, setNoteSubject] = useState<'Physics' | 'Chemistry' | 'Mathematics' | 'Biology'>(notes[0]?.subject || 'Physics');
  const [noteTopic, setNoteTopic] = useState(notes[0]?.topic || '');
  const [noteContent, setNoteContent] = useState(notes[0]?.content || '');

  useEffect(() => {
    if (notes.length > 0) {
      const current = notes.find(n => n.id === activeNoteId) || notes[0];
      if (current && current.id !== activeNoteId) {
        setActiveNoteId(current.id);
        setNoteTitle(current.title);
        setNoteSubject(current.subject);
        setNoteTopic(current.topic);
        setNoteContent(current.content);
      }
    } else {
      setActiveNoteId('');
      setNoteTitle('');
      setNoteTopic('');
      setNoteContent('');
    }
  }, [notes]);

  const handleSelectNote = (n: UserNote) => {
    setActiveNoteId(n.id);
    setNoteTitle(n.title);
    setNoteSubject(n.subject);
    setNoteTopic(n.topic);
    setNoteContent(n.content);
  };

  const handleCreateNewNote = () => {
    addNote({
      title: 'New Note Sheet',
      subject: 'Physics',
      topic: 'General',
      content: '# Title\nStart writing notes...'
    });
  };

  const handleSaveNote = () => {
    if (!activeNoteId) return;
    updateNote(activeNoteId, noteContent, noteTitle);
    alert('Notes saved successfully!');
  };

  const handleDeleteNote = () => {
    if (!activeNoteId) return;
    if (confirm('Delete this study sheet?')) {
      deleteNote(activeNoteId);
    }
  };

  const handlePrintPDF = () => {
    if (!activeNoteId) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${noteTitle} - MHT-CET Notes</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; }
            .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
            .meta { font-size: 10pt; color: #64748b; margin-top: 4px; }
            .content { margin-top: 20px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${noteTitle}</h2>
            <div class="meta">Subject: ${noteSubject} | Chapter: ${noteTopic}</div>
          </div>
          <div class="content">${noteContent.replace(/\n/g, '<br/>')}</div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // AI Tutor chat state
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'tutor'; text: string; time: string }>>([
    { sender: 'tutor', text: 'Hello! I am your **AI Tutor**. Ask me any conceptual question or paste a doubt from Physics, Chemistry, Mathematics, or Biology. I can walk you through equations and derivations using LaTeX format!', time: '16:00' }
  ]);
  const [inputText, setInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText;
    setInputText('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setChatLoading(true);

    const token = localStorage.getItem('mht_cet_token');
    try {
      const response = await fetch('http://localhost:5000/api/student/ai-tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ message: userMsg })
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { sender: 'tutor', text: data.reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      } else {
        throw new Error('Chat responder offline.');
      }
    } catch (err) {
      // Local intelligent response fallback
      setTimeout(() => {
        let fallback = 'I encountered an issue connecting to the AI brain. Let me answer locally:\n\nFor most questions, remember:';
        const low = userMsg.toLowerCase();
        if (low.includes('rotational') || low.includes('inertia')) {
          fallback = 'Regarding **Rotational Dynamics**, Moment of Inertia is $$I = \\sum m_i r_i^2$$. For a solid sphere rolling without slip, acceleration is $$a = \\frac{5}{7} g \\sin\\theta$$.';
        } else if (low.includes('kinetics') || low.includes('rate')) {
          fallback = 'For first order chemical kinetics, rate constant is $$k = \\frac{2.303}{t} \\log_{10}\\left(\\frac{[A]_0}{[A]_t}\\right)$$ and halflife is $$t_{1/2} = \\frac{0.693}{k}$$.';
        } else if (low.includes('vector')) {
          fallback = 'Area of a parallelogram with diagonals $d_1$ and $d_2$ is $$\\text{Area} = \\frac{1}{2} |d_1 \\times d_2|$$.';
        }
        setMessages(prev => [...prev, { sender: 'tutor', text: fallback, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      }, 1000);
    } finally {
      setChatLoading(false);
    }
  };

  // Helper to highlight simple LaTeX math formatting in tutor answers
  const formatTutorReply = (text: string) => {
    // Escape standard line breaks and format paragraphs
    const parts = text.split('\n');
    return parts.map((para, pIdx) => {
      // Check block LaTeX
      if (para.startsWith('$$') && para.endsWith('$$')) {
        const eq = para.substring(2, para.length - 2);
        return (
          <div key={pIdx} style={{ backgroundColor: 'var(--bg-app)', padding: '10px', borderRadius: '6px', margin: '10px 0', overflowX: 'auto', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.9rem', border: '1px solid var(--border)' }}>
            {eq}
          </div>
        );
      }
      
      // Inline LaTeX parsing ($...$)
      let formattedPara: React.ReactNode[] = [];
      let lastIndex = 0;
      const regex = /\$(.*?)\$/g;
      let match;
      let keyCounter = 0;
      
      while ((match = regex.exec(para)) !== null) {
        // text before math
        if (match.index > lastIndex) {
          formattedPara.push(<span key={keyCounter++}>{para.substring(lastIndex, match.index)}</span>);
        }
        // math section
        formattedPara.push(
          <code key={keyCounter++} style={{ backgroundColor: 'rgba(2, 132, 199, 0.08)', padding: '2px 4px', borderRadius: '4px', color: 'var(--accent)', fontFamily: 'monospace', fontWeight: 600 }}>
            {match[1]}
          </code>
        );
        lastIndex = regex.lastIndex;
      }
      
      if (lastIndex < para.length) {
        formattedPara.push(<span key={keyCounter++}>{para.substring(lastIndex)}</span>);
      }

      return (
        <p key={pIdx} style={{ margin: '0 0 8px 0', lineHeight: '1.5' }}>
          {formattedPara.length > 0 ? formattedPara : para}
        </p>
      );
    });
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '85vh' }}>
      
      {/* Free Plan Locking Overlay */}
      {isFree && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40,
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            className="card" 
            style={{ 
              maxWidth: '460px', 
              textAlign: 'center', 
              padding: '40px 30px', 
              border: '2px solid var(--accent)', 
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              backgroundColor: 'var(--bg-card)'
            }}
          >
            <div style={{ display: 'inline-flex', padding: '16px', backgroundColor: 'var(--primary-light)', borderRadius: '50%', color: 'var(--accent)', marginBottom: '20px' }}>
              <Lock size={36} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
              Unlock the Learning Pack
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.6' }}>
              Access our curated syllabus video lessons, create and manage unlimited study notes sheets, check daily study hour analytics, and clear doubts with your personal AI Tutor.
            </p>
            <button 
              onClick={() => setShowUpgradeModal(true)} 
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', height: '44px', fontWeight: 700 }}
            >
              <Zap size={16} /> Upgrade to Pro (₹1,499)
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div style={{ opacity: isFree ? 0.3 : 1, pointerEvents: isFree ? 'none' : 'auto', display: 'grid', gridTemplateColumns: '1.6fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Side: Video Library & Notes App Tab */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: '24px', minHeight: '650px', display: 'flex', flexDirection: 'column' }}>
            
            {/* Sub-tab selection */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px', gap: '16px' }}>
              <button
                onClick={() => setActiveSubTab('videos')}
                className={`btn btn-xs ${activeSubTab === 'videos' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 16px', borderRadius: '6px' }}
              >
                <Video size={14} />
                <span>Video Lessons</span>
              </button>
              <button
                onClick={() => setActiveSubTab('notes')}
                className={`btn btn-xs ${activeSubTab === 'notes' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 16px', borderRadius: '6px' }}
              >
                <BookOpen size={14} />
                <span>My Notes Canvas</span>
              </button>
              <button
                onClick={() => setActiveSubTab('materials')}
                className={`btn btn-xs ${activeSubTab === 'materials' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 16px', borderRadius: '6px' }}
              >
                <BookOpen size={14} />
                <span>Study Materials Repository</span>
              </button>
            </div>

            {/* Video Lessons tab contents */}
            {activeSubTab === 'videos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
                
                {/* Active Player Portal */}
                <div ref={videoPlayerRef}>
                  {selectedVideoUrl ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: 'var(--primary-light)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Currently Playing</span>
                          <h4 style={{ fontWeight: 700, fontSize: '1.1rem', margin: '2px 0 0' }}>{selectedVideoTitle}</h4>
                        </div>
                        <button onClick={() => { setSelectedVideoUrl(''); setSelectedVideoTitle(''); }} className="btn btn-secondary btn-sm" style={{ height: '32px' }}>
                          Close Player
                        </button>
                      </div>
                      {/* Responsive Video Embed Frame */}
                      <div style={{ width: '100%', position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <iframe
                          src={selectedVideoUrl}
                          title={selectedVideoTitle}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'var(--primary-light)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <div style={{ backgroundColor: 'var(--accent)', color: 'white', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Video size={20} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Select a recommended video to begin</h4>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Choose from the curated entrance syllabus library below.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* YouTube Video Recommendation Section */}
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '8px 0 16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                    <Video size={18} style={{ color: 'var(--accent)' }} /> YouTube Video Recommendations
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                    {sampleVideos.map(vid => (
                      <div 
                        key={vid.id} 
                        onClick={() => {
                          setSelectedVideoUrl(vid.url);
                          setSelectedVideoTitle(vid.title);
                          setTimeout(() => {
                            videoPlayerRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }}
                        className="card" 
                        style={{ 
                          padding: '0', 
                          boxShadow: 'none', 
                          border: '1px solid var(--border)', 
                          backgroundColor: 'var(--bg-card)',
                          display: 'flex', 
                          flexDirection: 'column', 
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                      >
                        {/* Thumbnail image and duration */}
                        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', overflow: 'hidden' }}>
                          <img 
                            src={vid.thumbnail} 
                            alt={vid.title} 
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                          <span style={{ position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'rgba(15, 23, 42, 0.85)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>
                            {vid.duration}
                          </span>
                        </div>

                        {/* Content text metadata */}
                        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span className={`badge badge-${vid.category.toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                                {vid.category}
                              </span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: 500 }}>
                                {vid.views}
                              </span>
                            </div>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '4px 0', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', height: '36px' }}>
                              {vid.title}
                            </h4>
                          </div>
                          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>{vid.channel}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Instructor: {vid.instructor}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Notes Canvas tab contents */}
            {activeSubTab === 'notes' && (
              <div className="notes-layout" style={{ flex: 1, minHeight: '400px' }}>
                {/* Notes List Side panel */}
                <div className="notes-list" style={{ width: '180px', flexShrink: 0 }}>
                  <button onClick={handleCreateNewNote} className="btn btn-primary btn-sm" style={{ width: '100%', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={12} /> New Sheet
                  </button>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                    {notes.map(note => (
                      <div 
                        key={note.id} 
                        onClick={() => handleSelectNote(note)}
                        className={`notes-list-item ${activeNoteId === note.id ? 'active' : ''}`}
                        style={{ padding: '8px', cursor: 'pointer', borderRadius: '4px' }}
                      >
                        <h5 style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{note.title}</h5>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>{note.subject}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes Editor workspace */}
                {activeNoteId ? (
                  <div className="note-editor" style={{ flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '14px' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={noteTitle} 
                        onChange={(e) => setNoteTitle(e.target.value)} 
                        placeholder="Note Title" 
                        style={{ padding: '6px 10px', fontSize: '0.85rem' }} 
                      />
                      <select 
                        className="form-select" 
                        value={noteSubject} 
                        onChange={(e) => setNoteSubject(e.target.value as any)} 
                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                      >
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Biology">Biology</option>
                      </select>
                    </div>

                    <textarea
                      className="form-textarea"
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Type markdown notes here..."
                      style={{ flex: 1, minHeight: '260px', fontFamily: 'monospace', fontSize: '0.85rem', padding: '12px' }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                      <button onClick={handleDeleteNote} className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)' }}>
                        <Trash2 size={14} />
                      </button>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handlePrintPDF} className="btn btn-outline btn-sm">
                          <Download size={14} />
                        </button>
                        <button onClick={handleSaveNote} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Save size={14} /> Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Create or select a note sheet to begin editing.
                  </div>
                )}
              </div>
            )}

            {activeSubTab === 'materials' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <StudentMaterials />
              </div>
            )}
          </div>
        </div>

        {/* Right Side: AI Tutor & Daily Insights widget */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* AI Tutor doubt solver chat */}
          <div className="card" style={{ padding: '20px', height: '460px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <GraduationCap size={18} style={{ color: 'var(--accent)' }} /> AI Tutor & Doubt Solver
            </h3>

            {/* Message Area */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px', marginBottom: '14px' }}>
              {messages.map((msg, index) => (
                <div 
                  key={index}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    backgroundColor: msg.sender === 'user' ? 'var(--accent)' : 'var(--primary-light)',
                    color: msg.sender === 'user' ? 'white' : 'var(--text-main)',
                    padding: '10px 14px',
                    borderRadius: msg.sender === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                    fontSize: '0.85rem',
                    border: msg.sender === 'tutor' ? '1px solid var(--border)' : 'none'
                  }}
                >
                  {msg.sender === 'tutor' ? formatTutorReply(msg.text) : <p style={{ margin: 0 }}>{msg.text}</p>}
                  <span style={{ display: 'block', fontSize: '0.65rem', color: msg.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-light)', marginTop: '4px', textAlign: 'right' }}>
                    {msg.time}
                  </span>
                </div>
              ))}

              {chatLoading && (
                <div style={{ alignSelf: 'flex-start', backgroundColor: 'var(--primary-light)', color: 'var(--text-muted)', padding: '10px 14px', borderRadius: '12px 12px 12px 0', fontSize: '0.8rem', border: '1px solid var(--border)' }}>
                  <div className="pulse" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-light)', marginRight: '4px' }} />
                  <div className="pulse" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-light)', marginRight: '4px' }} />
                  <div className="pulse" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-light)' }} />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              {/* Image Upload placeholder */}
              <button 
                type="button" 
                onClick={() => alert('Image Attachment UI Simulator triggered!')}
                className="btn btn-secondary" 
                style={{ padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px' }}
                title="Attach Doubt Image"
              >
                <Image size={16} />
              </button>

              {/* Voice Recording placeholder */}
              <button 
                type="button" 
                onClick={() => alert('Voice Recording Mic UI Simulator triggered!')}
                className="btn btn-secondary" 
                style={{ padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px' }}
                title="Record Doubt Voice"
              >
                <Mic size={16} />
              </button>

              <input
                type="text"
                className="form-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask your doubt..."
                style={{ padding: '8px 12px', fontSize: '0.85rem', flex: 1 }}
              />

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px' }}
                disabled={chatLoading}
              >
                <Send size={16} />
              </button>
            </form>
          </div>

          {/* Daily Insights Widgets */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '14px' }}>
              Daily Learning Insights
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Study hours */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ backgroundColor: 'var(--primary-light)', padding: '8px', borderRadius: '8px', color: 'var(--accent)' }}>
                  <Clock size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily Study Hours</span>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{stats.hoursStudied.toFixed(2)} Hours completed</h4>
                </div>
              </div>

              {/* Learning progress */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ backgroundColor: '#ecfdf5', padding: '8px', borderRadius: '8px', color: '#10b981' }}>
                  <TrendingUp size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Syllabus Coverage Progress</span>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                    <div style={{ width: `${dynamicProgress}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>{dynamicProgress}% Coverage</span>
                </div>
              </div>

              {/* AI Predicted Rank */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ backgroundColor: '#fffbeb', padding: '8px', borderRadius: '8px', color: '#f59e0b' }}>
                  <Award size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI-Predicted National Rank</span>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Rank #{stats.siteRank || 4} (based on site history)</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Simulated Upgrade Checkout Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <Zap size={32} style={{ color: 'var(--accent)', margin: '0 auto 8px' }} className="pulse" />
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Upgrade Subscription</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                Unlock Analysis, AI Insights & AI Tutor
              </p>
            </div>

            <form onSubmit={handleSimulatedUpgrade}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Target Course</label>
                  <select className="form-select" value={targetCourse} onChange={(e) => setTargetCourse(e.target.value as any)} style={{ fontSize: '0.8rem', padding: '6px' }}>
                    <option value="PCM">PCM</option>
                    <option value="PCB">PCB</option>
                    <option value="PCMB">PCMB</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Target Exam</label>
                  <select className="form-select" value={targetExam} onChange={(e) => setTargetExam(e.target.value as any)} style={{ fontSize: '0.8rem', padding: '6px' }}>
                    <option value="MHT-CET">MHT-CET</option>
                    <option value="JEE">JEE</option>
                    <option value="NEET">NEET</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`btn btn-xs ${paymentMethod === 'card' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ height: '32px' }}
                >
                  Card Payment
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`btn btn-xs ${paymentMethod === 'upi' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ height: '32px' }}
                >
                  UPI Payment
                </button>
              </div>

              {paymentMethod === 'card' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Card Number</label>
                    <input type="text" className="form-input" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Expiry</label>
                      <input type="text" className="form-input" value={expiry} onChange={(e) => setExpiry(e.target.value)} required />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>CVV</label>
                      <input type="password" className="form-input" value={cvv} onChange={(e) => setCvv(e.target.value)} required />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '20px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>UPI Address</label>
                  <input type="text" className="form-input" value={upiId} onChange={(e) => setUpiId(e.target.value)} required />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  disabled={paymentProcessing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2, display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
                  disabled={paymentProcessing}
                >
                  {paymentProcessing ? (
                    <>
                      <div className="pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white' }} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Pay ₹1,499</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
