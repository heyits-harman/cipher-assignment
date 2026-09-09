import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app";

describe("Authentication", () => {

    it("should login successfully", async () => {

        const response = await request(app)
            .post("/users/login")
            .send({
                email: "admin@example.com",
                password: "admin123"
            });

        expect(response.status).toBe(200);

        expect(response.body).toHaveProperty("token");
    });

});