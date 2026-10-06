# First-version verification evidence

Executed by the AI agent on 2026-10-06 (Asia/Bangkok), against local D1.
Base API URL: `http://localhost:8787/api`.
These results are separate from the student's personal verification notes in `AI_LOG.md`.
This is initial implementation verification, not an instructor Quality Gate review.

## Commands actually executed

- `npm install hono` and `npm install -D typescript wrangler`: completed.
- `npm run typegen`: generated `worker-configuration.d.ts`.
- `npm run typecheck`: passed (exit 0).
- `npm run db:migrate`: migration `0001_initial.sql` applied successfully.
- `npm run dev`: started the local API with the DB binding.
- `bash scripts/curl_checks.sh`: passed (exit 0), 19 requests; actual output below.

The curl script asserts status codes, JSON error shape, required response field types,
and the empty 204 body. The output also shows the two seeds and the updated purpose.
This evidence covers the listed cases; it is not a claim of exhaustive testing.

## Actual curl responses

```text

List equipment: HTTP 200 (expected 200)
[{"id":"eq-1","name":"Projector A","location":"Building 1"},{"id":"eq-2","name":"Camera A","location":"Building 2"}]

List bookings: HTTP 200 (expected 200)
[]

Create booking: HTTP 201 (expected 201)
{"id":"1bdce85d-0f0d-4664-b817-f13a1575efb6","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T09:00:00.000Z","endAt":"2026-10-20T11:00:00.000Z","purpose":"Class presentation"}

Read booking: HTTP 200 (expected 200)
{"id":"1bdce85d-0f0d-4664-b817-f13a1575efb6","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T09:00:00.000Z","endAt":"2026-10-20T11:00:00.000Z","purpose":"Class presentation"}

Update without self-conflict: HTTP 200 (expected 200)
{"id":"1bdce85d-0f0d-4664-b817-f13a1575efb6","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T09:00:00.000Z","endAt":"2026-10-20T11:00:00.000Z","purpose":"Updated presentation"}

Overlapping POST: HTTP 409 (expected 409)
{"error":"Booking time conflicts with an existing booking"}

Adjacent booking is allowed: HTTP 201 (expected 201)
{"id":"044c40b2-0d8e-43c8-a186-1d288b4d1cae","equipmentId":"eq-1","borrowerName":"Second borrower","startAt":"2026-10-20T11:00:00.000Z","endAt":"2026-10-20T12:00:00.000Z","purpose":"Next class"}

Overlapping PATCH: HTTP 409 (expected 409)
{"error":"Booking time conflicts with an existing booking"}

Invalid time order: HTTP 400 (expected 400)
{"error":"startAt must be earlier than endAt"}

Missing POST fields: HTTP 400 (expected 400)
{"error":"Provide booking fields"}

Unknown equipment: HTTP 400 (expected 400)
{"error":"equipmentId must refer to existing equipment"}

Impossible calendar date: HTTP 400 (expected 400)
{"error":"startAt must be a valid date and time"}

Malformed JSON: HTTP 400 (expected 400)
{"error":"Request body must be valid JSON"}

Booking not found GET: HTTP 404 (expected 404)
{"error":"Booking not found"}

Booking not found PATCH: HTTP 404 (expected 404)
{"error":"Booking not found"}

Delete booking: HTTP 204 (expected 204)


Deleted booking not found: HTTP 404 (expected 404)
{"error":"Booking not found"}

Booking not found DELETE: HTTP 404 (expected 404)
{"error":"Booking not found"}

Delete adjacent booking: HTTP 204 (expected 204)


All curl checks passed.
```

## Implementation inspection

Inspected `src/index.ts` against `exam_brief_en.md`:

- All six required method/path combinations are present.
- Equipment responses contain `id`, `name`, `location`; booking responses contain all six required fields.
- POST returns 201, GET/PATCH return 200, DELETE returns an empty 204.
- Missing/invalid payload or nonexistent equipment returns 400; nonexistent bookings return 404; overlaps return 409.
- All request-derived SQL values (including path IDs and PATCH fields) use `?` placeholders and `.bind(...)`. SQL strings contain no request interpolation or concatenation.
- Conditional INSERT and UPDATE both check overlap; UPDATE excludes its own ID with `id <> ?`.
- The migration has the equipment foreign key, two seed rows, and the time-order CHECK.
- JSON handlers cover validation errors, resource errors, conflicts, unknown routes, and unexpected errors.

