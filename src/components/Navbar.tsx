import React, { useState, useEffect } from 'react';
import { useLms } from '../context/LmsContext';
import { User, LogOut, Sun, Moon, GraduationCap, ShieldAlert, HelpCircle } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeUser, logout, setRunTour, isMockTestActive } = useLms();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('mht_cet_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mht_cet_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <GraduationCap size={28} className="pulse" style={{ color: 'var(--accent)' }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
          MHT-CET <span style={{ color: 'var(--accent)' }}>Ace</span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Guide Tour Button */}
        {activeUser && activeUser.role === 'student' && (
          <button
            id="step-guide"
            onClick={() => setRunTour(true)}
            className="btn btn-secondary"
            style={{ padding: '8px', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--primary-light)', color: 'var(--accent)' }}
            title="Start Onboarding Guide Tour"
          >
            <HelpCircle size={18} />
          </button>
        )}

        {/* Theme Toggler */}
        <button
          id="step-theme-toggle"
          onClick={toggleTheme}
          className="btn btn-secondary"
          style={{ padding: '8px', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {activeUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{activeUser.name}</span>
              <span 
                className={`badge badge-${
                activeUser.role === 'admin' ? 'danger' : 
                activeUser.role === 'parent' ? 'warning' : 
                activeUser.role === 'teacher' ? 'success' : 'info'
                }`}
                style={{ fontSize: '0.65rem', marginTop: '2px', padding: '2px 6px' }}
              >
                {activeUser.role}
              </span>
            </div>
            <button
              onClick={() => {
                if (isMockTestActive) {
                  alert("A mock test is currently in progress. You cannot sign out.");
                  return;
                }
                logout();
              }}
              disabled={isMockTestActive}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: isMockTestActive ? 0.5 : 1, cursor: isMockTestActive ? 'not-allowed' : 'pointer' }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={16} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Public Access</span>
          </div>
        )}
      </div>
    </header>
  );
};
