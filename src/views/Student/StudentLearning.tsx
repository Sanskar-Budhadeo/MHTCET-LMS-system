import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, CheckCircle2, ChevronRight, MessageSquare, Sparkles, Brain, ArrowUpRight, Play, Send, X } from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import axios from '../../axios';

interface DailyPlanItem {
  id: string;
  task: string;
  subject: string;
  status: 'Completed' | 'Pending' | 'In Progress';
  color: string;
}

interface InstituteNote {
  id: string;
  title: string;
  author: string;
  completed: boolean;
  subject: string;
}

interface FlashcardDeck {
  id: string;
  name: string;
  cardCount: number;
  subject: string;
}

interface LectureVideo {
  id: string;
  title: string;
  channel: string;
  duration: string;
  url?: string;
}

export const StudentLearning: React.FC = () => {
  const { weakTopics, attempts, activeUser } = useLms();
  const [selectedPlanItem, setSelectedPlanItem] = useState<StudyPlanItem | null>(null);
  const [activeLectureVideo, setActiveLectureVideo] = useState<{ title: string; url: string } | null>(null);

  const chapterVideos: Record<string, { title: string; channel: string; duration: string; url: string }[]> = {
    'Rotational Dynamics': [
      { title: 'MHT-CET Rotational Dynamics: Concept of MI & Rolling', channel: 'Ace Coaching Academics', duration: '24:15', url: 'https://www.youtube.com/embed/zH0uYvN3lM8' },
      { title: 'Rotational Motion Class 12: Complete Formula Derivations', channel: 'CET Prep Master', duration: '35:20', url: 'https://www.youtube.com/embed/7X8Xg_k1Uco' }
    ],
    'Chemical Kinetics': [
      { title: 'Arrhenius Rate Equations & Kinetics Calculations Made Easy', channel: 'Chemistry Catalyst Pro', duration: '18:40', url: 'https://www.youtube.com/embed/rV1e82845mE' },
      { title: 'Chemical Kinetics Class 12 MHT-CET Score Booster', channel: 'Smart Study Chemistry', duration: '22:15', url: 'https://www.youtube.com/embed/yQZ1K8n8V8g' }
    ],
    'Vectors': [
      { title: 'Vector Cross Product Mechanics & 3D Physics Proofs', channel: 'Math Wizard Tutorials', duration: '32:10', url: 'https://www.youtube.com/embed/e_qS5z7d0zM' },
      { title: 'Mathematics: Vector Geometry & Skew Lines Masterclass', channel: 'CET toppers Academy', duration: '28:50', url: 'https://www.youtube.com/embed/9BqFk-88U_c' }
    ],
    'Electrostatics': [
      { title: 'Gauss Law & Electric Field Spheres Concept Mastery', channel: 'Physics Simplified', duration: '30:45', url: 'https://www.youtube.com/embed/a6n3Z1G6l_s' }
    ],
    'Wave Optics': [
      { title: 'Wave Optics: Interference & Slit Diffraction Derivations', channel: 'Zenith Physics Class', duration: '26:30', url: 'https://www.youtube.com/embed/7Vd14pW9lM8' }
    ],
    'Photosynthesis': [
      { title: 'Biology Photosynthesis: Calvin Cycle & Z-Scheme Steps', channel: 'Bio Catalyst Pro', duration: '40:15', url: 'https://www.youtube.com/embed/8rW3f9050zM' }
    ]
  };

  const getDynamicVideos = (): LectureVideo[] => {
    if (!attempts || attempts.length === 0) {
      return [];
    }
    const list: any[] = [];
    let idCounter = 1;
    
    // First load videos for user's active weakTopics
    weakTopics.forEach(topic => {
      if (chapterVideos[topic]) {
        chapterVideos[topic].forEach(vid => {
          list.push({
            id: String(idCounter++),
            title: vid.title,
            channel: `${vid.channel} • (AI Recommended for: ${topic})`,
            duration: vid.duration,
            url: vid.url
          });
        });
      }
    });

    // Fallback/standard videos if list is small
    const defaultTopics = ['Rotational Dynamics', 'Chemical Kinetics', 'Vectors'];
    defaultTopics.forEach(topic => {
      if (list.length < 6 && chapterVideos[topic]) {
        chapterVideos[topic].forEach(vid => {
          if (!list.some(existing => existing.title === vid.title)) {
            list.push({
              id: String(idCounter++),
              title: vid.title,
              channel: `${vid.channel} • (Revision Deck)`,
              duration: vid.duration,
              url: vid.url
            });
          }
        });
      }
    });

    return list.slice(0, 6);
  };
  const [selectedFlashcardSubject, setSelectedFlashcardSubject] = useState<'Physics' | 'Chemistry' | 'Mathematics' | 'Biology' | null>(null);
  const [selectedFlashcardChapter, setSelectedFlashcardChapter] = useState<string | null>(null);
  const [currentFlashcardIdx, setCurrentFlashcardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const subjectChapters: Record<string, string[]> = {
    'Physics': ['Rotational Dynamics', 'Oscillations', 'Electrostatics', 'Wave Optics'],
    'Chemistry': ['Chemical Kinetics', 'Solid State', 'Coordination Compounds'],
    'Mathematics': ['Vectors', 'Trigonometric Functions', 'Probability Distributions'],
    'Biology': ['Photosynthesis', 'Genetics']
  };

  interface Flashcard {
    front: string;
    back: string;
  }

  const flashcardsData: Record<string, Flashcard[]> = {
    'Rotational Dynamics': [
      { front: "What is the formula for the Moment of Inertia of a solid sphere about its diameter?", back: "$$I = \\frac{2}{5}MR^2$$" },
      { front: "Write the equation of rotational kinetic energy of a rolling body.", back: "$$E_{kr} = \\frac{1}{2}I\\omega^2$$" },
      { front: "What is the relation between torque (\\tau) and angular momentum (L)?", back: "$$\\tau = \\frac{dL}{dt}$$" }
    ],
    'Chemical Kinetics': [
      { front: "What is the rate constant formula (k) for a first-order chemical reaction?", back: "$$k = \\frac{2.303}{t} \\log_{10}\\left(\\frac{[A]_0}{[A]_t}\\right)$$" },
      { front: "State the relationship between half-life (t_1/2) and rate constant (k) for a first-order reaction.", back: "$$t_{1/2} = \\frac{0.693}{k}$$ (independent of initial concentration)" },
      { front: "What is the Arrhenius equation expressing temperature dependence of rate constant?", back: "$$k = A e^{-\\frac{E_a}{RT}}$$" }
    ],
    'Vectors': [
      { front: "What is the formula for the scalar dot product of two vectors \\vec{a} and \\vec{b}?", back: "$$\\vec{a} \\cdot \\vec{b} = |\\vec{a}| |\\vec{b}| \\cos(\\theta)$$" },
      { front: "What is the vector cross product of unit vectors \\hat{i} and \\hat{j}?", back: "$$\\hat{i} \\times \\hat{j} = \\hat{k}$$ (Right-hand rule)" },
      { front: "Write the formula for the projection of vector \\vec{a} on vector \\vec{b}.", back: "$$\\text{Proj}_{\\vec{b}} \\vec{a} = \\frac{\\vec{a} \\cdot \\vec{b}}{|\\vec{b}|}$$" }
    ],
    'Photosynthesis': [
      { front: "What are the primary products of the light-dependent reactions of photosynthesis?", back: "$$\\text{ATP}, \\text{NADPH}, \\text{and } O_2$$" },
      { front: "In which part of the chloroplast does the dark reaction (Calvin Cycle) take place?", back: "$$\\text{Stroma}$$" },
      { front: "Write the basic equation representing photosynthesis.", back: "$$6CO_2 + 6H_2O \\xrightarrow{\\text{Light}} C_6H_{12}O_6 + 6O_2$$" }
    ]
  };

  const getFlashcardsForChapter = (chapter: string): Flashcard[] => {
    if (flashcardsData[chapter]) {
      return flashcardsData[chapter];
    }
    return [
      { front: `What are the core concepts in ${chapter}?`, back: `Revise the major derivations, formulas, and textbook definitions for ${chapter}.` },
      { front: `What is the most frequently asked MCQ topic from ${chapter}?`, back: `Typically numerical problems and key diagram/process checks.` },
      { front: `AI Tip for ${chapter}`, back: `Practice previous 5 years MHT-CET questions to understand question weighting.` }
    ];
  };

  const formatLaTeX = (text: string) => {
    if (!text) return '';
    const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const formula = part.slice(2, -2);
        return (
          <div key={index} className="my-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center font-mono font-bold text-sm text-[#e2fc5c] overflow-x-auto">
            {formula}
          </div>
        );
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const formula = part.slice(1, -1);
        return (
          <span key={index} className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[#e2fc5c] font-mono font-bold text-xs">
            {formula}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  interface StudyPlanItem {
    id: string;
    title: string;
    subject: 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology';
    topic: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    estimatedTime: string;
    actionableSteps: string[];
    rationale: string;
    resources: string[];
    status: 'Pending' | 'Completed';
    color: string;
  }

  const getDailyStudyPlan = (): StudyPlanItem[] => {
    if (!attempts || attempts.length === 0) {
      return [];
    }
    const topicsToInclude = weakTopics.length > 0 ? weakTopics : ['Rotational Dynamics', 'Chemical Kinetics', 'Vectors'];
    
    return topicsToInclude.map((topic, index) => {
      let subject: 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology' = 'Physics';
      let title = `Remedial Module: ${topic} Concept Clearance`;
      let rationale = `Your recent attempt accuracy in ${topic} indicates a conceptual gap.`;
      let steps = [
        `Review the core definitions and formulas for ${topic}.`,
        `Solve 10 practice questions from the Study Materials Repository.`,
        `Take a micro-quiz in the AI Adaptive Quiz section.`,
        `Draft a cheat sheet under 'My Notes Canvas' to summarize critical equations.`
      ];
      let time = '45 mins';
      let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
      let color = 'border-l-sky-500';
      let resources = [`Syllabus notes for ${topic}`, `${topic} Video Guides`];

      if (topic === 'Rotational Dynamics') {
        subject = 'Physics';
        title = 'Rotational Dynamics: Sphere Acceleration & Moment of Inertia';
        time = '60 mins';
        difficulty = 'Hard';
        color = 'border-l-sky-500';
        rationale = 'Your accuracy in rolling bodies dynamics is below 70%. Focus on moment of inertia equations.';
        steps = [
          'Study the moment of inertia for ring, disc, solid and hollow spheres.',
          'Solve the inclined plane rolling acceleration formula derivation: a = g*sin(theta) / (1 + k^2/R^2).',
          'Attempt 5 rotational dynamics quiz questions in Adaptive Learning.',
          'Save a copy of your derivation summary in notes canvas.'
        ];
        resources = ['Video Lesson: Rotational Dynamics - Spheres Rolling Acceleration', 'Physics Notes Module 2'];
      } else if (topic === 'Chemical Kinetics') {
        subject = 'Chemistry';
        title = 'Chemical Kinetics: First-Order Reactions & Half-Life';
        time = '50 mins';
        difficulty = 'Medium';
        color = 'border-l-amber-500';
        rationale = 'First-order kinetics and rate constant calculations are weak areas in your profiles.';
        steps = [
          'Revise the first-order rate constant equation: k = 2.303/t * log10([A]_0/[A]_t).',
          'Review half-life relation t_1/2 = 0.693/k and verify it is concentration-independent.',
          'Practice 8 numerical problems on rate constants.',
          'Ask AI Tutor for Arrhenius activation energy derivation check.'
        ];
        resources = ['Video Lesson: Chemical Kinetics - First Order Rate Calculations', 'Chemistry PDF Formula List'];
      } else if (topic === 'Vectors') {
        subject = 'Mathematics';
        title = 'Vectors: Cross Product & Shortest Distance between Lines';
        time = '65 mins';
        difficulty = 'Hard';
        color = 'border-l-fuchsia-500';
        rationale = 'Vectors spatial visualization and cross product applications need reinforcement.';
        steps = [
          'Review the definition and properties of scalar triple product and cross product.',
          'Learn the formula for shortest distance between two skew lines: d = |(a2 - a1) . (b1 x b2)| / |b1 x b2|.',
          'Solve 5 vector geometry problems.',
          'Solve a live practice set in mock arena.'
        ];
        resources = ['Video Lesson: Vectors - 3D Cross Product Concept Mastery', 'Mathematics Handout: Line Geometry'];
      } else if (topic === 'Photosynthesis') {
        subject = 'Biology';
        title = 'Photosynthesis: Calvin Cycle & Light Reactions';
        time = '45 mins';
        difficulty = 'Medium';
        color = 'border-l-emerald-500';
        rationale = 'Photosynthetic pathways and dark cycle stages need consolidation.';
        steps = [
          'Compare light-dependent cyclic and non-cyclic photophosphorylation.',
          'Detail the steps of carbon fixation in the Calvin Cycle (C3 pathway).',
          'Complete a diagram check on the chloroplast Z-scheme.',
          'Create a comparative summary note sheet.'
        ];
        resources = ['Biology Video Lesson: Carbon Pathways', 'Biology Handout: Calvin Cycle Details'];
      }

      return {
        id: `plan_${index}`,
        title,
        subject,
        topic,
        difficulty,
        estimatedTime: time,
        actionableSteps: steps,
        rationale,
        resources,
        color,
        status: 'Pending'
      };
    });
  };

  // Load Tailwind CDN dynamically to parse utility classes if not already globally configured
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  // Dynamic plans are now computed dynamically from active weakTopics in LMS Context

  // Institute Notes Interactive Checklist State
  const [notes, setNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoadingNotes(true);
        const token = localStorage.getItem('mht_cet_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get('http://localhost:5000/api/student/materials', { headers });
        const mapped = response.data.map((m: any) => ({
          id: m.id || m._id,
          title: m.title,
          author: m.author || 'Faculty Advisor',
          completed: false,
          subject: m.subject,
          url: m.url || m.file_url || '#'
        }));
        setNotes(mapped);
      } catch (err) {
        console.error('Error fetching materials in student portal:', err);
      } finally {
        setLoadingNotes(false);
      }
    };
    fetchNotes();
  }, []);

  const toggleNote = (id: string) => {
    setNotes(prev => prev.map(note => note.id === id ? { ...note, completed: !note.completed } : note));
  };

  // State for PDF Viewer modal
  const [selectedNote, setSelectedNote] = useState<InstituteNote | null>(null);

  const subjectDecks = [
    { id: 'phys_deck', subject: 'Physics', name: 'Physics Syllabus Revision Deck', icon: '⚡', color: 'border-l-sky-500' },
    { id: 'chem_deck', subject: 'Chemistry', name: 'Chemistry Equation Revision Deck', icon: '🧪', color: 'border-l-amber-500' },
    { id: 'math_deck', subject: 'Mathematics', name: 'Mathematics Formula Revision Deck', icon: '📐', color: 'border-l-fuchsia-500' },
    { id: 'biol_deck', subject: 'Biology', name: 'Biology Concept Revision Deck', icon: '🧬', color: 'border-l-emerald-500' }
  ];

  // Mock data for YouTube Video Lectures
  const recommendedVideos: LectureVideo[] = [
    { id: '1', title: 'MHT-CET Rotational Dynamics: Concept of MI', channel: 'Ace Coaching Academics', duration: '24:15' },
    { id: '2', title: 'Arrhenius Rate Equations Made Easy', channel: 'Chemistry Catalyst Pro', duration: '18:40' },
    { id: '3', title: 'Vector Cross Product Mechanics & Physics Proofs', channel: 'Math Wizard Tutorials', duration: '32:10' }
  ];

  // AI Tutor Chat State
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const studentFirstName = activeUser?.name ? activeUser.name.split(' ')[0] : 'Student';
    setMessages([
      { sender: 'tutor', text: `Hey ${studentFirstName}! Ready to dive into your MHT-CET doubts today? Ask me any questions, or select a chapter formula topic to revise.` }
    ]);
  }, [activeUser]);

  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    setMessages(prev => [...prev, { sender: 'user', text: inputMessage }]);
    const currentInput = inputMessage;
    setInputMessage('');
    triggerTutorReply(currentInput);
  };

  const handleChipClick = (query: string) => {
    setMessages(prev => [...prev, { sender: 'user', text: query }]);
    triggerTutorReply(query);
  };

  const triggerTutorReply = (query: string) => {
    const queryLower = query.toLowerCase();
    let replyText = "";
    if (queryLower.includes("moment") || queryLower.includes("rotational") || queryLower.includes("inertia")) {
      replyText = `Under Rotational Dynamics, the Moment of Inertia ($I$) represents rotational inertia.\n\nHere are the critical MHT-CET derivations:\n1. Ring/Hoop about central axis:\n$$I = MR^2$$\n2. Disc about central axis:\n$$I = \\frac{1}{2}MR^2$$\n3. Thin Rod about center perpendicular:\n$$I = \\frac{1}{12}ML^2$$\n4. Solid Sphere about diameter:\n$$I = \\frac{2}{5}MR^2$$\n\nRemember the Parallel Axis Theorem:\n$$I_o = I_g + Mh^2$$\nAnd the Perpendicular Axis Theorem:\n$$I_z = I_x + I_y$$\n\nLet me know if you want me to derive any of these!`;
    } else if (queryLower.includes("kinetics") || queryLower.includes("rate") || queryLower.includes("arrhenius")) {
      replyText = `For Chemical Kinetics, we track rate equations and transition states.\n\nKey MHT-CET relations:\n1. First-Order Rate Constant ($k$):\n$$k = \\frac{2.303}{t} \\log_{10}\\left(\\frac{[A]_0}{[A]_t}\\right)$$\n2. First-Order Half-Life ($t_{1/2}$):\n$$t_{1/2} = \\frac{0.693}{k}$$\n3. Temperature Dependence (Arrhenius Equation):\n$$k = A e^{-\\frac{E_a}{RT}}$$\nIn logarithmic form:\n$$\\log_{10}\\left(\\frac{k_2}{k_1}\\right) = \\frac{E_a}{2.303 R} \\left(\\frac{T_2 - T_1}{T_1 T_2}\\right)$$\n\nWhere $E_a$ is the activation energy and $R = 8.314\\text{ J/mol}\\cdot\\text{K}$.`;
    } else if (queryLower.includes("vector") || queryLower.includes("cross") || queryLower.includes("dot")) {
      replyText = `Vectors are evaluated under cross and dot algebraic products.\n\nSummary guide:\n1. Scalar Dot Product:\n$$\\vec{a} \\cdot \\vec{b} = |\\vec{a}| |\\vec{b}| \\cos(\\theta)$$\n2. Vector Cross Product:\n$$\\vec{a} \\times \\vec{b} = |\\vec{a}| |\\vec{b}| \\sin(\\theta) \\hat{n}$$\n3. Skew Lines Shortest Distance:\n$$d = \\frac{|(\\vec{a}_2 - \\vec{a}_1) \\cdot (\\vec{b}_1 \\times \\vec{b}_2)|}{|\\vec{b}_1 \\times \\vec{b}_2|}$$\n\nIf the lines intersect, the shortest distance $d = 0$, meaning:\n$$(\\vec{a}_2 - \\vec{a}_1) \\cdot (\\vec{b}_1 \\times \\vec{b}_2) = 0$$`;
    } else if (queryLower.includes("photosynthesis") || queryLower.includes("calvin") || queryLower.includes("light")) {
      replyText = `Photosynthesis comprises Light and Dark reactions:\n1. Light Reaction: Takes place in the thylakoid membrane (Grana). Generates $ATP$ and $NADPH$ using the Z-scheme electron pathway.\n2. Calvin Cycle (C3 Pathway): Takes place in the Stroma. Consists of 3 main stages:\n   * Carboxylation: CO2 combines with RuBP (catalyzed by RuBisCO).\n   * Reduction: Consumes ATP and NADPH to form G3P (sugars).\n   * Regeneration: RuBP is regenerated using ATP.\n\nOverall equation:\n$$6CO_2 + 6H_2O \\xrightarrow{\\text{Light}} C_6H_{12}O_6 + 6O_2$$`;
    } else {
      replyText = `That is an excellent doubt! For MHT-CET prep, always pay attention to the core concepts and standard mathematical formulations. Here is a general revision guide:\n\n1. Ensure that you memorize the fundamental formulas.\n2. Practice speed and accuracy (aim for < 60 seconds per Physics/Chemistry question and < 90 seconds per Math question).\n\nAsk me about "Rotational Dynamics", "Chemical Kinetics", "Vectors", or "Photosynthesis" for a detailed formulas breakdown!`;
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { 
        sender: 'tutor', 
        text: replyText 
      }]);
    }, 1000);
  };

  return (
    <div className="w-full min-h-screen text-slate-100 flex flex-col gap-8 p-4 md:p-8 bg-[#09090b] font-sans relative">
      
      {/* AI Suggested Daily Study Plan Details Modal */}
      {selectedPlanItem && (
        <div className="fixed inset-0 bg-[#09090b] z-[9999] flex flex-col overflow-hidden animate-fade-in select-text">
          <div className="w-full h-full max-w-7xl mx-auto p-6 md:p-10 flex flex-col justify-between overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-zinc-800 pb-5 mb-5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="bg-[#e2fc5c]/10 text-[#e2fc5c] border border-[#e2fc5c]/25 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                  AI Recommended Task
                </span>
                <span className="bg-zinc-900 border border-zinc-800 text-slate-300 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                  Est. Time: {selectedPlanItem.estimatedTime}
                </span>
              </div>
              <button 
                onClick={() => setSelectedPlanItem(null)}
                className="text-slate-400 hover:text-white p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Split Grid Content */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden min-h-0">
              
              {/* Left Column: Info & Materials */}
              <div className="lg:col-span-5 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedPlanItem.subject} Section</span>
                  <h3 className="text-2xl font-black text-white mt-1 leading-snug">{selectedPlanItem.title}</h3>
                </div>

                <div className="bg-[#121214] border border-zinc-900 rounded-2xl p-5 shadow-md">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">AI Analysis & Rationale</span>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold italic">"{selectedPlanItem.rationale}"</p>
                </div>

                {selectedPlanItem.resources && selectedPlanItem.resources.length > 0 && (
                  <div className="bg-[#121214] border border-zinc-900 rounded-2xl p-5 shadow-md">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-3">Recommended Study Material</span>
                    <div className="flex flex-col gap-3">
                      {selectedPlanItem.resources.map((res, idx) => (
                        <div key={idx} className="bg-[#09090b] border border-zinc-900/60 p-3 rounded-xl flex items-center justify-between hover:border-zinc-700 transition cursor-pointer">
                          <span className="text-xs text-slate-200 font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#e2fc5c]" />
                            {res}
                          </span>
                          <span className="text-[#e2fc5c] text-[9px] font-black uppercase">Open Resource →</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Interactive Checklist */}
              <div className="lg:col-span-7 bg-[#121214] border border-zinc-900 rounded-2xl p-6 flex flex-col justify-between overflow-hidden h-full shadow-md">
                <div className="flex flex-col gap-4 overflow-hidden flex-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b border-zinc-900 pb-2">
                    Actionable Study Checklist Steps
                  </span>
                  
                  <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    {selectedPlanItem.actionableSteps.map((step, idx) => (
                      <label 
                        key={idx} 
                        className="flex items-start gap-4 p-4 bg-[#09090b]/80 border border-zinc-900 rounded-xl hover:border-zinc-700 transition cursor-pointer select-none group"
                      >
                        <input 
                          type="checkbox" 
                          className="mt-1 w-4 h-4 accent-[#e2fc5c] rounded border-zinc-700 bg-zinc-900 cursor-pointer" 
                        />
                        <div className="flex-1">
                          <span className="text-xs text-slate-300 leading-relaxed font-semibold group-hover:text-white transition">
                            {step}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-zinc-900 pt-4 mt-4 flex-shrink-0">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Syllabus Priority</span>
                    <span className="text-xs font-black text-amber-400 uppercase">{selectedPlanItem.difficulty} Level</span>
                  </div>
                  <button 
                    onClick={() => setSelectedPlanItem(null)}
                    className="bg-[#e2fc5c] hover:bg-[#c4de32] text-[#09090b] px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-[#e2fc5c]/5"
                  >
                    Mark Task Complete & Close
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* PDF Viewer Overlay Modal */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-[#121214] border border-[#27272a] rounded-3xl p-6 max-w-4xl w-full h-[90vh] shadow-2xl flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3 mb-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-500 uppercase">PDF Viewer Asset</span>
                <h3 className="text-sm font-black text-white">{selectedNote.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedNote(null)}
                className="bg-zinc-850 hover:bg-zinc-850/80 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" /> Close Viewer
              </button>
            </div>
            
            {/* White/light gray placeholder content area representing the PDF page */}
            <div className="flex-1 bg-zinc-200 rounded-2xl p-8 overflow-y-auto text-zinc-850 font-serif shadow-inner border border-zinc-300 select-text">
              <div className="max-w-2xl mx-auto flex flex-col gap-6">
                <div className="text-center border-b border-zinc-400 pb-4">
                  <h4 className="text-xl font-bold uppercase">{selectedNote.title}</h4>
                  <p className="text-xs text-zinc-500 mt-1">LMS Shared Asset Document • Author: {selectedNote.author}</p>
                </div>
                <div className="space-y-4 text-sm leading-relaxed text-zinc-800">
                  <p className="font-bold text-zinc-900">1. Conceptual Overview</p>
                  <p>For any system target, the path derivations are evaluated under initial boundary conditions. In the context of MHT-CET examinations, the derivations for paths are crucial for numerical calculations.</p>
                  <p className="font-bold text-zinc-900">2. Key Equation Forms</p>
                  <div className="bg-white p-4 rounded-xl border border-zinc-300 text-center font-mono font-bold text-base my-2">
                    {"E = \\oint \\vec{D} \\cdot d\\vec{A} = q_{enclosed}"}
                  </div>
                  <p>The enclosed charge represents the total integrated density value over the Gaussian surface area elements.</p>
                  <p className="font-bold text-zinc-900">3. Worked Practice Problem</p>
                  <p>Evaluate the field intensity E at a distance r = 5cm from the center of a charged copper sphere with total net charge Q = 10 \mu C.</p>
                </div>
              </div>
            </div>
            
            <div className="text-center text-[10px] text-slate-500 mt-4 font-semibold">
              Page 1 of 4 • Shared Academy Resources
            </div>
          </div>
        </div>
      )}

      {/* Chapter Selection Modal */}
      {selectedFlashcardSubject && !selectedFlashcardChapter && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in">
          <div className="bg-[#121214] border border-[#27272a] rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Flashcard Modules
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedFlashcardSubject} Decks</h3>
              </div>
              <button 
                onClick={() => setSelectedFlashcardSubject(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Select a Chapter to Revise:</span>
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {(subjectChapters[selectedFlashcardSubject] || []).map((ch, idx) => {
                  const isWeak = weakTopics.includes(ch);
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedFlashcardChapter(ch);
                        setCurrentFlashcardIdx(0);
                        setIsFlipped(false);
                      }}
                      className="p-4 bg-[#09090b] border border-zinc-900 rounded-2xl hover:border-zinc-700 transition cursor-pointer flex justify-between items-center group"
                    >
                      <span className="text-xs text-slate-200 font-bold group-hover:text-[#e2fc5c] transition">{ch}</span>
                      {isWeak ? (
                        <span className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase flex items-center gap-1">
                          ⚠️ AI Suggestion: Weak Area
                        </span>
                      ) : (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase flex items-center gap-1">
                          ✅ Mastered
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flashcard Active Player Modal */}
      {selectedFlashcardSubject && selectedFlashcardChapter && (
        <div className="fixed inset-0 bg-[#09090b] z-[9999] flex flex-col overflow-hidden select-text animate-fade-in text-slate-100">
          <style>{`
            .perspective-1000 {
              perspective: 1000px;
            }
            .transform-style-3d {
              transform-style: preserve-3d;
            }
            .backface-hidden {
              backface-visibility: hidden;
            }
            .rotate-y-180 {
              transform: rotateY(180deg);
            }
          `}</style>
          <div className="w-full h-full max-w-5xl mx-auto p-6 md:p-10 flex flex-col justify-between overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-zinc-800 pb-5 mb-5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="bg-[#e2fc5c]/10 text-[#e2fc5c] border border-[#e2fc5c]/25 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                  Quick-Revision Active Deck
                </span>
                <span className="bg-zinc-900 border border-zinc-800 text-slate-300 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                  {selectedFlashcardSubject} • {selectedFlashcardChapter}
                </span>
              </div>
              <button 
                onClick={() => setSelectedFlashcardChapter(null)}
                className="text-slate-400 hover:text-white p-2 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition flex items-center gap-1 text-xs font-bold"
              >
                ← Back to Chapters
              </button>
            </div>

            {/* Main Interactive Flashcard View */}
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <div 
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full max-w-xl aspect-[1.618] perspective-1000 cursor-pointer relative select-none group"
              >
                <div 
                  className={`w-full h-full duration-500 transform-style-3d relative rounded-3xl border border-zinc-850 bg-gradient-to-br from-[#121214] to-[#18181b] p-8 shadow-2xl flex flex-col items-center justify-center text-center transition-all ${
                    isFlipped ? 'rotate-y-180 border-[#e2fc5c]/40' : 'hover:border-zinc-700'
                  }`}
                >
                  
                  {/* Front View */}
                  <div className={`backface-hidden w-full h-full flex flex-col items-center justify-center gap-4 ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Question / Concept check</span>
                    <p className="text-base sm:text-lg font-bold text-white leading-relaxed px-4">
                      {getFlashcardsForChapter(selectedFlashcardChapter)[currentFlashcardIdx]?.front}
                    </p>
                    <span className="text-[10px] font-bold text-[#e2fc5c] uppercase tracking-wider mt-4 opacity-60 group-hover:opacity-100 transition">
                      Click card to reveal answer 🔄
                    </span>
                  </div>

                  {/* Back View */}
                  <div className={`absolute inset-0 backface-hidden w-full h-full p-8 flex flex-col items-center justify-center gap-4 rotate-y-180 ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="text-[10px] font-black text-[#e2fc5c] uppercase tracking-widest">Answer / Explanation</span>
                    <div className="text-sm sm:text-base font-semibold text-slate-200 leading-relaxed max-h-[80%] overflow-y-auto pr-1">
                      {formatLaTeX(getFlashcardsForChapter(selectedFlashcardChapter)[currentFlashcardIdx]?.back)}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-4">
                      Click card to flip back 🔄
                    </span>
                  </div>

                </div>
              </div>
            </div>

            {/* Navigation & Controls Footer */}
            <div className="flex justify-between items-center border-t border-zinc-800 pt-5 mt-5 flex-shrink-0">
              <div className="text-xs font-bold text-slate-400">
                Card <span className="text-white">{currentFlashcardIdx + 1}</span> of <span className="text-white">{getFlashcardsForChapter(selectedFlashcardChapter).length}</span>
              </div>
              
              <div className="flex gap-3">
                <button
                  disabled={currentFlashcardIdx === 0}
                  onClick={() => {
                    setCurrentFlashcardIdx(prev => prev - 1);
                    setIsFlipped(false);
                  }}
                  className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    if (currentFlashcardIdx < getFlashcardsForChapter(selectedFlashcardChapter).length - 1) {
                      setCurrentFlashcardIdx(prev => prev + 1);
                      setIsFlipped(false);
                    } else {
                      alert("Deck completed! Outstanding effort.");
                      setSelectedFlashcardChapter(null);
                    }
                  }}
                  className="bg-[#e2fc5c] hover:bg-[#c4de32] text-[#09090b] px-5 py-2.5 rounded-xl text-xs font-black transition"
                >
                  {currentFlashcardIdx === getFlashcardsForChapter(selectedFlashcardChapter).length - 1 ? 'Finish Revision' : 'Next Card'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-1.5 border-b border-zinc-800 pb-5">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
          <BookOpen className="w-8 h-8 text-[#e2fc5c]" /> Learning Center
        </h1>
        <p className="text-sm text-slate-400 font-semibold leading-relaxed">
          Access shared institute study notes, revise critical formulas using flashcard decks, and chat with your AI Doubt Tutor.
        </p>
      </div>

      {/* Top Section: AI Suggested Study Plan */}
      <div className="flex flex-col gap-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#e2fc5c]" /> AI Suggested Daily Study Plan
        </h2>
        
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x" style={{ scrollbarWidth: 'thin', scrollbarColor: '#27272a transparent' }}>
          {getDailyStudyPlan().map(plan => (
            <div 
              key={plan.id} 
              onClick={() => setSelectedPlanItem(plan)}
              className={`bg-[#121214] border border-[#27272a] border-l-4 ${plan.color} rounded-2xl p-5 shadow-md flex flex-col justify-between min-h-[140px] min-w-[280px] sm:min-w-[300px] flex-shrink-0 snap-start cursor-pointer hover:border-zinc-500 transition-all`}
            >
              <div>
                <span className="text-[9px] font-black uppercase text-slate-500">{plan.subject} • {plan.estimatedTime}</span>
                <p className="text-xs font-bold text-white mt-1 leading-snug">
                  {plan.title}
                </p>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-900">
                <span className="text-[9px] font-extrabold uppercase text-[#e2fc5c] hover:underline flex items-center gap-0.5">
                  View Steps & Details →
                </span>
                <span className="text-[9px] font-extrabold uppercase text-slate-400">
                  {plan.difficulty}
                </span>
              </div>
            </div>
          ))}

          {getDailyStudyPlan().length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 bg-[#121214] border border-[#27272a] rounded-3xl w-full text-center">
              <Sparkles className="w-8 h-8 text-[#e2fc5c] mb-3 animate-pulse" />
              <p className="text-xs text-slate-400 font-medium">
                AI recommendations will populate here as soon as you finish your diagnostic setup assessment.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid (Split 7/12 and 5/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Shared Notes & Flashcards (span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Shared Institute Notes Section */}
          <div className="bg-[#121214] border border-[#27272a] rounded-3xl p-6 shadow-lg flex flex-col gap-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-850 pb-3">
              <FileText className="w-4 h-4 text-[#e2fc5c]" /> Shared Institute Notes Checklist
            </h2>

            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#27272a transparent' }}>
              {loadingNotes && (
                <div className="text-xs text-zinc-500 text-center py-8 font-semibold animate-pulse">
                  Loading shared materials from database...
                </div>
              )}
              
              {!loadingNotes && notes.length === 0 && (
                <div className="text-xs text-zinc-500 text-center py-8 font-semibold">
                  No materials published yet
                </div>
              )}

              {!loadingNotes && notes.map(note => (
                <div 
                  key={note.id}
                  className="flex items-center gap-4 p-4 bg-[#09090b] border border-zinc-900 rounded-2xl hover:border-zinc-700 transition-all"
                >
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => toggleNote(note.id)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        note.completed 
                          ? 'border-emerald-500 bg-emerald-500 text-white' 
                          : 'border-zinc-700 bg-transparent text-transparent'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div 
                    onClick={() => setSelectedNote(note)}
                    className="flex-1 flex flex-col gap-0.5 cursor-pointer"
                  >
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <span className={`text-xs font-bold ${note.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {note.title}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        note.subject === 'Physics' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                        note.subject === 'Chemistry' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20'
                      }`}>
                        {note.subject}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                      <span>Author: {note.author}</span>
                      <span className="text-[#e2fc5c] hover:underline font-bold flex items-center gap-0.5 text-[9px]">
                        Open PDF <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flashcards Deck Grid */}
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
              <span>🗂️</span> Quick-Revision Flashcard Decks
            </h2>
            {(!attempts || attempts.length === 0) ? (
              <div className="flex flex-col items-center justify-center p-8 bg-[#121214] border border-[#27272a] rounded-3xl w-full text-center">
                <Brain className="w-8 h-8 text-[#e2fc5c] mb-3 animate-pulse" />
                <p className="text-xs text-slate-400 font-medium">
                  AI recommendations will populate here as soon as you finish your diagnostic setup assessment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {subjectDecks.map(deck => (
                  <div 
                    key={deck.id} 
                    onClick={() => setSelectedFlashcardSubject(deck.subject as any)}
                    className={`bg-[#121214] border border-[#27272a] border-l-4 ${deck.color} rounded-3xl p-6 shadow-md flex justify-between items-center hover:border-zinc-500 transition duration-300 cursor-pointer`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black uppercase text-slate-500">{deck.subject}</span>
                      <span className="text-xs font-bold text-white leading-snug flex items-center gap-1.5">
                        <span>{deck.icon}</span> {deck.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold mt-1">
                        {subjectChapters[deck.subject]?.length || 0} Modules available
                      </span>
                    </div>
                    <button className="bg-zinc-850 hover:bg-zinc-800 text-[#e2fc5c] p-2.5 rounded-xl border border-zinc-800 transition">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: AI Tutor Chatbot Expanded (span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Expanded AI Tutor Interface Card */}
          <div className="bg-gradient-to-br from-[#121214] to-[#121215] border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between h-[540px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#e2fc5c]/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-zinc-850 pb-3 flex-shrink-0">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Brain className="w-4 h-4 text-[#e2fc5c]" /> LaTeX Doubt Assistant
                </span>
                <span className="bg-[#e2fc5c]/10 text-[#e2fc5c] border border-[#e2fc5c]/25 px-2 py-0.5 rounded text-[8px] font-black">
                  Gemini 1.5 Academic
                </span>
              </div>

              {/* Chat history area (Scroll-locked) */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 my-4 scrollbar-thin scrollbar-thumb-zinc-850 scrollbar-track-transparent">
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`max-w-[85%] p-3.5 rounded-2xl text-[10px] leading-relaxed font-semibold border ${
                      msg.sender === 'tutor' 
                        ? 'bg-[#09090b]/80 border-zinc-850 self-start text-slate-200' 
                        : 'bg-zinc-850/60 border-zinc-800 self-end text-slate-100 ml-auto'
                    }`}
                    style={{ marginLeft: msg.sender === 'user' ? 'auto' : '0' }}
                  >
                    <span className={`block text-[8px] font-black uppercase mb-1.5 ${msg.sender === 'tutor' ? 'text-[#e2fc5c]' : 'text-sky-400'}`}>
                      {msg.sender === 'tutor' ? 'AI Doubt Tutor' : 'You'}
                    </span>
                    <div className="space-y-1.5">
                      {formatLaTeX(msg.text)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap gap-1.5 mb-3 border-t border-zinc-850 pt-3 flex-shrink-0">
              <button 
                onClick={() => handleChipClick("Explain Rotational Dynamics Formulas")}
                className="bg-[#09090b] hover:bg-[#121214] text-slate-300 px-2.5 py-1.5 rounded-full text-[8.5px] font-bold border border-zinc-900 hover:border-zinc-700 transition"
              >
                ⚡ Rotational MI
              </button>
              <button 
                onClick={() => handleChipClick("Explain Chemical Kinetics First Order Rate formulas")}
                className="bg-[#09090b] hover:bg-[#121214] text-slate-300 px-2.5 py-1.5 rounded-full text-[8.5px] font-bold border border-zinc-900 hover:border-zinc-700 transition"
              >
                🧪 Chemical Kinetics
              </button>
              <button 
                onClick={() => handleChipClick("Explain Vector cross product rules")}
                className="bg-[#09090b] hover:bg-[#121214] text-slate-300 px-2.5 py-1.5 rounded-full text-[8.5px] font-bold border border-zinc-900 hover:border-zinc-700 transition"
              >
                📐 Vectors Cross Product
              </button>
            </div>

            {/* Chatbot input field */}
            <form onSubmit={handleSendMessage} className="flex gap-2 flex-shrink-0">
              <input 
                type="text" 
                className="flex-1 bg-[#09090b] border border-zinc-800 text-xs rounded-xl px-3.5 py-3 text-slate-200 focus:outline-none focus:border-zinc-700 font-semibold placeholder:text-slate-600"
                value={inputMessage} 
                onChange={(e) => setInputMessage(e.target.value)} 
                placeholder="Ask your doubt in LaTeX..."
              />
              <button 
                type="submit" 
                className="bg-[#e2fc5c] hover:bg-[#c4de32] text-[#09090b] p-3 rounded-xl transition flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* YouTube Recommendations Row */}
      <div className="flex flex-col gap-4 mt-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>📺</span> AI Recommended Video Lectures
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {getDynamicVideos().map(vid => (
            <div 
              key={vid.id} 
              onClick={() => vid.url && setActiveLectureVideo({ title: vid.title, url: vid.url })}
              className="bg-[#121214] border border-[#27272a] rounded-3xl p-5 shadow-lg flex flex-col gap-3 hover:border-zinc-700 transition duration-300 cursor-pointer"
            >
              {/* Dark placeholder for the thumbnail with a play icon */}
              <div className="relative bg-[#09090b] border border-zinc-850 aspect-video rounded-2xl flex items-center justify-center cursor-pointer group">
                <div className="p-4 bg-zinc-900 group-hover:bg-[#e2fc5c] rounded-full transition duration-300 border border-zinc-800">
                  <Play className="w-6 h-6 text-[#e2fc5c] group-hover:text-[#09090b] fill-current" />
                </div>
                <span className="absolute bottom-2.5 right-2.5 bg-black/80 px-2 py-0.5 rounded text-[8px] font-bold text-slate-300">
                  {vid.duration}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">
                  {vid.title}
                </h4>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">
                  {vid.channel}
                </span>
              </div>
            </div>
          ))}
          {getDynamicVideos().length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-8 bg-[#121214] border border-[#27272a] rounded-3xl text-center w-full">
              <Play className="w-8 h-8 text-[#e2fc5c] mb-3 animate-pulse" />
              <p className="text-xs text-slate-400 font-medium">
                AI recommendations will populate here as soon as you finish your diagnostic setup assessment.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Lecture Video Player Modal */}
      {activeLectureVideo && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in" onClick={() => setActiveLectureVideo(null)}>
          <div className="bg-[#121214] border border-[#27272a] rounded-3xl p-6 max-w-4xl w-full aspect-video shadow-2xl flex flex-col justify-between overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-zinc-850 pb-3 mb-4 flex-shrink-0">
              <h3 className="text-sm font-black text-white">{activeLectureVideo.title}</h3>
              <button 
                onClick={() => setActiveLectureVideo(null)}
                className="bg-zinc-900 hover:bg-zinc-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-zinc-800"
              >
                <X className="w-3.5 h-3.5" /> Close Player
              </button>
            </div>
            
            <div className="flex-1 bg-black rounded-2xl overflow-hidden relative border border-zinc-900">
              <iframe 
                src={activeLectureVideo.url}
                title={activeLectureVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
