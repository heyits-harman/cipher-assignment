import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ProblemList } from './components/ProblemList';
import { PracticeWorkspace } from './components/PracticeWorkspace';
import { AttemptHistory } from './components/AttemptHistory';
import { 
  fetchProblemBySlug, 
  createAttempt, 
  fetchAttempt, 
  submitAttempt, 
  retryEvaluation,
  Problem, 
  Attempt 
} from './services/api';
import './styles/App.css';

const DEMO_USER_ID = 'cm7demouser00001';

export function App() {
  const [currentTab, setCurrentTab] = useState<'problems' | 'practice' | 'history'>('problems');
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<Attempt | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // User picks a problem -> fetch full details & start/retrieve draft attempt
  const handleSelectProblem = async (slug: string) => {
    setLoading(true);
    setError(null);
    try {
      const problem = await fetchProblemBySlug(slug);
      setActiveProblem(problem);

      // Start new attempt for this user & problem
      const newAttempt = await createAttempt(DEMO_USER_ID, problem.id);
      setActiveAttempt(newAttempt);
      setCurrentTab('practice');
    } catch (err: any) {
      setError(err.message || 'Error initializing practice attempt');
    } finally {
      setLoading(false);
    }
  };

  // User submits a solution content
  const handleSubmitSolution = async (content: string) => {
    if (!activeAttempt) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await submitAttempt(activeAttempt.id, content);
      setActiveAttempt(updated);
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // User clicks on a past attempt from History
  const handleSelectAttempt = async (attemptId: string) => {
    setLoading(true);
    setError(null);
    try {
      const attempt = await fetchAttempt(attemptId);
      setActiveAttempt(attempt);
      if (attempt.problem) {
        setActiveProblem(attempt.problem);
      }
      setCurrentTab('practice');
    } catch (err: any) {
      setError(err.message || 'Error loading attempt');
    } finally {
      setLoading(false);
    }
  };

  // User retries evaluation on a failed attempt
  const handleRetryEval = async (attemptId: string) => {
    try {
      await retryEvaluation(attemptId);
      const refreshed = await fetchAttempt(attemptId);
      setActiveAttempt(refreshed);
    } catch (err: any) {
      setError(err.message || 'Retry failed');
    }
  };

  // User triggers a fresh attempt on the currently active problem
  const handleNewAttemptForActiveProblem = async () => {
    if (!activeProblem) return;
    setLoading(true);
    try {
      const newAttempt = await createAttempt(DEMO_USER_ID, activeProblem.id);
      setActiveAttempt(newAttempt);
      setCurrentTab('practice');
    } catch (err: any) {
      setError(err.message || 'Failed to create new attempt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-root">
      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={(tab) => setCurrentTab(tab)}
        activeProblemTitle={activeProblem?.title}
        hasActiveAttempt={Boolean(activeAttempt)}
      />

      {/* Main Content Area */}
      <main className="app-main">
        <div className="app-container">
          {error && (
            <div className="app-error-banner">
              <span>{error}</span>
              <button 
                onClick={() => setError(null)}
                className="app-error-close"
              >
                ✕
              </button>
            </div>
          )}

          {loading ? (
            <div className="app-loading">
              <div className="animate-spin app-loading-spinner" />
              <p className="app-loading-text">Loading LLD Workspace...</p>
            </div>
          ) : (
            <>
              {currentTab === 'problems' && (
                <ProblemList onSelectProblem={handleSelectProblem} />
              )}

              {currentTab === 'practice' && activeProblem && activeAttempt && (
                <PracticeWorkspace
                  problem={activeProblem}
                  attempt={activeAttempt}
                  onSubmit={handleSubmitSolution}
                  onRetryEvaluation={handleRetryEval}
                  onNewAttempt={handleNewAttemptForActiveProblem}
                  submitting={submitting}
                />
              )}

              {currentTab === 'history' && (
                <AttemptHistory
                  userId={DEMO_USER_ID}
                  onSelectAttempt={handleSelectAttempt}
                  onSelectProblem={handleSelectProblem}
                />
              )}
            </>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <div className="app-container app-footer-content">
          <div>
            <p className="app-footer-title">
              LLD Practice & Evaluation Platform
            </p>
          </div>
          <div className="app-footer-subtitle">
            MVP Prototype • Low-Level Design Assessment
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
