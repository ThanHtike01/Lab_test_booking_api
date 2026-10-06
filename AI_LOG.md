# AI interaction log — first version only

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

## What I personally verified — student fills this in

Leave unchecked until you actually do each item. Add your own command/output or screenshot reference.

- [ ] Installed dependencies and started the API. Date / command / result: __________
- [ ] Checked the equipment seed records. Evidence: __________
- [ ] Created, listed, read, updated and deleted a booking. Evidence: __________
- [ ] Verified POST overlap returns 409. Evidence: __________
- [ ] Verified PATCH overlap returns 409 and unchanged times do not conflict with themselves. Evidence: __________
- [ ] Verified missing/invalid data returns 400 and unknown booking returns 404. Evidence: __________
- [ ] Checked the route names, payload names, and JSON errors against the brief. Notes: __________
- [ ] Inspected SQL placeholders and `.bind(...)` arguments. Notes: __________
- [ ] Saved the first-version commit or screenshot before receiving the Quality Gate. Reference: __________

## My ownership notes — student fills this in

- Why `startAt < endAt` matters: __________
- Explain the two comparisons used to detect overlap: __________
- Why PATCH excludes its own ID: __________
- What the foreign key does: __________
- How parameter binding keeps request values separate from SQL: __________
- Why these cases use 400, 404 and 409: __________
- Decisions or AI suggestions I changed after reading/running the code: __________

Future instructor-provided Quality Gate work belongs in a later interaction/review, once supplied.

## Follow-up interaction: public Cloudflare deployment

User prompt: "We can't just submit localhost, we need to deploy on cloud flare, please create this for me" (with a Cloudflare account dashboard screenshot).

The user authorized deploying this first version. AI added remote migration/deploy npm commands, enabled the workers.dev URL, and documented the D1 deployment procedure. Wrangler reported that its stored authentication had expired; AI started `wrangler login` so the user can authorize their account in the browser.

Authentication succeeded. AI created the `equipment-booking` D1 database, recorded its real UUID in `wrangler.jsonc`, applied `0001_initial.sql` remotely, and deployed `campus-equipment-booking-api`. Public Base API URL: `https://campus-equipment-booking-api.thanhtike.workers.dev/api`. Type-checking and the deployment dry run passed. Actual public HTTP verification is recorded in `TEST_EVIDENCE.md`. No Quality Gate review is part of this request.

All 19 curl checks passed against the public URL after transient initial Cloudflare edge errors cleared. The script deleted its two test bookings. README and API contract now include the public submission URL; the student's personal verification remains unchecked.

Student verification:

- [ ] Opened the public `/api/equipment` URL. URL / result: __________
- [ ] Ran curl checks against the public Base API URL. Evidence: __________
