# API verification evidence

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

## Quality Gate verification — 2026-10-06

Base API URL: `https://campus-equipment-booking-api.thanhtike.workers.dev/api`.
Executed by the AI agent; student personal verification remains separate.

Commands actually executed:

```sh
npm run typecheck
BASE_URL=https://campus-equipment-booking-api.thanhtike.workers.dev/api node scripts/quality_gate_checks.mjs
curl -sS --max-time 20 -X POST https://campus-equipment-booking-api.thanhtike.workers.dev/api/bookings -H 'Content-Type: application/json' -d '{' -w '\nHTTP %{http_code}; Content-Type %{content_type}\n'
curl -sS --max-time 20 https://campus-equipment-booking-api.thanhtike.workers.dev/api/bookings -w '\nHTTP %{http_code}; Content-Type %{content_type}\n'
```

Type-check passed (exit 0). The guide/edge script passed (exit 0): 63 HTTP checks,
including every case from `curl_test_guide.md`, JSON content-type/error shape checks,
exact booking-value assertions, persistence checks, and cleanup of its records.
Supplementary curls verified malformed JSON and that no test bookings remained.
No source/schema/configuration change was made, so the existing public deployment
was tested without redeployment. No load/concurrency or database-failure test was run.
See `QUALITY_GATE_REVIEW.md` for findings and limitations.

### Actual guide and edge-case output

