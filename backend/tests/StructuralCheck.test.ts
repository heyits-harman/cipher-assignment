import { describe, it, expect } from "vitest";
import { runStructuralCheck } from "../src/services/evaluation";

const criteria = [
  { id: "c1", name: "Vehicle abstraction", description: "Uses a shared interface for vehicle types.", weight: 3 },
  { id: "c2", name: "Payment decoupling", description: "Payment logic is separate from spot management.", weight: 2 },
];

describe("runStructuralCheck", () => {
  it("passes criteria whose keywords are present in the content", () => {
    const content =
      "I designed a Vehicle interface with Car and Bike classes. Payment is handled by a separate PaymentProcessor.";
    const { score, results } = runStructuralCheck(content, criteria);

    expect(results.find((r) => r.criterionId === "c1")?.passed).toBe(true);
    expect(results.find((r) => r.criterionId === "c2")?.passed).toBe(true);
    expect(score).toBe(100);
  });

  it("fails criteria whose keywords are missing from the content", () => {
    const content = "I built a parking lot with spots and gates.";
    const { score, results } = runStructuralCheck(content, criteria);

    expect(results.find((r) => r.criterionId === "c1")?.passed).toBe(false);
    expect(results.find((r) => r.criterionId === "c2")?.passed).toBe(false);
    expect(score).toBe(0);
  });

  it("handles empty content without throwing", () => {
    const { score, results } = runStructuralCheck("", criteria);

    expect(results).toHaveLength(criteria.length);
    expect(results.every((r) => r.passed === false)).toBe(true);
    expect(score).toBe(0);
  });

  it("handles a problem with zero criteria without dividing by zero", () => {
    const { score, results } = runStructuralCheck("some content", []);

    expect(results).toEqual([]);
    expect(score).toBe(0);
  });
});