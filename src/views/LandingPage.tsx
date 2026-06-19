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
  const [selectedRole, setSelectedRole] = useState<'student' | 'parent' | 'admin'>('student');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('student@demo.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (role: 'student' | 'parent' | 'admin') => {
    setSelectedRole(role);
    if (role === 'student') setEmail('student@demo.com');
    else if (role === 'parent') setEmail('parent.rahul@cet.com');
    else setEmail('admin@demo.com');
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

    setLoading(true);
    setErrorMsg('');

    try {
      const endpoint = isSignUp 
        ? 'http://localhost:5000/api/auth/register' 
        : 'http://localhost:5000/api/auth/login';
      
      const payload = isSignUp 
        ? { name, email, password, role: selectedRole }
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
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Server connection failed.');
    } finally {
      setLoading(false);
    }
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
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={() => { handleRoleChange('student'); setShowLoginModal(true); }} className="btn btn-outline btn-sm">
            Student Login
          </button>
          <button onClick={() => { handleRoleChange('admin'); setShowLoginModal(true); }} className="btn btn-primary btn-sm">
            Teacher Portal
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
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Select Profile Role</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${selectedRole === 'student' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleRoleChange('student')}
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${selectedRole === 'parent' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleRoleChange('parent')}
                    >
                      Parent
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${selectedRole === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleRoleChange('admin')}
                    >
                      Admin
                    </button>
                  </div>
                </div>
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
                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
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
    </div>
  );
};
