import { prisma } from "../../lib/prisma";

interface CriterionResult {
  criterionId: string;
  name: string;
  passed: boolean;
  message: string;
}

interface Criterion {
  id: string;
  name: string;
  description: string;
  weight: number;
}

interface StructureCheckResult {
  score: number;
  results: CriterionResult[];
}

interface ProblemPayload {
  title: string;
  requirements: unknown;
}

function runStructuralCheck(
  content: string,
  criteria: Criterion[]
): StructureCheckResult {

  const text = content.toLowerCase();

  const results: CriterionResult[] = criteria.map((criterion: Criterion): CriterionResult => {

    const keywords: string[] = criterion.name
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3);

    const mentioned: string[] = keywords.filter((word: string): boolean => text.includes(word));
    const passed: boolean = keywords.length > 0 && mentioned.length / keywords.length >= 0.5;

    return {
      criterionId: criterion.id,
      name: criterion.name,
      passed,
      message: passed
        ? `Mentions the key ideas behind "${criterion.name}".`
        : `Doesn't clearly address "${criterion.name}" — ${criterion.description}`,
    }
  })
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0) || 1;
  const earnedWeight = results.reduce((sum, r, i) => sum + (r.passed ? (criteria[i]?.weight ?? 0) : 0), 0);
  const score = Math.round((earnedWeight / totalWeight) * 100);

  return { score, results };
}

async function runAICheck(
  problem: ProblemPayload,
  content: string,
  criteria: Criterion[]
): Promise<{ score: number; results: CriterionResult[] }> {

  const prompt = `
    You are reviewing a learner's Low-Level Design solution.

    Problem: ${problem.title}
    Requirements: ${JSON.stringify(problem.requirements)}

    Learner's submission:
    """
    ${content}
    """

    Evaluate against these criteria:
    ${criteria.map((c) => `- ${c.name}: ${c.description}`).join("\n")}

    Respond with ONLY valid JSON, no other text, in this exact shape:
    {
      "results": [
        { "criterionId": "string", "passed": boolean, "message": "short explanation" }
      ]
    }
    Use these exact criterionId values: ${criteria.map((c) => c.id).join(", ")}
    `.trim()
  ;

  //Calling LLM
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI request failed with status ${response.status}`);
  }

  //response cleanup
  const data = await response.json();
  const rawText = data.content?.[0]?.text ?? "";
  const cleaned = rawText.replace(/```json|```/g, "").trim();

  let parsed: { results: { criterionId: string; passed: boolean; message: string }[] };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI response was not valid JSON");
  }

  const results: CriterionResult[] = parsed.results.map((r) => {
    const criterion = criteria.find((c) => c.id === r.criterionId);
    return {
      criterionId: r.criterionId,
      name: criterion?.name ?? "Unknown criterion",
      passed: r.passed,
      message: r.message,
    };
  });

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0) || 1;
  const earnedWeight = results.reduce((sum, r) => {
    const criterion = criteria.find((c) => c.id === r.criterionId);
    return sum + (r.passed && criterion ? criterion.weight : 0);
  }, 0);
  const score = Math.round((earnedWeight / totalWeight) * 100);

  return { score, results };

}

export async function runEvaluation(attemptId: string) {

  const attempt = await prisma.practiceAttempt.findUnique({
    where: { id: attemptId },
    include: { submission: true, problem: { include: { evaluationCriteria: true } } },
  });

  if (!attempt || !attempt.submission) {
    throw new Error("Cannot evaluate an attempt with no submission");
  }

  await prisma.practiceAttempt.update({
    where: { id: attemptId },
    data: { status: "EVALUATING" },
  });

  await prisma.practiceAttempt.update({
    where: { id: attemptId },
    data: { status: "EVALUATING" },
  });

  const { content } = attempt.submission;
  const criteria = attempt.problem.evaluationCriteria;

  try{

    const structural = runStructuralCheck(content, criteria);

    let ai: { score: number; results: CriterionResult[] };

    try{
      ai = await runAICheck(attempt.problem, content, criteria);
    } catch (aiErr: any) {
      //AI failure doesn't kill the whole evaluation, It falls to structural only feeback in that case with a note
      console.error("AI check failed, falling back to structural only:", aiErr);
      ai = { score: structural.score, results: [] };
    }

    const overallScore = ai.results.length > 0
      ? Math.round((structural.score + ai.score) / 2)
      : structural.score;

    await prisma.evaluation.update({
      where: { attemptId },
      data: {
        status: "COMPLETED",
        structuralScore: structural.score,
        structuralFeedback: JSON.parse(JSON.stringify(structural.results)),
        aiScore: ai.results.length > 0 ? ai.score : null,
        aiFeedback: ai.results.length > 0 
          ? JSON.parse(JSON.stringify(ai.results)) 
          : null,
        overallScore,
        finalFeedback: JSON.parse(JSON.stringify({
          structural: structural.results,
          ai: ai.results,
        })),
        completedAt: new Date(),
      }
    });

    await prisma.practiceAttempt.update({
      where: { id: attemptId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

  } catch(err: any){
    console.error("Evaluation failed:", err);

    await prisma.evaluation.update({
      where: { attemptId },
      data: {
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "Unknown evaluation error",
      },
    });

    await prisma.practiceAttempt.update({
      where: { id: attemptId },
      data: { status: "FAILED" },
    });
  }

}

// Re-runs evaluation on an already-submitted attempt, used by the retry route.
export async function retryEvaluation(attemptId: string) {
  const attempt = await prisma.practiceAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) throw new Error("Attempt not found");
  if (!attempt.submittedAt) throw new Error("Attempt has no submission to evaluate");

  await runEvaluation(attemptId);
}