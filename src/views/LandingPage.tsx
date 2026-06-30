import React, { useState, useEffect } from 'react';
import { useLms } from '../context/LmsContext';
import {
  BookOpen,
  Award,
  TrendingUp,
  UserCheck,
  CheckCircle,
  HelpCircle,
  Play,
  Users,
  Compass,
  FileCheck,
  Eye,
  EyeOff
} from 'lucide-react';

// Interactive Canvas for Floating 3D Specular Lime-Yellow Bubbles
const BubblesCanvas: React.FC = () => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const mouse = React.useRef({ x: -1000, y: -1000 });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseLeave = () => {
      mouse.current = { x: -1000, y: -1000 };
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const bubbles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      depth: number;
    }[] = [];

    // Spaced out bubbles - less quantity, more room
    const numBubbles = Math.min(Math.floor((width * height) / 55000), 20);
    for (let i = 0; i < numBubbles; i++) {
      const depth = Math.random() * 0.5 + 0.6; // 0.6 to 1.1 depth scale
      bubbles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12, // slow horizontal drift
        vy: -(Math.random() * 0.18 + 0.08) * depth, // slow vertical drift
        r: (Math.random() * 55 + 35) * depth, // larger bubble size
        depth
      });
    }

    const drawBubble = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      r: number,
      depth: number
    ) => {
      // Glow shadow behind the bubble (matching neon lime-yellow)
      const shadowGrad = ctx.createRadialGradient(
        x + r * 0.1, y + r * 0.1, 0,
        x + r * 0.1, y + r * 0.1, r * 1.5
      );
      shadowGrad.addColorStop(0, 'rgba(210, 255, 61, 0.22)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.beginPath();
      ctx.arc(x + r * 0.1, y + r * 0.1, r * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = shadowGrad;
      ctx.fill();

      // Main spherical gradient
      const gX = x - r * 0.25;
      const gY = y - r * 0.25;
      const bubbleGrad = ctx.createRadialGradient(
        gX, gY, r * 0.05,
        gX, gY, r * 1.05
      );
      
      // Glassy neon-lime theme (high contrast, vibrant specular shine matching app)
      bubbleGrad.addColorStop(0, 'rgba(235, 255, 180, 0.9)'); // Bright warm center
      bubbleGrad.addColorStop(0.25, 'rgba(210, 255, 61, 0.6)'); // Vibrant lime core
      bubbleGrad.addColorStop(0.65, 'rgba(100, 160, 20, 0.15)'); // Translucent mid
      bubbleGrad.addColorStop(0.9, 'rgba(15, 35, 5, 0.55)');    // Refraction shadow
      bubbleGrad.addColorStop(1, 'rgba(5, 15, 2, 0.85)');       // Edge contrast

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = bubbleGrad;
      ctx.fill();

      // Glowing reflection stroke
      ctx.beginPath();
      ctx.arc(x, y, r - 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(210, 255, 61, 0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 3D Specular glare highlight (white circle)
      const specX = x - r * 0.35;
      const specY = y - r * 0.35;
      const specR = r * 0.16;
      const specularGrad = ctx.createRadialGradient(
        specX, specY, 0,
        specX, specY, specR
      );
      specularGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      specularGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
      specularGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.beginPath();
      ctx.arc(specX, specY, specR, 0, Math.PI * 2);
      ctx.fillStyle = specularGrad;
      ctx.fill();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      bubbles.forEach((b) => {
        // Natural drift
        b.x += b.vx;
        b.y += b.vy;

        // Interactive mouse repulsion
        const dx = b.x - mouse.current.x;
        const dy = b.y - mouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radiusOfEffect = 220;
        if (dist < radiusOfEffect) {
          const force = (radiusOfEffect - dist) / radiusOfEffect;
          const angle = Math.atan2(dy, dx);
          // Push outward depending on size/depth representation
          b.x += Math.cos(angle) * force * 3.5 * b.depth;
          b.y += Math.sin(angle) * force * 3.5 * b.depth;
        }

        // Boundary checks and resetting (relative to viewport coordinates)
        if (b.y < -b.r * 2) {
          b.y = height + b.r * 2;
          b.x = Math.random() * width;
        }
        if (b.x < -b.r * 2) b.x = width + b.r * 2;
        if (b.x > width + b.r * 2) b.x = -b.r * 2;

        drawBubble(ctx, b.x, b.y, b.r, b.depth);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="landing-bg-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        pointerEvents: 'none'
      }}
    />
  );
};

// 3D Card Hover Perspective Translation
interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const TiltCard: React.FC<TiltCardProps> = ({ children, className = '', style = {} }) => {
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const [transformStyle, setTransformStyle] = React.useState<string>('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  const [mousePos, setMousePos] = React.useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Mouse pointer offsets relative to card boundaries
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Center offsets scaled from -0.5 to +0.5
    const normX = (mouseX / width) - 0.5;
    const normY = (mouseY / height) - 0.5;

    // Tilt scale factor for soft rotation ranges
    const rotY = normX * 14; 
    const rotX = -normY * 14; 

    setTransformStyle(`perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.025, 1.025, 1.025)`);
    setMousePos({
      x: Math.round((mouseX / width) * 100),
      y: Math.round((mouseY / height) * 100),
    });
  };

  const handleMouseLeave = () => {
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        transform: transformStyle,
        transition: 'transform 0.12s cubic-bezier(0.25, 1, 0.5, 1)',
        position: 'relative',
        transformStyle: 'preserve-3d',
        '--mouse-x': `${mousePos.x}%`,
        '--mouse-y': `${mousePos.y}%`,
      } as React.CSSProperties}
    >
      <div className="specular-glow" />
      <div style={{ transform: 'translateZ(12px)', transformStyle: 'preserve-3d', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const { login } = useLms();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'student' | 'parent' | 'admin' | 'teacher' | 'executive'>('student');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('student@demo.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Student Extra Details
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [prn, setPrn] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('avatar1');

  // MHT-CET Phase 1 Custom Form States
  const [targetCourse, setTargetCourse] = useState<'PCB' | 'PCM' | 'PCMB'>('PCM');
  const [targetExam, setTargetExam] = useState<'JEE' | 'NEET' | 'MHT-CET'>('MHT-CET');
  const [plan, setPlan] = useState<'Free' | 'Pro' | 'Premium'>('Free');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Simulated Card/UPI Gateway Fields
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/29');
  const [cvv, setCvv] = useState('123');
  const [upiId, setUpiId] = useState('student@okaxis');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Avatar options for profile selection
  const AVATARS = [
    { id: 'avatar1', emoji: '🎓', label: 'Graduate', color: '#2563eb' },
    { id: 'avatar2', emoji: '🔬', label: 'Scientist', color: '#059669' },
    { id: 'avatar3', emoji: '📐', label: 'Engineer', color: '#7c3aed' },
    { id: 'avatar4', emoji: '🧬', label: 'Biologist', color: '#ea580c' },
    { id: 'avatar5', emoji: '⚡', label: 'Physics', color: '#d97706' },
    { id: 'avatar6', emoji: '🔭', label: 'Explorer', color: '#0891b2' },
    { id: 'avatar7', emoji: '📊', label: 'Analyst', color: '#be185d' },
    { id: 'avatar8', emoji: '🏆', label: 'Champion', color: '#ca8a04' },
  ];

  const handleRoleChange = (role: 'student' | 'parent' | 'admin' | 'teacher' | 'executive') => {
    setSelectedRole(role);
    if (isSignUp) {
      setEmail('');
      setPassword('');
    } else {
      if (role === 'student') setEmail('rahul@cet.com');
      else if (role === 'parent') setEmail('parent.rahul@cet.com');
      else if (role === 'teacher') setEmail('teacher@demo.com');
      else if (role === 'executive') setEmail('executive@demo.com');
      else setEmail('sharma.sir@cet.com');
    }
    setErrorMsg('');
  };

  // Secret Developer Demo Mode: fills mock student info
  const triggerBypass = () => {
    setEmail('student@demo.com');
    setPassword('password123');
    setSelectedRole('student');
    setIsSignUp(false);
    setErrorMsg('');
  };

  // Listen for Ctrl+Shift+D shortcut when modal is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showLoginModal && e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        triggerBypass();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLoginModal]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parent login uses email + child PRN only (no password)
    const isParentLogin = !isSignUp && selectedRole === 'parent';

    if (!email || (!isParentLogin && !password) || (isSignUp && !name)) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (isParentLogin && !prn) {
      setErrorMsg("Child's PRN number is required to log in as a parent.");
      return;
    }

    if (isSignUp && selectedRole === 'student' && (!parentName || !parentEmail)) {
      setErrorMsg("Parent's name and email are required.");
      return;
    }

    if (isSignUp && selectedRole === 'student' && plan !== 'Free' && !showPaymentModal) {
      setShowPaymentModal(true);
      return;
    }

    await executeRegistrationOrLogin();
  };

  const executeRegistrationOrLogin = async () => {
    setLoading(true);
    setErrorMsg('');

    // Demo/offline credentials mapping
    const DEMO_PASSWORDS: Record<string, string> = {
      'rahul@cet.com': 'password123',
      'parent.rahul@cet.com': 'password123',
      'teacher@demo.com': 'password123',
      'executive@demo.com': 'password123',
      'sharma.sir@cet.com': 'password123',
      'student@demo.com': 'password123',
    };

    const DEMO_USERS: Record<string, any> = {
      'rahul@cet.com': {
        id: 'u_student', name: 'Rahul Sharma', email: 'rahul@cet.com',
        role: 'student', streak: 12, plan: 'Pro', targetCourse: 'PCM', targetExam: 'MHT-CET',
        weakTopics: ['Rotational Dynamics', 'Chemical Kinetics'],
        strongTopics: ['Oscillations', 'Solid State'],
        loginDates: ['2026-06-18', '2026-06-17', '2026-06-16']
      },
      'student@demo.com': {
        id: 'u_student_demo', name: 'Demo Student', email: 'student@demo.com',
        role: 'student', streak: 5, plan: 'Free', targetCourse: 'PCM', targetExam: 'MHT-CET',
        weakTopics: ['Vectors'], strongTopics: ['Trigonometry'], loginDates: []
      },
      'parent.rahul@cet.com': {
        id: 'u_parent', name: 'Mr. Arvind Sharma', email: 'parent.rahul@cet.com',
        role: 'parent', studentId: 'u_student'
      },
      'teacher@demo.com': {
        id: 'u_teacher', name: 'Prof. Mehta', email: 'teacher@demo.com',
        role: 'teacher', subject: 'Physics'
      },
      'executive@demo.com': {
        id: 'u_executive', name: 'CEO Demo', email: 'executive@demo.com',
        role: 'executive'
      },
      'sharma.sir@cet.com': {
        id: 'u_admin', name: 'Prof. Sharma (Admin)', email: 'sharma.sir@cet.com',
        role: 'admin'
      },
    };

    try {
      const endpoint = isSignUp 
        ? 'http://localhost:5000/api/auth/register' 
        : 'http://localhost:5000/api/auth/login';
      
      const payload = isSignUp 
        ? { 
            name, 
            email, 
            password, 
            role: selectedRole,
            targetCourse: selectedRole === 'student' ? targetCourse : undefined,
            targetExam: selectedRole === 'student' ? targetExam : undefined,
            plan: selectedRole === 'student' ? plan : undefined,
            parentName: selectedRole === 'student' ? parentName : undefined,
            parentEmail: selectedRole === 'student' ? parentEmail : undefined,
          }
        : selectedRole === 'parent'
          // Parent login: email + child PRN — no password sent
          ? { email, prn }
          : { email, password };
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      
      // Update state in Context
      login(data.user, data.token);
      setShowLoginModal(false);
      setShowPaymentModal(false);
    } catch (err: any) {
      // If backend is offline (network error), fall back to offline demo mode
      const isNetworkError = err instanceof TypeError || err.message?.toLowerCase().includes('failed to fetch') || err.message?.toLowerCase().includes('network');

      if (isNetworkError) {
        // Offline / demo mode fallback
        const normalizedEmail = email.trim().toLowerCase();
        const expectedPassword = DEMO_PASSWORDS[normalizedEmail];

        if (isSignUp) {
          // For sign-up in offline mode: create a mock new user
          const newUser = {
            id: 'u_new_' + Date.now(),
            name: name.trim() || 'New User',
            email: normalizedEmail,
            role: selectedRole,
            streak: selectedRole === 'student' ? 0 : undefined,
            plan: selectedRole === 'student' ? plan : undefined,
            targetCourse: selectedRole === 'student' ? targetCourse : undefined,
            targetExam: selectedRole === 'student' ? targetExam : undefined,
            loginDates: [],
          };
          login(newUser as any, 'offline-demo-token');
          setShowLoginModal(false);
          setShowPaymentModal(false);
        } else if (selectedRole === 'parent') {
          // Parent offline login: just check email exists in demo map + PRN provided
          const offlineParent = DEMO_USERS[normalizedEmail];
          if (offlineParent && offlineParent.role === 'parent' && prn) {
            login(offlineParent, 'offline-demo-token');
            setShowLoginModal(false);
          } else if (!prn) {
            setErrorMsg("Child's PRN number is required.");
          } else {
            setErrorMsg('Parent account not found. Please check your email.');
          }
        } else if (expectedPassword && password === expectedPassword) {
          // Valid demo credentials — log in offline
          const offlineUser = DEMO_USERS[normalizedEmail];
          if (offlineUser) {
            login(offlineUser, 'offline-demo-token');
            setShowLoginModal(false);
            setShowPaymentModal(false);
          } else {
            setErrorMsg('Demo account not found. Please use a valid demo email.');
          }
        } else if (expectedPassword && password !== expectedPassword) {
          setErrorMsg('Incorrect password. Demo accounts use: password123');
        } else {
          setErrorMsg('Unknown email. Use a demo account or start the backend server.');
        }
      } else {
        console.error('Auth error:', err);
        setErrorMsg(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
      setPaymentProcessing(false);
    }
  };

  const handleSimulatedPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentProcessing(true);
    // Micro-animation delay to simulate gateway communication
    setTimeout(() => {
      executeRegistrationOrLogin();
    }, 1500);
  };

  return (
    <div className="landing-universe" style={{ minHeight: '100vh', position: 'relative' }}>
      <BubblesCanvas />
      
      <div className="landing-content-wrap" style={{ position: 'relative', zIndex: 10 }}>
        {/* Top Banner Navigation */}
        <div 
          className="landing-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 40px',
            position: 'sticky',
            top: 0,
            zIndex: 50
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={24} style={{ color: 'var(--accent)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem' }}>
              MHT-CET <span className="text-glow">Ace</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={() => { handleRoleChange('student'); setShowLoginModal(true); setIsSignUp(false); }} className="btn btn-outline btn-sm">
              Student Portal
            </button>
            <button onClick={() => { handleRoleChange('parent'); setShowLoginModal(true); setIsSignUp(false); }} className="btn btn-outline btn-sm">
              Parent Portal
            </button>
            <button onClick={() => { handleRoleChange('executive'); setShowLoginModal(true); setIsSignUp(false); }} className="btn btn-outline btn-sm">
              Executive Portal
            </button>
            <button onClick={() => { handleRoleChange('teacher'); setShowLoginModal(true); setIsSignUp(false); }} className="btn btn-primary btn-sm">
              Faculty Login
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <section style={{ padding: '80px 24px', textAlign: 'center', borderBottom: '1px solid rgba(210, 255, 61, 0.12)' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                backgroundColor: 'var(--primary-light)', 
                padding: '6px 16px', 
                borderRadius: '9999px',
                color: 'var(--accent)',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '20px',
                border: '1px solid rgba(210, 255, 61, 0.2)'
              }}
            >
              <Award size={14} /> MHT-CET 2026 Academic Preparation Engine
            </div>
            <h1 className="hero-title">
              Master the MHT-CET Exam with <span className="text-glow">Adaptive Learning</span>
            </h1>
            <p className="hero-subtitle">
              A high-performance preparation framework for Physics, Chemistry, Mathematics, and Biology. Timed exam simulations, analytical trackers, and automated adaptive quiz generators to close your key concept gaps.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
              <button onClick={() => { handleRoleChange('student'); setShowLoginModal(true); }} className="btn btn-primary btn-lg">
                Start Preparing Free
              </button>
              <button onClick={() => { handleRoleChange('parent'); setShowLoginModal(true); }} className="btn btn-secondary btn-lg">
                Parent Watch Dashboard
              </button>
            </div>

            {/* Metric Trackers */}
            <div className="metrics-container">
              <TiltCard className="metric-card">
                <div className="metric-val">12,450+</div>
                <div className="metric-label">Active Maharashtra Students</div>
              </TiltCard>
              <TiltCard className="metric-card">
                <div className="metric-val">84,200+</div>
                <div className="metric-label">Mock Tests Completed</div>
              </TiltCard>
              <TiltCard className="metric-card">
                <div className="metric-val">1.2M+</div>
                <div className="metric-label">MHT-CET MCQs Solved</div>
              </TiltCard>
              <TiltCard className="metric-card">
                <div className="metric-val">99.4%</div>
                <div className="metric-label">Syllabus Accuracy Index</div>
              </TiltCard>
            </div>
          </div>
        </section>

        {/* Feature Breakdown Section */}
        <section style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.25rem', marginBottom: '12px' }}>Engineered for High Scores</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '56px', maxWidth: '600px', margin: '0 auto 56px' }}>
            Explore the tools built specifically for students aiming for premium government engineering and medical colleges.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
            <TiltCard className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', backgroundColor: 'var(--primary-light)', borderRadius: '8px', color: 'var(--accent)', marginBottom: '20px' }}>
                <BookOpen size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>PCMB Comprehensive Syllabus</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                Dedicated preparation resources for Physics, Chemistry, Mathematics, and Biology. Integrated formulae cheat sheets, downloadable notes, and solved questions matching current board frameworks.
              </p>
            </TiltCard>

            <TiltCard className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', backgroundColor: 'var(--primary-light)', borderRadius: '8px', color: 'var(--accent)', marginBottom: '20px' }}>
                <TrendingUp size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>AI Adaptive Concept Engine</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                The engine automatically flags chapters where your mock accuracy drops below 70%, immediately generating micro-quizzes of 5 target questions to build muscle memory.
              </p>
            </TiltCard>

            <TiltCard className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', backgroundColor: 'var(--primary-light)', borderRadius: '8px', color: 'var(--accent)', marginBottom: '20px' }}>
                <Users size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>Parent Consistency Watch</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                Read-only dashboard tracking student scorecard metrics, daily mock test streak maps, and a unified feedback stream combining qualitative teacher input with automated AI time-spent analysis.
              </p>
            </TiltCard>
          </div>
        </section>

        {/* Subscription Pricing Plans */}
        <section style={{ padding: '80px 40px', backgroundColor: 'transparent', borderTop: '1px solid rgba(210, 255, 61, 0.12)', borderBottom: '1px solid rgba(210, 255, 61, 0.12)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: '2.25rem', marginBottom: '12px' }}>Flexible Registration Plans</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '56px' }}>
              Choose a plan that matches your MHT-CET timeline. Cancel or upgrade anytime.
            </p>

            <div className="pricing-grid">
              <TiltCard className="card pricing-card">
                <h3 style={{ fontSize: '1.125rem', color: 'var(--text-muted)' }}>Free Core Pack</h3>
                <div className="pricing-price">₹0 <span>/ forever</span></div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Perfect for initial test platform evaluation.</p>
                <ul className="pricing-features">
                  <li><CheckCircle size={14} style={{ color: 'var(--accent)' }} /> 1 Full-Length Mock Test</li>
                  <li><CheckCircle size={14} style={{ color: 'var(--accent)' }} /> 3 Sectional Micro Quizzes</li>
                  <li><CheckCircle size={14} style={{ color: 'var(--accent)' }} /> Markdown study notes access</li>
                  <li><CheckCircle size={14} style={{ color: 'var(--accent)' }} /> Basic dashboard statistics</li>
                </ul>
                <button onClick={() => { handleRoleChange('student'); setShowLoginModal(true); }} className="btn btn-secondary" style={{ width: '100%' }}>
                  Get Started
                </button>
              </TiltCard>

              <TiltCard className="card pricing-card popular">
                <div className="pricing-popular-badge">BEST VALUE</div>
                <h3 style={{ fontSize: '1.125rem', color: 'var(--accent)' }}>Mock Test Series Pro</h3>
                <div className="pricing-price">₹1,499 <span>/ full access</span></div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Tailored for regular mock simulator drills and analytics.</p>
                <ul className="pricing-features">
                  <li><CheckCircle size={14} style={{ color: 'var(--accent)' }} /> Unlimited Mock Test Series</li>
                  <li><CheckCircle size={14} style={{ color: 'var(--accent)' }} /> Full MHT-CET MCQ Bank</li>
                  <li><CheckCircle size={14} style={{ color: 'var(--accent)' }} /> AI Adaptive quiz generator</li>
                  <li><CheckCircle size={14} style={{ color: 'var(--accent)' }} /> Parent insights tracker stream</li>
                  <li><CheckCircle size={14} style={{ color: 'var(--accent)' }} /> Formula guides & diagram packs</li>
                </ul>
                <button onClick={() => { handleRoleChange('student'); setShowLoginModal(true); }} className="btn btn-primary" style={{ width: '100%' }}>
                  Enroll Now
                </button>
              </TiltCard>

              <TiltCard className="card pricing-card">
                <h3 style={{ fontSize: '1.125rem', color: 'var(--text-muted)' }}>Master Prep Complete</h3>
                <div className="pricing-price">₹2,999 <span>/ full access</span></div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Includes custom instructor-guided review and feedback.</p>
                <ul className="pricing-features">
                  <li><CheckCircle size={14} style={{ color: 'var(--accent)' }} /> Everything inside Pro Pack</li>
                  <li><CheckCircle size={14} style={{ color: 'var(--accent)' }} /> Direct manual teacher feedback</li>
                  <li><CheckCircle size={14} style={{ color: 'var(--accent)' }} /> PDF study material downloads</li>
                  <li><CheckCircle size={14} style={{ color: 'var(--accent)' }} /> Priority whatsapp doubt solving</li>
                </ul>
                <button onClick={() => { handleRoleChange('student'); setShowLoginModal(true); }} className="btn btn-secondary" style={{ width: '100%' }}>
                  Contact Admissions
                </button>
              </TiltCard>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ padding: '40px', textAlign: 'center', borderTop: '1px solid rgba(210, 255, 61, 0.12)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <p>© 2026 MHT-CET Ace LMS. All rights reserved. Maharashtra Technical Entrance Prep Engine.</p>
        </footer>
      </div>


      {/* Authentication Modal */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: '440px',
              '--role-accent': selectedRole === 'student' ? '#2563eb' : 
                               selectedRole === 'parent' ? '#ea580c' : 
                               (selectedRole === 'teacher' || selectedRole === 'admin') ? '#059669' : 
                               selectedRole === 'executive' ? '#7c3aed' : 
                               '#e11d48',
              '--role-accent-rgb': selectedRole === 'student' ? '37, 99, 235' : 
                                   selectedRole === 'parent' ? '234, 88, 12' : 
                                   (selectedRole === 'teacher' || selectedRole === 'admin') ? '5, 150, 105' : 
                                   selectedRole === 'executive' ? '124, 58, 237' : 
                                   '225, 29, 72'
            } as React.CSSProperties}
          >
            <h3 
              onDoubleClick={triggerBypass}
              style={{ fontSize: '1.5rem', marginBottom: '8px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
              title="Double click to autofill demo data"
            >
              {isSignUp ? 'Create Account' :
               (selectedRole === 'teacher' || selectedRole === 'admin') ? 'Faculty Login' :
               'Portal Sign In'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px', textAlign: 'center' }}>
              {isSignUp ? 'Sign up to start preparing for MHT-CET PCMB.' :
               (selectedRole === 'teacher' || selectedRole === 'admin') ? 'Faculty & Admin access portal. Select your role below.' :
               'Enter your credentials to access the prep portal.'}
            </p>

            {!isSignUp && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', padding: '12px 14px', backgroundColor: 'var(--primary-light)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demo Account Quick Logins</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(['student', 'parent', 'faculty', 'executive'] as const).map((r) => {
                    const isFaculty = r === 'faculty';
                    const isActive = isFaculty
                      ? (selectedRole === 'teacher' || selectedRole === 'admin')
                      : selectedRole === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          if (isFaculty) {
                            handleRoleChange('teacher');
                          } else {
                            handleRoleChange(r as any);
                          }
                          if (r !== 'parent') setPassword('password123');
                        }}
                        style={{
                          fontSize: '0.75rem',
                          padding: '6px 12px',
                          borderRadius: '9999px',
                          border: '1px solid var(--border)',
                          backgroundColor: isActive ? 'var(--accent)' : 'var(--bg-card)',
                          color: isActive ? 'var(--bg-card)' : 'var(--text-main)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'var(--transition)'
                        }}
                      >
                        {r === 'faculty' ? 'Faculty' : r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
              {isSignUp && (
                <div style={{ marginBottom: '20px' }}>
                  <label className="form-label" style={{ marginBottom: '8px', display: 'block', textAlign: 'center' }}>Create Account As</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    {(['student', 'teacher', 'admin'] as const).map((r) => {
                      const isActive = selectedRole === r;
                      const label = r === 'student' ? 'Student' : r === 'teacher' ? 'Teacher' : 'Admin';
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => handleRoleChange(r)}
                          style={{
                            fontSize: '0.75rem',
                            padding: '10px 8px',
                            borderRadius: '12px',
                            border: isActive ? '2px solid var(--accent)' : '2px solid var(--border)',
                            backgroundColor: isActive ? 'rgba(210, 255, 61, 0.12)' : 'var(--bg-card)',
                            color: isActive ? 'var(--accent)' : 'var(--text-main)',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'var(--transition)'
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {isSignUp && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrorMsg(''); }}
                    placeholder="Enter your name"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                  placeholder="name@mhtcet.com"
                  required
                />
              </div>

              {/* Password — hidden for parent login (they use email + PRN) */}
              {!(selectedRole === 'parent' && !isSignUp) && (
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                      placeholder="••••••••"
                      style={{ paddingRight: '40px' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-light)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}



              {/* Faculty Role Selector — shown when teacher or admin is selected (login only) */}
              {!isSignUp && (selectedRole === 'teacher' || selectedRole === 'admin') && (
                <div style={{ marginBottom: '20px' }}>
                  <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>Faculty Role</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {(['teacher', 'admin'] as const).map((r) => {
                      const meta = {
                        teacher: { label: 'Teacher', icon: '👨‍🏫', desc: 'Class & test management' },
                        admin:   { label: 'Admin',   icon: '🛡️',          desc: 'System administration' },
                      }[r];
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => handleRoleChange(r)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '14px 10px',
                            borderRadius: '12px',
                            border: selectedRole === r ? '2px solid #059669' : '2px solid var(--border)',
                            backgroundColor: selectedRole === r ? 'rgba(5,150,105,0.12)' : 'var(--bg-card)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            transform: selectedRole === r ? 'scale(1.04)' : 'scale(1)',
                            boxShadow: selectedRole === r ? '0 0 14px rgba(5,150,105,0.35)' : 'none',
                          }}
                        >
                          <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{meta.icon}</span>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: selectedRole === r ? '#059669' : 'var(--text-main)' }}>{meta.label}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>{meta.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {!isSignUp && selectedRole === 'parent' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Child's PRN Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={prn}
                      onChange={(e) => { setPrn(e.target.value); setErrorMsg(''); }}
                      placeholder="Enter Child's PRN (e.g. MHT202612345)"
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', backgroundColor: 'rgba(234,88,12,0.08)', borderRadius: '10px', border: '1px solid rgba(234,88,12,0.2)', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>ℹ️</span>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                      Parent accounts are <strong style={{ color: '#ea580c' }}>automatically created</strong> when a student registers. Log in using your registered <strong>email</strong> and your child's <strong>PRN number</strong> — no password needed.
                    </p>
                  </div>
                </>
              )}


              {isSignUp && (
                <>
                  {/* Sign-up is always for Student accounts only */}
                  {selectedRole === 'student' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--primary-light)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', border: '1px solid var(--border)' }}>

                      {/* Student Number — Auto-generated Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(37,99,235,0.08)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(37,99,235,0.2)' }}>
                        <span style={{ fontSize: '1.1rem' }}>🎫</span>
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', display: 'block' }}>Student Number (PRN)</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Your unique PRN will be auto-generated upon registration (e.g. MHT2026XXXXX)</span>
                        </div>
                      </div>

                      {/* Parent Account Details */}
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                          👨‍👩‍👧 Parent Account Details
                          <span style={{ fontSize: '0.65rem', fontWeight: 400, color: 'var(--accent)', textTransform: 'none', letterSpacing: 0 }}>(auto-created — parent logs in with email)</span>
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '3px' }}>Parent's Full Name</label>
                            <input
                              type="text"
                              className="form-input"
                              value={parentName}
                              onChange={(e) => { setParentName(e.target.value); setErrorMsg(''); }}
                              placeholder="e.g. Mr. Arvind Sharma"
                              style={{ fontSize: '0.82rem', padding: '8px 12px' }}
                              required
                            />
                          </div>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '3px' }}>Parent's Email Address</label>
                            <input
                              type="email"
                              className="form-input"
                              value={parentEmail}
                              onChange={(e) => { setParentEmail(e.target.value); setErrorMsg(''); }}
                              placeholder="parent@email.com"
                              style={{ fontSize: '0.82rem', padding: '8px 12px' }}
                              required
                            />
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '6px 10px', backgroundColor: 'rgba(210,255,61,0.06)', borderRadius: '8px', border: '1px solid rgba(210,255,61,0.15)' }}>
                            ℹ️ Your parent will log in using their <strong>email</strong> + your <strong>student PRN</strong> — no password required.
                          </div>
                        </div>
                      </div>

                      {/* Target Course & Exam */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>🎯 Target Course</label>
                          <select className="form-select" value={targetCourse} onChange={(e) => setTargetCourse(e.target.value as any)} style={{ fontSize: '0.8rem', padding: '6px', borderRadius: '8px' }}>
                            <option value="PCM">PCM (Engineering)</option>
                            <option value="PCB">PCB (Medical)</option>
                            <option value="PCMB">PCMB (Both)</option>
                          </select>
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>📋 Target Exam</label>
                          <select className="form-select" value={targetExam} onChange={(e) => setTargetExam(e.target.value as any)} style={{ fontSize: '0.8rem', padding: '6px', borderRadius: '8px' }}>
                            <option value="MHT-CET">MHT-CET</option>
                            <option value="JEE">JEE Mains</option>
                            <option value="NEET">NEET UG</option>
                          </select>
                        </div>
                      </div>

                      {/* Subscription Plan */}
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>💳 Subscription Plan</label>
                        <select className="form-select" value={plan} onChange={(e) => setPlan(e.target.value as any)} style={{ fontSize: '0.8rem', padding: '6px', borderRadius: '8px' }}>
                          <option value="Free">Free — Mock Tests Only</option>
                          <option value="Pro">Pro — ₹1,499 · AI Insights + Tutor + Mock Tests</option>
                          <option value="Premium">Premium — ₹2,999 · Full Pack + PDF + Instructor Review</option>
                        </select>
                      </div>

                    </div>
                  )}
                </>
              )}

              {errorMsg && (
                <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginBottom: '16px' }}>
                  ⚠️ {errorMsg}
                </p>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowLoginModal(false)} className="btn btn-secondary" style={{ flex: 1 }} disabled={loading}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-role-submit" 
                  style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white' }} />
                      <span>{isSignUp ? 'Creating...' : 'Authenticating...'}</span>
                    </>
                  ) : (
                    <span>{isSignUp ? (plan === 'Free' ? 'Create Account' : 'Proceed to Pay') : 'Sign In'}</span>
                  )}
                </button>
              </div>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              {isSignUp ? (
                <p style={{ color: 'var(--text-muted)' }}>
                  Already have an account?{' '}
                  <span 
                    onClick={() => { setIsSignUp(false); setErrorMsg(''); }} 
                    style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Sign In
                  </span>
                </p>
              ) : (
                // Hide "Create Account" for parent role — parent accounts are created automatically via student registration
                selectedRole !== 'parent' && (
                  <p style={{ color: 'var(--text-muted)' }}>
                    Need an account?{' '}
                    <span 
                      onClick={() => { setIsSignUp(true); setErrorMsg(''); }} 
                      style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Create Account
                    </span>
                  </p>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Simulated Payment Checkout Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <Compass size={32} style={{ color: 'var(--accent)', margin: '0 auto 8px' }} className="pulse" />
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Secure Payment Gateway</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                Simulating order for <strong>{plan} Package</strong>
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--primary-light)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Amount</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{plan === 'Pro' ? '₹1,499' : '₹2,999'}</div>
              </div>
              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>MHT-CET ACE LMS</span>
            </div>

            <form onSubmit={handleSimulatedPayment}>
              {/* Payment Method Switcher */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`btn btn-xs ${paymentMethod === 'card' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ height: '32px' }}
                >
                  Credit/Debit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`btn btn-xs ${paymentMethod === 'upi' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ height: '32px' }}
                >
                  UPI (GPay/PhonePe)
                </button>
              </div>

              {paymentMethod === 'card' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Card Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Expiry Date</label>
                      <input
                        type="text"
                        className="form-input"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>CVV</label>
                      <input
                        type="password"
                        className="form-input"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="•••"
                        maxLength={3}
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '20px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>UPI Virtual Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="student@upi"
                    required
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '4px', display: 'block' }}>
                    Simulating collect requests using mock payment APIs.
                  </span>
                </div>
              )}

              {errorMsg && (
                <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginBottom: '16px' }}>
                  ⚠️ {errorMsg}
                </p>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  disabled={paymentProcessing}
                >
                  Go Back
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
                    <span>Simulate Payment Success</span>
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
