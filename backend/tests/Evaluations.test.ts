import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../src/app";
import { prisma } from "../lib/prisma";
import { createTestUser, createTestProblem, cleanupTestData } from "./setup";

describe("Evaluation routes", () => {
  let userId: string;
  let problemId: string;

  beforeAll(async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ results: [] }) } }],
        }),
      })
    );

    const user = await createTestUser();
    const problem = await createTestProblem();
    userId = user.id;
    problemId = problem.id;
  });

  afterAll(async () => {
    await cleanupTestData(userId, problemId);
    vi.unstubAllGlobals();
  });

  it("returns 404 for an attempt that hasn't submitted yet", async () => {
    const create = await request(app).post("/attempts").send({ userId, problemId });
    const res = await request(app).get(`/evaluations/${create.body.id}`);
    expect(res.status).toBe(404);
  });

  it("returns the evaluation after a successful submission", async () => {
    const create = await request(app).post("/attempts").send({ userId, problemId });
    await request(app)
      .post(`/attempts/${create.body.id}/submission`)
      .send({ content: "Some design content." });

    const res = await request(app).get(`/evaluations/${create.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.attemptId).toBe(create.body.id);
  });

  it("rejects retry on a COMPLETED evaluation", async () => {
    const create = await request(app).post("/attempts").send({ userId, problemId });
    await request(app)
      .post(`/attempts/${create.body.id}/submission`)
      .send({ content: "Some design content." });

    const evaluation = await prisma.evaluation.findUnique({ where: { attemptId: create.body.id } });
    if (evaluation?.status === "COMPLETED") {
      const res = await request(app).post(`/evaluations/${create.body.id}/retry`);
      expect(res.status).toBe(400);
    }
  });

  it("allows retry on a FAILED evaluation and it resolves to a terminal status", async () => {
    const create = await request(app).post("/attempts").send({ userId, problemId });
    const attemptId = create.body.id;

    await prisma.submission.create({ data: { attemptId, content: "Retry test content." } });
    await prisma.practiceAttempt.update({
      where: { id: attemptId },
      data: { status: "SUBMITTED", submittedAt: new Date() },
    });
    await prisma.evaluation.create({
      data: { attemptId, status: "FAILED", errorMessage: "Forced for test" },
    });

    const res = await request(app).post(`/evaluations/${attemptId}/retry`);
    expect(res.status).toBe(200);
    expect(["COMPLETED", "FAILED"]).toContain(res.body.status);
  });
});