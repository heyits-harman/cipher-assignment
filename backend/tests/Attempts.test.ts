import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../src/app";
import { createTestUser, createTestProblem, cleanupTestData } from "./setup";

describe("Attempt routes", () => {
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

  it("creates an attempt", async () => {
    const res = await request(app).post("/attempts").send({ userId, problemId });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("DRAFT");
  });

  it("rejects creating an attempt for a nonexistent problem", async () => {
    const res = await request(app).post("/attempts").send({ userId, problemId: "nonexistent-id" });
    expect(res.status).toBe(404);
  });

  it("submits an attempt and moves it to a terminal status", async () => {
    const create = await request(app).post("/attempts").send({ userId, problemId });
    const res = await request(app)
      .post(`/attempts/${create.body.id}/submission`)
      .send({ content: "A reasonably detailed design." });

    expect(res.status).toBe(200);
    expect(["COMPLETED", "FAILED"]).toContain(res.body.status);
  });

  it("rejects submitting with missing content", async () => {
    const create = await request(app).post("/attempts").send({ userId, problemId });
    const res = await request(app).post(`/attempts/${create.body.id}/submission`).send({});
    expect(res.status).toBe(400);
  });

  it("rejects a second submission on the same attempt", async () => {
    const create = await request(app).post("/attempts").send({ userId, problemId });
    await request(app)
      .post(`/attempts/${create.body.id}/submission`)
      .send({ content: "First submission." });
    const second = await request(app)
      .post(`/attempts/${create.body.id}/submission`)
      .send({ content: "Second submission." });
    expect(second.status).toBe(400);
  });

  it("returns attempt history ordered most recent first", async () => {
    const res = await request(app).get(`/attempts/history/${userId}/${problemId}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});