```text
Quality Gate curl checks
Base API URL: https://campus-equipment-booking-api.thanhtike.workers.dev/api
1. Guide 1: list equipment: HTTP 200 (expected 200)
[{"id":"eq-1","name":"Projector A","location":"Building 1"},{"id":"eq-2","name":"Camera A","location":"Building 2"}]
2. Guide 2: list bookings: HTTP 200 (expected 200)
[]
3. Guide 3: create: HTTP 201 (expected 201)
{"id":"a5c7c937-381c-448e-a2ee-e52d3b63f6a0","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T09:00:00.000Z","endAt":"2026-10-20T11:00:00.000Z","purpose":"Class presentation"}
  Exact booking fields and values verified.
4. Guide 4: read: HTTP 200 (expected 200)
{"id":"a5c7c937-381c-448e-a2ee-e52d3b63f6a0","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T09:00:00.000Z","endAt":"2026-10-20T11:00:00.000Z","purpose":"Class presentation"}
5. Guide 5: full PATCH: HTTP 200 (expected 200)
{"id":"a5c7c937-381c-448e-a2ee-e52d3b63f6a0","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T12:00:00.000Z","endAt":"2026-10-20T14:00:00.000Z","purpose":"Updated class presentation"}
  Exact booking fields and values verified.
6. Verify PATCH persisted: HTTP 200 (expected 200)
{"id":"a5c7c937-381c-448e-a2ee-e52d3b63f6a0","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T12:00:00.000Z","endAt":"2026-10-20T14:00:00.000Z","purpose":"Updated class presentation"}
7. Verify booking appears in list: HTTP 200 (expected 200)
[{"id":"a5c7c937-381c-448e-a2ee-e52d3b63f6a0","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T12:00:00.000Z","endAt":"2026-10-20T14:00:00.000Z","purpose":"Updated class presentation"}]
8. Guide 6: invalid POST range: HTTP 400 (expected 400)
{"error":"startAt must be earlier than endAt"}
9. Guide 7: contained POST overlap: HTTP 409 (expected 409)
{"error":"Booking time conflicts with an existing booking"}
10. Guide 8: missing booking: HTTP 404 (expected 404)
{"error":"Booking not found"}
11. Guide 9: delete: HTTP 204 (expected 204)
<empty body>
12. Verify deleted booking is absent: HTTP 404 (expected 404)
{"error":"Booking not found"}
13. Edge: create anchor [12,14): HTTP 201 (expected 201)
{"id":"af57e8ab-ebcf-4360-8888-ba853e0e7c83","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T12:00:00.000Z","endAt":"2026-10-20T14:00:00.000Z","purpose":"Updated class presentation"}
14. Edge: POST identical overlap: HTTP 409 (expected 409)
{"error":"Booking time conflicts with an existing booking"}
15. Edge: POST contained overlap: HTTP 409 (expected 409)
{"error":"Booking time conflicts with an existing booking"}
16. Edge: POST containing overlap: HTTP 409 (expected 409)
{"error":"Booking time conflicts with an existing booking"}
17. Edge: POST left intersection overlap: HTTP 409 (expected 409)
{"error":"Booking time conflicts with an existing booking"}
18. Edge: POST right intersection overlap: HTTP 409 (expected 409)
{"error":"Booking time conflicts with an existing booking"}
19. Edge: left adjacency allowed: HTTP 201 (expected 201)
{"id":"e715d7aa-a478-4ab3-88ba-495b36566ee4","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T11:00:00.000Z","endAt":"2026-10-20T12:00:00.000Z","purpose":"Updated class presentation"}
20. Edge: right adjacency allowed: HTTP 201 (expected 201)
{"id":"b63da4ae-c990-44c4-a14a-d0b3d28016d9","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T14:00:00.000Z","endAt":"2026-10-20T15:00:00.000Z","purpose":"Updated class presentation"}
21. Edge: PATCH identical overlap: HTTP 409 (expected 409)
{"error":"Booking time conflicts with an existing booking"}
22. Verify rejected PATCH leaves values unchanged: HTTP 200 (expected 200)
{"id":"b63da4ae-c990-44c4-a14a-d0b3d28016d9","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T14:00:00.000Z","endAt":"2026-10-20T15:00:00.000Z","purpose":"Updated class presentation"}
23. Edge: PATCH contained overlap: HTTP 409 (expected 409)
{"error":"Booking time conflicts with an existing booking"}
24. Verify rejected PATCH leaves values unchanged: HTTP 200 (expected 200)
{"id":"b63da4ae-c990-44c4-a14a-d0b3d28016d9","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T14:00:00.000Z","endAt":"2026-10-20T15:00:00.000Z","purpose":"Updated class presentation"}
25. Edge: PATCH containing overlap: HTTP 409 (expected 409)
{"error":"Booking time conflicts with an existing booking"}
26. Verify rejected PATCH leaves values unchanged: HTTP 200 (expected 200)
{"id":"b63da4ae-c990-44c4-a14a-d0b3d28016d9","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T14:00:00.000Z","endAt":"2026-10-20T15:00:00.000Z","purpose":"Updated class presentation"}
27. Edge: PATCH left intersection overlap: HTTP 409 (expected 409)
{"error":"Booking time conflicts with an existing booking"}
28. Verify rejected PATCH leaves values unchanged: HTTP 200 (expected 200)
{"id":"b63da4ae-c990-44c4-a14a-d0b3d28016d9","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T14:00:00.000Z","endAt":"2026-10-20T15:00:00.000Z","purpose":"Updated class presentation"}
29. Edge: PATCH right intersection overlap: HTTP 409 (expected 409)
{"error":"Booking time conflicts with an existing booking"}
30. Verify rejected PATCH leaves values unchanged: HTTP 200 (expected 200)
{"id":"b63da4ae-c990-44c4-a14a-d0b3d28016d9","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T14:00:00.000Z","endAt":"2026-10-20T15:00:00.000Z","purpose":"Updated class presentation"}
31. Edge: full PATCH excludes itself: HTTP 200 (expected 200)
{"id":"af57e8ab-ebcf-4360-8888-ba853e0e7c83","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T12:00:00.000Z","endAt":"2026-10-20T14:00:00.000Z","purpose":"Updated class presentation"}
32. Edge: partial PATCH preserves omitted fields: HTTP 200 (expected 200)
{"id":"af57e8ab-ebcf-4360-8888-ba853e0e7c83","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T12:00:00.000Z","endAt":"2026-10-20T14:00:00.000Z","purpose":"Ownership check"}
33. Edge: different equipment can overlap: HTTP 201 (expected 201)
{"id":"738a5a73-ed87-4915-9362-c0f196061c34","equipmentId":"eq-2","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T12:00:00.000Z","endAt":"2026-10-20T14:00:00.000Z","purpose":"Updated class presentation"}
34. Edge: changing equipment checks target conflicts: HTTP 409 (expected 409)
{"error":"Booking time conflicts with an existing booking"}
35. Verify equipment was not changed on conflict: HTTP 200 (expected 200)
{"id":"738a5a73-ed87-4915-9362-c0f196061c34","equipmentId":"eq-2","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T12:00:00.000Z","endAt":"2026-10-20T14:00:00.000Z","purpose":"Updated class presentation"}
36. Edge: PATCH equal timestamps: HTTP 400 (expected 400)
{"error":"startAt must be earlier than endAt"}
37. Edge: PATCH reversed timestamps: HTTP 400 (expected 400)
{"error":"startAt must be earlier than endAt"}
38. Edge: PATCH unknown equipment: HTTP 400 (expected 400)
{"error":"equipmentId must refer to existing equipment"}
39. Edge: PATCH empty PATCH: HTTP 400 (expected 400)
{"error":"Provide booking fields"}
40. Edge: PATCH null field: HTTP 400 (expected 400)
{"error":"borrowerName must be a nonempty string"}
41. Edge: PATCH wrong field type: HTTP 400 (expected 400)
{"error":"equipmentId must be a nonempty string"}
42. Edge: PATCH blank field: HTTP 400 (expected 400)
{"error":"purpose must be a nonempty string"}
43. Edge: PATCH unknown field: HTTP 400 (expected 400)
{"error":"Only equipmentId, borrowerName, startAt, endAt and purpose are allowed"}
44. Edge: PATCH impossible date: HTTP 400 (expected 400)
{"error":"startAt must be a valid date and time"}
45. Verify invalid PATCHes did not alter anchor: HTTP 200 (expected 200)
{"id":"af57e8ab-ebcf-4360-8888-ba853e0e7c83","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T12:00:00.000Z","endAt":"2026-10-20T14:00:00.000Z","purpose":"Ownership check"}
46. Edge: POST unknown equipment: HTTP 400 (expected 400)
{"error":"equipmentId must refer to existing equipment"}
47. Edge: POST SQL-like equipment ID: HTTP 400 (expected 400)
{"error":"equipmentId must refer to existing equipment"}
48. Edge: POST equal times: HTTP 400 (expected 400)
{"error":"startAt must be earlier than endAt"}
49. Edge: POST null body: HTTP 400 (expected 400)
{"error":"Request body must be a JSON object"}
50. Edge: POST array body: HTTP 400 (expected 400)
{"error":"Request body must be a JSON object"}
51. Edge: POST missing fields: HTTP 400 (expected 400)
{"error":"borrowerName must be a nonempty string"}
52. Edge: SQL-like path ID is just an ID: HTTP 404 (expected 404)
{"error":"Booking not found"}
53. Edge: missing PATCH resource: HTTP 404 (expected 404)
{"error":"Booking not found"}
54. Edge: missing DELETE resource: HTTP 404 (expected 404)
{"error":"Booking not found"}
55. Edge: unknown route JSON error: HTTP 404 (expected 404)
{"error":"Route not found"}
56. Edge: SQL-like borrower text is stored literally: HTTP 201 (expected 201)
{"id":"1ecb08cc-a3b0-42d1-916f-098aa423118a","equipmentId":"eq-1","borrowerName":"O'Brien; DROP TABLE bookings; --","startAt":"2026-10-22T09:00:00.000Z","endAt":"2026-10-22T10:00:00.000Z","purpose":"Updated class presentation"}
  Exact booking fields and values verified.
57. Verify literal text and normalized timestamps persisted: HTTP 200 (expected 200)
{"id":"1ecb08cc-a3b0-42d1-916f-098aa423118a","equipmentId":"eq-1","borrowerName":"O'Brien; DROP TABLE bookings; --","startAt":"2026-10-22T09:00:00.000Z","endAt":"2026-10-22T10:00:00.000Z","purpose":"Updated class presentation"}
58. Verify failed POSTs inserted no extra bookings: HTTP 200 (expected 200)
[{"id":"e715d7aa-a478-4ab3-88ba-495b36566ee4","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T11:00:00.000Z","endAt":"2026-10-20T12:00:00.000Z","purpose":"Updated class presentation"},{"id":"738a5a73-ed87-4915-9362-c0f196061c34","equipmentId":"eq-2","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T12:00:00.000Z","endAt":"2026-10-20T14:00:00.000Z","purpose":"Updated class presentation"},{"id":"af57e8ab-ebcf-4360-8888-ba853e0e7c83","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T12:00:00.000Z","endAt":"2026-10-20T14:00:00.000Z","purpose":"Ownership check"},{"id":"b63da4ae-c990-44c4-a14a-d0b3d28016d9","equipmentId":"eq-1","borrowerName":"Somchai Jaidee","startAt":"2026-10-20T14:00:00.000Z","endAt":"2026-10-20T15:00:00.000Z","purpose":"Updated class presentation"},{"id":"1ecb08cc-a3b0-42d1-916f-098aa423118a","equipmentId":"eq-1","borrowerName":"O'Brien; DROP TABLE bookings; --","startAt":"2026-10-22T09:00:00.000Z","endAt":"2026-10-22T10:00:00.000Z","purpose":"Updated class presentation"}]
59. Cleanup test booking: HTTP 204 (expected 204)
<empty body>
60. Cleanup test booking: HTTP 204 (expected 204)
<empty body>
61. Cleanup test booking: HTTP 204 (expected 204)
<empty body>
62. Cleanup test booking: HTTP 204 (expected 204)
<empty body>
63. Cleanup test booking: HTTP 204 (expected 204)
<empty body>
All 63 Quality Gate HTTP checks and value assertions passed.
```

