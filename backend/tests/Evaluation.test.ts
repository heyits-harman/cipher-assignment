import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prisma } from "../lib/prisma";
import { runEvaluation } from "../src/services/evaluation";
import { createTestUser, createTestProblem, cleanupTestData } from "./setup";

describe("runEvaluation", () => {
  let userId: string;
  let problemId: string;
  let criteria: { id: string }[];

  beforeEach(async () => {
    const user = await createTestUser();
    const problem = await createTestProblem();
    userId = user.id;
    problemId = problem.id;
    criteria = problem.evaluationCriteria;
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    await cleanupTestData(userId, problemId);
    vi.unstubAllGlobals();
  });

  async function createSubmittedAttempt(content: string) {
    const attempt = await prisma.practiceAttempt.create({
      data: { userId, problemId, status: "SUBMITTED", submittedAt: new Date() },
    });
    await prisma.submission.create({ data: { attemptId: attempt.id, content } });
    return attempt.id;
  }

  it("completes with combined scores when the AI call succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  results: criteria.map((c) => ({
                    criterionId: c.id,
                    passed: true,
                    message: "Looks good.",
                  })),
                }),
              },
            },
          ],
        }),
      })
    );

    const attemptId = await createSubmittedAttempt(
      "A design mentioning vehicle abstraction and payment decoupling."
    );
    await runEvaluation(attemptId);

    const evaluation = await prisma.evaluation.findUnique({ where: { attemptId } });
    const attempt = await prisma.practiceAttempt.findUnique({ where: { id: attemptId } });

    expect(evaluation?.status).toBe("COMPLETED");
    expect(evaluation?.aiScore).not.toBeNull();
    expect(attempt?.status).toBe("COMPLETED");
  });

  it("falls back to structural-only when the AI request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    const attemptId = await createSubmittedAttempt("Some content without much detail.");
    await runEvaluation(attemptId);

    const evaluation = await prisma.evaluation.findUnique({ where: { attemptId } });

    expect(evaluation?.status).toBe("COMPLETED");
    expect(evaluation?.aiScore).toBeNull();
    expect(evaluation?.structuralScore).not.toBeNull();
  });

  it("falls back to structural-only when the AI returns malformed JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "not valid json {{{" } }],
        }),
      })
    );

    const attemptId = await createSubmittedAttempt("Some content.");
    await runEvaluation(attemptId);

    const evaluation = await prisma.evaluation.findUnique({ where: { attemptId } });

    expect(evaluation?.status).toBe("COMPLETED");
    expect(evaluation?.aiScore).toBeNull();
  });

  it("throws when there is no submission to evaluate", async () => {
    const attempt = await prisma.practiceAttempt.create({
      data: { userId, problemId, status: "SUBMITTED", submittedAt: new Date() },
    });

    await expect(runEvaluation(attempt.id)).rejects.toThrow(
      "Cannot evaluate an attempt with no submission"
    );
  });
});