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

  const handleRoleChange = (role: 'student' | 'parent' | 'admin' | 'teacher' | 'executive') => {
    setSelectedRole(role);
    if (role === 'student') setEmail('rahul@cet.com');
    else if (role === 'parent') setEmail('parent.rahul@cet.com');
    else if (role === 'teacher') setEmail('teacher@demo.com');
    else if (role === 'executive') setEmail('executive@demo.com');
    else setEmail('sharma.sir@cet.com');
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
    if (!email || !password || (isSignUp && !name)) {
      setErrorMsg('Please fill in all required fields.');
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
            plan: selectedRole === 'student' ? plan : undefined
          }
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
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Server connection failed.');
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
    <div style={{ backgroundColor: 'var(--bg-app)', minHeight: '100vh' }}>
      {/* Top Banner Navigation */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 40px',
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Compass size={24} style={{ color: 'var(--accent)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem' }}>
            MHT-CET <span style={{ color: 'var(--accent)' }}>Ace</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={() => { handleRoleChange('student'); setShowLoginModal(true); setIsSignUp(false); }} className="btn btn-outline btn-sm">
            Student Portal
          </button>
          <button onClick={() => { handleRoleChange('parent'); setShowLoginModal(true); setIsSignUp(false); }} className="btn btn-outline btn-sm">
            Parent Portal
          </button>
          <button onClick={() => { handleRoleChange('teacher'); setShowLoginModal(true); setIsSignUp(false); }} className="btn btn-outline btn-sm">
            Teacher Portal
          </button>
          <button onClick={() => { handleRoleChange('executive'); setShowLoginModal(true); setIsSignUp(false); }} className="btn btn-outline btn-sm">
            Executive Portal
          </button>
          <button onClick={() => { handleRoleChange('admin'); setShowLoginModal(true); setIsSignUp(false); }} className="btn btn-primary btn-sm">
            Admin Console
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="landing-hero">
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
              border: '1px solid var(--border)'
            }}
          >
            <Award size={14} /> MHT-CET 2026 Academic Preparation Engine
          </div>
          <h1 className="hero-title">
            Master the MHT-CET Exam with <span style={{ color: 'var(--accent)' }}>Adaptive Learning</span>
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
            <div className="metric-card">
              <div className="metric-val">12,450+</div>
              <div className="metric-label">Active Maharashtra Students</div>
            </div>
            <div className="metric-card">
              <div className="metric-val">84,200+</div>
              <div className="metric-label">Mock Tests Completed</div>
            </div>
            <div className="metric-card">
              <div className="metric-val">1.2M+</div>
              <div className="metric-label">MHT-CET MCQs Solved</div>
            </div>
            <div className="metric-card">
              <div className="metric-val">99.4%</div>
              <div className="metric-label">Syllabus Accuracy Index</div>
            </div>
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
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', backgroundColor: '#eff6ff', borderRadius: '8px', color: 'var(--accent)', marginBottom: '20px' }}>
              <BookOpen size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>PCMB Comprehensive Syllabus</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>
              Dedicated preparation resources for Physics, Chemistry, Mathematics, and Biology. Integrated formulae cheat sheets, downloadable notes, and solved questions matching current board frameworks.
            </p>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', backgroundColor: '#ecfdf5', borderRadius: '8px', color: '#10b981', marginBottom: '20px' }}>
              <TrendingUp size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>AI Adaptive Concept Engine</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>
              The engine automatically flags chapters where your mock accuracy drops below 70%, immediately generating micro-quizzes of 5 target questions to build muscle memory.
            </p>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', backgroundColor: '#fffbeb', borderRadius: '8px', color: '#f59e0b', marginBottom: '20px' }}>
              <Users size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>Parent Consistency Watch</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>
              Read-only dashboard tracking student scorecard metrics, daily mock test streak maps, and a unified feedback stream combining qualitative teacher input with automated AI time-spent analysis.
            </p>
          </div>
        </div>
      </section>

      {/* Subscription Pricing Plans */}
      <section style={{ padding: '80px 40px', backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.25rem', marginBottom: '12px' }}>Flexible Registration Plans</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '56px' }}>
            Choose a plan that matches your MHT-CET timeline. Cancel or upgrade anytime.
          </p>

          <div className="pricing-grid">
            <div className="card pricing-card">
              <h3 style={{ fontSize: '1.125rem', color: 'var(--text-muted)' }}>Free Core Pack</h3>
              <div className="pricing-price">₹0 <span>/ forever</span></div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Perfect for initial test platform evaluation.</p>
              <ul className="pricing-features">
                <li><CheckCircle size={14} style={{ color: 'var(--success)' }} /> 1 Full-Length Mock Test</li>
                <li><CheckCircle size={14} style={{ color: 'var(--success)' }} /> 3 Sectional Micro Quizzes</li>
                <li><CheckCircle size={14} style={{ color: 'var(--success)' }} /> Markdown study notes access</li>
                <li><CheckCircle size={14} style={{ color: 'var(--success)' }} /> Basic dashboard statistics</li>
              </ul>
              <button onClick={() => { handleRoleChange('student'); setShowLoginModal(true); }} className="btn btn-secondary" style={{ width: '100%' }}>
                Get Started
              </button>
            </div>

            <div className="card pricing-card popular">
              <div className="pricing-popular-badge">BEST VALUE</div>
              <h3 style={{ fontSize: '1.125rem', color: 'var(--accent)' }}>Mock Test Series Pro</h3>
              <div className="pricing-price">₹1,499 <span>/ full access</span></div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Tailored for regular mock simulator drills and analytics.</p>
              <ul className="pricing-features">
                <li><CheckCircle size={14} style={{ color: 'var(--success)' }} /> Unlimited Mock Test Series</li>
                <li><CheckCircle size={14} style={{ color: 'var(--success)' }} /> Full MHT-CET MCQ Bank</li>
                <li><CheckCircle size={14} style={{ color: 'var(--success)' }} /> AI Adaptive quiz generator</li>
                <li><CheckCircle size={14} style={{ color: 'var(--success)' }} /> Parent insights tracker stream</li>
                <li><CheckCircle size={14} style={{ color: 'var(--success)' }} /> Formula guides & diagram packs</li>
              </ul>
              <button onClick={() => { handleRoleChange('student'); setShowLoginModal(true); }} className="btn btn-primary" style={{ width: '100%' }}>
                Enroll Now
              </button>
            </div>

            <div className="card pricing-card">
              <h3 style={{ fontSize: '1.125rem', color: 'var(--text-muted)' }}>Master Prep Complete</h3>
              <div className="pricing-price">₹2,999 <span>/ full access</span></div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Includes custom instructor-guided review and feedback.</p>
              <ul className="pricing-features">
                <li><CheckCircle size={14} style={{ color: 'var(--success)' }} /> Everything inside Pro Pack</li>
                <li><CheckCircle size={14} style={{ color: 'var(--success)' }} /> Direct manual teacher feedback</li>
                <li><CheckCircle size={14} style={{ color: 'var(--success)' }} /> PDF study material downloads</li>
                <li><CheckCircle size={14} style={{ color: 'var(--success)' }} /> Priority whatsapp doubt solving</li>
              </ul>
              <button onClick={() => { handleRoleChange('student'); setShowLoginModal(true); }} className="btn btn-secondary" style={{ width: '100%' }}>
                Contact Admissions
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px', textAlign: 'center', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <p>© 2026 MHT-CET Ace LMS. All rights reserved. Maharashtra Technical Entrance Prep Engine.</p>
      </footer>

      {/* Authentication Modal */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <h3 
              onDoubleClick={triggerBypass}
              style={{ fontSize: '1.5rem', marginBottom: '8px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
              title="Double click to autofill demo data"
            >
              {isSignUp ? 'Create Account' : 'Portal Sign In'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px', textAlign: 'center' }}>
              {isSignUp ? 'Sign up to start preparing for MHT-CET PCMB.' : 'Enter your credentials to access the prep portal.'}
            </p>

            {!isSignUp && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', padding: '10px 12px', backgroundColor: 'var(--primary-light)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase' }}>Demo Account Quick Logins</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <button type="button" className="btn btn-xs btn-secondary" onClick={() => { handleRoleChange('student'); setPassword('password123'); }} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>Student</button>
                  <button type="button" className="btn btn-xs btn-secondary" onClick={() => { handleRoleChange('parent'); setPassword('password123'); }} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>Parent</button>
                  <button type="button" className="btn btn-xs btn-secondary" onClick={() => { handleRoleChange('teacher'); setPassword('password123'); }} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>Teacher</button>
                  <button type="button" className="btn btn-xs btn-secondary" onClick={() => { handleRoleChange('executive'); setPassword('password123'); }} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>Executive</button>
                  <button type="button" className="btn btn-xs btn-secondary" onClick={() => { handleRoleChange('admin'); setPassword('password123'); }} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>Admin</button>
                </div>
              </div>
            )}

            <form onSubmit={handleLoginSubmit}>
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

              {isSignUp && (
                <>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label">Select Profile Role</label>
                    <select
                      className="form-select"
                      value={selectedRole}
                      onChange={(e) => handleRoleChange(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-main)',
                        fontSize: '0.875rem'
                      }}
                    >
                      <option value="student">Student</option>
                      <option value="parent">Parent</option>
                      <option value="teacher">Teacher (Status: Pending Approval)</option>
                      <option value="executive">Executive / CEO (BI Metrics)</option>
                      <option value="admin">System Admin</option>
                    </select>
                  </div>

                  {selectedRole === 'student' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: 'var(--primary-light)', padding: '14px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Target Course</label>
                          <select className="form-select" value={targetCourse} onChange={(e) => setTargetCourse(e.target.value as any)} style={{ fontSize: '0.8rem', padding: '6px' }}>
                            <option value="PCM">PCM (Engg)</option>
                            <option value="PCB">PCB (Medical)</option>
                            <option value="PCMB">PCMB (Both)</option>
                          </select>
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Target Exam</label>
                          <select className="form-select" value={targetExam} onChange={(e) => setTargetExam(e.target.value as any)} style={{ fontSize: '0.8rem', padding: '6px' }}>
                            <option value="MHT-CET">MHT-CET</option>
                            <option value="JEE">JEE Mains</option>
                            <option value="NEET">NEET UG</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Subscription Tier</label>
                        <select className="form-select" value={plan} onChange={(e) => setPlan(e.target.value as any)} style={{ fontSize: '0.8rem', padding: '6px' }}>
                          <option value="Free">Free (Mock Tests Only)</option>
                          <option value="Pro">Pro (₹1,499 - AI Insights + Tutor + Mock Tests)</option>
                          <option value="Premium">Premium (₹2,999 - Full Pack + PDF + Instructor Review)</option>
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
                  className="btn btn-primary" 
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
                <p style={{ color: 'var(--text-muted)' }}>
                  Need an account?{' '}
                  <span 
                    onClick={() => { setIsSignUp(true); setErrorMsg(''); }} 
                    style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Create Account
                  </span>
                </p>
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
