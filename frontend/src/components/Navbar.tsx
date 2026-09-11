import React from 'react';
import { Sparkles, User } from 'lucide-react';
import logo from '../assets/logo.png';
import '../styles/Navbar.css';

interface NavbarProps {
  currentTab: 'problems' | 'practice' | 'history';
  onNavigate: (tab: 'problems' | 'practice' | 'history') => void;
  activeProblemTitle?: string;
  hasActiveAttempt?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  activeProblemTitle,
  hasActiveAttempt
}) => {
  return (
    <header className="navbar">
      <div className="app-container navbar-content">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => onNavigate('problems')}
          className="navbar-brand"
        >
          <img src={logo} alt="Logo" className="navbar-logo" />
          <div className="navbar-brand-text">
            <span className="navbar-brand-title">
              LLD Assignment
            </span>
            <span className="navbar-brand-subtitle">
              Practice Platform
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="navbar-nav">
          <button
            onClick={() => onNavigate('problems')}
            className={`navbar-nav-btn ${currentTab === 'problems' ? 'active' : ''}`}
          >
            Problems
          </button>

          {hasActiveAttempt && (
            <button
              onClick={() => onNavigate('practice')}
              className={`navbar-nav-btn ${currentTab === 'practice' ? 'active' : ''}`}
            >
              <Sparkles size={16} />
              <span>Workspace {activeProblemTitle ? `(${activeProblemTitle})` : ''}</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('history')}
            className={`navbar-nav-btn ${currentTab === 'history' ? 'active' : ''}`}
          >
            History
          </button>
        </nav>

        {/* User Identity Pill */}
        <div className="navbar-user">
          <User size={14} color="var(--color-slate-gray)" />
          <span className="navbar-user-name">
            Demo Learner
          </span>
        </div>
      </div>
    </header>
  );
};
