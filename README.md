# LLD Practice Platform

A small web application that lets a learner pick a Low-Level Design problem, submit a written solution, and receive structured feedback combining rule-based checks with an AI review. The platform also keeps a history of past attempts so a learner can track improvement over repeated tries at the same problem.

This project was built as a 2-day engineering assignment. The focus is on the domain design and the evaluation approach rather than on scale, authentication, or a polished UI.

## Overview

Practicing Low-Level Design is easy to start but hard to self-evaluate. A learner can design a Parking Lot or a Vending Machine and still not know whether their classes, responsibilities, and relationships are actually sound. This project's MVP addresses that with a simple loop:

Choose a problem, write a design as text, submit it, receive feedback, review the feedback, and try again on a new attempt.

The submission format is plain text by design. This keeps both the checker logic and the frontend simple, while leaving room to support other formats (code, diagrams) later without changing the rest of the system.

## Tech Stack

- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Frontend: React
- Testing: Vitest, Supertest
- AI review: a direct fetch call to an external LLM endpoint (not an SDK), so the exact request and response can be inspected and controlled directly

## Project Structure

```
backend/
  prisma/
    schema.prisma
    seed.ts
  src/
    app.ts
    server.ts
    lib/
      prisma.ts
    routes/
      problem.routes.ts
      attempt.routes.ts
      evaluation.routes.ts
    controllers/
      problem.controller.ts
      attempt.controller.ts
      evaluation.controller.ts
    services/
      evaluation.ts
  tests/
    setup.ts
    structuralCheck.test.ts
    evaluation.test.ts
    attempts.test.ts
    evaluations.test.ts
frontend/
  (React application)
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- A running PostgreSQL instance
- npm

### Backend Setup

1. Install dependencies:
   ```
   cd backend
   npm install
   ```

2. Create a `.env` file in the `backend` directory (see [Environment Variables](#environment-variables) below).

3. Run migrations to create the database tables:
   ```
   npx prisma migrate dev
   ```

4. Generate the Prisma client:
   ```
   npx prisma generate
   ```

5. Seed the database with a demo user and sample problems:
   ```
   npx prisma db seed
   ```

6. Start the development server:
   ```
   npm run dev
   ```

   The backend runs on `http://localhost:3000` by default.

### Frontend Setup

1. Install dependencies:
   ```
   cd frontend
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the `backend` directory with the following:

```
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
AI_API_KEY=<your api key for the AI evaluation provider>
AI_API_URL=<the endpoint the evaluation service should call>
```

The exact variable names for the AI provider depend on which service is configured in `src/services/evaluation.ts`. Check that file for the specific keys it reads before running the app for the first time.

## Database Schema

The schema is intentionally split into small, single-responsibility models rather than one large table, so that each part of the practice loop can evolve independently.

- **User**: the learner. No authentication is implemented; a single demo user is created by the seed script rather than through a signup flow, since user management is outside the scope of this assignment.
- **Problem**: an LLD exercise, with a title, requirements, difficulty, and a set of evaluation criteria.
- **EvaluationCriterion**: a single named check tied to a Problem (for example, "Vehicle abstraction"), with a description and a weight used for scoring.
- **PracticeAttempt**: one practice run of one Problem by one User. Its status moves through DRAFT, SUBMITTED, EVALUATING, and a terminal state of COMPLETED or FAILED. Starting a new attempt (rather than editing an old one) is how "try again" is represented, which is also what makes attempt history straightforward.
- **Submission**: the learner's text content for one Attempt. Kept as a separate model from Attempt so that a different submission format could be introduced later without reshaping Attempt itself.
- **Evaluation**: the feedback result for an Attempt, holding both a structural (deterministic) score and feedback and an AI score and feedback, plus an overall combined score. A status and an error message allow evaluation failures to be represented and retried without requiring the learner to resubmit.

## The Practice Loop

1. The learner requests the list of problems and picks one.
2. The learner starts an attempt for that problem.
3. The learner writes a text-based design and submits it.
4. The backend runs a deterministic structural check and an AI-based review, and combines them into a single evaluation.
5. The learner views the resulting feedback, broken down by individual criteria.
6. The learner can view their history of past attempts on that problem.
7. The learner can start a new attempt to try again, or retry evaluation on a failed attempt without resubmitting.

## API Routes

### Problems

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/problems` | List all problems, with basic details for the picker screen. |
| GET | `/problems/:slug` | Full detail for one problem, including requirements and evaluation criteria. |

