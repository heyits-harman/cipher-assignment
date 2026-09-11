import React, { useEffect, useState } from 'react';
import { fetchAttemptHistory, fetchProblems, Attempt, Problem } from '../services/api';
import { History, ArrowRight, Clock, RotateCcw, FileText, ChevronRight } from 'lucide-react';
import '../styles/AttemptHistory.css';

interface AttemptHistoryProps {
  userId: string;
  onSelectAttempt: (attemptId: string) => void;
  onSelectProblem: (slug: string) => void;
}

export const AttemptHistory: React.FC<AttemptHistoryProps> = ({
  userId,
  onSelectAttempt,
  onSelectProblem,
}) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblemId, setSelectedProblemId] = useState<string>('');
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProblems()
      .then((data) => {
        setProblems(data);
        if (data.length > 0) {
          setSelectedProblemId(data[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch problems');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedProblemId) return;
    setLoading(true);
    fetchAttemptHistory(userId, selectedProblemId)
      .then((data) => {
        setAttempts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch attempt history');
        setLoading(false);
      });
  }, [userId, selectedProblemId]);

  const selectedProblem = problems.find((p) => p.id === selectedProblemId);

  return (
    <div className="animate-fade-in attempt-history">
      {/* Header */}
      <div className="attempt-history-header">
        <div className="badge-pill attempt-history-header-badge">
          <History size={14} />
          <span>Iterative Practice Journey</span>
        </div>
        <h1 className="headline-display attempt-history-header-title">
          Attempt History &amp; Progression
        </h1>
        <p className="body-text-muted attempt-history-header-desc">
          Track your design iterations, score growth, and past feedback over time for each LLD problem.
        </p>
      </div>

      {/* Problem Selector Bar */}
      <div className="attempt-history-problems">
        {problems.map((prob) => (
          <button
            key={prob.id}
            onClick={() => setSelectedProblemId(prob.id)}
            className={`attempt-history-problem-btn ${selectedProblemId === prob.id ? 'active' : ''}`}
          >
            <span>{prob.title}</span>
            <span className="attempt-history-problem-difficulty">
              {prob.difficulty}
            </span>
          </button>
        ))}
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="card-surface attempt-history-loading">
          <div className="animate-spin attempt-history-loading-spinner" />
          <p className="attempt-history-loading-text">Loading attempt history...</p>
        </div>
      ) : error ? (
        <div className="card-surface attempt-history-error">
          <p className="attempt-history-error-text">{error}</p>
        </div>
      ) : attempts.length === 0 ? (
        <div className="card-surface attempt-history-empty">
          <div className="attempt-history-empty-icon">
            <FileText size={24} />
          </div>
          <h3 className="attempt-history-empty-title">
            No past attempts recorded yet
          </h3>
          <p className="attempt-history-empty-desc">
            You haven't submitted any solutions for {selectedProblem?.title || 'this problem'} yet.
          </p>
          {selectedProblem && (
            <button
              onClick={() => onSelectProblem(selectedProblem.slug)}
              className="btn-primary"
            >
              <span>Start First Attempt</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      ) : (
        <div className="attempt-history-list">
          <div className="attempt-history-list-header">
            <h2 className="attempt-history-list-title">
              Past Submissions for {selectedProblem?.title} ({attempts.length})
            </h2>
            {selectedProblem && (
              <button
                onClick={() => onSelectProblem(selectedProblem.slug)}
                className="btn-outline attempt-history-try-btn"
              >
                <RotateCcw size={14} />
                <span>Try New Solution</span>
              </button>
            )}
          </div>

          {attempts.map((attempt, index) => {
            const evalData = attempt.evaluation;
            const score = evalData?.overallScore;
            const formattedDate = new Date(attempt.startedAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const statusClass = attempt.status === 'COMPLETED' 
              ? 'completed' 
              : attempt.status === 'FAILED' 
                ? 'failed' 
                : 'other';

            return (
              <div
                key={attempt.id}
                className="card-surface attempt-history-card"
                onClick={() => onSelectAttempt(attempt.id)}
              >
                <div className="attempt-history-card-left">
                  {/* Attempt Index / Number */}
                  <div className="attempt-history-card-index">
                    #{attempts.length - index}
                  </div>

                  <div>
                    <div className="attempt-history-card-info-header">
                      <span className="attempt-history-card-id">
                        Attempt {attempt.id.slice(-6)}
                      </span>
                      <span className={`attempt-history-card-status ${statusClass}`}>
                        {attempt.status}
                      </span>
                    </div>

                    <div className="attempt-history-card-meta">
                      <span className="attempt-history-card-date">
                        <Clock size={14} />
                        {formattedDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score & Arrow Right */}
                <div className="attempt-history-card-right">
                  {score !== null && score !== undefined ? (
                    <div className="attempt-history-card-score">
                      <span className={`attempt-history-card-score-value ${score >= 70 ? 'good' : 'needs-work'}`}>
                        {score}%
                      </span>
                      <span className="attempt-history-card-score-label">
                        Overall Score
                      </span>
                    </div>
                  ) : (
                    <span className="attempt-history-card-no-score">
                      No score
                    </span>
                  )}

                  <div className="attempt-history-card-arrow">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
