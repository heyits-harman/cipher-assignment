import React, { useState } from 'react';
import { Problem, Attempt } from '../services/api';
import { 
  CheckCircle2, 
  XCircle, 
  Send, 
  Sparkles, 
  RotateCcw, 
  CheckSquare, 
  AlertCircle, 
  Code, 
  FileText,
  Cpu,
  Layers
} from 'lucide-react';
import '../styles/PracticeWorkspace.css';

interface PracticeWorkspaceProps {
  problem: Problem;
  attempt: Attempt;
  onSubmit: (content: string) => Promise<void>;
  onRetryEvaluation?: (attemptId: string) => Promise<void>;
  onNewAttempt: () => void;
  submitting: boolean;
}

const TEMPLATE_STARTER = `Describe your LLD Solution below (Classes, Interfaces, Patterns, and Relationships)

1. Interfaces & Domain Models
   - List your key interfaces and what they represent

2. Main Manager / Service Responsibilities
   - Describe the core classes and their roles

3. Relationships
   - Explain how the components interact with each other
`;

export const PracticeWorkspace: React.FC<PracticeWorkspaceProps> = ({
  problem,
  attempt,
  onSubmit,
  onRetryEvaluation,
  onNewAttempt,
  submitting,
}) => {
  const [content, setContent] = useState<string>(
    attempt.submission?.content || TEMPLATE_STARTER
  );
  const [retrying, setRetrying] = useState(false);

  const isSubmitted = attempt.status !== 'DRAFT';
  const isEvaluating = attempt.status === 'EVALUATING';
  const isCompleted = attempt.status === 'COMPLETED';
  const isFailed = attempt.status === 'FAILED';

  const evaluation = attempt.evaluation;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting || isSubmitted) return;
    onSubmit(content);
  };

  const handleRetry = async () => {
    if (!onRetryEvaluation || !attempt.id) return;
    setRetrying(true);
    try {
      await onRetryEvaluation(attempt.id);
    } catch (err) {
      console.error(err);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="animate-fade-in practice-workspace">
      {/* Workspace Top Header */}
      <div className="practice-header">
        <div>
          <div className="practice-header-title-row">
            <h1 className="practice-header-title">
              {problem.title}
            </h1>
            <span className={`practice-header-difficulty ${problem.difficulty.toLowerCase()}`}>
              {problem.difficulty}
            </span>
          </div>
          <p className="practice-header-attempt-id">
            Attempt ID: <code>{attempt.id}</code>
          </p>
        </div>

        <div className="practice-header-actions">
          <button
            onClick={onNewAttempt}
            className="btn-outline practice-new-attempt-btn"
          >
            <RotateCcw size={14} />
            <span>New Attempt</span>
          </button>

          {!isSubmitted && (
            <button
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
              className="btn-primary practice-submit-btn"
            >
              {submitting ? (
                <>
                  <div className="animate-spin spinner" />
                  <span>Submitting & Evaluating...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Submit Solution</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Split Layout */}
      <div className="practice-grid">
        {/* Left Column: Problem Requirements & Criteria */}
        <div className="card-surface practice-requirements-card">
          <div className="practice-requirements-header">
            <FileText size={18} color="var(--color-signal-blue)" />
            <h2 className="practice-requirements-title">
              Problem Context &amp; Requirements
            </h2>
          </div>

          <p className="practice-description">
            {problem.description}
          </p>

          {/* Overview */}
          {problem.requirements?.overview && (
            <div className="practice-overview">
              <h3 className="practice-overview-title">
                Overview
              </h3>
              <p className="practice-overview-text">
                {problem.requirements.overview}
              </p>
            </div>
          )}

          {/* Must Handle Requirements */}
          {problem.requirements?.mustHandle && problem.requirements.mustHandle.length > 0 && (
            <div className="practice-requirements">
              <h3 className="practice-requirements-subtitle">
                Key Functional Requirements
              </h3>
              <ul className="practice-requirements-list">
                {problem.requirements.mustHandle.map((req, idx) => (
                  <li key={idx} className="practice-requirements-item">
                    <CheckSquare size={16} color="var(--color-signal-blue)" className="practice-requirements-item-icon" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Evaluation Criteria */}
          {problem.evaluationCriteria && problem.evaluationCriteria.length > 0 && (
            <div className="practice-criteria">
              <h3 className="practice-criteria-title">
                Evaluation Focus &amp; Criteria
              </h3>
              <div className="practice-criteria-list">
                {problem.evaluationCriteria.map((criterion) => (
                  <div key={criterion.id} className="practice-criterion">
                    <div className="practice-criterion-header">
                      <span className="practice-criterion-name">
                        {criterion.name}
                      </span>
                      <span className="practice-criterion-weight">
                        Weight: {criterion.weight}x
                      </span>
                    </div>
                    <p className="practice-criterion-desc">
                      {criterion.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Solution Input & Feedback Panel */}
        <div className="practice-right-panel">
          {/* Solution Input Card */}
          <div className="card-surface practice-solution-card">
            <div className="practice-solution-header">
              <div className="practice-solution-header-left">
                <Code size={18} color="var(--color-signal-blue)" />
                <h2 className="practice-solution-title">
                  Your Solution &amp; Design
                </h2>
              </div>
              <span className="practice-solution-format">
                Text Format Only
              </span>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitted}
              placeholder="Describe your solution in plain text — class structures, interfaces, relationships, and methods..."
              rows={14}
              className="practice-textarea"
            />

            {!isSubmitted && (
              <div className="practice-solution-footer">
                <span className="practice-solution-tip">
                  Tip: Include interface declarations and key method signatures.
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !content.trim()}
                  className="btn-primary practice-submit-attempt-btn"
                >
                  <Send size={14} />
                  <span>Submit Attempt</span>
                </button>
              </div>
            )}
          </div>

          {/* Feedback & Evaluation Panel */}
          {isSubmitted && (
            <div className="card-surface animate-fade-in practice-feedback-card">
              {/* Header */}
              <div className="practice-feedback-header">
                <div className="practice-feedback-header-left">
                  <Sparkles size={20} color="var(--color-signal-blue)" />
                  <h2 className="practice-feedback-title">
                    Evaluation Results &amp; Feedback
                  </h2>
                </div>

                {evaluation?.overallScore !== null && evaluation?.overallScore !== undefined && (
                  <div className={`practice-score-badge ${evaluation.overallScore >= 70 ? 'good' : 'needs-work'}`}>
                    <span>Overall Score: {evaluation.overallScore}%</span>
                  </div>
                )}
              </div>

              {/* Status: Evaluating */}
              {isEvaluating && (
                <div className="practice-evaluating">
                  <div className="animate-spin practice-evaluating-spinner" />
                  <p className="practice-evaluating-text">Running hybrid structural &amp; LLM analysis...</p>
                  <p className="practice-evaluating-subtext">Evaluating SRP, encapsulation, and requirement coverage.</p>
                </div>
              )}

              {/* Status: Failed */}
              {isFailed && (
                <div className="practice-failed">
                  <div className="practice-failed-header">
                    <AlertCircle size={18} />
                    <span>Evaluation Failed</span>
                  </div>
                  <p className="practice-failed-message">
                    {evaluation?.errorMessage || 'An error occurred while evaluating your submission.'}
                  </p>
                  <button
                    onClick={handleRetry}
                    disabled={retrying}
                    className="btn-primary practice-retry-btn"
                  >
                    <RotateCcw size={14} />
                    <span>{retrying ? 'Retrying...' : 'Retry Evaluation'}</span>
                  </button>
                </div>
              )}

              {/* Status: Completed with Feedback */}
              {isCompleted && evaluation && (
                <div className="practice-completed">
                  {/* Scores breakdown bar */}
                  <div className="practice-scores-grid">
                    <div className="practice-score-item">
                      <Layers size={18} color="var(--color-slate-gray)" />
                      <div>
                        <span className="practice-score-label">Structural Check</span>
                        <span className="practice-score-value">
                          {evaluation.structuralScore !== null ? `${evaluation.structuralScore}%` : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="practice-score-item">
                      <Cpu size={18} color="var(--color-slate-gray)" />
                      <div>
                        <span className="practice-score-label">AI Reasoning Check</span>
                        <span className="practice-score-value">
                          {evaluation.aiScore !== null ? `${evaluation.aiScore}%` : 'Fallback (Structural)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Feedback Section */}
                  {evaluation.aiFeedback && evaluation.aiFeedback.length > 0 && (
                    <div>
                      <h3 className="practice-feedback-section-title">
                        <Cpu size={16} color="var(--color-signal-blue)" />
                        <span>AI Design Feedback (LLM Review)</span>
                      </h3>
                      <div className="practice-feedback-list">
                        {evaluation.aiFeedback.map((item, idx) => (
                          <div key={idx} className={`practice-feedback-item ${item.passed ? 'passed' : 'failed'}`}>
                            <div className="practice-feedback-item-header">
                              {item.passed ? (
                                <CheckCircle2 size={16} color="#16a34a" />
                              ) : (
                                <XCircle size={16} color="#e11d48" />
                              )}
                              <span className={`practice-feedback-item-name ${item.passed ? 'passed' : 'failed'}`}>
                                {item.name}
                              </span>
                            </div>
                            <p className="practice-feedback-item-message">
                              {item.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Structural Feedback Section */}
                  {evaluation.structuralFeedback && evaluation.structuralFeedback.length > 0 && (
                    <div>
                      <h3 className="practice-feedback-section-title">
                        <Layers size={16} color="var(--color-signal-blue)" />
                        <span>Structural &amp; Keyword Audit</span>
                      </h3>
                      <div className="practice-structural-list">
                        {evaluation.structuralFeedback.map((item, idx) => (
                          <div key={idx} className="practice-structural-item">
                            {item.passed ? (
                              <CheckCircle2 size={16} color="#16a34a" className="practice-structural-item-icon" />
                            ) : (
                              <XCircle size={16} color="#dc2626" className="practice-structural-item-icon" />
                            )}
                            <div>
                              <span className="practice-structural-item-name">
                                {item.name}
                              </span>
                              <span className="practice-structural-item-message">
                                {item.message}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
