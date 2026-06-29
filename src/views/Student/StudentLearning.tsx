import React, { useState, useEffect } from 'react';
import { BookOpen, FileText, CheckCircle2, ChevronRight, MessageSquare, Sparkles, Brain, ArrowUpRight, Play, Send, X } from 'lucide-react';

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
}

export const StudentLearning: React.FC = () => {
  // Load Tailwind CDN dynamically to parse utility classes if not already globally configured
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  // Daily Plan Mock Data
  const dailyPlans: DailyPlanItem[] = [
    { id: '1', task: 'Read Physics: Angular Momentum Formulas', subject: 'Physics', status: 'Completed', color: 'border-l-sky-500' },
    { id: '2', task: 'Attempt Chemistry Organic reactions Quiz', subject: 'Chemistry', status: 'In Progress', color: 'border-l-amber-500' },
    { id: '3', task: 'Solve Math Vectors Exercises 1-15', subject: 'Mathematics', status: 'Pending', color: 'border-l-fuchsia-500' },
    { id: '4', task: 'Review Definite Integration AI summary', subject: 'Mathematics', status: 'Pending', color: 'border-l-fuchsia-500' }
  ];

  // Institute Notes Interactive Checklist State
  const [notes, setNotes] = useState<InstituteNote[]>([
    { id: '1', title: 'Electrostatics Part 2: Gauss Law & Charge Spheres', author: 'Dr. R. K. Sen', completed: true, subject: 'Physics' },
    { id: '2', title: 'Transition State Energy & Chemical Kinetics Equations', author: 'Prof. Mehta', completed: false, subject: 'Chemistry' },
    { id: '3', title: 'Vector Algebra: Dot Products & Cross Product Derivations', author: 'Prof. Anand', completed: false, subject: 'Mathematics' },
    { id: '4', title: 'Wave Optics: Slit Path Difference Derivations', author: 'Dr. R. K. Sen', completed: false, subject: 'Physics' }
  ]);

  const toggleNote = (id: string) => {
    setNotes(prev => prev.map(note => note.id === id ? { ...note, completed: !note.completed } : note));
  };

  // State for PDF Viewer modal
  const [selectedNote, setSelectedNote] = useState<InstituteNote | null>(null);

  // Flashcards Decks Mock Data
  const decks: FlashcardDeck[] = [
    { id: '1', name: 'Mathematics: Vector Coordinates', cardCount: 42, subject: 'Mathematics' },
    { id: '2', name: 'Chemistry: Rate Constant Units', cardCount: 28, subject: 'Chemistry' },
    { id: '3', name: 'Physics: Moment of Inertia Shapes', cardCount: 35, subject: 'Physics' },
    { id: '4', name: 'Physics: Formula Integration tricks', cardCount: 20, subject: 'Physics' }
  ];

  // Mock data for YouTube Video Lectures
  const recommendedVideos: LectureVideo[] = [
    { id: '1', title: 'MHT-CET Rotational Dynamics: Concept of MI', channel: 'Ace Coaching Academics', duration: '24:15' },
    { id: '2', title: 'Arrhenius Rate Equations Made Easy', channel: 'Chemistry Catalyst Pro', duration: '18:40' },
    { id: '3', title: 'Vector Cross Product Mechanics & Physics Proofs', channel: 'Math Wizard Tutorials', duration: '32:10' }
  ];

  // AI Tutor Chat State
  const [messages, setMessages] = useState([
    { sender: 'tutor', text: 'Hey Rahul! Ready to dive into Vector cross products today? Ask me any LaTeX equation problem.' },
    { sender: 'user', text: 'Yes, explain the path logic of cross formulas.' },
    { sender: 'tutor', text: 'Sure! For vectors \\vec{A} and \\vec{B}, the cross product is given by: \\vec{A} \\times \\vec{B} = ||\\vec{A}|| ||\\vec{B}|| \\sin(\\theta) \\hat{n}. Here, \\hat{n} is the unit vector perpendicular to the plane containing both vectors.' }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    setMessages(prev => [...prev, { sender: 'user', text: inputMessage }]);
    const currentInput = inputMessage;
    setInputMessage('');
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        sender: 'tutor', 
        text: `Here is the LaTeX equation breakdown for "${currentInput}":\n\n\\[ \\oint_C \\vec{B} \\cdot d\\vec{l} = \\mu_0 I_{enclosed} \\]\n\nTry using this in your daily practice drills.` 
      }]);
    }, 1000);
  };

  return (
    <div className="w-full min-h-screen text-slate-100 flex flex-col gap-8 p-4 md:p-8 bg-[#09090b] font-sans relative">
      
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
                    E = \oint \vec{D} \cdot d\vec{A} = q_{"{enclosed}"}
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {dailyPlans.map(plan => (
            <div 
              key={plan.id} 
              className={`bg-[#121214] border border-[#27272a] border-l-4 ${plan.color} rounded-2xl p-5 shadow-md flex flex-col justify-between min-h-[120px]`}
            >
              <div>
                <span className="text-[9px] font-black uppercase text-slate-500">{plan.subject}</span>
                <p className="text-xs font-bold text-white mt-1 leading-snug">
                  {plan.task}
                </p>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-900">
                <span className={`text-[9px] font-extrabold uppercase ${
                  plan.status === 'Completed' ? 'text-emerald-400' :
                  plan.status === 'In Progress' ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  {plan.status}
                </span>
                {plan.status === 'Completed' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-950/20" />
                )}
              </div>
            </div>
          ))}
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

            <div className="flex flex-col gap-3">
              {notes.map(note => (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {decks.map(deck => (
                <div 
                  key={deck.id} 
                  className="bg-[#121214] border border-[#27272a] rounded-3xl p-6 shadow-md flex justify-between items-center hover:border-zinc-700 transition duration-300"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase text-slate-500">{deck.subject}</span>
                    <span className="text-xs font-bold text-white leading-snug">{deck.name}</span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-1">{deck.cardCount} cards in deck</span>
                  </div>
                  <button className="bg-zinc-850 hover:bg-zinc-800 text-slate-300 p-2.5 rounded-xl border border-zinc-800 transition">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: AI Tutor Chatbot Expanded (span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Expanded AI Tutor Interface Card */}
          <div className="bg-gradient-to-br from-[#121214] to-[#1a1c13] border-2 border-[#e2fc5c]/30 rounded-3xl p-6 shadow-xl flex flex-col justify-between h-[520px]">
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-zinc-850 pb-3">
                <span className="flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-[#e2fc5c]" /> LaTeX AI Tutor Chatbot
                </span>
                <span className="bg-[#e2fc5c]/10 text-[#e2fc5c] border border-[#e2fc5c]/25 px-2 py-0.5 rounded text-[8px] font-black">
                  PRO ONLY
                </span>
              </div>

              {/* Chat history area (Scroll-locked) */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 my-4 scrollbar-thin scrollbar-thumb-zinc-850 scrollbar-track-transparent">
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`max-w-[85%] p-3.5 rounded-2xl text-[10px] leading-relaxed font-semibold border ${
                      msg.sender === 'tutor' 
                        ? 'bg-[#09090b] border-zinc-850 self-start text-slate-200' 
                        : 'bg-zinc-850 border-zinc-800 self-end text-slate-100 ml-auto'
                    }`}
                  >
                    <span className={`block text-[8px] font-black uppercase mb-1 ${msg.sender === 'tutor' ? 'text-[#e2fc5c]' : 'text-sky-400'}`}>
                      {msg.sender === 'tutor' ? 'AI Tutor' : 'You'}
                    </span>
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chatbot input field */}
            <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-zinc-850 pt-4">
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
          {recommendedVideos.map(vid => (
            <div 
              key={vid.id} 
              className="bg-[#121214] border border-[#27272a] rounded-3xl p-5 shadow-lg flex flex-col gap-3 hover:border-zinc-700 transition duration-300"
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
                <h4 className="text-xs font-bold text-white leading-snug">
                  {vid.title}
                </h4>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">
                  {vid.channel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
