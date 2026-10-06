# AI interaction log

Date: 2026-10-06 (Asia/Bangkok).

## Important prompt (user text)

```text
You are helping me prepare the FIRST VERSION of my individual midterm practical lab API.

Before changing or creating code, read these two files in the project root carefully:

- `exam_brief_en.md`
- `rubric_en.md`

Treat those files as the source of truth. Do not replace the required contract with your own API design.

The course stack is TypeScript + Hono + local SQLite/D1, using the instructor-style starter project structure. If this folder already contains starter code, inspect it first and preserve its structure and tooling instead of rebuilding the project from scratch.

I am currently working on the PRE-QUALITY-GATE version only. Do not invent or complete the later Quality Gate review because the instructor has not provided the Quality Gate yet.

Build the simplest clear, working implementation that satisfies the initial exam requirements.

Required API:

Equipment:

- GET /api/equipment

Seed at least two equipment records.

Bookings:

- GET /api/bookings
- GET /api/bookings/:id
- POST /api/bookings
- PATCH /api/bookings/:id
- DELETE /api/bookings/:id

Follow the payload, field names, response requirements, and HTTP status codes from exam_brief_en.md exactly.

Important business rules:

1. equipmentId must refer to existing equipment.
2. startAt must be earlier than endAt.
3. The same equipment must not have overlapping bookings.
4. Overlap detection must work for both POST and PATCH.
5. When updating a booking, do not treat the booking being updated as conflicting with itself.
6. Missing or invalid data should return the appropriate 400 response.
7. Missing resources should return 404.
8. Booking time conflicts should return 409.
9. All errors must be JSON using the required { "error": "..." } format.

Database/security requirements:

- Use SQLite/D1 according to the starter project.
- Use parameter binding for all request-derived SQL values.
- Never concatenate request data into SQL.
- Use an appropriate foreign-key relationship between bookings and equipment.
- Keep the schema simple and easy for a student to explain.

Do not over-engineer the solution.
Do not add authentication, JWT, Docker, ORMs, complex service/repository architecture, frontend code, deployment configuration, or unnecessary dependencies unless they are already required by the starter repository.

Create or update the following documentation where appropriate:

1. README.md
   - how to install/run the API
   - Base API URL
   - database setup/migration instructions
   - simple curl examples
2. API_CONTRACT.md
   - endpoints
   - request payload
   - success responses/status codes
   - 400, 404 and 409 error behaviour
   - important assumptions
3. A simple database schema/ERD, either in API_CONTRACT.md, README.md, or an appropriate schema file.
4. AI_LOG.md
   - add this prompt as an important AI interaction
   - describe what was generated/suggested
   - leave clear places for me to record what I personally verified after running the project
5. Prepare a simple set of curl commands covering at least:
   - list equipment
   - create booking
   - read booking
   - update booking
   - overlapping booking conflict
   - invalid time/data
   - booking not found
   - delete booking

Do not fabricate test results. Provide the commands, but only record a test as passed after it has actually been executed.

Before finishing:

- run or type-check the project if the environment allows it;
- inspect the implementation against exam_brief_en.md;
- verify that route names and JSON property names match the contract;
- verify that all request-derived SQL uses parameter binding;
- verify that overlap checking applies to POST and PATCH.

When finished, give me:

1. a short summary of what you created or changed;
2. the exact command to start the API;
3. the Base API URL;
4. the first curl command I should execute;
5. any problem that still requires my attention.

Keep everything simple enough that I can explain the important code myself during the instructor's ownership questions.
```

Formatting of the prompt above is normalized to plain text; requirements are retained.

## What AI generated / suggested

- Read both exam files first and inspected the directory. No starter source, tooling, curl guide, or Quality Gate checklist was present.
- Wrote `API_CONTRACT.md` before application code, including the schema and explicit PATCH/time assumptions.
- Generated a single Hono route file, a two-table D1 migration with two equipment seeds, local npm/Wrangler/TypeScript tooling, and generated runtime types.
- Used parameter-bound SQL throughout, with overlap checking within INSERT and UPDATE. PATCH merges provided fields and excludes its own booking ID.
- Wrote setup instructions, curl checks, and an evidence file for checks actually run by the agent.
- Consulted official Hono and Cloudflare documentation for local D1, prepared statements, and Worker tooling.
- Did not perform or invent the instructor's later Quality Gate review. No `QUALITY_GATE_REVIEW.md` was created.

## Agent verification (separate from student verification)

Actual commands and results are recorded in `TEST_EVIDENCE.md`. These are agent-executed checks, not a claim that the student personally ran or understood them.

## Personal verification and ownership notes

The final section below records the submitted screenshot evidence and provides plain-language explanation notes. It replaces the earlier blank verification forms. Agent-executed checks remain separate from student screenshot evidence.

