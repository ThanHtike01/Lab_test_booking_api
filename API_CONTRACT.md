# First-version API contract

Source of truth: `exam_brief_en.md` and `rubric_en.md`. This is the pre-Quality-Gate version.

Public Base API URL (submission): `https://campus-equipment-booking-api.thanhtike.workers.dev/api`

Local Base API URL: `http://localhost:8787/api`

| Method | Path | Success response |
| --- | --- | --- |
| GET | `/api/equipment` | 200, array of equipment |
| GET | `/api/bookings` | 200, array of bookings (possibly empty) |
| GET | `/api/bookings/:id` | 200, one booking |
| POST | `/api/bookings` | 201, created booking |
| PATCH | `/api/bookings/:id` | 200, updated booking |
| DELETE | `/api/bookings/:id` | 204, no response body |

Equipment objects contain `id`, `name`, and `location`. The migration seeds `eq-1` and `eq-2`.

## Request and response

POST requires all five fields. PATCH accepts any nonempty subset of these same fields; omitted fields retain their current values. Send a JSON object:

```json
{
  "equipmentId": "eq-1",
  "borrowerName": "Somchai Jaidee",
  "startAt": "2026-10-20T09:00:00.000Z",
  "endAt": "2026-10-20T11:00:00.000Z",
  "purpose": "Class presentation"
}
```

A booking response contains exactly these five fields plus a generated string `id`:

```json
{
  "id": "<generated UUID>",
  "equipmentId": "eq-1",
  "borrowerName": "Somchai Jaidee",
  "startAt": "2026-10-20T09:00:00.000Z",
  "endAt": "2026-10-20T11:00:00.000Z",
  "purpose": "Class presentation"
}
```

## Errors and assumptions

All errors use `{ "error": "An understandable message" }`.

- 400: malformed JSON, non-object body, missing POST fields, empty PATCH, unknown fields, non-string/blank fields, invalid timestamp, unknown `equipmentId`, or `startAt >= endAt`.
- 404: booking ID does not exist (GET, PATCH, DELETE); unknown route.
- 409: requested time overlaps another booking for the same equipment (POST or PATCH).
- 500: unexpected server/database error, still using the JSON error format.

The brief does not specify PATCH omission semantics or time boundary handling; the assumptions here make them explicit. Strings are trimmed. Timestamps must be valid UTC ISO strings in `YYYY-MM-DDTHH:mm:ssZ` or `YYYY-MM-DDTHH:mm:ss.sssZ` form and are stored/returned with three millisecond digits. Impossible calendar dates are rejected. No future-only rule is imposed.

Intervals include the start and exclude the end. A booking ending at 11:00 can be followed by one starting at 11:00. Overlap means `existing.startAt < requested.endAt AND existing.endAt > requested.startAt`. PATCH checks the merged booking and excludes its own ID. Other equipment can be booked at the same time.

Conflict checking is part of the INSERT/UPDATE SQL statement, so checking and writing happen together. Every request-derived SQL value is passed to `.bind(...)` using `?` placeholders.

## Simple schema / ERD

```text
equipment (1) ───────── (many) bookings
id TEXT PK                     id TEXT PK
name TEXT                      equipmentId TEXT FK → equipment.id
location TEXT                  borrowerName TEXT
                               startAt TEXT (normalized UTC)
                               endAt TEXT (normalized UTC)
                               purpose TEXT
```

All columns are NOT NULL. `CHECK (startAt < endAt)` supports the time rule. The foreign key prevents orphan bookings. See `migrations/0001_initial.sql`. Equipment has no write endpoints in this version.
