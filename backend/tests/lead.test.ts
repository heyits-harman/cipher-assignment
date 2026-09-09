import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import app from "../src/app";

describe("Leads API", () => {
  let adminToken = "";
  let memberToken = "";
  let leadId = "";

  // 1. Log in both Admin and Member before running lead tests
  beforeAll(async () => {
    const adminRes = await request(app)
      .post("/users/login")
      .send({
        email: "admin@example.com",
        password: "admin123",
      });
    adminToken = adminRes.body.token;

    const memberRes = await request(app)
      .post("/users/login")
      .send({
        email: "member1@example.com",
        password: "member123",
      });
    memberToken = memberRes.body.token;
  });

  // Test 1: Create a Lead
  it("should create a lead", async () => {
    const res = await request(app)
      .post("/leads/create")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test Corp",
        email: "contact@testcorp.com",
        company: "Test Corp Inc",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    leadId = res.body.id; // Save created lead ID for subsequent tests
  });

  // Test 2: Fetch Leads
  it("should fetch all leads", async () => {
    const res = await request(app)
      .get("/leads/get")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // Test 3: Member Authorization Check (Member cannot delete lead)
  it("should not allow a regular member to delete a lead", async () => {
    const res = await request(app)
      .delete(`/leads/delete/${leadId}`)
      .set("Authorization", `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
  });

  // Test 4: Admin Authorization Check (Admin can delete lead)
  it("should allow an admin to delete a lead", async () => {
    const res = await request(app)
      .delete(`/leads/delete/${leadId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});