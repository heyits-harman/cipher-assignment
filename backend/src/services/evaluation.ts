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

export function runStructuralCheck(
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
    You are a Staff Software Engineer evaluating a learner's Low-Level Design (LLD) submission.

    ### Task Context
    Problem Title: ${problem.title}
    Problem Requirements: ${JSON.stringify(problem.requirements)}

    ### Learner Submission:
    """
    ${content}
    """

    ### Evaluation Criteria:
    ${criteria.map((c) => `- Criterion [${c.id}]: ${c.name}\n  Description: ${c.description}`).join("\n")}

    ### Instructions & Persona:
    1. Focus strictly on Low-Level Design principles: class/interface design, single responsibility (SRP), encapsulation, design patterns, extensibility, and domain relationships.
    2. Be objective, precise, and practical. Do not praise superficial aspects if key structural abstractions or responsibilities are missing.
    3. For every failed criterion, provide constructive, actionable guidance on how to fix the design rather than just stating what is wrong.

    ### Strict Output Format:
    Respond ONLY with a valid JSON object matching this exact shape:
    {
      "results": [
        ${criteria.map((c) => `{ "criterionId": "${c.id}", "passed": true, "message": "Clear explanation." }`).join(",\n        ")}
      ]
    }

    Constraint Checklist:
    - The "results" array MUST contain exactly ${criteria.length} items.
    - Match each "criterionId" exactly to the provided criteria IDs: [${criteria.map((c) => `"${c.id}"`).join(", ")}].
    - Do not add extra conversational text or markdown code blocks.
  `.trim();

  // 1. LLM Calling
  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      model: "meta/llama-3.2-11b-vision-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.2,
      reasoning_effort: "high",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`NVIDIA API Error Status ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content ?? "";

  if (!rawText) {
    throw new Error("AI returned an empty response.");
  }

  // 2. Clean reasoning tags (<think>...</think>) and markdown backticks
  const cleanedText = rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```json|```/g, "")
    .trim();

  const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
  const finalJsonString = jsonMatch ? jsonMatch[0] : cleanedText;

  let parsed: { results: { criterionId: string; passed: boolean; message: string }[] };
  try {
    parsed = JSON.parse(finalJsonString);
  } catch (err) {
    console.error("Raw AI Response:", rawText);
    throw new Error("AI response was not valid JSON");
  }

  // 3. Map back to Criterion result types
  const results: CriterionResult[] = parsed.results.map((r) => {
    const criterion = criteria.find((c) => c.id === r.criterionId);
    return {
      criterionId: r.criterionId,
      name: criterion?.name ?? "Unknown criterion",
      passed: Boolean(r.passed),
      message: r.message ?? "",
    };
  });

  // 4. Calculate score
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

    await prisma.evaluation.upsert({
      where: { attemptId },
      create: {
        attemptId,
        status: "COMPLETED",
        structuralScore: structural.score,
        structuralFeedback: JSON.parse(JSON.stringify(structural.results)),
        aiScore: ai.results.length > 0 ? ai.score : null,
        aiFeedback: ai.results.length > 0 ? JSON.parse(JSON.stringify(ai.results)) : null,
        overallScore,
        finalFeedback: JSON.parse(JSON.stringify({ structural: structural.results, ai: ai.results })),
        completedAt: new Date(),
      },
      update: {
        status: "COMPLETED",
        structuralScore: structural.score,
        structuralFeedback: JSON.parse(JSON.stringify(structural.results)),
        aiScore: ai.results.length > 0 ? ai.score : null,
        aiFeedback: ai.results.length > 0 ? JSON.parse(JSON.stringify(ai.results)) : null,
        overallScore,
        finalFeedback: JSON.parse(JSON.stringify({ structural: structural.results, ai: ai.results })),
        completedAt: new Date(),
      },
    });

    await prisma.practiceAttempt.update({
      where: { id: attemptId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });

  } catch(err: any){
    console.error("Evaluation failed:", err);

    await prisma.evaluation.upsert({
      where: { attemptId },
      create: {
        attemptId,
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "Unknown evaluation error",
      },
      update: {
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