### Actual supplementary curl output

Malformed JSON:

```text
{"error":"Request body must be valid JSON"}
HTTP 400; Content-Type application/json
```

Bookings after cleanup:

```text
[]
HTTP 200; Content-Type application/json
```


## Student-supplied manual curl screenshot evidence

Base API URL shown in the screenshots:
`https://campus-equipment-booking-api.thanhtike.workers.dev/api`

Evidence: [PDF with summary and original screenshots](output/pdf/API_Test_Screenshot_Evidence.pdf), with originals in `screenshot/`. The supplied screenshots show 15 executed HTTP requests on 2026-10-06; results below are transcribed from the images, not newly generated or hypothetical test results. Filenames use Buddhist year 2569 (Gregorian 2026). Screenshot capture times are not the same as the HTTP response times.

| Test | Observed result | PDF page | Screenshot filename time |
| --- | --- | --- | --- |
| List equipment | 200; eq-1 and eq-2 | 2 | 15.08.40 |
| List bookings | 200; JSON array | 3 | 15.08.53 |
| Create booking | 201; returned first booking ID | 4 | 15.09.21 |
| Read booking | 200; matching ID and values | 5 | 15.09.31 |
| Partial PATCH without self-conflict | 200; purpose updated, equipment/times unchanged | 6 | 15.09.45 |
| Overlapping POST | 409; JSON error | 7 | 15.09.55 |
| Adjacent POST | 201; starts exactly when first booking ends | 8 | 15.10.05 |
| Overlapping PATCH | 409; JSON error | 9 | 15.10.16 |
| Read after rejected PATCH | 200; endAt still 11:00 | 10 | 15.10.26 |
| Invalid time range PATCH | 400; JSON error | 11 | 15.10.38 |
| Unknown equipment PATCH | 400; JSON error | 12 | 15.10.56 |
| Missing booking GET | 404; JSON error | 12 | 15.10.56 |
| Delete first booking | 204; empty body | 13 | 15.11.08 |
| Read deleted booking | 404; JSON error | 13 | 15.11.08 |
| Delete adjacent booking | 204; empty body | 13 | 15.11.08 |

The first booking ID is `fa519d29-9d40-426e-91d5-a98a38a39fd0`; the adjacent booking ID is `f86600fa-823f-49d6-b318-ee35414a4d45`. These have been deleted and should not be reused as live test records. The manual sequence uses 2026-10-25, while the automated instructor-guide sequence above uses 2026-10-20.


## Final submission-preparation checks — 2026-10-06

Executed by the AI agent after the documentation updates:

- `npm run typecheck`: passed, exit 0.
- `git diff --check`: passed, exit 0.
- `curl -sS --max-time 25 https://campus-equipment-booking-api.thanhtike.workers.dev/api/equipment -w '\nHTTP %{http_code}\n'`: returned 200 and both equipment records.

Actual public response:

```text
[{"id":"eq-1","name":"Projector A","location":"Building 1"},{"id":"eq-2","name":"Camera A","location":"Building 2"}]
HTTP 200
```

No runtime changes were made during this final documentation pass. The 63-case suite was not re-run during this pass; its earlier executed results remain recorded above.
