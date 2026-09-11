import { prisma } from "../lib/prisma";

export async function createTestUser() {
  return prisma.user.create({
    data: {
      email: `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      name: "Test User",
    },
  });
}

export async function createTestProblem() {
  return prisma.problem.create({
    data: {
      title: "Test Problem",
      slug: `test-problem-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      description: "A problem for testing.",
      difficulty: "EASY",
      requirements: { overview: "test", mustHandle: ["a", "b"] },
      evaluationCriteria: {
        create: [
          { name: "Vehicle abstraction", description: "Uses an interface.", weight: 3 },
          { name: "Payment decoupling", description: "Separates payment.", weight: 2 },
        ],
      },
    },
    include: { evaluationCriteria: true },
  });
}

export async function cleanupTestData(userId: string, problemId: string) {
  await prisma.evaluation.deleteMany({ where: { attempt: { userId, problemId } } });
  await prisma.submission.deleteMany({ where: { attempt: { userId, problemId } } });
  await prisma.practiceAttempt.deleteMany({ where: { userId, problemId } });
  await prisma.evaluationCriterion.deleteMany({ where: { problemId } });
  await prisma.problem.delete({ where: { id: problemId } }).catch(() => {});
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
}