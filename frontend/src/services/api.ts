const API_BASE = '/api';

export interface Criterion {
  id: string;
  name: string;
  description: string;
  weight: number;
}

export interface ProblemRequirements {
  overview?: string;
  mustHandle?: string[];
  [key: string]: any;
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  requirements?: ProblemRequirements;
  evaluationCriteria?: Criterion[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Submission {
  id: string;
  attemptId: string;
  content: string;
  createdAt: string;
}

export interface CriterionFeedback {
  criterionId: string;
  name: string;
  passed: boolean;
  message: string;
}

export interface Evaluation {
  id: string;
  attemptId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  overallScore: number | null;
  structuralScore: number | null;
  structuralFeedback: CriterionFeedback[] | null;
  aiScore: number | null;
  aiFeedback: CriterionFeedback[] | null;
  finalFeedback: {
    structural: CriterionFeedback[];
    ai: CriterionFeedback[];
  } | null;
  evaluatorType: 'STRUCTURAL' | 'AI' | 'HYBRID';
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface Attempt {
  id: string;
  userId: string;
  problemId: string;
  status: 'DRAFT' | 'SUBMITTED' | 'EVALUATING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  submittedAt?: string | null;
  completedAt?: string | null;
  submission?: Submission | null;
  evaluation?: Evaluation | null;
  problem?: Problem;
}

export async function fetchProblems(): Promise<Problem[]> {
  const res = await fetch(`${API_BASE}/problems`);
  if (!res.ok) throw new Error('Failed to fetch problems');
  const data = await res.json();
  return data.problems || [];
}

export async function fetchProblemBySlug(slug: string): Promise<Problem> {
  const res = await fetch(`${API_BASE}/problems/${slug}`);
  if (!res.ok) throw new Error('Failed to fetch problem details');
  const data = await res.json();
  return data.problem;
}

export async function createAttempt(userId: string, problemId: string): Promise<Attempt> {
  const res = await fetch(`${API_BASE}/attempts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, problemId }),
  });
  if (!res.ok) throw new Error('Failed to create practice attempt');
  const data = await res.json();
  return data.attempt;
}

export async function fetchAttempt(id: string): Promise<Attempt> {
  const res = await fetch(`${API_BASE}/attempts/${id}`);
  if (!res.ok) throw new Error('Failed to fetch attempt');
  const data = await res.json();
  return data.attempt;
}

export async function submitAttempt(id: string, content: string): Promise<Attempt> {
  const res = await fetch(`${API_BASE}/attempts/${id}/submission`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('Failed to submit attempt');
  const data = await res.json();
  return data.result;
}

export async function fetchAttemptHistory(userId: string, problemId: string): Promise<Attempt[]> {
  const res = await fetch(`${API_BASE}/attempts/history/${userId}/${problemId}`);
  if (!res.ok) throw new Error('Failed to fetch attempt history');
  const data = await res.json();
  return data;
}

export async function retryEvaluation(attemptId: string): Promise<Evaluation> {
  const res = await fetch(`${API_BASE}/evaluations/${attemptId}/retry`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to retry evaluation');
  const data = await res.json();
  return data.updated;
}
