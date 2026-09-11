# AI Usage

I used Claude throughout this project — mainly for planning, getting past decision fatigue on structure, generating boilerplate I then edited, and debugging a couple of gnarly errors. Below are the decisions that actually mattered, what I accepted, what I changed or rejected, and why.

## 1. Data model for Attempt / Submission / Evaluation

I went in with a rough idea (problems, submissions, feedback) but not a clean way to split responsibilities. Claude proposed separating `Attempt` (the practice run and its status), `Submission` (the actual content), and `Evaluation` (the feedback result) into three models instead of cramming everything onto one Attempt row. I kept that split — it made the "try again" flow trivial, since a new attempt is just a new row rather than an edit to an old one.

Where I diverged: Claude's first version had submissions storing structured `classes`/`relationships` JSON, essentially a mini diagram format. I decided early on to keep submissions as plain text instead — it's a much smaller surface to build a UI and a checker for in two days, and the assignment doesn't require the diagram format specifically. I also simplified the Evaluation model — Claude suggested two separate Evaluation rows per attempt (one deterministic, one AI), but I merged them into a single row with separate score/feedback columns for each source. One row per attempt was easier to reason about for my scope, even though it's slightly less extensible if I ever add a third evaluation type.

## 2. Boilerplate for routes and controllers

Once the schema was settled, I had Claude generate the first pass of the Express routes and controllers for problems, attempts, and evaluations. This saved a fair amount of typing on repetitive CRUD-shaped code (params validation, 404s, try/catch blocks), but I went through each one and adjusted the actual logic — for example, adding the guard that rejects a second submission on an already-submitted attempt, and the check that only lets a retry happen on a `FAILED` evaluation rather than any status. Those two rules came from me thinking through what "try again" should actually mean for this product, not from the initial generated code.

## 3. Debugging a stuck evaluation state

I hit a bug where submitting an attempt threw a 500, and the attempt got stuck in `EVALUATING` in the database instead of moving to `FAILED`. I pasted the stack trace and my evaluation service code to Claude, and it traced the actual cause: I was calling `prisma.evaluation.update()` on a row that had never been created yet, because I'd never added an `evaluation.create()` or `upsert()` step earlier in the flow. The fix (switching both the success-path and failure-path writes to `upsert`) was straightforward once the root cause was clear, but I'd been staring at the wrong end of the trace — I initially assumed the frontend polling was somehow writing to the attempt, which turned out to be wrong. That's a debugging habit I'll watch for next time: check what a route actually does before assuming it's the cause.

## 4. Switching off the AI SDK after a 404

My first version of the AI evaluator used an SDK client pointed at a third-party inference provider, and it kept failing with a 404 on the chat completions call. Claude helped narrow it down to a bad model name/endpoint mismatch rather than a code bug, and I ended up rewriting that part as a plain `fetch` call instead of relying on the SDK, since it gave me more visibility into exactly what was being sent and made it easier to confirm the request shape myself. The fallback behavior — if the AI call fails or returns malformed JSON, fall back to structural-only feedback rather than failing the whole evaluation — was a decision I made deliberately for the assignment's "what if evaluation fails" question, and I had Claude help me implement it cleanly with a nested try/catch rather than let one bad AI response take down the whole request.

## 5. Initial UI structure

For the frontend, I had Claude scaffold the basic screen structure — problem list, attempt screen, feedback view, history view — as a starting layout so I wasn't staring at a blank App.tsx. I rebuilt the actual components and styling myself and changed how state flows between the submit action and the feedback view, but the initial scaffold was a useful starting point rather than something I had to fight against.

## Overall

AI was most useful here as a thinking partner for structure and a fast way to generate first-draft code I could then critique and rewrite, plus a second pair of eyes for tracing bugs. The actual product decisions — text-only submissions, the resubmission and retry rules, the AI-failure fallback behavior, and the final data model shape — were mine; I used AI suggestions as a starting point and changed a fair amount of what it first proposed.