The Quality Gate was deferred at the first-version stage. It has now been supplied; see the Quality Gate interaction below.

## Follow-up interaction: public Cloudflare deployment

The user authorized deploying this first version. AI added remote migration/deploy npm commands, enabled the workers.dev URL, and documented the D1 deployment procedure. Wrangler reported that its stored authentication had expired; AI started `wrangler login` so the user can authorize their account in the browser.

Authentication succeeded. AI created the `equipment-booking` D1 database, recorded its real UUID in `wrangler.jsonc`, applied `0001_initial.sql` remotely, and deployed `campus-equipment-booking-api`. Public Base API URL: `https://campus-equipment-booking-api.thanhtike.workers.dev/api`. Type-checking and the deployment dry run passed. Actual public HTTP verification is recorded in `TEST_EVIDENCE.md`. No Quality Gate review is part of this request.

All 19 curl checks passed against the public URL after transient initial Cloudflare edge errors cleared. The script deleted its two test bookings. README and API contract now include the public submission URL; student screenshot verification is recorded in the final section below.

Student verification: see the final section and `output/pdf/API_Test_Screenshot_Evidence.pdf` for the public curl results.

## Quality Gate interaction — 2026-10-06

Important user prompt (requirements summarized): We are now at the Quality Gate stage. Read the newly added `quality_gate.md` and `curl_test_guide.md`; review the current API without rebuilding or adding unrelated features. Find meaningful improvements around POST/PATCH overlap, self-exclusion, adjacency, invalid times, equipment existence, statuses, JSON errors, bound SQL, documentation accuracy and ownership. Create `QUALITY_GATE_REVIEW.md` with at least three findings using finding → action → evidence, including Reliability/Accuracy and Reasoning/You Own It. Do not invent findings or unexecuted results. Re-run guide and edge cases, make only small justified code fixes if needed, redeploy if code changes, update evidence/log, and report findings, changes, test results, submission decision and what I must understand.

What AI generated / used:

- Read both newly supplied files and re-read the brief, rubric, existing source, schema, contract and run instructions.
- Saved `snapshots/before-quality-gate.tar.gz` before review changes. This is a review-start snapshot, not a backdated minute-30 commit/screenshot.
- Found actual test gaps: status/type-only checks did not assert value persistence or unchanged records after rejection; coverage missed several overlap shapes and equipment-change conflicts.
- Generated `scripts/quality_gate_checks.mjs`, using Node's built-in assertions and curl without new dependencies. It runs all nine guide cases and additional validation/persistence/binding examples, and cleans up its own test bookings.
- Corrected README/API contract statements that the Quality Gate was deferred and the curl guide absent. Added concrete status/interval reasoning and disclosed the simultaneous partial-PATCH overwrite limitation.
- Created `QUALITY_GATE_REVIEW.md` with four meaningful findings. No API code defect was found in the exercised requirements. Application source, schema and deployment configuration were unchanged; no redeploy was needed.

Agent verification actually performed:

- `npm run typecheck`: passed, exit 0.
- Public `quality_gate_checks.mjs`: 63 HTTP checks plus exact-value assertions passed, exit 0.
- Additional public malformed-JSON curl: 400, JSON `{ "error": "Request body must be valid JSON" }`.
- Public list after cleanup: 200, `[]`.
- Inspected parameter binding in every request-derived SQL query; compared the source hash with the saved pre-review snapshot and confirmed it was unchanged.
- Actual output was appended to `TEST_EVIDENCE.md`. These are AI-agent results; no student test or understanding is claimed.

At the end of the initial review, the decision was DO NOT SUBMIT YET because personal evidence and the original first-version checkpoint were unrecorded. The current evidence and decision are recorded below.

## Final personal verification and explanation notes

### What my screenshots show

Public Base API URL used for testing:
`https://campus-equipment-booking-api.thanhtike.workers.dev/api`

My supplied curl screenshots are in `screenshot/` and collected in `output/pdf/API_Test_Screenshot_Evidence.pdf`. They show 15 HTTP requests on 2026-10-06. The checkmarks below refer to visible results in those screenshots, not to an unrecorded test run.

- [x] Listed equipment: 200 and two seed records (PDF page 2).
- [x] Listed bookings: 200 with a JSON array (page 3).
- [x] Created and read a booking: 201 and 200, with the same returned ID and values (pages 4–5).
- [x] Updated the purpose without a self-conflict: 200; equipment and times stayed unchanged (page 6).
- [x] Tried an overlapping POST: 409 with a JSON `error` (page 7).
- [x] Created an adjacent booking starting at the first booking's end: 201 (page 8).
- [x] Tried an overlapping PATCH: 409; a subsequent GET confirmed the original end time was unchanged (pages 9–10).
- [x] Tried an invalid time range and unknown equipment: 400 with JSON errors (pages 11–12).
- [x] Requested a missing booking: 404 with a JSON error (page 12).
- [x] Deleted the first booking: 204 with no response body; GET afterwards returned 404. Deleted the second booking too (page 13).

