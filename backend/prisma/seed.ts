import { prisma } from "../lib/prisma";

async function main() {
  console.log("🌱 Seeding database...");

  // Demo user — no auth in this project, so we seed one directly
  // instead of exposing a signup route (see earlier decision to drop /users)
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      id: "cm7demouser00001",
      email: "demo@example.com",
      name: "Demo Learner",
    },
  });
  console.log(`✅ Demo user ready: ${demoUser.id}`);

  // Clear old criteria so re-running the seed doesn't duplicate them
  await prisma.evaluationCriterion.deleteMany({});

  // --- Problem 1: Parking Lot ---
  const parkingLot = await prisma.problem.upsert({
    where: { slug: "parking-lot" },
    update: {},
    create: {
      title: "Parking Lot",
      slug: "parking-lot",
      description: "Design a parking lot system that supports multiple vehicle types and tracks spot availability.",
      difficulty: "MEDIUM",
      requirements: {
        overview:
          "Design a parking lot with multiple floors, multiple spot sizes, and multiple vehicle types (motorcycle, car, bus).",
        mustHandle: [
          "Assigning a vehicle to a suitable spot based on size",
          "Rejecting entry when the lot is full",
          "Calculating a parking fee based on duration",
          "Supporting more than one entry/exit gate",
        ],
      },
      evaluationCriteria: {
        create: [
          {
            name: "Vehicle abstraction",
            description: "Distinct vehicle types are represented with a shared abstraction (interface/base class), not hardcoded if/else on type.",
            weight: 3,
          },
          {
            name: "Spot allocation strategy",
            description: "Spot assignment logic is separated from the parking lot itself, so the strategy could be swapped later.",
            weight: 3,
          },
          {
            name: "Full lot handling",
            description: "The design explicitly handles the no-available-spot case rather than ignoring it.",
            weight: 2,
          },
          {
            name: "Payment decoupling",
            description: "Fee calculation/payment is a separate responsibility from spot management.",
            weight: 2,
          },
        ],
      },
    },
  });
  console.log(`✅ Problem ready: ${parkingLot.slug}`);

  // --- Problem 2: Vending Machine ---
  const vendingMachine = await prisma.problem.upsert({
    where: { slug: "vending-machine" },
    update: {},
    create: {
      title: "Vending Machine",
      slug: "vending-machine",
      description: "Design a vending machine that accepts payment, dispenses items, and handles change and out-of-stock cases.",
      difficulty: "EASY",
      requirements: {
        overview:
          "Design a vending machine that sells multiple products, accepts cash and card, and returns change.",
        mustHandle: [
          "Selecting a product and checking stock",
          "Accepting payment and calculating change",
          "Handling insufficient payment",
          "Restocking items",
        ],
      },
      evaluationCriteria: {
        create: [
          {
            name: "State machine",
            description: "The machine's behavior is modeled as explicit states (idle, selecting, paying, dispensing) rather than scattered flags.",
            weight: 3,
          },
          {
            name: "Payment strategy",
            description: "Different payment methods (cash, card) are handled through a shared interface, not duplicated logic per type.",
            weight: 3,
          },
          {
            name: "Stock handling",
            description: "Out-of-stock and insufficient-payment cases are explicitly handled, not left implicit.",
            weight: 2,
          },
          {
            name: "Inventory responsibility",
            description: "Inventory/stock tracking is a separate responsibility from the machine's state logic.",
            weight: 2,
          },
        ],
      },
    },
  });
  console.log(`✅ Problem ready: ${vendingMachine.slug}`);

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });