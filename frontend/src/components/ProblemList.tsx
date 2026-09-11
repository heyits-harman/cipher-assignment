import React, { useEffect, useState } from 'react';
import { fetchProblems, Problem } from '../services/api';
import { ShieldCheck, Cpu, ChevronRight, Sparkles, BookOpen } from 'lucide-react';
import '../styles/ProblemList.css';

interface ProblemListProps {
  onSelectProblem: (slug: string) => void;
}

export const ProblemList: React.FC<ProblemListProps> = ({ onSelectProblem }) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProblems()
      .then((data) => {
        setProblems(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load problems');
        setLoading(false);
      });
  }, []);

  const getDifficultyBadge = (difficulty: string) => {
    const isEasy = difficulty === 'EASY';
    return (
      <span className={`difficulty-badge ${isEasy ? 'easy' : 'medium'}`}>
        {difficulty}
      </span>
    );
  };

  return (
    <div className="animate-fade-in problem-list">
      {/* Hero Section */}
      <div className="problem-list-hero">
        <div className="problem-list-blob-coral" />
        <div className="problem-list-blob-sky" />

        <div className="problem-list-hero-content">
          <div className="badge-pill problem-list-hero-badge">
            <Sparkles size={14} />
            <span>Interactive LLD Practice Loop</span>
          </div>

          <h1 className="headline-display problem-list-hero-title">
            Master Object-Oriented & Low-Level Design.
          </h1>

          <p className="body-text-muted problem-list-hero-desc">
            Choose a domain challenge, craft your class responsibilities and abstractions, and get instant hybrid structural & LLM feedback.
          </p>

          <div className="problem-list-hero-features">
            <div className="problem-list-hero-feature">
              <ShieldCheck size={18} color="var(--color-signal-blue)" />
              <span>Deterministic Structural Audits</span>
            </div>
            <div className="problem-list-hero-feature">
              <Cpu size={18} color="var(--color-signal-blue)" />
              <span>AI Design Principles Review</span>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Grid Title */}
      <div className="problem-list-header">
        <div>
          <h2 className="headline-section problem-list-header-title">
            Available Practice Problems
          </h2>
          <p className="problem-list-header-subtitle">
            Select a problem to start a new practice attempt or view details.
          </p>
        </div>
        <span className="problem-list-header-count">
          {problems.length} {problems.length === 1 ? 'Problem' : 'Problems'} available
        </span>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="problem-list-loading-grid">
          {[1, 2].map((i) => (
            <div key={i} className="card-surface problem-list-loading-card">
              <div className="problem-list-loading-bar short" />
              <div className="problem-list-loading-bar medium" />
              <div className="problem-list-loading-bar long" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="card-surface problem-list-error">
          <p className="problem-list-error-title">Failed to connect to backend service</p>
          <p className="problem-list-error-msg">{error}</p>
        </div>
      )}

      {/* Problems List Grid */}
      {!loading && !error && (
        <div className="problem-list-grid">
          {problems.map((prob) => (
            <div
              key={prob.id}
              className="card-surface problem-card"
              onClick={() => onSelectProblem(prob.slug)}
            >
              <div>
                <div className="problem-card-header">
                  <div className="problem-card-icon">
                    <BookOpen size={20} />
                  </div>
                  {getDifficultyBadge(prob.difficulty)}
                </div>

                <h3 className="problem-card-title">
                  {prob.title}
                </h3>

                <p className="problem-card-desc">
                  {prob.description}
                </p>
              </div>

              <div className="problem-card-footer">
                <span className="problem-card-cta">
                  Start Practice Attempt
                </span>
                <div className="problem-card-arrow">
                  <ChevronRight size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