These manual tests use 2026-10-25 slots and a partial PATCH. The agent separately ran all nine instructor-guide cases using the guide's 2026-10-20 dates and the extra cases in `TEST_EVIDENCE.md`. My screenshots do not demonstrate that I personally ran every automated edge case or installed/started the API locally.

### My explanation notes — AI-assisted draft for me to review

These answers are written in first person for preparation. They are not evidence that I have already explained the code independently. I should read the source and edit any wording I would not use myself.

**What does my API do?** I can list the available equipment and create, list, read, update and delete bookings. It stops the same equipment from being booked for overlapping times. The important files are `src/index.ts` for routes and validation, `migrations/0001_initial.sql` for tables and seed data, and `wrangler.jsonc` for the D1 binding. I run it locally with `npm ci`, `npm run db:migrate`, then `npm run dev`.

**Why must the start be earlier than the end?** A booking needs a positive duration. Equal or reversed times are invalid input, so the API returns 400 before writing to the database.

**How do I detect overlap?** For the same equipment, I check both `existing.startAt < requested.endAt` and `existing.endAt > requested.startAt`. Both must be true. For example, 12:00–14:00 conflicts with 11:00–15:00, even though the new start is outside the old range. Checking only whether the new start is inside would miss this case.

**Why are adjacent bookings allowed?** The comparisons are strict. A booking ending at 11:00 can be followed by another starting at 11:00. They share an endpoint but no booking time.

**How does PATCH work?** I first read the booking. I merge the supplied fields with its current fields, then validate the complete result. Omitted fields keep their values. The overlap query excludes the current ID with `id <> ?`, so an unchanged booking does not conflict with itself. The query checks the updated equipment and times, including when equipment changes.

**Why 400, 404 and 409?** I use 400 for an invalid request, including missing fields, invalid dates or an equipment ID that cannot be used. I use 404 when the booking addressed by the URL does not exist. I use 409 when valid booking data conflicts with another booking for the same equipment. Errors use `{ "error": "..." }`. Successful creation returns 201, reads and updates return 200, and deletion returns 204 with no body.

**Why normalize the timestamps?** I accept UTC ISO timestamps ending in `Z` and store them with milliseconds. The fixed format lets chronological order match the text order used in SQLite. I reject impossible dates rather than allowing JavaScript to roll them into another month. UTC-only input and partial PATCH support are documented choices; preventing overlaps and invalid ranges are exam requirements.

**What does the foreign key do?** `bookings.equipmentId` references `equipment.id`. One equipment record can have many bookings. The foreign key prevents a booking from referring to missing equipment. The API also checks equipment first so it can return a clear 400 message.

**How does parameter binding help?** SQL contains `?` placeholders and `.bind(...)` supplies the request values separately. An ID or borrower name stays data instead of becoming SQL code. I do not concatenate request values into SQL.

**Why include overlap checking in the write?** The INSERT and UPDATE contain `NOT EXISTS` checks. The database checks the conflict as part of the write, rather than relying on a separate check followed by a write that another request could race with.

**What improved after the Quality Gate?** The review strengthened the tests to check exact values, saved changes and unchanged records after rejection. It added overlap shapes, both adjacency boundaries and equipment-change cases. The documentation was corrected and explanations were expanded. The required rules already worked, so no application code fix or redeployment was needed.

**What are the limitations?** Concurrent partial PATCH requests to the same booking can overwrite each other's field changes because both may read the same earlier values. No load test or simulated database-failure test was run. Authentication and a browser frontend are outside the requested scope; curl does not need CORS.

**What did AI help with, and what did I verify?** AI generated the initial implementation, schema, tooling, documentation and automated checks, then helped review them. My supplied screenshots demonstrate the public manual curl results listed above. I should not claim that I wrote every line independently or personally ran the agent's entire test suite.

### Final decision and remaining personal confirmation

**REVIEW WITH INSTRUCTOR.** The six submission deliverables and public test evidence are present. The original minute-30 screenshot/commit was missed. Commit `6e62f19a140f4cc28d984d64e9ab7e32dc75a873` is a later reconstructed checkpoint, saved on 2026-10-06 at 14:34:51 (Asia/Bangkok), not proof of the original minute-30 state. `snapshots/before-quality-gate.tar.gz` was saved at review start. I need the instructor to clarify whether those substitutes are acceptable.

- [ ] I have read the explanation notes and can explain the important source code independently. This is for me to confirm; screenshots cannot establish it.
- [ ] The instructor has resolved the missing original checkpoint requirement. No acceptance is recorded yet.

Once both are genuinely confirmed and no test issue remains, the decision can be changed to READY. No independent local setup, personal code inspection or instructor approval is claimed without evidence.