The later instructor Quality Gate and student ownership verification are still pending.

## Public Cloudflare deployment and verification

Executed by the AI agent on 2026-10-06 (Asia/Bangkok).
Public Base API URL: `https://campus-equipment-booking-api.thanhtike.workers.dev/api`.

- `npx wrangler login`: succeeded after the user authorized in the browser.
- `npx wrangler d1 create equipment-booking`: created a separate database in APAC.
- `npm run typegen` and `npm run typecheck`: passed.
- `npx wrangler deploy --dry-run`: passed before publication.
- `npm run db:migrate:remote`: applied `0001_initial.sql`, seeding two equipment rows.
- `npm run deploy`: succeeded; version `90ff6e7b-3d4a-4ca6-af19-a61cd2e73903`.
- The first public request returned HTTP 404 with Cloudflare error 1042; a following request returned HTTP 500 with error 1104. Retrying shortly afterward succeeded without a code change, consistent with deployment propagation.
- `BASE_URL=https://campus-equipment-booking-api.thanhtike.workers.dev/api bash scripts/curl_checks.sh`: passed (exit 0), all 19 requests. The script deleted both bookings it created.

Actual successful public HTTP responses:

```text

List equipment: HTTP 200 (expected 200)
[{"id":"eq-1","name":"Projector A","location":"Building 1"},{"id":"eq-2","name":"Camera A","location":"Building 2"}]

List bookings: HTTP 200 (expected 200)
[]

Create booking: HTTP 201 (expected 201)
{"id":"b2538914-43e4-49bb-a0fc-7787f4df4913","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T09:00:00.000Z","endAt":"2026-10-20T11:00:00.000Z","purpose":"Class presentation"}

Read booking: HTTP 200 (expected 200)
{"id":"b2538914-43e4-49bb-a0fc-7787f4df4913","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T09:00:00.000Z","endAt":"2026-10-20T11:00:00.000Z","purpose":"Class presentation"}

Update without self-conflict: HTTP 200 (expected 200)
{"id":"b2538914-43e4-49bb-a0fc-7787f4df4913","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T09:00:00.000Z","endAt":"2026-10-20T11:00:00.000Z","purpose":"Updated presentation"}

Overlapping POST: HTTP 409 (expected 409)
{"error":"Booking time conflicts with an existing booking"}

Adjacent booking is allowed: HTTP 201 (expected 201)
{"id":"9934ddff-d109-4e83-94f8-393924c02d94","equipmentId":"eq-1","borrowerName":"Second borrower","startAt":"2026-10-20T11:00:00.000Z","endAt":"2026-10-20T12:00:00.000Z","purpose":"Next class"}

Overlapping PATCH: HTTP 409 (expected 409)
{"error":"Booking time conflicts with an existing booking"}

Invalid time order: HTTP 400 (expected 400)
{"error":"startAt must be earlier than endAt"}

Missing POST fields: HTTP 400 (expected 400)
{"error":"Provide booking fields"}

Unknown equipment: HTTP 400 (expected 400)
{"error":"equipmentId must refer to existing equipment"}

Impossible calendar date: HTTP 400 (expected 400)
{"error":"startAt must be a valid date and time"}

Malformed JSON: HTTP 400 (expected 400)
{"error":"Request body must be valid JSON"}

Booking not found GET: HTTP 404 (expected 404)
{"error":"Booking not found"}

Booking not found PATCH: HTTP 404 (expected 404)
{"error":"Booking not found"}

Delete booking: HTTP 204 (expected 204)


Deleted booking not found: HTTP 404 (expected 404)
{"error":"Booking not found"}

Booking not found DELETE: HTTP 404 (expected 404)
{"error":"Booking not found"}

Delete adjacent booking: HTTP 204 (expected 204)


All curl checks passed.
```