### Attempts

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/attempts` | Start a new attempt. Body: `{ userId, problemId }`. |
| GET | `/attempts/:id` | Fetch one attempt, including its submission and evaluation if present. |
| POST | `/attempts/:id/submission` | Submit text content for an attempt. Body: `{ content }`. Triggers evaluation. Rejects a second submission on the same attempt. |
| GET | `/attempts/history/:userId/:problemId` | List all past attempts by a user on a given problem, most recent first. |

### Evaluations

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/evaluations/:attemptId` | Fetch the evaluation for an attempt. |
| POST | `/evaluations/:attemptId/retry` | Re-run evaluation on the existing submission. Only allowed when the current evaluation status is FAILED. |

## Evaluation Approach

Feedback is produced by two independent checks that are combined into one evaluation record:

**Structural (deterministic) check.** A plain function compares the submission text against the keywords in each problem's evaluation criteria. This runs entirely in code, with no external calls, and produces a pass or fail with an explanation for each criterion. It is fast, free, and predictable, which makes it a reasonable first layer of feedback.

**AI check.** The submission and the problem's requirements are sent to an LLM with a prompt asking for a structured JSON response matching the same criterion shape as the structural check. This allows the two checks to be combined and compared directly.

**Combining the two.** When both checks succeed, the overall score is the average of the structural and AI scores. If the AI call fails, times out, or returns output that cannot be parsed as valid JSON, the evaluation does not fail outright. It falls back to the structural result alone, and the evaluation still completes, so a temporary problem with the AI provider does not block the learner from getting some feedback.

**Handling genuine failures.** If evaluation cannot complete at all (for example, the attempt has no submission), the Evaluation and the Attempt are both marked FAILED with an error message. The learner can then call the retry route to re-run evaluation on the same submission, without needing to write and submit their design again.

This design keeps the deterministic and AI checks interchangeable at the code level: adding a third evaluation source later would mean writing one function that returns the same `{ score, results }` shape and calling it alongside the existing two, rather than restructuring the evaluation flow.

## Testing

Tests are written with Vitest and Supertest, and are split by what they exercise:

- `tests/unit/structuralCheck.test.ts`: the deterministic checker in isolation, with no database or network dependency.
- `tests/unit/evaluation.test.ts`: the evaluation orchestration logic, with the AI call mocked, covering a successful run, an AI failure that falls back to structural-only, malformed AI output, and a hard failure with no submission.
- `tests/integration/attempts.test.ts`: the attempt routes end to end, including rejecting a second submission and rejecting an attempt on a nonexistent problem.
- `tests/integration/evaluations.test.ts`: the evaluation routes end to end, including the rule that only a FAILED evaluation can be retried.
- `tests/setup.ts`: shared helpers for creating and cleaning up throwaway test data, so tests do not depend on or pollute the seeded demo data.

Run the full suite with:

```
npm test
```

Tests should be run against a separate test database, not the same database used for local development, since the integration tests create and delete real rows.

## Seeding Data

The seed script creates one demo user and two sample problems, Parking Lot and Vending Machine, each with a small set of weighted evaluation criteria. Run it with:

```
npx prisma db seed
```

It is safe to run more than once. Users and problems are upserted by a unique key, and each problem's criteria are cleared and recreated on every run, so adjusting a criterion's wording only requires re-running the seed rather than manually editing the database.

## Deployment

The backend can be deployed to a standard Node hosting platform such as Render. A typical configuration is:

Build command:
```
npm install && npx prisma generate && npx prisma migrate deploy
```

Start command:
```
npm start
```

The database URL and any AI provider credentials should be set as environment variables in the hosting platform's dashboard rather than committed to the repository.

## Known Limitations

- There is no authentication. A single demo user is used throughout, which is appropriate for this assignment's scope but would need to be addressed before any real multi-user use.
- Submissions are plain text only. Code and diagram formats are not implemented, though the schema and evaluation flow were designed to accommodate them later.
- Evaluation runs synchronously as part of the submit request. This is acceptable for text-based submissions at this scale, but a queued or background evaluation process would be a more robust approach at higher volume or with slower evaluators.
- The structural checker uses simple keyword matching rather than deeper analysis of the submission. It is meant as a fast, explainable first layer of feedback rather than a full static analysis.

## Possible Extensions

- Support additional submission formats (code, diagrams) by adding a format field and a corresponding checker, without needing to change the Attempt or Evaluation models.
- Move evaluation to a background job queue so submission and feedback are decoupled, particularly if AI evaluation becomes slower or less reliable at scale.
- Add authentication and per-user accounts.
- Expand the structural checker beyond keyword matching, for example by checking for specific class or interface patterns in code-based submissions.
